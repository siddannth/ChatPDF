import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { OpenAIEmbeddings } from "@langchain/openai";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { getPineconeClient } from "@/lib/pinecone";
import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 30;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { messages, chatId } = await req.json();

    const _chats = await db.select().from(chats).where(eq(chats.id, chatId));
    if (_chats.length !== 1) {
      return NextResponse.json({ error: "chat not found" }, { status: 404 });
    }
    const fileKey = _chats[0].fileKey;
    
    const lastMessage = messages[messages.length - 1];
    const context = await getContext(lastMessage.content, fileKey);
const prompt = {
      role: "system",
      content: `AI assistant is a brand new, powerful, human-like artificial intelligence.
      The traits of AI include expert knowledge, helpfulness, cleverness, and articulateness.
      AI is a well-behaved and well-mannered individual.
      AI is always friendly, kind, and inspiring, and he is eager to provide vivid and thoughtful responses to the user.
      AI has the sum of all knowledge in their brain, and is able to accurately answer nearly any question about any topic in conversation.
      AI assistant is a big fan of Pinecone and Vercel.
      START CONTEXT BLOCK
      ${context}
      END OF CONTEXT BLOCK
      AI assistant will take into account any CONTEXT BLOCK that is provided in a conversation.
      If the context does not provide the answer to question, the AI assistant will say, "I'm sorry, but I don't know the answer to that question".
      AI assistant will not apologize for previous responses, but instead will indicated new information was gained.
      AI assistant will not invent anything that is not drawn directly from the context.
      `,
    };


    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        prompt,
        ...messages.filter((message: any) => message.role === "user"),
      ],
      stream: true,
    });

    const stream = OpenAIStream(response as any);
    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function getContext(query: string, fileKey: string) {
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY!,
  });
  const queryEmbedding = await embeddings.embedQuery(query);
  
  const pinecone = await getPineconeClient();
  const index = pinecone.index(process.env.PINECONE_INDEX_NAME!);
  
  const queryResponse = await index.query({
    vector: queryEmbedding,
    topK: 10,
    filter: { fileKey },
    includeMetadata: true,
  });

  const relevantDocs = queryResponse.matches.map((match) => match.metadata?.text || "");
  return relevantDocs.join("\n\n");
}