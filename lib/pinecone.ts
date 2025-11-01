import { Pinecone, PineconeRecord } from "@pinecone-database/pinecone";
import { downloadFromS3 } from "@/lib/s3-server";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import { generateEmbeddings, EmbeddingVector } from "@/lib/embeddings";

let pinecone: Pinecone | null = null;

export const getPineconeClient = async (): Promise<Pinecone> => {
  if (!pinecone) {
    if (!process.env.PINECONE_API_KEY) {
      throw new Error("Missing PINECONE_API_KEY");
    }
    
    pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
  }
  
  return pinecone;
};

// Custom PDF loader using pdf2json (no canvas dependency!)
// Custom PDF loader using pdf2json (no canvas dependency!)
async function loadPDFWithPdf2json(filePath: string): Promise<Document[]> {
  return new Promise((resolve, reject) => {
    const PDFParser = require("pdf2json");
    const pdfParser = new PDFParser();

    pdfParser.on("pdfParser_dataError", (errData: any) => {
      console.error("❌ PDF Parse Error:", errData.parserError);
      reject(errData.parserError);
    });

    pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
      try {
        const documents: Document[] = [];
        
        pdfData.Pages.forEach((page: any, pageIndex: number) => {
          let pageText = "";
          
          page.Texts.forEach((text: any) => {
            text.R.forEach((textRun: any) => {
              try {
                // Try to decode URI component
                pageText += decodeURIComponent(textRun.T) + " ";
              } catch (e) {
                // If decoding fails, use the raw text
                pageText += textRun.T + " ";
              }
            });
          });

          if (pageText.trim()) {
            documents.push(
              new Document({
                pageContent: pageText.trim(),
                metadata: {
                  pageNumber: pageIndex + 1,
                  source: filePath,
                },
              })
            );
          }
        });

        console.log(`✅ Extracted ${documents.length} pages`);
        resolve(documents);
      } catch (error) {
        reject(error);
      }
    });

    pdfParser.loadPDF(filePath);
  });
}

export async function loadS3IntoPinecone(fileKey: string) {
  console.log("📥 Downloading file from S3:", fileKey);

  const filePath = await downloadFromS3(fileKey);
  if (!filePath) {
    throw new Error("Failed to download file from S3");
  }

  console.log("📄 Loading PDF from:", filePath);
  
  try {
    // Load PDF using custom loader (no canvas needed!)
    const rawDocs = await loadPDFWithPdf2json(filePath);

    console.log(`✅ Loaded ${rawDocs.length} pages from PDF`);

    // Split documents into smaller chunks using LangChain
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const docs = await textSplitter.splitDocuments(rawDocs);

    console.log(`✅ Split into ${docs.length} chunks`);

    // Add fileKey to metadata
    const documentsWithMetadata = docs.map((doc, index) => ({
      ...doc,
      metadata: {
        ...doc.metadata,
        fileKey,
        chunkIndex: index,
        totalChunks: docs.length,
      },
    }));

    return documentsWithMetadata;
  } catch (error) {
    console.error("❌ Error loading PDF:", error);
    throw error;
  }
}

// Store vectors in Pinecone
// Store vectors in Pinecone
export async function storeToPinecone(
  vectors: EmbeddingVector[],
  fileKey: string
) {
  try {
    const client = await getPineconeClient();
    const indexName = process.env.PINECONE_INDEX_NAME!;

    if (!indexName) {
      throw new Error("Missing PINECONE_INDEX_NAME");
    }

    console.log("📌 Connecting to Pinecone index:", indexName);
    const index = client.index(indexName);

    // Add fileKey to existing metadata (don't overwrite!)
    const vectorsWithFileKey = vectors.map((vector) => ({
      id: vector.id,
      values: vector.values,
      metadata: {
        ...(vector.metadata || {}),  // Keep existing metadata (including text!)
        fileKey,  // Add fileKey
      },
    }));

    // Upsert vectors in batches of 100
    const batchSize = 100;
    for (let i = 0; i < vectorsWithFileKey.length; i += batchSize) {
      const batch = vectorsWithFileKey.slice(i, i + batchSize);
      await index.upsert(batch);
      console.log(
        `📌 Upserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
          vectorsWithFileKey.length / batchSize
        )}`
      );
    }

    console.log(`✅ Successfully stored ${vectors.length} vectors in Pinecone`);
  } catch (error) {
    console.error("❌ Error storing to Pinecone:", error);
    throw error;
  }
}
// Query Pinecone for similar documents
export async function queryPinecone(
  queryEmbedding: number[],
  fileKey: string,
  topK: number = 5
) {
  try {
    const client = await getPineconeClient();
    const indexName = process.env.PINECONE_INDEX_NAME!;
    const index = client.index(indexName);

    const results = await index.query({
      vector: queryEmbedding,
      topK,
      filter: { fileKey: { $eq: fileKey } },
      includeMetadata: true,
    });

    return results.matches || [];
  } catch (error) {
    console.error("❌ Error querying Pinecone:", error);
    throw error;
  }
}

// Main orchestrator function
export async function embedAndStoreToPinecone(
  fileKey: string,
  chatId: number
) {
  try {
    console.log("🚀 Starting embedding process for:", fileKey);

    // 1. Load and split PDF
    const documents = await loadS3IntoPinecone(fileKey);
    
    // 2. Generate embeddings (from separate embeddings.ts file)
    console.log("🧠 Generating embeddings...");
    const vectors = await generateEmbeddings(documents);
    
    // 3. Store in Pinecone
    console.log("📌 Storing in Pinecone...");
    await storeToPinecone(vectors, fileKey);
    
    console.log("✅ Successfully embedded and stored PDF!");
    return { success: true, documentCount: documents.length, vectorCount: vectors.length };
  } catch (error) {
    console.error("❌ Error in embedAndStoreToPinecone:", error);
    throw error;
  }

  

  
}