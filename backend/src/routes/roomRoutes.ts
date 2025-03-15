import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { client, createBroadcastRoom, generateHostToken, generateId, generateReceiveOnlyToken } from "../functions.js";
import prisma from "../db.js";
import { verifyTokenMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();
const secretKey = "secret";

// router.post("/token" , async(req: Request , res : Response)=>{
//     const { roomId } = await req.body
//     const authHeader = req.headers["authorization"];
//     if (!authHeader) {
//         res.status(401).json({ message: "Authorization header is missing" });
//         return;
//     }

//     const token = authHeader.split(" ")[1];
//     const decoded = jwt.verify(token, secretKey);
//     const userData = await prisma.user.findUnique({
//         where: { id: decoded as string }
//     });
//     const id = `${userData?.name}_${Date.now()}`;
//     const roomToken = await generateReceiveOnlyToken(roomId , id)
//     res.json({
//         token : token
//     })
// })

// router.post("/host" , async(req: Request , res : Response)=>{
//     const authHeader = req.headers["authorization"];
//     if (!authHeader) {
//         res.status(401).json({ message: "Authorization header is missing" });
//         return;
//     }

//     const token = authHeader.split(" ")[1];
//     const decoded = jwt.verify(token, secretKey);

//     const userData = await prisma.user.findUnique({
//         where: { id: decoded as string }
//     });

//     const roomId = generateId()
//     await createBroadcastRoom(roomId)
//     const id = `${userData?.name}_${Date.now()}`;
//     const roomToken = await generateHostToken(roomId , id)
//     console.log(roomId)
//     res.json({
//         token : token
//     })
// })

router.post("/create-room", verifyTokenMiddleware, async (req: Request, res: Response) => {
    // const { permissions, videoUrl } = req.body;
    const processId = crypto.randomUUID() + Date.now().toString();
    const roomId = generateId();
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
        res.status(401).json({ message: "Authorization header is missing" });
        return;
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, secretKey);

    const userData = await prisma.user.findUnique({
        where: { id: decoded as string }
    });

    const id = `${userData?.name}_${Date.now()}`;
    const roomToken = await generateHostToken(roomId, id);

    await client.lPush("room", JSON.stringify({ type: "CREATE", roomId: roomId, roomToken, processId, userId : id}));
    // await client.brPop(processId, 0);

    res.json({ roomToken, roomId: roomId, userId:id});
});

router.post("/join-room", async (req: Request, res: Response) => {
    const { roomId } = await req.body;
    const processId = crypto.randomUUID() + Date.now().toString();
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
        res.status(401).json({ message: "Authorization header is missing" });
        return;
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, secretKey);
    const userData = await prisma.user.findUnique({
        where: { id: decoded as string }
    });
    const id = `${userData?.name}_${Date.now()}`;
    // const roomToken = jwt.sign(userData?.username || "", secretKey);
    const roomToken = await generateReceiveOnlyToken(roomId, id);

    await client.lPush("room", JSON.stringify({ type: "JOIN", roomId: roomId, roomToken, processId, userId : id}));
    // await client.brPop(processId, 0);


    res.json({ roomToken, roomId, userId:id });
});

export default router;
