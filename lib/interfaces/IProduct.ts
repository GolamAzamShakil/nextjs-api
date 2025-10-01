import mongoose, { Document, Types } from 'mongoose';

export enum ProductCategory {
  ELECTRICS = "electrics",
  CLOTHING = "clothings",
  APPLIANCES = "appliances",
  GROCERIES = "groceries",
  BOOKS = "books"
}

export interface IProductDetails extends Document {
  productAltId?: string;
  productCategory: ProductCategory;
  productImageLink?: string;
  productAvailability: number;
}

export interface IProduct extends Document {
  productId: string;
  productName?: string;
  productDetails: Types.ObjectId | IProductDetails;
}

export interface IProductPopulated extends Omit<IProduct, 'productDetails'> {
  productDetails: IProductDetails;
}