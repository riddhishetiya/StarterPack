import express from "express";
import authenticateToken from "../middleware/authMiddleware.js";
import { getMessages, getMembers, postMessage } from "../controllers/chatController.js";

const router = express.Router();

router.get("/:ideaId/messages", getMessages);
router.get("/:ideaId/members", getMembers);
router.post("/:ideaId/messages", authenticateToken, postMessage);

export default router;

