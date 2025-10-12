import mongoose, { Schema, Model } from "mongoose";
import { IProductDetails, ProductCategory } from "../interfaces/IProduct";


const ProductDetailsSchema = new Schema<IProductDetails>(
  {
    productAltId: {
      type: String,
    },
    productCategory: {
      type: String,
      enum: {
        values: Object.values(ProductCategory),
        message: "{VALUE} is not supported",
      },
      required: true,
    },
    productImageLink: {
      type: String,
    },
    productAvailability: {
      type: Number,
      required: true,
    }
  },
  {
    timestamps: true,
  }
);

const ProductDetails: Model<IProductDetails> = mongoose.models.ProductDetails || mongoose.model<IProductDetails>("ProductDetails", ProductDetailsSchema);

export default ProductDetails;
