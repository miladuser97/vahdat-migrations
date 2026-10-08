"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { getAuthenticatedUser } from "./auth-utils";
import { initiatePayment, verifyPayment } from "../payment-boundary";
import { notifyOrderSuccess } from "../notification-boundary";
import { logger } from "../logger";
import { z } from "zod";

// ============================================================
// Schema Validation با Zod
// ============================================================

const CartItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(999),
});

const CheckoutDataSchema = z.object({
  customerInformation: z.unknown(),
  address: z.unknown(),
  shippingMethod: z.string().optional(),
  shippingCost: z.number().min(0).optional(),
  couponCode: z.string().optional(),
  idempotencyKey: z.string().optional(),
});

// ============================================================
// Safe Error Handling
// ============================================================

function safeErrorMessage(error: unknown, defaultMessage: string): string {
  if (error instanceof Error) {
    const message = error.message;

    const safeMessages = [
      "موجودی کافی نیست",
      "محصول یافت نشد",
      "سبد خرید نمی‌تواند خالی باشد",
      "عدم دسترسی به سفارش",
      "این سفارش قبلاً پرداخت شده است",
      "توکن نامعتبر است",
      "امکان پرداخت این سفارش وجود ندارد",
      "سفارش لغو شده یا منقضی شده است",
      "داده‌های ورودی نامعتبر است",
      "محصولات سبد خرید نامعتبر هستند",
      "سفارش قابل لغو نیست",
    ];

    if (safeMessages.some(msg => message.includes(msg))) {
      return message;
    }

    if (message.includes("Prisma") || message.includes("Database") || message.includes("prisma")) {
      logger.error("[DB Error]", { error: message });
      return defaultMessage;
    }
  }

  logger.error("[Unknown Error]", { error: String(error) });
  return defaultMessage;
}

// ============================================================
// Types
// ============================================================

type OrderWithItems = Prisma.OrderGetPayload<{ include: { items: true } }>;
type OrderWithItemsAndPayments = Prisma.OrderGetPayload<{
  include: { items: true; paymentAttempts: true };
}>;

export type CreateOrderResult =
    | { success: true; orderId: string; totalAmount: number; message: string; guestToken?: string }
    | { success: false; error: string };

export type StartPaymentResult =
    | { success: true; paymentUrl: string }
    | { success: false; error: string };

export type PaymentCallbackCode = "ALREADY_PAID" | "PAID" | "ORDER_NOT_PAYABLE" | "ORDER_NOT_PAYABLE_FUNDS_CAPTURED" | "VERIFICATION_FAILED" | "ERROR";

export type PaymentCallbackResult =
    | { success: true; message: string; code: "ALREADY_PAID" | "PAID" }
    | { success: false; error: string; code: Exclude<PaymentCallbackCode, "ALREADY_PAID" | "PAID"> };

export type CleanupOrdersResult =
    | { success: true; count: number }
    | { success: false; error: string };

export type GetUserOrdersResult =
    | { success: true; orders: OrderWithItems[] }
    | { success: false; error: string };

export type GetOrderResult =
    | { success: true; order: OrderWithItemsAndPayments }
    | { success: false; error: string };

export type CancelOrderResult =
    | { success: true }
    | { success: false; error: string };

const PAYABLE_ORDER_STATUSES = ["pending_payment", "payment_failed"] as const;

function isPayableStatus(status: string): boolean {
  return (PAYABLE_ORDER_STATUSES as readonly string[]).includes(status);
}

// ============================================================
// Review Actions
// ============================================================

export type AddReviewResult =
    | { success: true; reviewId: string }
    | { success: false; error: string };

export type GetProductReviewsResult =
    | { success: true; reviews: Array<{
    id: string;
    rating: number;
    title: string | null;
    content: string | null;
    createdAt: Date;
    user: {
      firstName: string;
      lastName: string;
    };
  }> }
    | { success: false; error: string };

