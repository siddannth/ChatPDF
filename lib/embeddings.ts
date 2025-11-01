import { OpenAIEmbeddings } from "@langchain/openai";
import { Document } from "@langchain/core/documents";
import { PineconeRecord } from "@pinecone-database/pinecone";
import md5 from "md5";

export type EmbeddingVector = PineconeRecord;

/**
 * Generate embeddings for documents using OpenAI
 */
export async function generateEmbeddings(
  docs: Document[]
): Promise<EmbeddingVector[]> {
  try {
    console.log("🧠 Generating embeddings for", docs.length, "documents...");

    const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY!,
  modelName: "text-embedding-3-small",

});

    // Generate embeddings for all documents
    const vectors: EmbeddingVector[] = await Promise.all(
      docs.map(async (doc, index) => {
        const embedding = await embeddings.embedQuery(doc.pageContent);
        
        // Create unique ID for each chunk
        const id = md5(doc.pageContent);

        return {
          id,
          values: embedding,
          metadata: {
            text: doc.pageContent,
            pageNumber: doc.metadata.pageNumber || 0,
            chunkIndex: index,
          },
        } as EmbeddingVector;
      })
    );

    console.log(`✅ Created ${vectors.length} embeddings`);
    return vectors;
  } catch (error) {
    console.error("❌ Error generating embeddings:", error);
    throw error;
  }
}

/**
 * Generate embeddings in batches (for large documents)
 */
export async function generateEmbeddingsBatch(
  docs: Document[],
  batchSize: number = 50
): Promise<EmbeddingVector[]> {
  console.log(`🧠 Generating embeddings in batches of ${batchSize}...`);
  
  const allVectors: EmbeddingVector[] = [];
  const totalBatches = Math.ceil(docs.length / batchSize);

  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = docs.slice(i, i + batchSize);
    const currentBatch = Math.floor(i / batchSize) + 1;
    
    console.log(`🧠 Processing batch ${currentBatch}/${totalBatches}`);
    
    const vectors = await generateEmbeddings(batch);
    allVectors.push(...vectors);
  }

  console.log(`✅ Generated ${allVectors.length} total embeddings`);
  return allVectors;
}

/**
 * Generate embedding for a single query string
 */
export async function generateQueryEmbedding(query: string): Promise<number[]> {
  try {
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY!,
      modelName: "text-embedding-3-small",
    });

    const embedding = await embeddings.embedQuery(query);
    return embedding;
  } catch (error) {
    console.error("❌ Error generating query embedding:", error);
    throw error;
  }
}