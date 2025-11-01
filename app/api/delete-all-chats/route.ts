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

    // Get all user's chats
    const userChats = await db
      .select()
      .from(chats)
      .where(eq(chats.userId, userId));

    if (userChats.length === 0) {
      return NextResponse.json({ success: true, message: "No chats to delete" });
    }

    const chatIds = userChats.map(chat => chat.id);

    // Delete all messages for these chats
    for (const chatId of chatIds) {
      await db.delete(messages).where(eq(messages.chatId, chatId));
    }

    // Delete all chats
    await db.delete(chats).where(eq(chats.userId, userId));

    return NextResponse.json({ 
      success: true, 
      message: `Deleted ${userChats.length} chats` 
    });
  } catch (error) {
    console.error("Error deleting all chats:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}