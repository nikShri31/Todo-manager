import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";


const app = express();


// middleware functions 
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit: "1000kb"}));
app.use(express.urlencoded({extended: true, limit: "1000kb"}));
app.use(express.static("public"));
app.use(cookieParser());
app.use(morgan("dev"));   //HTTP request logger middleware for node.js 

// importing routes
import userRouter from "./routes/user.routes.js";
import todoRouter from "./routes/todo.routes.js";

//route declearation
app.use('/api/v1/users',userRouter);
app.use("/api/v1/todos", todoRouter);

app.use((req, res) => {
    res.status(404).json({ success: false, message: "Route not found" });
  });
  

export default app;
