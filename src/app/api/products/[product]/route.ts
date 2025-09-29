import { Types } from "mongoose";
import { NextResponse } from "next/server";
import connectDB from "../../../../../lib/db";
import Product from "../../../../../lib/models/products";
import { ProductCategory } from "../../../../../lib/interfaces/IProduct";
import ProductDetails from "../../../../../lib/models/productDetails";
import { convertGoogleDriveUrl } from "../../../../../lib/linkConverter";


export const GET = async (request: Request, context: { params: any }) => {
  const productId = context.params.product;
  try {
    let productAltId: string | null = null;

    try {
      const { searchParams } = new URL(request.url);
      productAltId = searchParams.get("productAltId") || null;
    } catch {
      if (!productId && !productAltId) {
        return NextResponse.json(
          {
            error: "Must provide productId or productAltId as query parameter",
          },
          { status: 400 }
        );
      }
    }
    

    /* if (!productId || !Types.ObjectId.isValid(productId)) {
      return new NextResponse(
        JSON.stringify({ message: "Invalid or missing productId" }),
        {
          status: 400,
        }
      );
    } */
    

    await connectDB();

    let product = await Product.findOne({ productId }).populate("productDetails").exec();
    if (!product && productAltId) {
      const productDetails = await ProductDetails.findOne({ productAltId }).exec();
      if (productDetails) {
        product = await Product.findOne({ productDetails: productDetails._id }).populate("productDetails").exec();
      }
    }

    /* if (productId) {
      product = await Product.findOne({ productId }).populate("productDetails");
    } else if (!product || productAltId) {
      // Since productDetails is referenced, we find the product by joined productDetails.productAltId
      product = await Product.findOne().populate({
        path: "productDetails",
        match: { productAltId },
      });

      // Mongoose's populate with match returns the document with productDetails null if no match
      if (!product || !product.productDetails) {
        product = null;
      }
    } */

    if (!product) {
      return new NextResponse(
        JSON.stringify({ message: "Product not found in the database" }),
        {
          status: 400,
        }
      );
    }

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

export const POST = async (request: Request, context: { params: any }) => {
  const productId = context.params.product;
  try {
    //const { searchParams } = new URL(request.url);
    //const category = searchParams.get("category");
    const body = await request.json();
    const { productName, productAltId, productCategory, productImageLink, productAvailability } = body;
    const convertedLink = convertGoogleDriveUrl(productImageLink);

    if (!Object.values(ProductCategory).includes(productCategory)) {
      return new NextResponse(
        JSON.stringify({ message: "Invalid or missing category" }),
        {
          status: 400,
        }
      );
    }

    await connectDB();

    let product = await Product.findOne({ productId }).populate("productDetails").exec();
    if (!product && productAltId) {
      const productDetails = await ProductDetails.findOne({ productAltId }).exec();
      if (productDetails) {
        product = await Product.findOne({ productDetails: productDetails._id }).populate("productDetails").exec();
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

    if (!product) {
      const productDetails = await ProductDetails.create({ productAltId, productCategory, productImageLink: convertedLink, productAvailability });

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
          productImageLink: convertedLink,
          productAvailability,
        });
      } else {
        // productDetails might just be ObjectId reference if not populated
        await ProductDetails.findByIdAndUpdate(product.productDetails, {
          productAltId,
          productCategory,
          productImageLink: convertedLink,
          productAvailability,
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
