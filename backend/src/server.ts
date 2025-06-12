import dotenv from "dotenv";
import express , {Response, Request} from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import fileRoutes from "./routes/fileRoutes.js"; // Import file routes
import { client } from "./functions.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

(async () => {
    await client.connect();
    console.log("Connected to Redis...");
})();
// Use routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/room", roomRoutes);
app.use("/api/v1/file", fileRoutes); // Ensure this is included

app.get("/",(req : Request, res : Response)=>{
    res.json("hello from eduShare http sever ")
})

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server is running on port ${process.env.PORT || 3000}`);
});
