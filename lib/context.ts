import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateQueryEmbedding } from "@/lib/embeddings";
import { queryPinecone } from "@/lib/pinecone";

export async function getContext(query: string, chatId: number) {
  try {
   
    const [chat] = await db
      .select()
      .from(chats)
      .where(eq(chats.id, chatId))
      .limit(1);

    if (!chat) {
      console.log(" Chat not found for chatId:", chatId);
      return "";
    }
    const queryEmbedding = await generateQueryEmbedding(query);
    const matches = await queryPinecone(
      queryEmbedding,
      chat.fileKey,
     
    );

    const context = matches
      .map((match: any) => match.metadata?.text || "")
      .filter((text) => text.length > 0)
      .join("\n\n");

    return context;
  } catch (error) {
    console.error("Error in getContext:", error);
    return "";
  }
}