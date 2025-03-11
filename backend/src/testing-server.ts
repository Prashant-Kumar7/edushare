// import express, { NextFunction, Request, Response } from "express";
// import cors from "cors";
// import multer from "multer";
// import { createClient } from "redis";
// import {
//     S3Client,
//     PutObjectCommand,
//     GetObjectCommand,
//     DeleteObjectCommand,
// } from "@aws-sdk/client-s3";
// import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
// import crypto from "crypto";
// import jwt, { sign } from "jsonwebtoken";
// import dotenv from "dotenv"
// import prisma from "./db.js";
// import { z } from "zod";
// import { hash, compare} from "bcrypt";

// const port = 3000;
// const app = express();
// const redisClient = createClient({
//     username: 'default',
//     password: process.env.REDIS_PASSWORD,
//     socket: {
//         host: process.env.REDIS_HOST,
//         port: 12203
//     }
// });
// const s3Client = new S3Client({ region: process.env.AWS_REGION });
// const secretKey = "secret"
// const userSignupSchema = z.object({
//     email : z.string().email(),
//     password : z.string().min(6),
//     username : z.string()
// })

// dotenv.config()
// app.use(express.json());
// app.use(cors());

// const upload = multer();

// (async () => {
//     await redisClient.connect();
//     console.log("Connected to Redis...");
// })();

// async function getSignedURL(key: string, contentType: string) {
//     const command = new PutObjectCommand({
//         Bucket: process.env.AWS_S3_BUCKET_NAME,
//         Key: key,
//         ContentType: contentType,
//     });

//     const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });
//     return signedUrl;
// }

// const verifyTokenMiddleware = async(req: Request, res: Response, next: NextFunction) :  Promise<void> => {
//     const authHeader = req.headers['authorization'];
  
//     if (!authHeader) {
//         res.status(401).json({ message: 'Authorization header is missing' });
//         return
//     }
  
//     const token = authHeader.split(' ')[1];

//     try {
//         const decoded = jwt.verify(token, secretKey);
//         if(typeof(decoded) === "string"){

//             const data = await prisma.user.findUnique({
//                 where : {
//                     id : decoded
//                 }
//             })

//             if(!data){
//                 res.status(400).json({ message: 'Unauthorized' });
//                 return
//             }
//         }
//         // @ts-ignore
//         req["userId"] = decoded // Attach decoded data to the request
//         next(); 
//     } catch (error) {
//         res.status(401).json({ message: 'Invalid' });
//         return
//     }
// };


// app.post("/api/video/upload", upload.single("file"), async (req: Request, res: Response) => {
//     try {
//         if (!req.file) {
//             res.status(400).json({ error: "No file uploaded" });
//             return 
//         }

//         const authHeader = req.headers['authorization'];
  
//         if (!authHeader) {
//             res.status(401).json({ message: 'Authorization header is missing' });
//             return
//         }
      
//         const token = authHeader.split(' ')[1];
//         const decoded = jwt.verify(token, secretKey);


//         const file = req.file;
//         const fileId = crypto.randomUUID(); // Generate a unique file ID
//         const fileKey = `videos/${fileId}-${file.originalname}`; // S3 object key
//         const signedURL = await getSignedURL(fileKey, file.mimetype);
//         const url = getPublicUrl(fileKey)

//         // Upload the file to S3
//         await fetch(signedURL, {
//             method: "PUT",
//             headers: {
//                 "Content-Type": file.mimetype,
//             },
//             body: file.buffer, // Use file.buffer for multer uploads
//         });

//         console.log(`File uploaded to S3: ${fileKey}`);

//         // Push metadata to Redis queue
//         const fileMetadata = {
//             // url: `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${file}`,
//             name: file.originalname,
//             bucket: process.env.AWS_S3_BUCKET_NAME,
//             key: fileKey,
//             fileKey : fileId,
//             userId : decoded
//         };

//         await redisClient.lPush("files", JSON.stringify(fileMetadata));
//         // await waitForRedisData(fileKey)
//         res.json({
//             message: "File uploaded successfully",
//             file: fileMetadata,
//             fileUrl : `${url}/720.mp4`
//         });
//     } catch (error) {
//         console.error("Error uploading file:", error);
//         res.status(500).json({ error: "File upload failed" });
//     }
// });


// // const waitForRedisData = (channel: string): Promise<string> => {
// //     return new Promise(async(resolve, reject) => {
// //       const listener = (message: string) => {
// //         redisClient.unsubscribe(channel).catch(reject); // Unsubscribe after receiving a message
// //         resolve(message); // Resolve the promise with the message
// //       };
  
// //     //   redisClient.subscribe(channel).then(() => {
// //     //     redisClient.on("message", (subscribedChannel, message) => {
// //     //       if (subscribedChannel === channel) {
// //     //         redisClient.off("message", listener); // Remove the listener to avoid memory leaks
// //     //         listener(message);
// //     //       }
// //     //     });
// //     //   }).catch(reject);
// //       await redisClient.subscribe(channel, (message)=>{
// //         listener(message);
// //       })

