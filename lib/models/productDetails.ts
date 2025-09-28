import mongoose, { model, models, Schema, Types, Document } from "mongoose";
import { IProductDetails, ProductCategory } from "../interfaces/IProduct";


const ProductDetailsSchema = new Schema<IProductDetails>(
  {
    productAltId: {
      type: "string",
    },
    productCategory: {
      type: "string",
      enum: {
        values: Object.values(ProductCategory),
        message: "{VALUE} is not supported",
      },
      required: true,
    },
    productImageLink: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const ProductDetails = mongoose.model("ProductDetails", ProductDetailsSchema);

export default ProductDetails;
