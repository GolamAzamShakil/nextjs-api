import { Types } from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../../../lib/db";
import { ProductCategory } from "../../../../../lib/interfaces/IProduct";
import ProductDetails from "../../../../../lib/models/productDetails";
import { convertGoogleDriveUrl } from "../../../../../lib/linkConverter";
import { Product } from "../../../../../lib/models";


export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    await connectDB();

    const { productId } = params

    if (!productId || productId.trim().length === 0) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const product = await Product.findOne({ productId: productId })
      .populate({
          path: 'productDetails',
          select: '-__v'
        })
      .select('-__v')
      .lean()
      .exec();

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(product, { 
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=240'
      }
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/* export const GET = async (request: Request, context: { params: any }) => {
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

    await connectDB();

    let product = await Product.findOne({ productId }).populate("productDetails").exec();
    if (!product && productAltId) {
      const productDetails = await ProductDetails.findOne({ productAltId }).exec();
      if (productDetails) {
        product = await Product.findOne({ productDetails: productDetails._id }).populate("productDetails").exec();
      }
    }

    // if (productId) {
    //   product = await Product.findOne({ productId }).populate("productDetails");
    // } else if (!product || productAltId) {
    //   // Since productDetails is referenced, we find the product by joined productDetails.productAltId
    //   product = await Product.findOne().populate({
    //     path: "productDetails",
    //     match: { productAltId },
    //   });

    //   // Mongoose's populate with match returns the document with productDetails null if no match
    //   if (!product || !product.productDetails) {
    //     product = null;
    //   }
    // }

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
}; */

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
