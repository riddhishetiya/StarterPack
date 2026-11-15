import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { pool } from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import diaryRoutes from "./routes/diaryRoutes.js"

const app = express();

// Middleware
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/diary",diaryRoutes)
// Basic route
app.get("/", (req, res) => {
    res.send("Backend server is running!");
});

// Database health check
app.get("/api/health", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");

        res.status(200).json({
            success: true,
            message: "Database connected successfully!",
            time: result.rows[0].now
        });

    } catch (error) {
        console.error("Database connection failed:", error);

        res.status(500).json({
            success: false,
            message: "Database connection failed"
        });
    }
});

// Start server
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});