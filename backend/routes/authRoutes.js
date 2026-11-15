import express from "express";
import { registerUser, loginUser, getCurrentUser } from "../controllers/authController.js";
import authenticateToken from "../middleware/authMiddleware.js";

const router = express.Router();

// Registration endpoint
router.post("/register", registerUser);

// Login endpoint
router.post("/login", loginUser);

router.get("/me", authenticateToken, getCurrentUser);

export default router;