// //     });
// //   };




// app.post("/api/v1/signup" , async(req : Request, res : Response)=>{
//     const body = await req.body    
//     const hashPassword = await hash(body.password, 10)
//     const {success} = userSignupSchema.safeParse(body)

//     if(!success){
//         res.status(400).json("invaild input")
//         return
//     }

//     try {
//         const user = await  prisma.user.findUnique({
//             where : {
//                 username : body.username
//             }
//         })
    
//         if(user){
//             res.status(409).json("Conflict")
//             return
//         }

//         const data = await prisma.user.create({
//             data : {
//                 username : body.username,
//                 password : hashPassword,
//                 email : body.email
//             }
//         })
//         res.status(201).json({
//             message : "User created successfully",
//             userId : data.id,
//             email : data.email
//         })
//         return
//     } catch (error) {
//         res.status(500).json("internal server error") 
//         return
//     }
// })


// app.post("/api/v1/signin" , async(req: Request , res: Response)=>{
//     const { email , password } = await req.body
//     const hashPassword = await hash(password, 10);
//     if(!email || !password){
//         res.status(400).json("Bad Request")
//     }
//     try {

//         const data = await prisma.user.findUnique({
//             where : {
//                 email : email
//             },
//             select : {
//                 id : true,
//                 password : true
//             }
//         })
//         if(data && await compare(password, data.password)){
//             const token: string = jwt.sign(data.id, secretKey);
//             res.status(200).json({
//                 token: token,
//                 userId: data.id
//             })
//             return
//         }

//         res.status(401).json("Unauthorized")
        
//     } catch (error) {
//         res.status(500).json("internal server error")
//     }
    
// })


// app.post("/api/v1/create-room", verifyTokenMiddleware , async(req: Request, res: Response)=>{
//     const {permissions, videoUrl} = await req.body
//     const processId = crypto.randomUUID() + Date.now().toString()
//     const sessionId = generateId()
//     // const payload = `${sessionId}_${videoUrl}`

//     const authHeader = req.headers['authorization'];
  
//     if (!authHeader) {
//         res.status(401).json({ message: 'Authorization header is missing' });
//         return
//     }
      
//     const token = authHeader.split(' ')[1];
//     const decoded = jwt.verify(token, secretKey);

    

//     const userData = await prisma.user.findUnique({
//         where : {
//             id : decoded as string
//         }
//     })

//     const payload = `${userData?.username}_${videoUrl}`
//         const roomToken: string = jwt.sign(payload, secretKey);
//         await redisClient.lPush("room", JSON.stringify({type: "CREATE",roomId : sessionId, roomToken : roomToken, processId : processId, permissions : permissions}))
//         res.json({
//             roomToken : roomToken,
//             roomId : sessionId
//         })
// })

// app.post("/api/v1/join-room", async(req: Request, res : Response)=>{
//     const {roomId , name} = await req.body
//     const payload = `${roomId}_PART`
//     // const token: string = jwt.sign(payload, secretKey);
//     // const roomToken: string = jwt.sign(payload, secretKey);

//     const authHeader = req.headers['authorization'];
  
//     if (!authHeader) {
//         res.status(401).json({ message: 'Authorization header is missing' });
//         return
//     }
      
//     const token = authHeader.split(' ')[1];
//     const decoded = jwt.verify(token, secretKey);

    

//     const userData = await prisma.user.findUnique({
//         where : {
//             id : decoded as string
//         }
//     })
//     const roomToken: string = jwt.sign(userData?.username || "", secretKey);   
//     await redisClient.lPush("join-room", JSON.stringify({type: "CREATE", roomId : roomId, roomToken : roomToken}))
//     res.json({
//         roomToken : roomToken
//     })
    

    
// })


// app.get("/api/v1/get-videos", verifyTokenMiddleware ,async(req : Request, res : Response)=>{
//     const authHeader = req.headers['authorization'];
  
//     if (!authHeader) {
//         res.status(401).json({ message: 'Authorization header is missing' });
//         return
//     }
      
//     const token = authHeader.split(' ')[1];
//     const userId = jwt.verify(token, secretKey);

//     const data = await prisma.video.findMany({
//         where : {
//             userId : userId as string
//         },
//         select : {
//             id :true,
//             name : true,
//             thumbnailUrl : true,
//             url : true
//         }
//     })

//     res.json({
//         videos : data
//     })

// })

// app.listen(port, () => {
//     console.log("Server is running on port " + port);
// });

// const getPublicUrl = (key: string) => {
//     return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
// };

// const generateId = (): string =>{
//     const generateSegment = () => {
//         return Array.from({ length: 3 }, () =>
//             String.fromCharCode(97 + Math.floor(Math.random() * 26))
//         ).join('');
//     };
  
//     return `${generateSegment()}-${generateSegment()}-${generateSegment()}`;
// }