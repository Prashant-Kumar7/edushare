import express, { Request, Response } from "express";
import multer from "multer";
import { client, getPublicUrl, getSignedURL } from "../functions.js";

const router = express.Router();
const upload = multer();

// Upload endpoint
router.post("/upload", upload.single("file"), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: "No file uploaded" });
            return;
        }

        const processId = crypto.randomUUID() + Date.now().toString();
        const file = req.file;
        const fileId = crypto.randomUUID();
        const fileKey = `${fileId}-${file.originalname}`;
        const signedURL = await getSignedURL(fileKey, file.mimetype);
        const url = getPublicUrl(fileKey);

        // Upload the file to S3
        await fetch(signedURL, {
            method: "PUT",
            headers: {
                "Content-Type": file.mimetype,
            },
            body: file.buffer,
        });

        console.log(`File uploaded to S3: ${fileKey}`);

        const fileMetadata = {
            name: file.originalname,
            bucket: process.env.AWS_S3_BUCKET_NAME,
            key: fileKey,
            fileKey: fileId,
            processId: processId
        };

        await client.lPush("upload-queue", JSON.stringify(fileMetadata));

        const submission = await client.brPop(processId, 0);
        if (submission) {
            const parsedMessage = JSON.parse(submission.element.toString());
            res.json({
                message: "File uploaded successfully",
                file: fileMetadata,
                images: parsedMessage.images
            });
        }
    } catch (error) {
        console.error("Error uploading file:", error);
        res.status(500).json({ error: "File upload failed" });
    }
});



router.get("/" , (req : Request, res : Response)=>{
    res.json("hi from server")
})

export default router;
