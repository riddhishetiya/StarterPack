/* ------------------------------------------------------------------ */
/*  GALLERY + LIGHTBOX + CHATROOM HOOKS                                */
/*  (gallery.js has been folded in; do NOT import it separately)       */
/* ------------------------------------------------------------------ */
import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";

import "../styles/Gallery.css";

import { ideasFetch } from "../services/diaryServices";


const DEFAULT_DESC =
  "A cool retro aesthetic piece capturing the raw energy of underground web culture and creative vision.";

// The original CSS toggles a state class on overlays. Since gallery.css /
// carousel.css weren't included, apply the usual candidates so either works.
const openCls = (base, isOpen) => (isOpen ? `${base} show active open` : base);

const PAGE_SIZE = 36; // BATCH from gallery.js
const MODE = "any"; // "any" | "all" – how multiple selected categories combine
const COL_WIDTH = 230;
const GAP = 26;
const FRAMES = ["f1", "f2", "f3", "f1", "f3", "f2", "f1"];
const STICKERS = ["eye", "bolt", "cassette", "checker", "floppy", "rec", "xsmile", "barcode"];

const calcCols = (width) =>
  Math.max(2, Math.floor((width + GAP) / (COL_WIDTH + GAP)));

function GalleryOverlay({ open, onClose, onOpenChat }) {
  const [photos, setPhotos] = useState([]);
  const [selected, setSelected] = useState(() => new Set());
  const [panelOpen, setPanelOpen] = useState(false);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [colCount, setColCount] = useState(2);
  const [gridWidth, setGridWidth] = useState(0);
  const [noAnim, setNoAnim] = useState(false);

  const overlayRef = useRef(null);
  const sentinelRef = useRef(null);
  const scrollRef = useRef(null);
  const gridRef = useRef(null);
  const loadedRef = useRef(false);

  //Fetching the images from db to gallery
  useEffect(() => {
    if (!open) return;

    const fetchPhotos = async () => {
      try {
        const data = await ideasFetch();

        console.log("Fetched data :", data);
        const galleryPhotos = data.map((photo) => ({
          id: photo.id,
          thumb: photo.image_src,
          full: photo.image_src,
          w: 1,
          h: 1,
          cats: [],
          desc: "",
        }));

        console.log("Gallery photos:", galleryPhotos);
        setPhotos(galleryPhotos);
      } catch (error) {
        console.error(error);
      }
    };

    fetchPhotos();
  }, [open]);

  /* ---------- hand-drawn wobble filter (injected once) ---------- */
  useEffect(() => {
    if (document.getElementById("galWobble")) return;
    const s = document.createElement("div");
    s.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
    s.innerHTML =
      '<svg width="0" height="0" aria-hidden="true"><filter id="galWobble" x="-4%" y="-4%" width="108%" height="108%">' +
      '<feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="4" result="n"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="n" scale="4.5" xChannelSelector="R" yChannelSelector="G"/></filter></svg>';
    document.body.appendChild(s);
  }, []);

  /* ---------- borrow sticker drawings if the book is present ---------- */
  useEffect(() => {
    if (!open || !overlayRef.current) return;
    const bookEl = document.querySelector(".book-pages");
    if (!bookEl) return;
    const cs = getComputedStyle(bookEl);
    STICKERS.forEach((n) => {
      const v = cs.getPropertyValue(`--st-${n}`);
      if (v) overlayRef.current.style.setProperty(`--st-${n}`, v);
    });
  }, [open]);

  /* ---------- categories (multi-select chips with counts) ---------- */
  const categoryCounts = useMemo(() => {
    const counts = {};
    photos.forEach((p) =>
      p.cats.forEach((c) => {
        counts[c] = (counts[c] || 0) + 1;
      })
    );
    return counts;
  }, [photos]);

  const filtered = useMemo(() => {
    const sel = Array.from(selected);
    if (!sel.length) return photos;
    return photos.filter((p) =>
      MODE === "all"
        ? sel.every((c) => p.cats.includes(c))
        : sel.some((c) => p.cats.includes(c))
    );
  }, [photos, selected]);

  const shown = useMemo(() => filtered.slice(0, visible), [filtered, visible]);
  const lightboxOpen = lightboxIndex !== null;
  const lbImage = lightboxOpen ? filtered[lightboxIndex] : null;

  const resetView = () => {
    setVisible(PAGE_SIZE);
    setNoAnim(false);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  };

  const toggleCategory = (name) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
    resetView();
  };

  const clearCategories = () => {
    setSelected(new Set());
    resetView();
  };

  /* ---------- masonry column layout ---------- */
  useEffect(() => {
    if (!open) return;
    const measure = () => {
      if (!gridRef.current) return;
      const w = gridRef.current.clientWidth;
      setGridWidth(w);
      setColCount((prev) => {
        const n = calcCols(w);
        if (n !== prev) setNoAnim(true); // relayout shouldn't replay the pop-in
        return n;
      });
    };
    measure();
    let rt;
    const onResize = () => {
      clearTimeout(rt);
      rt = setTimeout(measure, 150);
    };
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(rt);
      window.removeEventListener("resize", onResize);
    };
  }, [open, photos.length]);

  const columns = useMemo(() => {
    const colW = gridWidth ? gridWidth / colCount : COL_WIDTH;
    const cols = Array.from({ length: colCount }, () => []);
    const heights = Array(colCount).fill(0);
    shown.forEach((p, idx) => {
      const a = p.w && p.h ? p.w / p.h : 1;
      let k = 0;
      for (let i = 1; i < heights.length; i++) if (heights[i] < heights[k]) k = i;
      cols[k].push({ p, idx, a });
      heights[k] += colW / a + 40;
    });
    return cols;
  }, [shown, colCount, gridWidth]);

  /* ---------- infinite scroll ---------- */
  useEffect(() => {
    if (!open || !sentinelRef.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting)
          setVisible((v) => Math.min(v + PAGE_SIZE, filtered.length));
      },
      { root: scrollRef.current, rootMargin: "800px" }
    );
    io.observe(sentinelRef.current);
    return () => io.disconnect();
  }, [open, filtered.length, visible]);

  /* ---------- lightbox controls ---------- */
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const prev = useCallback(
    () =>
      setLightboxIndex((i) =>
        i === null ? i : (i - 1 + filtered.length) % filtered.length
      ),
    [filtered.length]
  );
  const next = useCallback(
    () =>
      setLightboxIndex((i) => (i === null ? i : (i + 1) % filtered.length)),
    [filtered.length]
  );

  /* ---------- chatroom ---------- */
  const openChatRoom = useCallback(
    (photo) => {
      const chatOverlay = document.getElementById("chatOverlay");
      if (!chatOverlay) {
        if (onOpenChat) onOpenChat(photo);
        return;
      }
      const descEl = document.getElementById("chatImgDescription");
      if (descEl) descEl.textContent = (photo && photo.desc) || DEFAULT_DESC;
      chatOverlay.classList.add("show");
      if (onOpenChat) onOpenChat(photo);
    },
    [onOpenChat]
  );

  /* ---------- unified keyboard handling ----------
     Escape: close chat first, then lightbox, then the gallery.
     Arrows: navigate the lightbox. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      const chatOverlay = document.getElementById("chatOverlay");
      const chatOpen = chatOverlay && chatOverlay.classList.contains("show");
      if (e.key === "Escape") {
        if (chatOpen) chatOverlay.classList.remove("show");
        else if (lightboxOpen) closeLightbox();
        else onClose();
      } else if (lightboxOpen && !chatOpen) {
        if (e.key === "ArrowLeft") prev();
        if (e.key === "ArrowRight") next();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, lightboxOpen, closeLightbox, prev, next, onClose]);

  // closing the gallery also closes the lightbox and filter panel
  useEffect(() => {
    if (!open) {
      setLightboxIndex(null);
      setPanelOpen(false);
    }
  }, [open]);

  /* ---------- chat overlay wiring (close button, backdrop, form) ---------- */
  useEffect(() => {
    const chatOverlay = document.getElementById("chatOverlay");
    const closeChatBtn = document.getElementById("closeChat");
    const chatForm = document.getElementById("chatForm");
    const chatInput = document.getElementById("chatInput");
    const chatMessages = document.getElementById("chatMessages");

    const hide = () => chatOverlay && chatOverlay.classList.remove("show");
    const onBackdrop = (e) => {
      if (e.target === chatOverlay) hide();
    };
    const onSubmit = (e) => {
      e.preventDefault();
      const text = chatInput.value.trim();
      if (!text) return;
      const timeStr = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      const msgDiv = document.createElement("div");
      msgDiv.className = "msg";
      const userSpan = document.createElement("span");
      userSpan.className = "user";
      userSpan.textContent = `You [${timeStr}]:`;
      msgDiv.appendChild(userSpan);
      // textContent (not innerHTML) so user input can't inject markup
      msgDiv.appendChild(document.createTextNode(" " + text));
      chatMessages.appendChild(msgDiv);
      chatInput.value = "";
      chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    if (closeChatBtn) closeChatBtn.addEventListener("click", hide);
    if (chatOverlay) chatOverlay.addEventListener("click", onBackdrop);
    if (chatForm) chatForm.addEventListener("submit", onSubmit);
    return () => {
      if (closeChatBtn) closeChatBtn.removeEventListener("click", hide);
      if (chatOverlay) chatOverlay.removeEventListener("click", onBackdrop);
      if (chatForm) chatForm.removeEventListener("submit", onSubmit);
    };
  }, []);

  /* ---------- chat header dates ---------- */
  useEffect(() => {
    const now = new Date();
    const month = now.toLocaleString("en-US", { month: "long" });
    const weekday = now.toLocaleString("en-US", { weekday: "long" });
    const fullDate = `${month} ${now.getDate()} ${weekday}`; // "November 9 Monday"
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const shortDate = `${mm}.${dd}`; // "11.09"

    const headerDateEl = document.getElementById("chatHeaderDate");
    const dialupDateEl = document.getElementById("dialupDate");
    if (headerDateEl) headerDateEl.textContent = fullDate;
    if (dialupDateEl) dialupDateEl.textContent = shortDate;
  }, []);

  /* ---------- perf clock ---------- */
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mi = String(now.getMinutes()).padStart(2, "0");
      const el = document.getElementById("perfTime");
      if (el) el.textContent = `${hh}.${mi}`;
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  /* ---------------------------- render ---------------------------- */
  return (
    <>
      <div
        id="galleryOverlay"
        ref={overlayRef}
        className={openCls("gallery-overlay bg-graph", open)}
      >
        <div className="gallery-stickers" />

        <div className="gallery-top">
          <h1 className="gallery-title">
            GALLERY{" "}
            <small className="gallery-count">
              {filtered.length} {filtered.length === 1 ? "pic" : "pics"}
            </small>
          </h1>

          <button
            type="button"
            className="gallery-close"
            aria-label="Close Gallery"
            onClick={onClose}
          >
            ✖
          </button>

          {/* FILTER button */}
          <button
            type="button"
            className={panelOpen ? "filter-btn open" : "filter-btn"}
            onClick={() => setPanelOpen((o) => !o)}
          >
            FILTER
            <span className={selected.size > 0 ? "badge show" : "badge"}>
              {selected.size}
            </span>
            <span className="arrow">▼</span>
          </button>

          <div className={panelOpen ? "cat-bar open" : "cat-bar"}>
            <button
              type="button"
              className={selected.size === 0 ? "cat-chip on" : "cat-chip"}
              onClick={clearCategories}
            >
              All<b>{photos.length}</b>
            </button>
            {Object.keys(categoryCounts)
              .sort()
              .map((name) => (
                <button
                  key={name}
                  type="button"
                  className={selected.has(name) ? "cat-chip on" : "cat-chip"}
                  onClick={() => toggleCategory(name)}
                >
                  {name}
                  <b>{categoryCounts[name]}</b>
                </button>
              ))}
          </div>
        </div>

        <div
          className="gallery-scroll"
          ref={scrollRef}
          onClick={() => setPanelOpen(false)}
        >
          <div className="gallery-grid" ref={gridRef}>
            {filtered.length === 0 && loadedRef.current && photos.length > 0 ? (
              <div className="gallery-empty">nothing here yet…</div>
            ) : (
              columns.map((col, ci) => (
                <div className="gal-col" key={ci}>
                  {col.map(({ p, idx, a }) => (
                    <figure
                      key={p.id ?? idx}
                      className={
                        "photo v" +
                        (idx % 4) +
                        " " +
                        FRAMES[idx % FRAMES.length] +
                        (idx % 4 === 1 ? " tape" + (idx % 8 === 5 ? " y" : "") : "")
                      }
                      style={{
                        "--a": a,
                        "--r": (((idx * 37) % 9) - 4) * 0.7 + "deg",
                        "--tr": (((idx * 11) % 7) - 3) * 2 + "deg",
                        "--dy": ((idx * 53) % 5) * 5 + "px",
                        ...(noAnim ? { animation: "none" } : null),
                      }}
                      onClick={() => setLightboxIndex(idx)}
                    >
                      <span className="mat">
                        <img
                          src={p.thumb}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          onError={(e) => console.log("Image failed:", e.target.src)}
                          onLoad={() => console.log("Image loaded successfully")}
                        />
                      </span>
                    </figure>
                  ))}
                </div>
              ))
            )}
          </div>
          <div className="gallery-sentinel" ref={sentinelRef} />
        </div>
      </div>

      {/* LIGHTBOX */}
      <div
        id="lightbox"
        className={openCls("lightbox", lightboxOpen)}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeLightbox();
        }}
      >
        <button
          type="button"
          className="lb-close"
          aria-label="Close Lightbox"
          onClick={closeLightbox}
        >
          ✖
        </button>
        <button
          type="button"
          className="lb-prev"
          aria-label="Previous Image"
          onClick={prev}
        >
          ◄
        </button>
        <button
          type="button"
          className="lb-next"
          aria-label="Next Image"
          onClick={next}
        >
          ►
        </button>
        <img
          src={lbImage ? lbImage.full || lbImage.src || lbImage.thumb : undefined}
          alt="Full size preview"
          onClick={() => lbImage && openChatRoom(lbImage)}
        />
      </div>
    </>
  );
}

export default GalleryOverlay;