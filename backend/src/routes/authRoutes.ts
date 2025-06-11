import express, { Request, Response } from "express";
import prisma from "../db.js";
import { hash, compare } from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { verifyTokenMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();
const secretKey = "secret";

const userSignupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string(),
    role: z.string(),
});

router.post("/signup", async (req: Request, res: Response) => {
    const body = await req.body;
    const hashPassword = await hash(body.password, 10);
    const { success } = userSignupSchema.safeParse(body);
    const role = body.role.toUpperCase();
    if (!success) {
        res.status(400).json("Invalid input");
        return;
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: body.email }
        });

        if (user) {
            res.status(409).json("Conflict");
            return;
        }

        const data = await prisma.user.create({
            data: {
                name: body.name,
                password: hashPassword,
                email: body.email,
                role: role
            }
        });

        res.status(201).json({
            message: "User created successfully",
            userId: data.id,
            email: data.email
        });
    } catch (error) {
        res.status(500).json("Internal server error");
    }
});

router.post("/signin", async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400).json("Bad Request");
        return;
    }

    try {
        const data = await prisma.user.findUnique({
            where: { email },
            select: { id: true, password: true }
        });

        if (data && (await compare(password, data.password))) {
            const token = jwt.sign(data.id, secretKey);
            res.status(200).json({ token, userId: data.id });
            return;
        }

        res.status(401).json("Unauthorized");
    } catch (error) {
        res.status(500).json("Internal server error");
    }
});


router.get("/user", verifyTokenMiddleware, async (req: Request, res: Response) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader?.split(" ")[1];
    const decoded = jwt.verify(token || "", secretKey) as string;
    const user = await prisma.user.findUnique({
        where: {
            id: decoded
        },
        select: {
            role: true,
            name: true
        }
    })

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

    res.status(200).json({
        message: "authorized",
        user,
        rooms : userRoomData
    })
})

export default router;
