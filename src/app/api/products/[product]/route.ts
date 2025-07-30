import { Types } from "mongoose";
import { NextResponse } from "next/server";
import connectDB from "../../../../../lib/db";
import Product from "../../../../../lib/models/products";
import { ProductCategory } from "../../../../../lib/interfaces/IProduct";
import ProductDetails from "../../../../../lib/models/productDetails";

export const POST = async (request: Request, context: { params: any }) => {
  const productId = context.params.product;
  try {
    //const { searchParams } = new URL(request.url);
    //const category = searchParams.get("category");
    const body = await request.json();
    const { productName, productAltId, productCategory, productImageLink } = body;

    if (!Object.values(ProductCategory).includes(productCategory)) {
      return new NextResponse(
        JSON.stringify({ message: "Invalid or missing category" }),
        {
          status: 400,
        }
      );
    }

    await connectDB();

    let product = await Product.findOne({ productId }).populate('productDetails');

    let productWithAltId;
    if(productAltId) {
      /* productWithAltId = await Product.findOne().populate({
        path: "productDetails",
        match: { productAltId },
      }); */

      productWithAltId = await ProductDetails.findOne({ productAltId });

      if (!productWithAltId) {
        productWithAltId = null;
      }
    }
    /* if (!product) {
      return new NextResponse(
        JSON.stringify({ message: "Product not found" }),
        {
          status: 404,
        }
      );
    } */
    /* const = new ({
      title,
      user: new Types.ObjectId(productId),
    }); */

    //await newCategory.save();

    if (!product && !productWithAltId) {
      // create new ProductDetails first
      const productDetails = await ProductDetails.create({ productAltId, productCategory, productImageLink });

      // then create new Product
      product = await Product.create({
        productId,
        productName,
        productDetails: productDetails._id,
      });
    } else {
      // Update existing
      product.productName = productName;
      if (product.productDetails && "_id" in product.productDetails) {
        await ProductDetails.findByIdAndUpdate(product.productDetails._id, {
          productAltId,
          productCategory,
          productImageLink,
        });
      } else {
        // productDetails might just be ObjectId reference if not populated
        await ProductDetails.findByIdAndUpdate(product.productDetails, {
          productAltId,
          productCategory,
          productImageLink,
        });
      }
      await product.save();
    }

    return new NextResponse(
      JSON.stringify({ message: "Product is created or updated", product: product }),
      { status: 200 }
    );
  } catch (error: any) {
    return new NextResponse("Error occurred during creating or updating product- " + error.message, {
      status: 500,
    });
  }
};
