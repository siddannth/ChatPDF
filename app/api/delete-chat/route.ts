import { db } from "@/lib/db";
import { chats, messages } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { chatId } = await req.json();

    if (!chatId) {
      return new NextResponse("Chat ID is required", { status: 400 });
    }

   
    const [chat] = await db
      .select()
      .from(chats)
      .where(eq(chats.id, chatId));

    if (!chat || chat.userId !== userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

  
    await db.delete(messages).where(eq(messages.chatId, chatId));

    await db.delete(chats).where(eq(chats.id, chatId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting chat:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
