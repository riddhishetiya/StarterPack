import React, { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { fetchMessages, fetchMembers } from "../services/chatServices";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5001";

function formatChatDate(d) {
  const month = d.toLocaleString("en-US", { month: "long" });
  const weekday = d.toLocaleString("en-US", { weekday: "long" });
  return `${month} ${d.getDate()} ${weekday}`;
}

export default function ChatOverlay({ open, onClose, image, user }) {
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [draft, setDraft] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [connected, setConnected] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const logRef = useRef(null);
  const socketRef = useRef(null);

  // Timer for Dial-up elapsed connection readout
  useEffect(() => {
    if (!open) return;
    setElapsed(0);
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [open]);

  // Scroll messages to bottom whenever messages update
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages, open]);

  // Socket and Room Management
  useEffect(() => {
    if (!open || !image?.id) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const ideaId = image.id;
    setErrorMsg("");

    // 1. Immediately fetch existing messages & members via REST
    fetchMessages(ideaId)
      .then((data) => {
        setMessages(data || []);
      })
      .catch((err) => {
        console.error("Error loading chat messages:", err);
      });

    fetchMembers(ideaId)
      .then((data) => {
        setMembers(data || []);
      })
      .catch((err) => {
        console.error("Error loading idea members:", err);
      });

    // 2. Initialize Socket connection
    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      auth: {
        userId: user?.id,
        userName: user?.name,
      },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join_room", {
        ideaId,
        user: {
          id: user?.id,
          name: user?.name,
        },
      });
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("room_data", (data) => {
      if (data && data.ideaId === ideaId) {
        if (data.messages) setMessages(data.messages);
        if (data.members) setMembers(data.members);
      }
    });

    socket.on("new_message", (msg) => {
      if (msg && msg.idea_id === ideaId) {
        setMessages((prev) => {
          // Avoid duplicate messages if already present
          if (msg.id && prev.some((m) => m.id === msg.id)) {
            return prev;
          }
          return [...prev, msg];
        });
      }
    });

    socket.on("room_members", (updatedMembers) => {
      if (Array.isArray(updatedMembers)) {
        setMembers(updatedMembers);
      }
    });

    socket.on("chat_error", (err) => {
      if (err?.message) {
        setErrorMsg(err.message);
        setTimeout(() => setErrorMsg(""), 4000);
      }
    });

    return () => {
      if (socket) {
        socket.emit("leave_room", { ideaId });
        socket.disconnect();
      }
    };
  }, [open, image?.id, user?.id, user?.name]);

  // Keyboard Escape listener
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const perfTime = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}.${String(
    elapsed % 60
  ).padStart(2, "0")}`;

  const submit = (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !image?.id) return;

    if (!user) {
      setErrorMsg("Please log in to participate in the chatroom.");
      return;
    }

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("send_message", {
        ideaId: image.id,
        content: text,
        senderId: user.id,
        senderName: user.name || "Anonymous",
      });
      setDraft("");
    } else {
      setErrorMsg("Connecting to chat server, please wait...");
    }
  };

  const handleBackdrop = (e) => {
    if (e.target.id === "chatOverlay") {
      onClose();
    }
  };

  return (
    <div
      id="chatOverlay"
      className={open ? "chat-overlay show active open" : "chat-overlay"}
      onClick={handleBackdrop}
    >
      <div className="win95-desktop">
        <div className="win95-window">
          {/* Titlebar */}
          <div className="win95-titlebar">
            <div className="title-text">
              <span className="win-icon">💬</span>
              <span>
                Chat Room - {image?.title ? `"${image.title}"` : "Idea Room"}
              </span>
            </div>
            <div className="win-controls">
              <button className="win-btn" type="button" title="Minimize">
                _
              </button>
              <button className="win-btn" type="button" title="Maximize">
                □
              </button>
              <button
                className="win-btn close-chat"
                id="closeChat"
                type="button"
                title="Close"
                onClick={onClose}
              >
                ✖
              </button>
            </div>
          </div>

          {/* Retro Stickers & Banner */}
          <div className="clippy-sticker">
            <div className="speech-bubble">sick lmao</div>
            <div className="clippy-img">📎</div>
          </div>

          <div className="retro-banner-text">pretty fly for a wifi</div>
          <div className="music-note note-left">🎵</div>
          <div className="music-note note-right">🎶</div>
          <div className="dog-sticker">🐕🎸</div>

          {/* Window Body */}
          <div className="win95-body">
            {/* Left Dial-up Box */}
            <div className="dialup-box">
              <div className="dialup-header">
                <span id="perfTime">{perfTime}</span>
                <div className="mini-controls">
                  <span title={connected ? "Online" : "Connecting"}>
                    {connected ? "🟢" : "🟡"}
                  </span>
                  <span>_</span>
                  <span>□</span>
                </div>
              </div>
              <div className="dialup-content">
                <div className="desc-box">
                  <span className="desc-label">IDEA TITLE</span>
                  <p
                    className="desc-text"
                    style={{ fontWeight: "bold", marginBottom: "8px" }}
                  >
                    {image?.title || "Untitled Idea"}
                  </p>
                  <span className="desc-label">DESCRIPTION</span>
                  <p id="chatImgDescription" className="desc-text">
                    {image?.description ||
                      image?.desc ||
                      "A cool retro aesthetic piece capturing the raw energy of underground web culture and creative vision."}
                  </p>
                </div>

                <div className="desc-box">
                  <span className="desc-label">
                    CONTRIBUTORS ({members.length})
                  </span>
                  {members.length === 0 ? (
                    <p
                      className="desc-text"
                      style={{ fontStyle: "italic", color: "#666" }}
                    >
                      No contributors yet. Send a message to become the first contributor!
                    </p>
                  ) : (
                    <ul className="lineup-list">
                      {members.map((mem, idx) => {
                        const isMe = user?.id && mem.user_id === user.id;
                        return (
                          <li
                            key={mem.id || mem.user_id || idx}
                            style={{ wordBreak: "break-all", fontSize: "11px" }}
                          >
                            👤 {mem.user_name || "Contributor"}
                            {isMe ? " (You)" : ""}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                {errorMsg && (
                  <div
                    style={{
                      background: "#ffcccc",
                      border: "1px solid #cc0000",
                      padding: "4px 6px",
                      color: "#990000",
                      fontSize: "10px",
                      marginTop: "6px",
                    }}
                  >
                    ⚠️ {errorMsg}
                  </div>
                )}
              </div>
            </div>

            {/* Right Chat Main */}
            <div className="chat-main">
              <div className="chat-header-info">
                <span id="chatHeaderDate">{formatChatDate(new Date())}</span>
                <span style={{ fontSize: "11px", color: connected ? "#008000" : "#808080" }}>
                  Status: {connected ? "Connected" : "Dialing..."}
                </span>
              </div>

              <div className="chat-messages" id="chatMessages" ref={logRef}>
                <div className="msg system-msg">
                  <span className="user">Clippy:</span> Welcome to the chat room for "
                  {image?.title || "this idea"}"! Leave a message to join as a contributor.
                </div>

                {messages.map((m, i) => {
                  const isMe = user?.id && m.sender_id === user.id;
                  const displayName = isMe ? "You" : m.sender_name || "Anonymous";
                  const timeStr = m.sent_at
                    ? new Date(m.sent_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "";

                  return (
                    <div className="msg" key={m.id || i}>
                      <span className="user">
                        {displayName} {timeStr ? `[${timeStr}]` : ""}:
                      </span>{" "}
                      {m.content}
                    </div>
                  );
                })}
              </div>

              <form id="chatForm" className="chat-input-bar" onSubmit={submit}>
                <input
                  type="text"
                  id="chatInput"
                  placeholder={
                    user
                      ? "Type a message to contribute..."
                      : "Please log in to chat..."
                  }
                  autoComplete="off"
                  required
                  disabled={!user}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <button
                  type="submit"
                  className="win95-btn"
                  disabled={!user || !draft.trim()}
                >
                  SEND
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

