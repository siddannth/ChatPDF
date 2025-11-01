import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateQueryEmbedding } from "@/lib/embeddings";
import { queryPinecone } from "@/lib/pinecone";

export async function getContext(query: string, chatId: number) {
  try {
    // 1. Get the chat from database to get fileKey
    const [chat] = await db
      .select()
      .from(chats)
      .where(eq(chats.id, chatId))
      .limit(1);

    if (!chat) {
      console.log("❌ Chat not found for chatId:", chatId);
      return "";
    }

    console.log("✅ Found chat, fileKey:", chat.fileKey);

    // 2. Generate embedding for the user's question
    console.log("🧠 Generating query embedding for:", query);
    const queryEmbedding = await generateQueryEmbedding(query);

    // 3. Search Pinecone for relevant chunks
    console.log("🔍 Searching Pinecone...");
    const matches = await queryPinecone(
      queryEmbedding,
      chat.fileKey,
      5 // Get top 5 most relevant chunks
    );

    console.log("✅ Found", matches.length, "matches");

    // 4. Combine the relevant chunks into context
    const context = matches
      .map((match: any) => match.metadata?.text || "")
      .filter((text) => text.length > 0)
      .join("\n\n");

    console.log("📝 Context length:", context.length, "characters");

    return context;
  } catch (error) {
    console.error("❌ Error getting context:", error);
    return "";
  }
}