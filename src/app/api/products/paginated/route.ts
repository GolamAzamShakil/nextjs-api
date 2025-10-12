import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../../../lib/server/db";
import { Product } from "../../../../../lib/models";
import { mergePublicHeaders } from "../../../../../lib/server/cors";

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");

  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;

    const validatedPage = Math.max(1, page);
    const validatedLimit = Math.min(Math.max(1, limit), 100); // Max 100 items per page

    const skip = (validatedPage - 1) * validatedLimit;

    // Build sort object with fallback
    const allowedSortFields = [
      "createdAt",
      "updatedAt",
      "productName",
      "productId",
      "productDetails.productAvailability",
    ];
    const validSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    const sort: any = {};
    sort[validSortBy] = sortOrder;

    const [products, totalItems] = await Promise.all([
      Product.find({})
        .populate({
          path: "productDetails",
          select: "-__v",
        })
        .sort(sort)
        .skip(skip)
        .limit(validatedLimit)
        .select("-__v")
        .lean()
        .exec(),
      Product.countDocuments({}),
    ]);

    const totalPages = Math.ceil(totalItems / validatedLimit);

    const response = {
      data: products,
      pagination: {
        currentPage: validatedPage,
        totalPages,
        totalItems,
        itemsPerPage: validatedLimit,
        hasNextPage: validatedPage < totalPages,
        hasPreviousPage: validatedPage > 1,
      },
    };

    return NextResponse.json(response, {
      status: 200,
      headers: mergePublicHeaders(origin, {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      }),
    });
  } catch (error) {
    console.error("Error fetching paginated products:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch paginated products",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/* export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    // Validate pagination params
    const validatedPage = Math.max(1, page);
    const validatedLimit = Math.min(Math.max(1, limit), 100); // Max 100 items per page

    const skip = (validatedPage - 1) * validatedLimit;

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder;

    // Execute query with pagination
    const [products, totalItems] = await Promise.all([
      Product.find({})
        .sort(sort)
        .skip(skip)
        .limit(validatedLimit)
        .select('-__v')
        .lean()
        .exec(),
      Product.countDocuments({})
    ]);

    const totalPages = Math.ceil(totalItems / validatedLimit);

    const response = {
      data: products,
      pagination: {
        currentPage: validatedPage,
        totalPages,
        totalItems,
        itemsPerPage: validatedLimit,
        hasNextPage: validatedPage < totalPages,
        hasPreviousPage: validatedPage > 1
      }
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching paginated products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch paginated products' },
      { status: 500 }
    );
  }
} */
