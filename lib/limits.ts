import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const MAX_FREE_CHATS = 3;

export async function checkChatLimit(userId: string) {
  const userChats = await db
    .select()
    .from(chats)
    .where(eq(chats.userId, userId));

  return userChats.length < MAX_FREE_CHATS;
}