export type GetPendingReviewsResult =
    | { success: true; reviews: Array<{
    id: string;
    rating: number;
    title: string | null;
    content: string | null;
    createdAt: Date;
    product: { title: string; slug: string };
    user: { firstName: string; lastName: string; mobileNumber: string };
  }> }
    | { success: false; error: string };

export type ApproveReviewResult =
    | { success: true }
    | { success: false; error: string };

export type RejectReviewResult =
    | { success: true }
    | { success: false; error: string };

// ============================================================
// ✅ توابع Review با export
// ============================================================

export async function addReviewAction(
    productId: string,
    data: { rating: number; title?: string; content?: string }
): Promise<AddReviewResult> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return { success: false, error: "برای ثبت نظر باید وارد حساب خود شوید." };
  }

  if (data.rating < 1 || data.rating > 5) {
    return { success: false, error: "امتیاز باید بین ۱ تا ۵ باشد." };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existingReview = await tx.review.findFirst({
        where: {
          productId,
          userId: user.id,
        },
      });

      if (existingReview) {
        throw new Error("شما قبلاً برای این محصول نظر ثبت کرده‌اید.");
      }

      const review = await tx.review.create({
        data: {
          productId,
          userId: user.id,
          rating: data.rating,
          title: data.title || null,
          content: data.content || null,
          isApproved: false,
        },
      });

      const aggregation = await tx.review.aggregate({
        where: {
          productId,
          isApproved: true,
        },
        _avg: {
          rating: true,
        },
        _count: {
          id: true,
        },
      });

      const averageRating = aggregation._avg.rating || 0;
      const reviewCount = aggregation._count.id || 0;

      await tx.product.update({
        where: { id: productId },
        data: {
          rating: averageRating,
          reviewCount: reviewCount,
        },
      });

      return { reviewId: review.id };
    });

    logger.info("[Review:Add] Success", { reviewId: result.reviewId, productId, userId: user.id });

    return { success: true, reviewId: result.reviewId };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { success: false, error: "شما قبلاً برای این محصول نظر ثبت کرده‌اید." };
    }

    logger.error("[Review:Add] Failed", {
      error: error instanceof Error ? error.message : String(error),
      productId,
      userId: user.id,
    });

    return { success: false, error: "خطا در ثبت نظر. لطفاً دوباره تلاش کنید." };
  }
}

