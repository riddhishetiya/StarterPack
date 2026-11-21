import roomBackground from "../assets/room_bg_inked.png";
// import "../utils/gallery.js"
import "../styles/Dashboard.css";

import React, {
  useEffect,
  useRef,
  useState,
} from "react";

//JSX FILES FOR DASHBOARD
import BookOverlay from "./BookOverlay";
import WallHeading from "./WallHeading";
import GalleryOverlay from "./GalleryOverlay";
import ChatOverlay from "./ChatOverlay";
import { getCurrentUser } from "../services/authServices";

const openCls = (base, isOpen) => (isOpen ? `${base} show active open` : base);

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

export default function Dashboard({ user: propUser }) {
  const [user, setUser] = useState(propUser || null);
  const [lightOn, setLightOn] = useState(false); // spotlight + wall heading
  const [bookOpen, setBookOpen] = useState(false); // diary
  const [galleryOpen, setGalleryOpen] = useState(false); // paintings
  const [chatOpen, setChatOpen] = useState(false);
  const [chatImage, setChatImage] = useState(null);
  const [carouselOpen, setCarouselOpen] = useState(false);

  useEffect(() => {
    if (propUser) {
      setUser(propUser);
    } else {
      getCurrentUser()
        .then((u) => {
          if (u) setUser(u);
        })
        .catch(() => {});
    }
  }, [propUser]);

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
            onClick={() => setGalleryOpen(true) }
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
        user={user}
        onClose={() => setChatOpen(false)}
      />
    </>
  );
}
