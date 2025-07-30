import { NextResponse } from "next/server";
import { Types } from "mongoose";
import connectDB from "../../../../lib/db";
import Product from "../../../../lib/models/products";



export const GET = async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const productAltId = searchParams.get("productAltId");

    /* if (!productId || !Types.ObjectId.isValid(productId)) {
      return new NextResponse(
        JSON.stringify({ message: "Invalid or missing productId" }),
        {
          status: 400,
        }
      );
    } */
    if (
      (!productId) &&
      (!productAltId)
    ) {
      return NextResponse.json(
        { error: "Must provide productId or productAltId as query parameter" },
        { status: 400 }
      );
    }

    await connectDB();

    //const product = await Product.findById(productId);
    let product;

    if (productId) {
      product = await Product.findOne({ productId }).populate("productDetails");
    } else if (productAltId) {
      // Since productDetails is referenced, we find the product by joined productDetails.productAltId
      product = await Product.findOne().populate({
        path: "productDetails",
        match: { productAltId },
      });

      // Mongoose's populate with match returns the document with productDetails null if no match
      if (!product || !product.productDetails) {
        product = null;
      }
    }

    if (!product) {
      return new NextResponse(
        JSON.stringify({ message: "Product not found in the database" }),
        {
          status: 400,
        }
      );
    }

    /* const categories = await Category.find({
      user: new Types.ObjectId(productId),
    }); */

    return new NextResponse(JSON.stringify(product), {
      status: 200,
    });
  } catch (error: any) {
    return new NextResponse(
      "Error occurred during fetching products- " + error.message,
      {
        status: 500,
      }
    );
  }
};
