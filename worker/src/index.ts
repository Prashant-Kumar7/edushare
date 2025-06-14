import dotenv from "dotenv"
import ConvertAPI from 'convertapi';
import * as path from 'path';
import { DeleteObjectCommand, GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import * as fs from "fs";
import { Readable } from "stream";
import { Upload } from '@aws-sdk/lib-storage';
import fsExtra from 'fs-extra';
import fsPromises from 'fs/promises';
import { createClient } from "redis";

dotenv.config();

export const client = createClient({
  url: process.env.REDIS_URL
});

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});


async function StartQueue(){
    try {
        await client.connect();
        console.log("connected to Redis.");
        const convertapi = new ConvertAPI.ConvertAPI(process.env.CONVERT_API_KEY || "")
        const bucketName = process.env.AWS_S3_BUCKET_NAME || ""; // Replace with your S3 bucket name
  
        // Main loop
        while (true) {
            try {
                console.log("Waiting for files...");
                const submission = await client.brPop("upload-queue", 0);
                // Blocking pop
                var downloadedFile = "";
                var fileType = "";
                if (!submission) continue;
                const file: { key: string; bucket: string; name: string; fileKey :string; processId : string } = JSON.parse(submission.element);
                if(file.name.includes("ppt")){
                    downloadedFile = "./downloaded-file.ppt"
                    fileType = "ppt"
                }else if(file.name.includes("pdf")){
                    downloadedFile = "./downloaded-file.pdf"
                    fileType = "pdf"
                }else if(file.name.includes("doc")){
                    downloadedFile = "./downloaded-file.doc"
                    fileType = "doc"
                }else{
                  console.log("file not supported")
                  await client.lPush(file.processId, JSON.stringify({images : []}))
                  continue
                }
                const params = { Bucket: process.env.AWS_S3_BUCKET_NAME, Key: file.key };
                const command = new GetObjectCommand(params);
                const outputDir = "./output/"
                // Get the S3 object
                const response = await s3.send(command);
                // Check if Body is a stream
                if (!response.Body) {
                  throw new Error("No response body received.");
                }
            
                const bodyStream = response.Body as Readable;
            
                const fileStream = fs.createWriteStream(downloadedFile);
            
                // Pipe the stream to a file
                await new Promise<void>((resolve, reject) => {
                  bodyStream.pipe(fileStream);
                  bodyStream.on("error", reject);
                  fileStream.on("finish", resolve);
                });
            
                console.log(`${fileType} downloaded to ${downloadedFile}`);
            
                if (!fs.existsSync(outputDir)) {
                  fs.mkdirSync(outputDir, { recursive: true });
                }
            
                // Convert PDF to JPG
                const result = await convertapi.convert('jpg', { File: downloadedFile}, fileType);
            
                console.log('Conversion successful! Downloading files...');
                const lengthOfPdf = result.files.length
                // Save each page as a separate JPG file
                await Promise.all(
                  result.files.map(async (file, index) => {
                    const outputFilePath = path.join(outputDir, `page-${index + 1}.jpg`);
                    await file.save(outputFilePath);
                    console.log(`Saved: ${outputFilePath}`);
                  })
                );
            
                console.log('All files saved successfully!');
            
                const deleteParams = {
                  Bucket: bucketName,
                  Key: file.fileKey,
                };
            
                await s3.send(new DeleteObjectCommand(params));
                console.log(`Deleted: ${file.fileKey}`);
                try {
                  const localFolder = './output'; // Replace with your folder path
                  const s3Folder = `${file.fileKey}`; // Replace with your desired S3 folder key
                
                  await uploadFolderToS3(bucketName, localFolder, s3Folder);
                
                  console.log('Upload complete!');
                } catch (error) {
                  console.error('Error uploading folder:', error);
                }
            
                await deleteFile(downloadedFile)
                const data =  imageUrl(lengthOfPdf , file.fileKey)
            
                await client.lPush(file.processId, JSON.stringify({images : data}))
                console.log(fileType+" is converted to images")
                

            } catch (error) {
                console.error("Error processing submission:", error);
            }
        }
    } catch (error) {
        console.error("Failed to connect to Redis", error);
    }
}
  
StartQueue()



function imageUrl(len:number , fileKey : string) {
    const data : string[] = []  ;
    for (var i = 1 ; i<=len ; i++ ){
        data.push(`https://csv-upload-22990.s3.ap-south-1.amazonaws.com/${fileKey}/page-${i}.jpg`)
    }
    
    return data
  
}
  
  
async function uploadFileToS3(bucketName: string, filePath: string, s3Key: string): Promise<void> {
    const fileStream = fs.createReadStream(filePath);
  
    const upload = new Upload({
        client: s3,
        params: {
            Bucket: bucketName,
            Key: s3Key,
            Body: fileStream,
        },
    });
  
    await upload.done();
    console.log(`Uploaded: ${filePath} to ${s3Key}`);
}
  
  // Function to upload a folder to S3
async function uploadFolderToS3(bucketName: string, folderPath: string, s3Folder: string): Promise<void> {
    const files = await fsExtra.readdir(folderPath);
  
    for (const file of files) {
        const filePath = path.join(folderPath, file);
  
      // Check if it's a file or a folder
        const stat = await fsExtra.stat(filePath);
  
        if (stat.isFile()) {
        // Upload file
            const s3Key = path.join(s3Folder, file).replace(/\\/g, '/'); // S3 uses forward slashes
            await uploadFileToS3(bucketName, filePath, s3Key);
        } else if (stat.isDirectory()) {
        // Recursively upload sub-folder
            const subFolder = path.join(s3Folder, file).replace(/\\/g, '/'); // S3 uses forward slashes
            await uploadFolderToS3(bucketName, filePath, subFolder);
        }
    }
}
  
  // Example usage
  
async function deleteFile(downloadedFile :string) {
    try {
        await fsPromises.unlink(downloadedFile);
        console.log(`Deleted file: ${downloadedFile}`);
    } catch (error) {
        console.error(`Error deleting file: ${downloadedFile}`, error);
    }
  
    try {
        await fsPromises.rm('./output', { recursive: true, force: true });
        console.log(`Deleted folder: ${'./output'}`);
    } catch (error) {
        console.error(`Error deleting folder: ${'./output'}`, error);
    }
}
  
  
import express, { Response } from 'express';

const app = express();

app.get('/', (_, res : Response) =>{res.send('Worker is alive!')} ); // For UptimeRobot

const port = 3000;
app.listen(port, () => {
  console.log(`Dummy HTTP server running on port ${port}`);
});

