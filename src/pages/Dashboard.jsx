import { useEffect, useRef, useState } from "react";
import roomBackground from "../assets/room_bg_inked.png";
import "../styles/Dashboard.css";
import "../styles/gallery.css";

function App() {
  // React state for dashboard interactions
  const [lightOn, setLightOn] = useState(false);
  const [isBookOpen, setIsBookOpen] = useState(false);
  const [uploadedImage, setUploadedImage] = useState("");
  const [title, setTitle] = useState("");
  const [diaryText, setDiaryText] = useState("");

  const titleRef = useRef(null);

  // Load the existing gallery script.
  // Keep gallery.js in the public folder so it is available at /gallery.js.
  useEffect(() => {
    const galleryScript = document.createElement("script");
    galleryScript.src = "/gallery.js";
    galleryScript.async = true;
    document.body.appendChild(galleryScript);

    return () => {
      if (document.body.contains(galleryScript)) {
        document.body.removeChild(galleryScript);
      }
    };
  }, []);

  // Release the previous object URL when the uploaded image changes/unmounts.
  useEffect(() => {
    if (!uploadedImage) return undefined;

    return () => URL.revokeObjectURL(uploadedImage);
  }, [uploadedImage]);

  // Auto-fit the title text inside the title textarea.
  useEffect(() => {
    const titleElement = titleRef.current;
    if (!titleElement) return undefined;

    const LINES = 3;
    const LINE_HEIGHT = 1.05;
    const MIN_SIZE = 6;
    const RATIO = 0.6;
    const STEP = 0.5;

    const mirror = document.createElement("div");
    document.body.appendChild(mirror);

    const setSize = (size) => {
      titleElement.style.fontSize = `${size}px`;
      titleElement.style.letterSpacing = `${size * 0.09}px`;
    };

    const textHeight = (size) => {
      const computed = window.getComputedStyle(titleElement);

      mirror.style.cssText = [
        "position:absolute",
        "left:-9999px",
        "top:0",
        "visibility:hidden",
        "box-sizing:border-box",
        "white-space:pre-wrap",
        "overflow-wrap:anywhere",
        "word-break:break-word",
      ].join(";");

      mirror.style.width = `${titleElement.clientWidth}px`;
      mirror.style.fontFamily = computed.fontFamily;
      mirror.style.fontWeight = computed.fontWeight;
      mirror.style.paddingLeft = computed.paddingLeft;
      mirror.style.paddingRight = computed.paddingRight;
      mirror.style.fontSize = `${size}px`;
      mirror.style.letterSpacing = `${size * 0.09}px`;
      mirror.style.lineHeight = String(LINE_HEIGHT);
      mirror.textContent = `${titleElement.value || " "}\u200b`;

      return mirror.offsetHeight;
    };

    const fitTitle = () => {
      const boxHeight = titleElement.clientHeight;
      if (!boxHeight) return;

      const maxSize = Math.floor(boxHeight / (LINES * LINE_HEIGHT));
      let size = maxSize;

      while (
        textHeight(size) > size * LINE_HEIGHT * 1.5 &&
        size > maxSize * RATIO
      ) {
        size -= STEP;
      } while (textHeight(size) > boxHeight && size > MIN_SIZE) {
        size -= STEP;
      }

      setSize(size);
      titleElement.scrollTop = 0;
    };

    const handleKeyDown = (event) => {
      if (event.key === "Enter") event.preventDefault();
    };

    titleElement.addEventListener("keydown", handleKeyDown);

    const resizeObserver = new ResizeObserver(fitTitle);
    resizeObserver.observe(titleElement);
    window.addEventListener("resize", fitTitle);

    fitTitle();

    return () => {
      titleElement.removeEventListener("keydown", handleKeyDown);
      resizeObserver.disconnect();
      window.removeEventListener("resize", fitTitle);
      mirror.remove();
    };
  }, [title]);

  // Wall heading slider: pointer swipe, horizontal wheel, arrow keys and autoplay.
  // The slides are animated with CSS classes, so this effect manages those
  // animation events while React controls whether the spotlight is active.
  useEffect(() => {
    const heading = document.querySelector(".wall-heading");
    if (!heading) return undefined;

    const viewport = heading.querySelector(".wall-viewport");
    const slides = Array.from(heading.querySelectorAll(".wall-slide"));
    const dotsBox = heading.querySelector(".wall-dots");

    if (!viewport || slides.length === 0) return undefined;

    const AUTOPLAY_MS = 4500;
    const ANIMATION_MS = 680;

    let current = 0;
    let busy = false;
    let timer = null;
    let startX = null;
    let dx = 0;
    let wheelLock = false;
    let wheelTimer = null;
    let animationTimer = null;

    // Build the navigation dots for the existing wall-dots container.
    const dots = dotsBox
      ? slides.map(() => {
        const dot = document.createElement("i");
        dotsBox.appendChild(dot);
        return dot;
      })
      : [];

    const markDot = () => {
      dots.forEach((dot, index) => {
        dot.classList.toggle("on", index === current);
      });
    };

    slides.forEach((slide) => {
      slide.classList.remove("is-active", "is-leaving");
      slide.style.removeProperty("--from");
    });
    slides[0].classList.add("is-active");
    markDot();

    const pause = () => {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    };

    const go = (direction, target) => {
      if (busy || slides.length < 2) return;

      const next =
        target !== undefined
          ? target
          : (current + direction + slides.length) % slides.length;

      if (next === current) return;

      busy = true; const restart = () => {
        pause();
        if (!AUTOPLAY_MS) return;

        timer = window.setInterval(() => {
          if (heading.classList.contains("active") && !document.hidden) {
            go(1);
          }
        }, AUTOPLAY_MS);
      };

      const handleKeyDown = (event) => {
        if (!heading.classList.contains("active")) return;

        if (event.key === "ArrowRight") {
          go(1);
          restart();
        } else if (event.key === "ArrowLeft") {
          go(-1);
          restart();
        }
      };

      const handlePointerDown = (event) => {
        if (busy) return;

        startX = event.clientX;
        dx = 0;
        viewport.setPointerCapture(event.pointerId);
        viewport.classList.add("dragging");
        pause();
      };

      const handlePointerMove = (event) => {
        if (startX === null) return;

        dx = event.clientX - startX;
        const activeSlide = slides[current];

        activeSlide.style.transform = `translateX(${dx}px)`;
        activeSlide.style.opacity = String(
          Math.max(0.15, 1 - Math.abs(dx) / (viewport.clientWidth * 0.8))
        );
      };

      const endDrag = () => {
        if (startX === null) return;

        const activeSlide = slides[current];
        viewport.classList.remove("dragging");
        activeSlide.style.transform = "";
        activeSlide.style.opacity = "";

        const moved = dx;
        const limit = Math.min(60, viewport.clientWidth * 0.2);

        startX = null;
        dx = 0;

        if (moved < -limit) go(1);
        else if (moved > limit) go(-1);

        restart();
      };

      const handleWheel = (event) => {
        if (
          Math.abs(event.deltaX) < Math.abs(event.deltaY) ||
          Math.abs(event.deltaX) < 20
        ) {
          return;
        }

        event.preventDefault();
        if (wheelLock) return;

        wheelLock = true;
        go(event.deltaX > 0 ? 1 : -1);
        restart();

        wheelTimer = window.setTimeout(() => {
          wheelLock = false;
        }, 700);
      };

      const handleMouseEnter = () => pause();
      const handleMouseLeave = () => restart();
      document.addEventListener("keydown", handleKeyDown);
      viewport.addEventListener("pointerdown", handlePointerDown);
      viewport.addEventListener("pointermove", handlePointerMove);
      viewport.addEventListener("pointerup", endDrag);
      viewport.addEventListener("pointercancel", endDrag);
      viewport.addEventListener("wheel", handleWheel, { passive: false });
      heading.addEventListener("mouseenter", handleMouseEnter);
      heading.addEventListener("mouseleave", handleMouseLeave);

      restart();

      return () => {
        pause();
        if (animationTimer) window.clearTimeout(animationTimer);
        if (wheelTimer) window.clearTimeout(wheelTimer);

        document.removeEventListener("keydown", handleKeyDown);
        viewport.removeEventListener("pointerdown", handlePointerDown);
        viewport.removeEventListener("pointermove", handlePointerMove);
        viewport.removeEventListener("pointerup", endDrag);
        viewport.removeEventListener("pointercancel", endDrag);
        viewport.removeEventListener("wheel", handleWheel);
        heading.removeEventListener("mouseenter", handleMouseEnter);
        heading.removeEventListener("mouseleave", handleMouseLeave);

        slides.forEach((slide) => {
          slide.classList.remove("is-active", "is-leaving");
          slide.style.removeProperty("--from");
          slide.style.removeProperty("transform");
          slide.style.removeProperty("opacity");
        });

        dots.forEach((dot) => dot.remove());
      };
      dots.forEach((dot) => dot.remove());
    }
  }, []);

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadedImage(URL.createObjectURL(file));
  };

  const handleTitleChange = (event) => {
    // Keep the title on a single line, as in the original implementation.
    setTitle(event.target.value.replace(/\s*\n+\s*/g, " "));
  };

  const handleStickClick = () => {
    console.log("stick clicked");
  };
  return (
    <>
      <div className="scene-container">
        <div className="zoom-wrapper">
          <img
            src={roomBackground}
            className="responsive-img"
            alt="Illustrated room"
          />

          <div className="paper-shadow"></div>
          <div className="paper">
            <div className="paper-sheet"></div>
          </div>

          <div
            className={`spotlight-beam ${lightOn ? "active" : ""}`}
            id="yellowBeam"
          ></div>

          {/* Clickable Hotspots */}
          <button
            id="lightSwitch"
            className="clickable-hotspot"
            aria-label={lightOn ? "Turn light off" : "Turn light on"}
            aria-pressed={lightOn}
            onClick={() => setLightOn((previous) => !previous)}
          ></button>

          <button
            className="book-hotspot"
            id="openBook"
            aria-label="Open Book"
            onClick={() => setIsBookOpen(true)}
          ></button>

          <button
            id="openGallery"
            className="gallery-hotspot"
            aria-label="Open Gallery"
          ></button>

          {/* Animated Wall Heading */}
          <div className={`wall-heading ${lightOn ? "active" : ""}`}>
            <div className="wall-viewport">
              <div className="wall-slide">Where'd all the time go?</div>
              <div className="wall-slide">Change is scary</div>
              <div className="wall-slide">Stay a little longer</div>
            </div>

            <div className="wall-dots"></div>
          </div>
        </div>
      </div>
      {/* CAROUSEL OVERLAY */}
      <div className="carousel-overlay" id="carouselOverlay">
        <button className="close-carousel" id="closeCarousel">
          &times;
        </button>
        <div id="carousel-root"></div>
      </div>

      {/* BOOK OVERLAY */}
      <div
        className={`book-overlay ${isBookOpen ? "show" : ""}`}
        id="bookOverlay"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            setIsBookOpen(false);
          }
        }}
      >
        <div className="book">
          <button
            className="close-book"
            id="closeBook"
            onClick={() => setIsBookOpen(false)}
            aria-label="Close book"
          >
            &times;
          </button>

          <div className="book-cover-title">
            <span>PERSONAL COLLECTION · 001</span>
            <h1>STARTER PACK</h1>
            <p>A LITTLE SPACE FOR EVERYTHING</p>
          </div>

          <div className="book-pages">
            <div className="page image-page">
              <button
                type="button"
                className="stick-btn"
                onClick={handleStickClick}
              >
                stick
              </button>

              <div className="image-area">
                <img
                  id="uploadedImage"
                  src={uploadedImage}
                  alt="Uploaded"
                  style={{ display: uploadedImage ? "block" : "none" }}
                />
              </div>

              <input
                type="file"
                id="imageUpload"
                accept="image/*"
                hidden
                onChange={handleImageUpload}
              />

              <label
                htmlFor="imageUpload"
                className="pencil-btn"
                title="Add image"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="19"
                  height="19"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
                </svg>
              </label>
            </div>

            <div className="page writing-page">
              <textarea
                ref={titleRef}
                className="title-input"
                placeholder="Title"
                rows={3}
                maxLength={60}
                wrap="off"
                value={title}
                onChange={handleTitleChange}
              ></textarea>
              <textarea
                placeholder="Your vision(no essays, show us that it was YOUR idea)"
                value={diaryText}
                onChange={(event) => setDiaryText(event.target.value)}
              ></textarea>

              <span className="page-number">02</span>
            </div>
          </div>
        </div>
      </div>

      {/* GALLERY OVERLAY */}
      <div id="galleryOverlay" className="gallery-overlay bg-graph">
        <div className="gallery-stickers"></div>

        <div className="gallery-top">
          <h1 className="gallery-title">
            GALLERY
            <small className="gallery-count">0 pics</small>
          </h1>

          <button
            type="button"
            className="gallery-close"
            aria-label="Close Gallery"
          >
            ✖
          </button>

          <div className="cat-bar"></div>
        </div>

        <div className="gallery-scroll">
          <div className="gallery-grid"></div>
          <div className="gallery-sentinel"></div>
        </div>
      </div>
      {/* LIGHTBOX MODAL */}
      <div id="lightbox" className="lightbox">
        <button
          type="button"
          className="lb-close"
          aria-label="Close Lightbox"
        >
          ✖
        </button>

        <button
          type="button"
          className="lb-prev"
          aria-label="Previous Image"
        >
          ◄
        </button>

        <button
          type="button"
          className="lb-next"
          aria-label="Next Image"
        >
          ►
        </button>

        <img src="" alt="Full size preview" />
      </div>
      {/* RETRO Y2K CHAT ROOM OVERLAY */}
      <div id="chatOverlay" className="chat-overlay">
        <div className="win95-desktop">
          <div className="win95-window">
            {/* Window Titlebar */}
            <div className="win95-titlebar">
              <div className="title-text">
                <span className="win-icon">💬</span>
                <span>Chat Room </span>
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
                >
                  ✖
                </button>
              </div>
            </div>

            {/* Y2K Sticker Overlays */}
            <div className="clippy-sticker">
              <div className="speech-bubble">sick lmao</div>
              <div className="clippy-img">📎</div>
            </div>

            <div className="retro-banner-text">pretty fly for a wifi</div>

            <div className="music-note note-left">🎵</div>
            <div className="music-note note-right">🎶</div>
            <div className="dog-sticker">🐕🎸</div>

            {/* Window Main Body */}
            <div className="win95-body">
              {/* Left Dial-Up Info Panel */}
              <div className="dialup-box">
                <div className="dialup-header">
                  <span id="perfTime">00.00</span>

                  <div className="mini-controls">
                    <span>_</span>
                    <span>□</span>
                  </div>
                </div>

                <div className="dialup-content">
                  <div className="desc-box">
                    <span className="desc-label">DESCRIPTION</span>

                    <p id="chatImgDescription" className="desc-text">
                      A cool retro aesthetic piece capturing the raw energy
                      of underground web culture and creative vision.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Live Chat Room */}
              <div className="chat-main">
                <div className="chat-header-info">
                  <span id="chatHeaderDate">August 25 Sunday</span>
                </div>

                {/* Scrollable Chat Log */}
                <div className="chat-messages" id="chatMessages">
                  <div className="msg">
                    <span className="user">Clippy:</span>{" "}
                    Welcome to the chat room! Feel free to leave a message.
                  </div>
                </div>

                {/* Chat Input Field */}
                <form id="chatForm" className="chat-input-bar">
                  <input
                    type="text"
                    id="chatInput"
                    placeholder="Type a message..."
                    autoComplete="off"
                    required
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
    </>
  );
}


export default App;

