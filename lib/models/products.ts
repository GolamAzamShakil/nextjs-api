import mongoose, { Model, Schema } from "mongoose";
import { IProduct } from "../interfaces/IProduct";

const ProductSchema = new Schema<IProduct>(
  {
    productId: { type: String, required: true, unique: true, index: true },
    productName: { type: String },
    productDetails: {
      type: Schema.Types.ObjectId,
      ref: "ProductDetails",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);

export default Product;