export async function getProductReviewsAction(productId: string): Promise<GetProductReviewsResult> {
  try {
    const reviews = await prisma.review.findMany({
      where: {
        productId,
        isApproved: true,
      },
      select: {
        id: true,
        rating: true,
        title: true,
        content: true,
        createdAt: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, reviews };
  } catch (error) {
    logger.error("[Review:Get] Failed", { error: error instanceof Error ? error.message : String(error) });
    return { success: false, error: "خطا در دریافت نظرات." };
  }
}

export async function getPendingReviewsAction(): Promise<GetPendingReviewsResult> {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== "admin") {
    return { success: false, error: "دسترسی غیرمجاز." };
  }

  try {
    const reviews = await prisma.review.findMany({
      where: { isApproved: false },
      select: {
        id: true,
        rating: true,
        title: true,
        content: true,
        createdAt: true,
        product: {
          select: {
            title: true,
            slug: true,
          },
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            mobileNumber: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return { success: true, reviews };
  } catch (error) {
    logger.error("[Review:Pending] Failed", { error: error instanceof Error ? error.message : String(error) });
    return { success: false, error: "خطا در دریافت نظرات در انتظار تأیید." };
  }
}

export async function approveReviewAction(reviewId: string): Promise<ApproveReviewResult> {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== "admin") {
    return { success: false, error: "دسترسی غیرمجاز." };
  }

  try {
    const review = await prisma.review.update({
      where: { id: reviewId },
      data: { isApproved: true },
    });

    const reviews = await prisma.review.findMany({
      where: { productId: review.productId, isApproved: true },
      select: { rating: true },
    });

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;

    await prisma.product.update({
      where: { id: review.productId },
      data: {
        rating: averageRating,
        reviewCount: totalReviews,
      },
    });

    logger.info("[Review:Approve] Success", { reviewId });

    return { success: true };
  } catch (error) {
    logger.error("[Review:Approve] Failed", { error: error instanceof Error ? error.message : String(error) });
    return { success: false, error: "خطا در تأیید نظر." };
  }
}

export async function rejectReviewAction(reviewId: string): Promise<RejectReviewResult> {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== "admin") {
    return { success: false, error: "دسترسی غیرمجاز." };
  }

  try {
    await prisma.review.delete({
      where: { id: reviewId },
    });

    logger.info("[Review:Reject] Success", { reviewId });

    return { success: true };
  } catch (error) {
    logger.error("[Review:Reject] Failed", { error: error instanceof Error ? error.message : String(error) });
    return { success: false, error: "خطا در حذف نظر." };
  }
}

// ============================================================
// ✅ توابع Order با export
// ============================================================

export async function createOrderAction(
    checkoutData: {
      customerInformation: unknown,
      address: unknown,
      shippingMethod?: string,
      shippingCost?: number,
      couponCode?: string,
      idempotencyKey?: string
    },
    cartItems: { productId: string, quantity: number }[]
): Promise<CreateOrderResult> {
  const correlationId = crypto.randomUUID();
  logger.info("[Order:Create] Initiation", undefined, correlationId);

  try {
    const user = await getAuthenticatedUser();
    const isTest = process.env.NODE_ENV === "test";

    const validatedCheckout = CheckoutDataSchema.safeParse(checkoutData);
    if (!validatedCheckout.success) {
      return { success: false, error: "داده‌های ورودی نامعتبر است." };
    }

    const validatedItems = z.array(CartItemSchema).safeParse(cartItems);
    if (!validatedItems.success) {
      return { success: false, error: "محصولات سبد خرید نامعتبر هستند." };
    }

    if (validatedItems.data.length === 0) {
      return { success: false, error: "سبد خرید نمی‌تواند خالی باشد." };
    }

    const idempotencyKey = validatedCheckout.data.idempotencyKey;
    if (idempotencyKey) {
      const existingOrder = await prisma.order.findFirst({
        where: {
          idempotencyKey: idempotencyKey,
          userId: user?.id || null
        }
      });
      if (existingOrder) {
        logger.info("[Order:Create] Idempotency hit", { orderId: existingOrder.id }, correlationId);
        return {
          success: true,
          orderId: existingOrder.id,
          totalAmount: Number(existingOrder.totalAmount),
          message: "این سفارش قبلاً ثبت شده است."
        };
      }
    }

    const orderResult = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const validatedProductItems = [];

      const productIds = validatedItems.data.map(item => item.productId);
      const products = await tx.product.findMany({
        where: {
          id: { in: productIds },
          isEnabled: true
        }
      });

      const productMap = new Map(products.map(p => [p.id, p]));

      for (const item of validatedItems.data) {
        const product = productMap.get(item.productId);

        if (!product) {
          throw new Error(`محصول با شناسه ${item.productId} یافت نشد.`);
        }

        if (product.inventoryCount < item.quantity) {
          throw new Error(`موجودی کافی نیست برای محصول: ${product.title}`);
        }

        const price = Number(product.price);
        totalAmount += price * item.quantity;

        await tx.product.update({
          where: { id: product.id },
          data: { inventoryCount: { decrement: item.quantity } }
        });

        validatedProductItems.push({
          productId: product.id,
          title: product.title,
          price: product.price,
          quantity: item.quantity
        });
      }

      const SHIPPING_COSTS: Record<string, number> = {
        "standard-post": 35000,
        "express-post": 65000,
        "courier": 120000,
        "local-delivery": 50000,
        "store-pickup": 0,
        "free-shipping": 0,
      };

      const shippingCost = validatedCheckout.data.shippingMethod
          ? (SHIPPING_COSTS[validatedCheckout.data.shippingMethod] || 0)
          : 0;

      let discountAmount = 0;
      const couponCode = validatedCheckout.data.couponCode;

      if (couponCode && couponCode.toUpperCase() === "WELCOME10") {
        discountAmount = totalAmount * 0.1;
      }

      const finalTotal = totalAmount + shippingCost - discountAmount;

      const guestToken = user ? null : crypto.randomUUID();

      const orderParams: Prisma.OrderUncheckedCreateInput = {
        status: "pending_payment",
        totalAmount: finalTotal,
        customerInformation: JSON.stringify(validatedCheckout.data.customerInformation),
        address: JSON.stringify(validatedCheckout.data.address),
        shippingMethod: validatedCheckout.data.shippingMethod || null,
        shippingCost: shippingCost,
        idempotencyKey: idempotencyKey || undefined,
        userId: user?.id,
        guestToken: guestToken,
        items: {
          create: validatedProductItems.map(item => ({
            productId: item.productId,
            title: item.title,
            price: Number(item.price),
            quantity: item.quantity,
          }))
        }
      };

      if (isTest) {
        orderParams.orderNumber = Math.floor(Math.random() * 1000000);
      }

      const newOrder = await tx.order.create({
        data: orderParams
      });

      return { orderId: newOrder.id, totalAmount: finalTotal, guestToken };
    });

    logger.info("[Order:Create] Success", { orderId: orderResult.orderId }, correlationId);

    return {
      success: true,
      orderId: orderResult.orderId,
      totalAmount: orderResult.totalAmount,
      message: "سفارش شما با موفقیت ثبت شد.",
      guestToken: orderResult.guestToken || undefined,
    };
  } catch (error: unknown) {
    const errMessage = safeErrorMessage(error, "خطا در ثبت سفارش. لطفاً دوباره تلاش کنید.");
    logger.error("[Order:Create] Failed", { error: errMessage }, correlationId);
    return { success: false, error: errMessage };
  }
}

export async function startPaymentAction(
    orderId: string,
    guestToken?: string
): Promise<StartPaymentResult> {
  const user = await getAuthenticatedUser();

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) throw new Error("سفارش یافت نشد.");

    if (order.userId) {
      if (order.userId !== user?.id) {
        throw new Error("عدم دسترسی به سفارش.");
      }
    } else {
      if (!guestToken || order.guestToken !== guestToken) {
        throw new Error("توکن نامعتبر است.");
      }
    }

    if (order.status === "paid") {
      throw new Error("این سفارش قبلاً پرداخت شده است.");
    }
    if (!isPayableStatus(order.status)) {
      throw new Error("امکان پرداخت این سفارش وجود ندارد (سفارش لغو شده یا منقضی شده است).");
    }

    const customerInfo = JSON.parse(order.customerInformation);

    const payment = await initiatePayment({
      orderId: order.id,
      amount: Number(order.totalAmount),
      mobile: customerInfo.mobileNumber,
      description: `سفارش شماره ${order.orderNumber}`
    });

    await prisma.paymentAttempt.create({
      data: {
        orderId: order.id,
        provider: "zarinpal",
        authority: payment.id,
        status: "pending",
        amount: order.totalAmount,
      },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { paymentAuthority: payment.id }
    });

    return { success: true, paymentUrl: payment.paymentUrl };
  } catch (error: unknown) {
    const errMessage = safeErrorMessage(error, "خطا در اتصال به درگاه پرداخت.");
    return { success: false, error: errMessage };
  }
}

