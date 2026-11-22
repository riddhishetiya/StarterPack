import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { pool } from "./config/db.js";
import { saveMessageAndRecordMember } from "./controllers/chatController.js";

// Helper to parse cookie string into key-value map
function parseCookies(cookieString) {
    if (!cookieString) return {};
    return Object.fromEntries(
        cookieString.split(";").map((c) => {
            const [k, ...v] = c.trim().split("=");
            return [k, decodeURIComponent(v.join("="))];
        })
    );
}

export const setupSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "http://localhost:5173",
            credentials: true,
            methods: ["GET", "POST"]
        }
    });

    // Optional Auth middleware on socket connection
    io.use((socket, next) => {
        try {
            const cookieHeader = socket.handshake.headers.cookie;
            const cookies = parseCookies(cookieHeader);
            const token = cookies.token || socket.handshake.auth?.token;

            if (token && process.env.JWT_SECRET) {
                try {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET);
                    socket.userId = decoded.userId;
                } catch (err) {
                    console.log("Socket token verify error:", err.message);
                }
            }

            if (!socket.userId && socket.handshake.auth?.userId) {
                socket.userId = socket.handshake.auth.userId;
            }

            next();
        } catch (error) {
            console.error("Socket auth middleware error:", error);
            next();
        }
    });

    io.on("connection", (socket) => {
        console.log(`Socket connected: ${socket.id}, User ID: ${socket.userId || "anonymous"}`);

        // Join chatroom for a specific idea
        socket.on("join_room", async ({ ideaId, user }) => {
            try {
                if (!ideaId) return;

                const roomName = `idea_${ideaId}`;
                socket.join(roomName);
                socket.currentIdeaId = ideaId;

                if (!socket.userId && user?.id) {
                    socket.userId = user.id;
                }

                console.log(`Socket ${socket.id} joined room ${roomName}`);

                // 1. Fetch recent messages
                const messagesRes = await pool.query(
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

                // 2. Fetch idea members (contributors)
                const membersRes = await pool.query(
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

                // Send initial data to this socket
                socket.emit("room_data", {
                    ideaId,
                    messages: messagesRes.rows,
                    members: membersRes.rows
                });
            } catch (error) {
                console.error("Error joining room:", error);
                socket.emit("chat_error", { message: "Failed to load room data" });
            }
        });

        // Send a message in the chatroom
        socket.on("send_message", async ({ ideaId, content, senderId, senderName }) => {
            try {
                const targetIdeaId = ideaId || socket.currentIdeaId;
                const activeUserId = senderId || socket.userId;

                if (!targetIdeaId || !content || !content.trim()) {
                    return socket.emit("chat_error", { message: "Idea ID and content are required" });
                }

                if (!activeUserId) {
                    return socket.emit("chat_error", { message: "You must be logged in to send messages" });
                }

                const trimmedContent = content.trim();

                // Save message in Messages and ensure user is in IdeaMembers
                const messageData = await saveMessageAndRecordMember(
                    targetIdeaId,
                    activeUserId,
                    trimmedContent
                );

                if (senderName && messageData.sender_name === "Anonymous") {
                    messageData.sender_name = senderName;
                }

                const roomName = `idea_${targetIdeaId}`;

                // Broadcast message to everyone in the room (including sender)
                io.to(roomName).emit("new_message", messageData);

                // Fetch updated members list and broadcast to room
                const membersRes = await pool.query(
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
                    [targetIdeaId]
                );

                io.to(roomName).emit("room_members", membersRes.rows);
            } catch (error) {
                console.error("Error sending socket message:", error);
                socket.emit("chat_error", { message: "Failed to send message" });
            }
        });

        // Leave room
        socket.on("leave_room", ({ ideaId }) => {
            const targetIdeaId = ideaId || socket.currentIdeaId;
            if (targetIdeaId) {
                const roomName = `idea_${targetIdeaId}`;
                socket.leave(roomName);
                console.log(`Socket ${socket.id} left room ${roomName}`);
            }
        });

        socket.on("disconnect", () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });

    return io;
};

