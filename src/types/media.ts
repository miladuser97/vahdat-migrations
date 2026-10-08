/**
 * ImageRef
 * A minimal, shared shape for referencing an image — used by both
 * Product (images/thumbnail) and Category (icon/image) so the two
 * features don't each invent their own slightly-different image shape.
 */
export interface ImageRef {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
}
