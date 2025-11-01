import { OpenAIStream, StreamingTextResponse } from "ai";
import { getContext } from "@/lib/context";
import OpenAI from "openai";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { messages, chatId } = await req.json();

    // Get the last message from the user
    const lastMessage = messages[messages.length - 1];

    // Get relevant context from Pinecone
    const context = await getContext(lastMessage.content, chatId);

    console.log("📄 Using context length:", context.length);

    // Create system message with context
    const systemMessage = {
      role: "system" as const,
      content: `You are a helpful AI assistant. Answer questions based ONLY on the following context from a PDF document.

CONTEXT FROM PDF:
${context}

INSTRUCTIONS:
- Answer questions using ONLY the information from the context above
- If the answer is clearly in the context, provide a detailed response
- Be specific and quote relevant parts
- If the information is not in the context, say "I don't see that information in this document"
- Be conversational and helpful`,
    };

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      stream: true,
      messages: [systemMessage, ...messages],
      temperature: 0.0, // Lower temperature for more factual responses
    });

    const stream = OpenAIStream(response);
    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error("❌ Chat API Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}