export async function handlePaymentCallbackAction(params: { orderId: string, token: string }): Promise<PaymentCallbackResult> {
  const correlationId = crypto.randomUUID();
  logger.info(`[Payment:Reconcile] Initiation`, { orderId: params.orderId }, correlationId);

  try {
    const order = await prisma.order.findUnique({
      where: { id: params.orderId },
      include: { paymentAttempts: true }
    });

    if (!order) throw new Error("سفارش یافت نشد.");

    if (order.paymentAuthority && order.paymentAuthority !== params.token) {
      throw new Error("توکن پرداخت نامعتبر است.");
    }

    if (order.status === "paid") {
      return { success: true, message: "این سفارش قبلاً پرداخت شده است.", code: "ALREADY_PAID" as const };
    }

    if (!isPayableStatus(order.status)) {
      logger.warn(
          "[Payment:Reconcile] Callback received for a non-payable order status",
          { orderId: order.id, status: order.status },
          correlationId,
      );

      const auditVerification = await verifyPayment(params.token, Number(order.totalAmount));
      if (auditVerification.success) {
        try {
          await prisma.paymentAttempt.create({
            data: {
              orderId: order.id,
              provider: "zarinpal",
              status: "requires_manual_review",
              amount: order.totalAmount,
              transactionId: auditVerification.transactionId || null,
            },
          });
        } catch (attemptError) {
          if (!(attemptError instanceof Prisma.PrismaClientKnownRequestError && attemptError.code === "P2002")) {
            throw attemptError;
          }
        }
        logger.error(
            "[Payment:Reconcile] Gateway verification succeeded for a non-payable order. Funds may have been captured; flagged for manual review.",
            { orderId: order.id, status: order.status, transactionId: auditVerification.transactionId },
            correlationId,
        );
        return {
          success: false,
          error: "این سفارش دیگر معتبر نیست. در صورت کسر وجه، لطفاً با پشتیبانی تماس بگیرید.",
          code: "ORDER_NOT_PAYABLE_FUNDS_CAPTURED" as const,
        };
      }

      return {
        success: false,
        error: "این سفارش لغو شده یا منقضی شده و امکان تکمیل پرداخت آن وجود ندارد.",
        code: "ORDER_NOT_PAYABLE" as const,
      };
    }

    const verification = await verifyPayment(params.token, Number(order.totalAmount));

    if (!verification.success) {
      await prisma.$transaction(async (tx) => {
        const updated = await tx.order.updateMany({
          where: { id: order.id, status: { in: [...PAYABLE_ORDER_STATUSES] } },
          data: { status: "payment_failed" },
        });
        if (updated.count > 0) {
          await tx.paymentAttempt.create({
            data: {
              orderId: order.id,
              provider: "zarinpal",
              status: "failed",
              amount: order.totalAmount,
              transactionId: verification.transactionId || null,
            },
          });
        }
      });
      return { success: false, error: verification.error || "پرداخت ناموفق بود.", code: "VERIFICATION_FAILED" as const };
    }

    const reconciled = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.updateMany({
        where: { id: order.id, status: { in: [...PAYABLE_ORDER_STATUSES] } },
        data: { status: "paid" },
      });

      if (updated.count === 0) {
        return { alreadyReconciled: true };
      }

      try {
        await tx.paymentAttempt.create({
          data: {
            orderId: order.id,
            provider: "zarinpal",
            status: "success",
            amount: order.totalAmount,
            transactionId: verification.transactionId,
          },
        });
      } catch (attemptError) {
        if (attemptError instanceof Prisma.PrismaClientKnownRequestError && attemptError.code === "P2002") {
        } else {
          throw attemptError;
        }
      }

      return { alreadyReconciled: false };
    });

    if (reconciled.alreadyReconciled) {
      return { success: true, message: "این سفارش قبلاً پرداخت شده است.", code: "ALREADY_PAID" as const };
    }

    try {
      const customerInfo = JSON.parse(order.customerInformation);
      if (customerInfo.mobileNumber) {
        const notifyResult = await notifyOrderSuccess(customerInfo.mobileNumber, order.id);
        if (notifyResult.status !== "sent") {
          logger.warn(
              "[Payment:Notify] Order-paid notification did not send",
              { orderId: order.id, status: notifyResult.status },
              correlationId,
          );
        }
      }
    } catch (notifyError) {
      logger.error("[Payment:Notify] Failed to send notification", { orderId: order.id, error: String(notifyError) }, correlationId);
    }

    logger.info(`[Payment:Reconcile] Success`, { orderId: order.id, transactionId: verification.transactionId }, correlationId);
    return { success: true, message: "پرداخت با موفقیت تایید شد.", code: "PAID" as const };
  } catch (error: unknown) {
    const errMessage = safeErrorMessage(error, "خطا در تایید پرداخت.");
    logger.error(`[Payment:Reconcile] Failed`, { error: errMessage }, correlationId);
    return { success: false, error: errMessage, code: "ERROR" as const };
  }
}

