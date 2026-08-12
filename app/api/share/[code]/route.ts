import { NextResponse } from "next/server";
import { readShare } from "@/lib/share-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const snapshot = await readShare(code);
  if (!snapshot) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(snapshot);
}
