import { NextResponse } from "next/server";
import { swaggerSpec } from "../../../../lib/doc/swagger";

export async function GET() {
  return NextResponse.json(swaggerSpec);
}
