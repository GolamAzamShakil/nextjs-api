import mongoose, { Document, Types } from 'mongoose';

export enum ProductCategory {
  SUPER = "super",
  GOOD = "good",
  AVERAGE = "average",
  BAD = "bad",
}

export interface IProductDetails extends Document {
  productAltId?: string;
  productCategory: ProductCategory;
  productImageLink?: string;
}

export interface IProduct extends Document {
  productId: string;
  productName?: string;
  productDetails: Types.ObjectId | IProductDetails;
}