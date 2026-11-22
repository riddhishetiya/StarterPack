import express from "express";
import authenticateToken from "../middleware/authMiddleware.js";
import { saveDiaryInput, ideasFetch } from "../controllers/diaryController.js";
import upload from "../middleware/uploadMiddleware.js";

const router=express.Router();

router.post("/input", authenticateToken, upload.single("image"), saveDiaryInput)
router.get("/ideas-fetch",ideasFetch)

export default router;