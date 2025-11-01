// lib/s3-server.ts
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import * as fs from "fs";
import * as path from "path";
import type { Readable } from "stream";

// If you insist on NEXT_PUBLIC_* vars, keep them; otherwise prefer server-only vars.
const s3 = new S3Client({
  region: process.env.NEXT_PUBLIC_S3_REGION || "eu-north-1", // make sure this matches your bucket!
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY!,
  },
});

function isNodeReadable(x: any): x is Readable {
  return x && typeof x.read === "function";
}

async function bodyToBuffer(body: any): Promise<Buffer> {
  // Node stream
  if (isNodeReadable(body)) {
    const chunks: Buffer[] = [];
    for await (const chunk of body) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }
  // Web stream
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
  // Blob/ArrayBuffer
  if (typeof body?.arrayBuffer === "function") {
    const ab = await body.arrayBuffer();
    return Buffer.from(ab);
  }
  throw new Error("Unsupported S3 Body stream type");
}

export async function downloadFromS3(file_key: string): Promise<string | null> {
  try {
    const { Body } = await s3.send(
      new GetObjectCommand({
        Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME!,
        Key: file_key,
      })
    );

    const buffer = await bodyToBuffer(Body);

    // Ensure ./tmp exists (Windows-safe)
    const tmpDir = path.join(process.cwd(), "tmp");
    fs.mkdirSync(tmpDir, { recursive: true });

    const filePath = path.join(tmpDir, `pdf-${Date.now()}.pdf`);
    fs.writeFileSync(filePath, buffer);
    return filePath;
  } catch (error) {
    console.error("Error downloading from S3:", error);
    return null;
  }
}
