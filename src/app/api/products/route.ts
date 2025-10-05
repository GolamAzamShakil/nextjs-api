import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
//import Product from "../../../../lib/models/products";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import ProductDetails from "../../../../lib/models/productDetails";
import { Product } from "../../../../lib/models";
import { ProductCategory } from "../../../../lib/interfaces/IProduct";

//export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') as ProductCategory | null;
    const minAvailability = searchParams.get('minAvailability');
    const searchTerm = searchParams.get('search');

    const productDetailsQuery: any = {};
    
    if (category && Object.values(ProductCategory).includes(category)) {
      productDetailsQuery.productCategory = category;
    }

    if (minAvailability) {
      const availability = parseInt(minAvailability, 10);
      if (!isNaN(availability) && availability >= 0) {
        productDetailsQuery.productAvailability = { $gte: availability };
      }
    }

    const productQuery: any = {};

    if (Object.keys(productDetailsQuery).length > 0) {
      const matchingDetails = await ProductDetails.find(productDetailsQuery)
        .select('_id')
        .lean()
        .exec();
      
      const detailIds = matchingDetails.map(d => d._id);

      if (detailIds.length === 0) {
        return NextResponse.json([], {
          status: 200,
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
          }
        });
      }
      
      productQuery.productDetails = { $in: detailIds };
    }

    if (searchTerm && searchTerm.trim()) {
      const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');


      productQuery.$or = [
        { productName: { $regex: escapedSearchTerm, $options: 'i' } },
        { productId: { $regex: escapedSearchTerm, $options: 'i' } },
        //{ 'productDetails.productAltId': { $regex: escapedSearchTerm, $options: 'i' } }
      ];
    }

    /* const matchingDetails = await ProductDetails.find({
      productCategory: category,
      productAvailability: { $gte: minAvailability }
    })
      .select('_id')
      .lean()
      .exec();
   */
    const products = await Product.find(productQuery)
      .populate({
        path: "productDetails",
        select: "-__v",
        //match: category ? { productCategory: category } : {},
      })
      .select("-__v")
      .lean()
      .exec();

    return NextResponse.json(products, { 
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


/* export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') as ProductCategory | null;
    const minAvailability = searchParams.get('minAvailability');
    const searchTerm = searchParams.get('search');

    // Build query object
    const query: any = {};

    if (category && Object.values(ProductCategory).includes(category)) {
      query['productDetails.productCategory'] = category;
    }

    if (minAvailability) {
      query['productDetails.productAvailability'] = { 
        $gte: parseInt(minAvailability, 10) 
      };
    }

    if (searchTerm) {
      query.$or = [
        { productName: { $regex: searchTerm, $options: 'i' } },
        { productId: { $regex: searchTerm, $options: 'i' } },
        { 'productDetails.productAltId': { $regex: searchTerm, $options: 'i' } }
      ];
    }

    const products = await Product.find(query)
      .select('-__v')
      .lean()
      .exec();

    return NextResponse.json(products, { status: 200 });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
} */

/* export const GET = async () => {
  try {
    await connectDB();

    void ProductDetails
    const products = await Product.find({})
      .populate("productDetails");

    return NextResponse.json(products, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products", message: error.message },
      { status: 500 }
    );
  }
} */