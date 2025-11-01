import { NextResponse } from "next/server";
import { loadS3IntoPinecone, storeToPinecone } from "@/lib/pinecone";
import { generateEmbeddings } from "@/lib/embeddings";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { getS3Url } from "@/lib/s3";
import { checkSubscription } from "@/lib/subscription";
import { checkChatLimit, MAX_FREE_CHATS } from "@/lib/limits";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { file_key, file_name } = body;

    console.log("Received file_key:", file_key);
    console.log("Received file_name:", file_name);

    if (!file_key) {
      return NextResponse.json(
        { error: "file_key is required" },
        { status: 400 }
      );
    }

    // Check subscription and limits
    const isPro = await checkSubscription();
    const canCreate = await checkChatLimit(userId);

    if (!isPro && !canCreate) {
      return NextResponse.json(
        { 
          error: "Free limit reached", 
          message: `You've reached the limit of ${MAX_FREE_CHATS} chats. Upgrade to Pro for unlimited chats!` 
        },
        { status: 403 }
      );
    }

    // Insert into database
    console.log("💾 Creating chat in database...");
    const chat_id = await db
      .insert(chats)
      .values({
        fileKey: file_key,
        pdfName: file_name,
        pdfUrl: getS3Url(file_key),
        userId,
      })
      .returning({
        insertedId: chats.id,
      });

    console.log("✅ Chat created with ID:", chat_id[0].insertedId);

    // Load and split PDF
    console.log("📄 Loading and splitting PDF...");
    const documents = await loadS3IntoPinecone(file_key);

    // Generate embeddings
    console.log("🧠 Generating embeddings...");
    const vectors = await generateEmbeddings(documents);

    // Store in Pinecone
    console.log("📌 Storing in Pinecone...");
    await storeToPinecone(vectors, file_key);

    console.log("✅ Successfully processed PDF!");

    return NextResponse.json(
      {
        success: true,
        chatId: chat_id[0].insertedId,
        message: "PDF embedded and stored successfully",
        documentCount: documents.length,
        vectorCount: vectors.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}