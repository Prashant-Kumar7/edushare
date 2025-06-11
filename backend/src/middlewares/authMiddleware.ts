import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import prisma from "../db.js";

const secretKey = "secret";

export const verifyTokenMiddleware = async(req: Request, res: Response, next: NextFunction) :  Promise<void> => {
    const authHeader = req.headers['authorization'];
  
    if (!authHeader) {
        res.status(401).json('Authorization header is missing');
        return
    }
  
    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, secretKey);
        if(typeof(decoded) === "string"){

            const data = await prisma.user.findUnique({
                where : {
                    id : decoded
                }
            })

            if(!data){
                res.status(400).json('Unauthorized');
                return
            }
        }
        // @ts-ignore
        // req["userId"] = decoded // Attach decoded data to the request
        next(); 
    } catch (error) {
        res.status(401).json('Invalid');
        return
    }
};
