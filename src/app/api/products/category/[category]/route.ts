import { NextRequest, NextResponse } from "next/server";
import getMongooseConnection from "../../../../../../lib/server/db";
import { ProductCategory } from "../../../../../../lib/interfaces/IProduct";
import { Product, ProductDetails } from "../../../../../../lib/models";
import { mergePublicHeaders } from "../../../../../../lib/server/cors";

export async function GET(
  request: NextRequest,
  { params }: { params: { category: string } }
) {
  const origin = request.headers.get("origin");

  try {
    await getMongooseConnection();

    const { category } = params;

    if (!Object.values(ProductCategory).includes(category as ProductCategory)) {
      return NextResponse.json(
        {
          error: "Invalid product category",
          validCategories: Object.values(ProductCategory),
        },
        { status: 400 }
      );
    }

    const matchingDetails = await ProductDetails.find({
      productCategory: category,
    })
      .select("_id")
      .lean()
      .exec();

    const detailIds = matchingDetails.map((d) => d._id);

    if (detailIds.length === 0) {
      return NextResponse.json([], {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=90, stale-while-revalidate=180",
        },
      });
    }

    const products = await Product.find({
      productDetails: { $in: detailIds },
    })
      .populate({
        path: "productDetails",
        select: "-__v",
      })
      .select("-__v")
      .lean()
      .exec();

    /* const products = await Product.find()
      .populate({
          path: 'productDetails',
          match: { productCategory: category },
          select: '-__v'
        })
      .select('-__v')
      .lean()
      .exec();
 */
    // Filter out products where productDetails is null (didn't match category)
    const filteredProducts = products.filter((p) => p.productDetails !== null);

    return NextResponse.json(filteredProducts, {
      status: 200,
      headers: mergePublicHeaders(origin, {
        "Cache-Control": "public, s-maxage=90, stale-while-revalidate=180",
      }),
    });
  } catch (error) {
    console.error("Error fetching products by category:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch products by category",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
