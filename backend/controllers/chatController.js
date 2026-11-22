import { pool } from "../config/db.js";

// Fetch all messages for a specific idea chatroom
export const getMessages = async (req, res) => {
    try {
        const { ideaId } = req.params;

        if (!ideaId) {
            return res.status(400).json({ message: "ideaId is required" });
        }

        const result = await pool.query(
            `SELECT 
                m.id,
                m.idea_id,
                m.sender_id,
                m.content,
                m.sent_at,
                u.name AS sender_name,
                u.email AS sender_email
            FROM "Messages" m
            LEFT JOIN "Users" u ON m.sender_id = u.id
            WHERE m.idea_id = $1
            ORDER BY m.sent_at ASC, m.id ASC`,
            [ideaId]
        );

        return res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching messages:", error);
        return res.status(500).json({ message: "Failed to fetch messages" });
    }
};

// Fetch all contributors/members for a specific idea
export const getMembers = async (req, res) => {
    try {
        const { ideaId } = req.params;

        if (!ideaId) {
            return res.status(400).json({ message: "ideaId is required" });
        }

        const result = await pool.query(
            `SELECT 
                im.id,
                im.idea_id,
                im.user_id,
                im.role,
                im.joined_at,
                u.name AS user_name,
                u.email AS user_email
            FROM "IdeaMembers" im
            LEFT JOIN "Users" u ON im.user_id = u.id
            WHERE im.idea_id = $1
            ORDER BY im.joined_at ASC, im.id ASC`,
            [ideaId]
        );

        return res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching idea members:", error);
        return res.status(500).json({ message: "Failed to fetch idea members" });
    }
};

// Helper function to save a message and add member to IdeaMembers
export const saveMessageAndRecordMember = async (ideaId, senderId, content) => {
    // 1. Ensure user is recorded in IdeaMembers as contributor
    await pool.query(
        `INSERT INTO "IdeaMembers" (idea_id, user_id, role, joined_at)
        SELECT $1, $2, 'contributor', NOW()
        WHERE NOT EXISTS (
            SELECT 1 FROM "IdeaMembers" WHERE idea_id = $1 AND user_id = $2
        )`,
        [ideaId, senderId]
    );

    // 2. Insert message into Messages table
    const messageRes = await pool.query(
        `INSERT INTO "Messages" (idea_id, sender_id, content, sent_at)
        VALUES ($1, $2, $3, NOW())
        RETURNING id, idea_id, sender_id, content, sent_at`,
        [ideaId, senderId, content]
    );

    const savedMessage = messageRes.rows[0];

    // 3. Fetch sender's name
    const userRes = await pool.query(
        `SELECT name, email FROM "Users" WHERE id = $1`,
        [senderId]
    );
    const sender = userRes.rows[0] || {};

    return {
        id: savedMessage.id,
        idea_id: savedMessage.idea_id,
        sender_id: savedMessage.sender_id,
        content: savedMessage.content,
        sent_at: savedMessage.sent_at,
        sender_name: sender.name || "Anonymous",
        sender_email: sender.email || ""
    };
};

// REST endpoint to post a message
export const postMessage = async (req, res) => {
    try {
        const { ideaId } = req.params;
        const { content } = req.body;
        const senderId = req.user?.userId;

        if (!ideaId || !content || !content.trim()) {
            return res.status(400).json({ message: "ideaId and content are required" });
        }

        if (!senderId) {
            return res.status(401).json({ message: "Authentication required to post message" });
        }

        const messageData = await saveMessageAndRecordMember(ideaId, senderId, content.trim());

        return res.status(201).json(messageData);
    } catch (error) {
        console.error("Error posting message:", error);
        return res.status(500).json({ message: "Failed to post message" });
    }
};

