
import bcrypt from "bcrypt";
import { pool } from "../config/db.js";
import jwt from "jsonwebtoken";

export const registerUser = async (req, res) => {
    try {
        // 1. Extract data from the request body
        const { name, email, password } = req.body;

        // 2. Validate the input
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required"
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 8 characters"
            });
        }

        // 3. Normalize the email
        const normalizedEmail = email.trim().toLowerCase();

        // 4. Check whether the email already exists
        const existingUser = await pool.query(
            'SELECT id FROM "Users" WHERE email = $1',
            [normalizedEmail]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Email is already registered"
            });
        }

        // 5. Hash the password
        const hashedPassword = await bcrypt.hash(password, 12);

        // 6. Insert the new user into the database
        const result = await pool.query(
            `INSERT INTO "Users" (name, email, password_hash)
             VALUES ($1, $2, $3)
             RETURNING id, name, email, created_at`,
            [name.trim(), normalizedEmail, hashedPassword]
        );

        // 7. Send the response
        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: result.rows[0]
        });

    } catch (error) {
        console.error("Registration error:", error);

        // Handle duplicate email (including concurrent requests)
        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "Email is already registered"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const loginUser = async (req, res) => {
    try {
        // 1. Extract login credentials
        const { email, password } = req.body;

        // 2. Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        // 3. Normalize email
        const normalizedEmail = email.trim().toLowerCase();

        // 4. Find the user in the database
        const result = await pool.query(
            `SELECT id, name, email, password_hash
             FROM "Users"
             WHERE email = $1`,
            [normalizedEmail]
        );

        // 5. Check whether the user exists
        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const user = result.rows[0];

        // 6. Compare entered password with stored hash
        const isPasswordValid = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // 7. Generate JWT
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // 8. Store JWT in an HTTP-only cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        // 9. Send successful login response
        return res.status(200).json({
            success: true,
            message: "Login successful",
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
export const getCurrentUser = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email FROM "Users" WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "User not found"
      });
    }

    return res.status(200).json({
      user: result.rows[0]
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to fetch user"
    });
  }
};