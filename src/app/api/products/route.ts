import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
//import Product from "../../../../lib/models/products";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import ProductDetails from "../../../../lib/models/productDetails";
import { Product } from "../../../../lib/models";

export const dynamic = "force-dynamic";

export const GET = async () => {
  try {
    await connectDB();

    void ProductDetails
    const products = await Product.find({})
      .populate("productDetails");
      //.lean(); // lean() for better performance if you don't need Mongoose documents

    return NextResponse.json(products, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products", message: error.message },
      { status: 500 }
    );
  }
}