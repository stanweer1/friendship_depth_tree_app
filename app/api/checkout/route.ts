import { NextResponse } from "next/server";
import type { BillingInterval, PlanId } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    plan?: PlanId;
    interval?: BillingInterval;
  };
  const plan = body.plan === "family" ? "family" : "plus";
  const secret = process.env.STRIPE_SECRET_KEY;
  const price =
    plan === "family"
      ? process.env.STRIPE_PRICE_FAMILY
      : process.env.STRIPE_PRICE_PLUS;

  if (secret && price) {
    const origin = new URL(request.url).origin;
    const session = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        mode: "subscription",
        success_url: `${origin}/grove?upgraded=${plan}`,
        cancel_url: `${origin}/pricing`,
        "line_items[0][price]": price,
        "line_items[0][quantity]": "1",
      }),
    });
    const data = (await session.json()) as { url?: string; error?: { message?: string } };
    if (data.url) return NextResponse.json({ url: data.url });
    return NextResponse.json({ error: data.error?.message || "Stripe error" }, { status: 500 });
  }

  return NextResponse.json({ demo: true, plan });
}
