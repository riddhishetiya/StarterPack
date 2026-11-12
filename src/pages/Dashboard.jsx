import roomBackground from "../assets/room_bg_inked.png";
import "../styles/Dashboard.css";
import "../styles/gallery.css";

import React, {
  useEffect,
  useRef,
  useState,
} from "react";

//JSX FILES FOR DASHBOARD
import BookOverlay from "./BookOverlay";
import WallHeading from "./WallHeading";
import GalleryOverlay from "./GalleryOverlay"

/* ------------------------------------------------------------------ */
/*  RETRO CHAT ROOM                                                    */
/* ------------------------------------------------------------------ */
function formatChatDate(d) {
  const month = d.toLocaleString("en-US", { month: "long" });
  const weekday = d.toLocaleString("en-US", { weekday: "long" });
  return `${month} ${d.getDate()} ${weekday}`;
}

function ChatOverlay({ open, onClose, image }) {
  const [messages, setMessages] = useState([
    { user: "Clippy", text: "Welcome to the chat room! Feel free to leave a message." },
  ]);
  const [draft, setDraft] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const logRef = useRef(null);

  // elapsed-time readout in the dial-up box, runs while the chat is open
  useEffect(() => {
    if (!open) return;
    setElapsed(0);
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [open]);

  // keep the log scrolled to the newest message
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  const perfTime = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}.${String(
    elapsed % 60
  ).padStart(2, "0")}`;

  const submit = (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setMessages((m) => [...m, { user: "You", text }]);
    setDraft("");
  };

  return (
    <div id="chatOverlay" className={openCls("chat-overlay", open)}>
      <div className="win95-desktop">
        <div className="win95-window">
          <div className="win95-titlebar">
            <div className="title-text">
              <span className="win-icon">💬</span>
              <span>Chat Room </span>
            </div>
            <div className="win-controls">
              <button className="win-btn" type="button" title="Minimize">_</button>
              <button className="win-btn" type="button" title="Maximize">□</button>
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

          <div className="clippy-sticker">
            <div className="speech-bubble">sick lmao</div>
            <div className="clippy-img">📎</div>
          </div>

          <div className="retro-banner-text">pretty fly for a wifi</div>
          <div className="music-note note-left">🎵</div>
          <div className="music-note note-right">🎶</div>
          <div className="dog-sticker">🐕🎸</div>

          <div className="win95-body">
            <div className="dialup-box">
              <div className="dialup-header">
                <span id="perfTime">{perfTime}</span>
                <div className="mini-controls">
                  <span>_</span>
                  <span>□</span>
                </div>
              </div>
              <div className="dialup-content">
                <div className="desc-box">
                  <span className="desc-label">DESCRIPTION</span>
                  <p id="chatImgDescription" className="desc-text">
                    {image
                      ? image.description
                      : "A cool retro aesthetic piece capturing the raw energy of underground web culture and creative vision."}
                  </p>
                </div>
              </div>
            </div>

            <div className="chat-main">
              <div className="chat-header-info">
                <span id="chatHeaderDate">{formatChatDate(new Date())}</span>
              </div>

              <div className="chat-messages" id="chatMessages" ref={logRef}>
                {messages.map((m, i) => (
                  <div className="msg" key={i}>
                    <span className="user">{m.user}:</span> {m.text}
                  </div>
                ))}
              </div>

              <form id="chatForm" className="chat-input-bar" onSubmit={submit}>
                <input
                  type="text"
                  id="chatInput"
                  placeholder="Type a message..."
                  autoComplete="off"
                  required
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <button type="submit" className="win95-btn">
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

/* ------------------------------------------------------------------ */
/*  CAROUSEL OVERLAY                                                   */
/*  The original only had an empty #carousel-root mount point.         */
/*  Render your carousel component as children.                        */
/* ------------------------------------------------------------------ */
function CarouselOverlay({ open, onClose, children }) {
  return (
    <div
      className={open ? "carousel-overlay show active open" : "carousel-overlay"}
      id="carouselOverlay"
    >
      <button className="close-carousel" id="closeCarousel" onClick={onClose}>
        &times;
      </button>
      <div id="carousel-root">{children}</div>
    </div>
  );
}

export default function App() {
  const [lightOn, setLightOn] = useState(false); // spotlight + wall heading
  const [bookOpen, setBookOpen] = useState(false); // diary
  const [galleryOpen, setGalleryOpen] = useState(false); // paintings
  const [chatOpen, setChatOpen] = useState(false);
  const [chatImage, setChatImage] = useState(null);
  const [carouselOpen, setCarouselOpen] = useState(false);

  const openChat = (img) => {
    setChatImage(img);
    setChatOpen(true);
  };

  return (
    <>
      <div className="scene-container">
        <div className="zoom-wrapper">
          <img src={roomBackground} className="responsive-img" alt="" />

          <div className="paper-shadow" />
          <div className="paper">
            <div className="paper-sheet" />
          </div>

          <div
            className={lightOn ? "spotlight-beam active" : "spotlight-beam"}
            id="yellowBeam"
          />

          {/* Clickable hotspots */}
          <button
            id="lightSwitch"
            className="clickable-hotspot"
            aria-label="Light Switch"
            onClick={() => setLightOn((v) => !v)}
          />
          <button
            className="book-hotspot"
            id="openBook"
            aria-label="Open Book"
            onClick={() => setBookOpen(true)}
          />
          <button
            id="openGallery"
            className="gallery-hotspot"
            aria-label="Open Gallery"
            onClick={() => setGalleryOpen(true)}
          />

          <WallHeading lightOn={lightOn} />
        </div>
      </div>

      <CarouselOverlay
        open={carouselOpen}
        onClose={() => setCarouselOpen(false)}
      />

      <BookOverlay open={bookOpen} onClose={() => setBookOpen(false)} />

      <GalleryOverlay
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        onOpenChat={openChat}
      />

      <ChatOverlay
        open={chatOpen}
        image={chatImage}
        onClose={() => setChatOpen(false)}
      />
    </>
  );
}
