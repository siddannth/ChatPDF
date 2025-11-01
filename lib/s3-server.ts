// lib/s3-server.ts
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import * as fs from "fs";
import * as path from "path";
import type { Readable } from "stream";

const s3 = new S3Client({
  region: "eu-north-1", // Hardcoded for now
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY!,
  },
});

function isNodeReadable(x: any): x is Readable {
  return x && typeof x.read === "function";
}

async function bodyToBuffer(body: any): Promise<Buffer> {
  if (isNodeReadable(body)) {
    const chunks: Buffer[] = [];
    for await (const chunk of body) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }
  if (body?.getReader) {
    const reader = body.getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    return Buffer.concat(chunks.map((u) => Buffer.from(u)));
  }
  if (typeof body?.arrayBuffer === "function") {
    const ab = await body.arrayBuffer();
    return Buffer.from(ab);
  }
  throw new Error("Unsupported S3 Body stream type");
}

export async function downloadFromS3(file_key: string): Promise<string | null> {
  try {
    console.log("🔍 Downloading from S3:");
    console.log("  - Bucket:", process.env.NEXT_PUBLIC_S3_BUCKET_NAME);
    console.log("  - Key:", file_key);
    console.log("  - Region:", "eu-north-1");
    console.log("  - Access Key ID:", process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID?.substring(0, 10) + "...");

    const { Body } = await s3.send(
      new GetObjectCommand({
        Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME!,
        Key: file_key,
      })
    );

    console.log("✅ S3 response received, converting to buffer...");
    const buffer = await bodyToBuffer(Body);
    console.log("✅ Buffer created, size:", buffer.length);

    const tmpDir = path.join(process.cwd(), "tmp");
    fs.mkdirSync(tmpDir, { recursive: true });

    const filePath = path.join(tmpDir, `pdf-${Date.now()}.pdf`);
    fs.writeFileSync(filePath, buffer);
    console.log("✅ File saved to:", filePath);
    
    return filePath;
  } catch (error) {
    console.error("❌ S3 Download Error:", error);
    console.error("❌ Error details:", {
      message: error instanceof Error ? error.message : "Unknown",
      name: error instanceof Error ? error.name : "Unknown",
      stack: error instanceof Error ? error.stack : "No stack"
    });
    throw new Error(`Failed to download file from S3: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}