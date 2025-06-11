import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { client, createBroadcastRoom, generateHostToken, generateId, generateReceiveOnlyToken } from "../functions.js";
import prisma from "../db.js";
import { verifyTokenMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();
const secretKey = "secret";

router.post("/create-room", verifyTokenMiddleware, async (req: Request, res: Response) => {
    const { name, description } : {name : string, description : string} = await req.body;
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

    if(!userData){
        res.json({message: "User doesn't exists"})
        return
    }

    if(userData.role === "STUDENT"){
        res.json({message: "Not authorized to create room"})
        return
    }

    const room = await prisma.room.findUnique({
        where : {
            id : roomId
        }
    })

    if(room){
        res.json({message: "Room Already exists"})
        return
    }

    const id = `${userData.name}_${userData.id}`;
    const roomToken = await generateHostToken(roomId, id);

    await client.lPush("room", JSON.stringify({ type: "CREATE", roomId: roomId, roomToken, processId, userId : id}));
    // await client.brPop(processId, 0);
    await prisma.room.create({
        data : {
            id : roomId,
            name,
            description,
        }
    })
    await prisma.userRoomManager.create({
        data : {
            userId : decoded as string,
            roomId : roomId,
            roomToken : roomToken
        }
    })
    res.json({ roomToken, roomId: roomId, userId:id});
});

router.post("/join-room", async (req: Request, res: Response) => {
    const { roomId, addToMyClassroom } : {roomId : string, addToMyClassroom : boolean} = await req.body;
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

    if(!userData){
        res.json({message: "User doesn't exists"})
        return
    }

    const id = `${userData.name}_${userData.id}`;
    // const roomToken = jwt.sign(userData?.username || "", secretKey);
    const roomToken = await generateReceiveOnlyToken(roomId, id);

    if(addToMyClassroom){
        const userRoomData = await prisma.userRoomManager.findMany({
            where: {
                userId: decoded as string
            },
            select: {
                room: {
                    select: {
                        name: true,
                        description: true,
                        id: true
                    }
                }
            }
        })

        const foundRoom = userRoomData.find((data)=>{
            return data.room.id === roomId
        })

        if(!foundRoom){
            await prisma.userRoomManager.create({
                data : {
                    userId : decoded as string,
                    roomId : roomId,
                    roomToken : roomToken
                }
            })
        }
    }
    await client.lPush("room", JSON.stringify({ type: "JOIN", roomId: roomId, roomToken, processId, userId : id, role : userData.role==="TEACHER"}));
    // await client.brPop(processId, 0);
    res.json({ roomToken, roomId, userId:id });
});

router.post("/enter-classroom", async (req: Request, res: Response) => {
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

    if(!userData){
        res.json({message: "User doesn't exists"})
        return
    }

    const userRoomData = await prisma.userRoomManager.findMany({
        where : {
            userId : decoded as string
        },
        select : {
            roomToken : true
        }
    })
    const id = `${userData.name}_${userData.id}`;
    const roomToken = userRoomData[0].roomToken

    await client.lPush("room", JSON.stringify({ type: "ENTER_CLASSROOM", roomId: roomId, roomToken, processId, userId : id, role : userData.role==="TEACHER"}));
    const resposne = await client.brPop(processId, 0);
    if(resposne?.element === "JOINED"){
        res.json({ roomToken, roomId, userId:id });
        return
    }else if(resposne?.element ==="ROOM_CLOSE"){
        res.json({ err : resposne?.element });
    }
    
});

export default router;
