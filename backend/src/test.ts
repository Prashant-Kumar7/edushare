import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import * as fs from "fs";
import { Readable } from "stream";
import dotenv from 'dotenv'
// import { PdfToImage } from 'pdf-poppler';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';
import { writeFile, mkdirSync, existsSync } from 'fs';

dotenv.config()

// Initialize the S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

/**
 * Downloads a PDF file from S3 and saves it locally.
 * @param bucket - The name of the S3 bucket.
 * @param key - The key of the S3 object.
 * @param downloadPath - The local path to save the file.
 */
async function downloadPdfFromS3(bucket: string, key: string, downloadPath: string): Promise<void> {
  try {
    const params = { Bucket: bucket, Key: key };
    const command = new GetObjectCommand(params);

    // Get the S3 object
    const response = await s3.send(command);

    // Check if Body is a stream
    if (!response.Body) {
      throw new Error("No response body received.");
    }

    const bodyStream = response.Body as Readable;

    const fileStream = fs.createWriteStream(downloadPath);

    // Pipe the stream to a file
    await new Promise<void>((resolve, reject) => {
      bodyStream.pipe(fileStream);
      bodyStream.on("error", reject);
      fileStream.on("finish", resolve);
    });

    console.log(`PDF downloaded to ${downloadPath}`);
  } catch (error) {
    console.error("Error downloading PDF from S3:", error);
    throw error;
  }
}

// Example usage
const bucketName = process.env.AWS_S3_BUCKET_NAME;
const fileKey = "100xdevsPdf.pdf";
const localPath = "./downloaded-file.pdf";


downloadPdfFromS3(bucketName||"", fileKey, localPath)
  .then(() => console.log("Download completed."))
  .catch((error) => console.error("Download failed:", error));




