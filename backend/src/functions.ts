import * as path from 'path';
import * as fs from "fs";
import { Upload } from '@aws-sdk/lib-storage';
import fsExtra from 'fs-extra';
import fsPromises from 'fs/promises';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createClient } from 'redis';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from "dotenv"
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';

dotenv.config();

const API_KEY = process.env.LIVEKET_API_KEY;
const API_SECRET = process.env.LIVEKET_SECRET_KEY;
const LIVEKIT_URL = "wss://live-stream-j0ngkwts.livekit.cloud";

export const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const s3Client = new S3Client({ region: process.env.AWS_REGION });

export const client = createClient({
  username: 'default',
  password: process.env.REDIS_PASSWORD,
  socket: {
      host: process.env.REDIS_HOST,
      port: 13642
  }
});

export const getPublicUrl = (key: string) => {
    return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  };


 export function imageUrl(len:number , fileKey : string) {
    const data : string[] = []  ;
    for (var i = 1 ; i<=len ; i++ ){
      data.push(`https://csv-upload-22990.s3.ap-south-1.amazonaws.com/${fileKey}/page-${i}.jpg`)
    }
    
    return data
  
  }
  
  
 export async function uploadFileToS3(bucketName: string, filePath: string, s3Key: string): Promise<void> {
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
export  async function uploadFolderToS3(bucketName: string, folderPath: string, s3Folder: string): Promise<void> {
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
  
 export async function deleteFile() {
    try {
      await fsPromises.unlink('./downloaded-file.pdf');
      console.log(`Deleted file: ${'./downloaded-file.pdf'}`);
    } catch (error) {
      console.error(`Error deleting file: ${"./downloaded-file.pdf"}`, error);
    }
  
    try {
      await fsPromises.rm('./output', { recursive: true, force: true });
      console.log(`Deleted folder: ${'./output'}`);
    } catch (error) {
      console.error(`Error deleting folder: ${'./output'}`, error);
    }
  }
  
  
  export async function uploadingFunction(fileKey:string) {
    try {
      const bucketName = 'csv-upload-22990'; // Replace with your S3 bucket name
      const localFolder = './output'; // Replace with your folder path
      const s3Folder = `${fileKey}`; // Replace with your desired S3 folder key
  
      await uploadFolderToS3(bucketName, localFolder, s3Folder);
  
      console.log('Upload complete!');
    } catch (error) {
      console.error('Error uploading folder:', error);
    }
  }
  
export function generateId(): string {
    const generateSegment = () => {
        return Array.from({ length: 3 }, () =>
            String.fromCharCode(97 + Math.floor(Math.random() * 26))
        ).join('');
    };
  
    return `${generateSegment()}-${generateSegment()}-${generateSegment()}`;
  }
  
  "https://csv-upload-22990.s3.ap-south-1.amazonaws.com/1b116508-2011-418a-af1d-3315005f9e3a/page-1.jpg"

 export  async function getSignedURL(key: string, contentType: string) {
    const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key,
        ContentType: contentType,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });
    return signedUrl;
}



export async function createBroadcastRoom(roomId : string) {
  const roomService = new RoomServiceClient(LIVEKIT_URL, API_KEY, API_SECRET);

  try {
    const room = await roomService.createRoom({
      name: roomId,
      emptyTimeout: 0, // Prevent room from auto-closing
      maxParticipants: 100, // Adjust as needed
    });

    console.log(`Room created: ${room.name}`);
    return room.name;
  } catch (error) {
    console.error('Error creating room:', error);
    throw error;
  }
}

// Generate an Access Token for receive-only participants
export  async function generateReceiveOnlyToken(roomName: string, participantIdentity: string) {
    //   const { userId , roomId } = await req.body

    const { AccessToken } = await import('livekit-server-sdk');
    const token = new AccessToken(process.env.LIVEKET_API_KEY , process.env.LIVEKET_SECRET_KEY, {
        identity: participantIdentity, // Unique identifier for the user
    });

    token.addGrant({
        roomJoin: true,
        room: roomName,
        canSubscribe: true,
        canPublish: false,
        canPublishData: true, // Allow data message publishing if canPublish is true
      });

    const result = await token.toJwt()
    // res.json({token : result , userType : "participant"})
    return result
}

export async function generateHostToken(roomName: string, participantIdentity: string) {
    //   const { userId , roomId } = await req.body

    const { AccessToken } = await import('livekit-server-sdk');
    const token = new AccessToken(process.env.LIVEKET_API_KEY , process.env.LIVEKET_SECRET_KEY, {
        identity: participantIdentity, // Unique identifier for the user
    });

    token.addGrant({
        roomJoin: true,
        room: roomName,
        canSubscribe: true,
        canPublish: true,
        canPublishData: true, // Allow data message publishing if canPublish is true
      });

    const result = await token.toJwt()
    // res.json({token : result , userType : "participant"})
    return result
}