export async function cleanupExpiredOrdersAction(): Promise<CleanupOrdersResult> {
  const EXPIRY_HOURS = 24;
  const expiryDate = new Date(Date.now() - EXPIRY_HOURS * 60 * 60 * 1000);

  try {
    const expiredOrders = await prisma.order.findMany({
      where: {
        status: "pending_payment",
        createdAt: { lt: expiryDate }
      },
      include: { items: true }
    });

    if (expiredOrders.length === 0) return { success: true, count: 0 };

    let updatedCount = 0;

    await prisma.$transaction(async (tx) => {
      for (const order of expiredOrders) {
        const updated = await tx.order.updateMany({
          where: {
            id: order.id,
            status: "pending_payment"
          },
          data: { status: "expired" }
        });

        if (updated.count === 0) {
          continue;
        }

        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { inventoryCount: { increment: item.quantity } }
          });
        }

        updatedCount++;
      }
    });

    return { success: true, count: updatedCount };
  } catch (error) {
    const errMessage = safeErrorMessage(error, "خطا در پاکسازی سفارش‌های منقضی.");
    logger.error("[Order:Cleanup] Failed", { error: errMessage });
    return { success: false, error: errMessage };
  }
}

export async function getUserOrdersAction(): Promise<GetUserOrdersResult> {
  const user = await getAuthenticatedUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        items: true
      }
    });
    return { success: true, orders };
  } catch (error) {
    logger.error("[Order:List] Failed to fetch orders", { userId: user.id, error: error instanceof Error ? error.message : String(error) });
    return { success: false, error: "Failed to fetch orders." };
  }
}

