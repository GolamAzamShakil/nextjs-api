import { NextResponse } from "next/server";
import connectDB from "../../../../../lib/db";
import Product from "../../../../../lib/models/products";
import User from "../../../../../lib/models/users";


export const GET = async () => {
    try {
        await connectDB();

        const products = await Product.find({}).populate("productDetails");
        const users = await User.find({}, "-userPassword");

        return new NextResponse(JSON.stringify(users), { status: 200 });
    } catch (error: any) {
        return new NextResponse("Error occurred during fetching users- " + error.message, { status: 500 })
    }
}