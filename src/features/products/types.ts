import { Product, StockStatus } from "./schema";

export type { Product, StockStatus };

export interface ProductDimensions {
  length?: number;
  width?: number;
  height?: number;
  unit?: "cm" | "mm";
}
