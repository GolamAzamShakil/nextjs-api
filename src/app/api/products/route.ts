import { NextResponse } from "next/server";
import { Types } from "mongoose";
import connectDB from "../../../../lib/db";
import Product from "../../../../lib/models/products";

export const GET = async () => {
    try {
        await connectDB();

        const products = await Product.find({}).populate("productDetails");

        return new NextResponse(JSON.stringify(products), { status: 200 });
    } catch (error: any) {
        return new NextResponse("Error occurred during fetching users- " + error.message, { status: 500 })
    }
}

