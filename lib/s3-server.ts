import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import * as fs from "fs";
import * as path from "path";
import type { Readable } from "stream";

const s3 = new S3Client({
  region: "eu-north-1",
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
    
    const command = new GetObjectCommand({
      Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME!,
      Key: file_key,
    });

    const response = await s3.send(command);
    if (!response.Body) {
      throw new Error("S3 response has no body");
    }

    const buffer = await bodyToBuffer(response.Body);
    const tmpDir = "/tmp";
    const fileName = `pdf-${Date.now()}.pdf`;
    const filePath = path.join(tmpDir, fileName);
    fs.writeFileSync(filePath, buffer);
    
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      console.log("File verified, size:", stats.size, "bytes");
      return filePath;
    } else {
      throw new Error("File was not created");
    }
  } catch (error: any) { 
    throw new Error(`Failed to download from S3: ${error.message}`);
  }
}