export async function getOrderAction(orderId: string): Promise<GetOrderResult> {
  const user = await getAuthenticatedUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        paymentAttempts: true
      }
    });

    if (!order || order.userId !== user.id) {
      return { success: false, error: "Access denied." };
    }

    return { success: true, order };
  } catch (error) {
    logger.error("[Order:Get] Failed to fetch order", { orderId, userId: user.id, error: error instanceof Error ? error.message : String(error) });
    return { success: false, error: "Failed to fetch order." };
  }
}

export async function cancelOrderAction(orderId: string): Promise<CancelOrderResult> {
  const user = await getAuthenticatedUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true }
      });

      if (!order || order.userId !== user.id) {
        throw new Error("Access denied.");
      }

      if (order.status !== "pending_payment" && order.status !== "draft") {
        throw new Error("امکان لغو این سفارش وجود ندارد.");
      }

      const updatedOrder = await tx.order.updateMany({
        where: {
          id: orderId,
          status: { in: ["pending_payment", "draft"] }
        },
        data: { status: "cancelled" }
      });

      if (updatedOrder.count === 0) {
        throw new Error("سفارش قابل لغو نیست (وضعیت تغییر کرده است).");
      }

      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { inventoryCount: { increment: item.quantity } }
        });
      }

      return { success: true };
    });

    return { success: true };
  } catch (error: unknown) {
    const errMessage = safeErrorMessage(error, "خطا در لغو سفارش.");
    return { success: false, error: errMessage };
  }
}