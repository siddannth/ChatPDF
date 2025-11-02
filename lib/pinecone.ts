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


async function loadPDFWithPdf2json(filePath: string): Promise<Document[]> {
  return new Promise((resolve, reject) => {
    const PDFParser = require("pdf2json");
    const pdfParser = new PDFParser();
    pdfParser.on("pdfParser_dataError", (errData: any) => {
      console.error(" PDF Parse Error:", errData.parserError);
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
                
                pageText += decodeURIComponent(textRun.T) + " ";
              } catch (e) {
               
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

        resolve(documents);
      } catch (error) {
        reject(error);
      }
    });

    pdfParser.loadPDF(filePath);
  });
}

export async function loadS3IntoPinecone(fileKey: string) {
  console.log("Downloading file from S3:", fileKey);

  const filePath = await downloadFromS3(fileKey);
  if (!filePath) {
    throw new Error("Failed to download file from S3");
  }
  
  try {
    
    const rawDocs = await loadPDFWithPdf2json(filePath);
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const docs = await textSplitter.splitDocuments(rawDocs);
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
    console.error("Error loading PDF:", error);
    throw error;
  }
}


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

    const index = client.index(indexName);
    const vectorsWithFileKey = vectors.map((vector) => ({
      id: vector.id,
      values: vector.values,
      metadata: {
        ...(vector.metadata || {}),  
        fileKey,  
      },
    }));

    
    const batchSize = 100;
    for (let i = 0; i < vectorsWithFileKey.length; i += batchSize) {
      const batch = vectorsWithFileKey.slice(i, i + batchSize);
      await index.upsert(batch);
      console.log(
        `Upserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
          vectorsWithFileKey.length / batchSize
        )}`
      );
    }

   
  } catch (error) {
    console.error("Error storing to Pinecone:", error);
    throw error;
  }
}

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
    console.error(" Error querying Pinecone:", error);
    throw error;
  }
}

export async function embedAndStoreToPinecone(
  fileKey: string,
  chatId: number
) {
  try {
  
    const documents = await loadS3IntoPinecone(fileKey);
    const vectors = await generateEmbeddings(documents);
    await storeToPinecone(vectors, fileKey);
    return { success: true, documentCount: documents.length, vectorCount: vectors.length };
  } catch (error) {
    console.error(" Error in embedAndStoreToPinecone:", error);
    throw error;
  }

  

  
}