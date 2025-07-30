import { model, models, Schema } from "mongoose";
import { IProduct } from "../interfaces/IProduct";

const ProductSchema = new Schema<IProduct>(
    {
        productId: { type: "string", required: true, unique: true },
        productName: { type: "string" },
        productDetails: { type: Schema.Types.ObjectId, ref: "ProductDetails", required: true }
    },
    {
        timestamps: true
    }
);

const Product = models.Product || model("Product", ProductSchema);

export default Product;

