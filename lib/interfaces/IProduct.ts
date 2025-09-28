import mongoose, { Document, Types } from 'mongoose';

export enum ProductCategory {
  ELECTRONICS = "electronics",
  CLOTHING = "clothings",
  APPLIANCES = "appliances",
  GROCERIES = "groceries",
  BOOKS = "books"
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