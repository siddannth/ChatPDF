import { db } from "@/lib/db";
import { userSubscriptions } from "@/lib/db/schema";
import { stripe } from "@/lib/stripe";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return new NextResponse("Webhook error", { status: 400 });
  }

  // new subscription created
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    
    if (!session?.metadata?.userId) {
      return new NextResponse("User id is required", { status: 400 });
    }

    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );
    
    // Get current_period_end from subscription item
    const periodEnd = subscription.items.data[0]?.current_period_end;
    
    if (!periodEnd) {
      return new NextResponse("no period end", { status: 400 });
    }
    
    await db.insert(userSubscriptions).values({
      userId: session.metadata.userId,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer as string,
      stripePriceId: subscription.items.data[0].price.id,
      stripeCurrentPeriodEnd: new Date(periodEnd * 1000),
    });
  }

  // subscription payment succeeded (renewal)
  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as Stripe.Invoice;
    
    // Fix: Access subscription using bracket notation or cast
    const subscriptionId = (invoice as any).subscription as string;
    
    if (subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      
      const periodEnd = subscription.items.data[0]?.current_period_end;
      
      if (periodEnd) {
        await db
          .update(userSubscriptions)
          .set({
            stripePriceId: subscription.items.data[0].price.id,
            stripeCurrentPeriodEnd: new Date(periodEnd * 1000),
          })
          .where(eq(userSubscriptions.stripeSubscriptionId, subscription.id));
      }
    }
  }

  return new NextResponse(null, { status: 200 });
}