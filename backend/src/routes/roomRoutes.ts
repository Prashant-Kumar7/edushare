import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { client, createBroadcastRoom, generateHostToken, generateId, generateReceiveOnlyToken } from "../functions.js";
import prisma from "../db.js";
import { verifyDeleteUpdateMiddleware, verifyTokenMiddleware } from "../middlewares/authMiddleware.js";

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

router.post("/join-room",verifyTokenMiddleware , async (req: Request, res: Response) => {
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

router.post("/enter-classroom",verifyTokenMiddleware, async (req: Request, res: Response) => {
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


router.delete("/:roomId",verifyTokenMiddleware, verifyDeleteUpdateMiddleware, async(req : Request, res : Response)=>{
    const {roomId} = req.params
    const processId = crypto.randomUUID() + Date.now().toString();
    try {

        await prisma.userRoomManager.deleteMany({
            where : {
                roomId : roomId
            }
        })

        await prisma.room.delete({
            where : {
                id : roomId
            }
        })

        await client.lPush("room", JSON.stringify({ type: "DELETE_CLASSROOM", roomId: roomId}));
        const resposne = await client.brPop(processId, 0);
        if(resposne?.element === "JOINED"){
            res.status(200).json("Delete Room")
            return
        }else if(resposne?.element ==="ROOM_CLOSE"){
            res.status(200).json("Room doesn't exsits")
            return
        }
    } catch (error) {
        res.status(500).json("db error")
        return
    }
})

router.delete("/remove/:roomId",verifyTokenMiddleware , async(req : Request, res : Response)=>{
    const {roomId} = req.params
    //@ts-ignore
    const userId = req["userId"]
    try {

        const room = await prisma.userRoomManager.findMany({
            where : {
                userId : userId,
                roomId : roomId
            }
        })

        if(room.length === 0){
            res.status(200).json("Room doesn't exists")
            return
        }

        const data = await prisma.userRoomManager.deleteMany({
            where : {
                userId : userId,
                roomId : roomId
            }
        })
        res.status(200).json("remove successfull")
        return
    } catch (error) {
        res.status(500).json("db error")
        return
    }
})

router.put("/:roomId", verifyTokenMiddleware, async(req : Request, res : Response)=>{
    const { name, description } : {name : string, description : string} = await req.body;
    const {roomId} = req.params
    // @ts-ignore
    const userRole = req["userRole"]
    
    if(userRole === "STUDENT"){
        res.status(400).json('Unauthorized');
        return
    }

    try {
        const data = await prisma.room.update({
            data : {
                name : name,
                description : description
            },
            where : {
                id : roomId
            }
        })
        res.status(200).json(data)
        return
    } catch (error) {
        res.status(500).json("db error")
        return
    }
})


export default router;
