/* ------------------------------------------------------------------ */
/*  GALLERY + LIGHTBOX + CHATROOM HOOKS                                */
/* ------------------------------------------------------------------ */

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import "../styles/Gallery.css";
import { ideasFetch } from "../services/diaryServices";

const DEFAULT_DESC =
  "A cool retro aesthetic piece capturing the raw energy of underground web culture and creative vision.";

const openCls = (base, isOpen) => (isOpen ? `${base} show active open` : base);

const PAGE_SIZE = 36;
const COL_WIDTH = 230;
const GAP = 26;

const FRAMES = ["f1", "f2", "f3", "f1", "f3", "f2", "f1"];

const STICKERS = ["eye", "bolt", "cassette", "checker", "floppy", "rec", "xsmile", "barcode"];

// Category IDs must match the IDs in your PostgreSQL database.
const CATEGORIES = [
  { id: 1, name: "Tech" },
  { id: 2, name: "Design" },
  { id: 3, name: "Art" },
  { id: 4, name: "Startup" },
  { id: 5, name: "Random" },
];

const calcCols = (width) => Math.max(2, Math.floor((width + GAP) / (COL_WIDTH + GAP)));

function GalleryOverlay({ open, onClose, onOpenChat }) {
  /* ---------------------------- STATE ---------------------------- */
  const [photos, setPhotos] = useState([]);
  const [categoryId, setCategoryId] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [colCount, setColCount] = useState(2);
  const [gridWidth, setGridWidth] = useState(0);
  const [noAnim, setNoAnim] = useState(false);

  /* ---------------------------- REFS ---------------------------- */
  const overlayRef = useRef(null);
  const sentinelRef = useRef(null);
  const scrollRef = useRef(null);
  const gridRef = useRef(null);
  const loadedRef = useRef(false);

  /* ---------------------------- FETCH IDEAS ---------------------------- */
  useEffect(() => {
    if (!open) return;
    const fetchPhotos = async () => {
      try {
        loadedRef.current = false;
        const data = await ideasFetch();
        console.log("Fetched data:", data);
        const galleryPhotos = data.map((photo) => ({
          id: photo.id,
          thumb: photo.image_src,
          full: photo.image_src,
          w: 1,
          h: 1,
          // Preserve the category ID returned by the backend.
          category_id: Number(photo.category_id ?? photo.categoryId ?? 0),
          title: photo.title || "",
          desc: photo.description || "",
          description: photo.description || "",
          creator_id: photo.creator_id,
        }));
        console.log("Gallery photos:", galleryPhotos);
        setPhotos(galleryPhotos);
        loadedRef.current = true;
      } catch (error) {
        console.error("Error fetching gallery ideas:", error);
      }
    };
    fetchPhotos();
  }, [open]);

  /* ---------------------------- WOBBLE FILTER ---------------------------- */
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

  /* ---------------------------- BORROW BOOK STICKERS ---------------------------- */
  useEffect(() => {
    if (!open || !overlayRef.current) return;
    const bookEl = document.querySelector(".book-pages");
    if (!bookEl) return;
    const cs = getComputedStyle(bookEl);
    STICKERS.forEach((n) => {
      const v = cs.getPropertyValue(`--st-${n}`);
      if (v) {
        overlayRef.current.style.setProperty(`--st-${n}`, v);
      }
    });
  }, [open]);

  /* ---------------------------- CATEGORY COUNTS ---------------------------- */
  const categoryCounts = useMemo(() => {
    const counts = {};
    photos.forEach((photo) => {
      const id = photo.category_id;
      if (id) {
        counts[id] = (counts[id] || 0) + 1;
      }
    });
    return counts;
  }, [photos]);

  /* ---------------------------- CATEGORY FILTERING ---------------------------- */
  const filtered = useMemo(() => {
    // categoryId = 0 means no filter.
    if (categoryId === 0) {
      return photos;
    }
    return photos.filter((photo) => photo.category_id === categoryId);
  }, [photos, categoryId]);

  /* ---------------------------- VISIBLE PHOTOS ---------------------------- */
  const shown = useMemo(() => filtered.slice(0, visible), [filtered, visible]);

  const lightboxOpen = lightboxIndex !== null;
  const lbImage = lightboxOpen ? filtered[lightboxIndex] : null;

  /* ---------------------------- RESET GALLERY VIEW ---------------------------- */
  const resetView = () => {
    setVisible(PAGE_SIZE);
    setNoAnim(false);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  };

  /* ---------------------------- CATEGORY CHANGE ---------------------------- */
  const handleCategoryChange = (id) => {
    setCategoryId(id);
    resetView();
  };

  /* ---------------------------- MASONRY COLUMN LAYOUT ---------------------------- */
  useEffect(() => {
    if (!open) return;
    const measure = () => {
      if (!gridRef.current) return;
      const w = gridRef.current.clientWidth;
      setGridWidth(w);
      setColCount((prev) => {
        const n = calcCols(w);
        if (n !== prev) {
          setNoAnim(true);
        }
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

  /* ---------------------------- DISTRIBUTE PHOTOS INTO COLUMNS ---------------------------- */
  const columns = useMemo(() => {
    const colW = gridWidth ? gridWidth / colCount : COL_WIDTH;
    const cols = Array.from({ length: colCount }, () => []);
    const heights = Array(colCount).fill(0);
    shown.forEach((p, idx) => {
      const a = p.w && p.h ? p.w / p.h : 1;
      let k = 0;
      for (let i = 1; i < heights.length; i++) {
        if (heights[i] < heights[k]) {
          k = i;
        }
      }
      cols[k].push({ p, idx, a });
      heights[k] += colW / a + 40;
    });
    return cols;
  }, [shown, colCount, gridWidth]);

  /* ---------------------------- INFINITE SCROLL ---------------------------- */
  useEffect(() => {
    if (!open || !sentinelRef.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible((v) => Math.min(v + PAGE_SIZE, filtered.length));
        }
      },
      { root: scrollRef.current, rootMargin: "800px" }
    );
    io.observe(sentinelRef.current);
    return () => io.disconnect();
  }, [open, filtered.length, visible]);

  /* ---------------------------- LIGHTBOX CONTROLS ---------------------------- */
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const prev = useCallback(
    () => setLightboxIndex((i) => (i === null ? i : (i - 1 + filtered.length) % filtered.length)),
    [filtered.length]
  );

  const next = useCallback(
    () => setLightboxIndex((i) => (i === null ? i : (i + 1) % filtered.length)),
    [filtered.length]
  );

  /* ---------------------------- CHATROOM ---------------------------- */
  const openChatRoom = useCallback(
    (photo) => {
      if (onOpenChat) {
        onOpenChat(photo);
      }
    },
    [onOpenChat]
  );

  /* ---------------------------- KEYBOARD HANDLING ---------------------------- */
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (lightboxOpen) {
          closeLightbox();
        } else {
          onClose();
        }
      } else if (lightboxOpen) {
        if (e.key === "ArrowLeft") {
          prev();
        }
        if (e.key === "ArrowRight") {
          next();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, lightboxOpen, closeLightbox, prev, next, onClose]);

  /* ---------------------------- CLOSE OVERLAYS ---------------------------- */
  useEffect(() => {
    if (!open) {
      setLightboxIndex(null);
      setPanelOpen(false);
    }
  }, [open]);

  /* ---------------------------- CHAT HEADER DATES ---------------------------- */
  useEffect(() => {
    const now = new Date();
    const month = now.toLocaleString("en-US", { month: "long" });
    const weekday = now.toLocaleString("en-US", { weekday: "long" });
    const fullDate = `${month} ${now.getDate()} ${weekday}`;
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const shortDate = `${mm}.${dd}`;
    const headerDateEl = document.getElementById("chatHeaderDate");
    const dialupDateEl = document.getElementById("dialupDate");
    if (headerDateEl) {
      headerDateEl.textContent = fullDate;
    }
    if (dialupDateEl) {
      dialupDateEl.textContent = shortDate;
    }
  }, []);

  /* ---------------------------- PERF CLOCK ---------------------------- */
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mi = String(now.getMinutes()).padStart(2, "0");
      const el = document.getElementById("perfTime");
      if (el) {
        el.textContent = `${hh}.${mi}`;
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  /* ---------------------------- RENDER ---------------------------- */
  return (
    <>
      {/* ---------------- GALLERY OVERLAY ---------------- */}
      <div
        id="galleryOverlay"
        ref={overlayRef}
        className={openCls("gallery-overlay bg-graph", open)}
      >
        <div className="gallery-stickers" />

        {/* ---------------- GALLERY HEADER ---------------- */}
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

          {/* FILTER BUTTON */}
          <button
            type="button"
            className={panelOpen ? "filter-btn open" : "filter-btn"}
            onClick={() => setPanelOpen((o) => !o)}
          >
            FILTER
            <span className={categoryId !== 0 ? "badge show" : "badge"}>
              {categoryId !== 0 ? 1 : 0}
            </span>
            <span className="arrow">▼</span>
          </button>

          {/* ---------------- CATEGORY FILTER PANEL ---------------- */}
          <div className={panelOpen ? "cat-bar open" : "cat-bar"}>
            {/* ALL CATEGORIES */}
            <button
              type="button"
              className={categoryId === 0 ? "cat-chip on" : "cat-chip"}
              onClick={() => handleCategoryChange(0)}
            >
              All
              <b>{photos.length}</b>
            </button>

            {/* INDIVIDUAL CATEGORY FILTERS */}
            {[...CATEGORIES]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={categoryId === category.id ? "cat-chip on" : "cat-chip"}
                  onClick={() => handleCategoryChange(category.id)}
                >
                  {category.name}
                  <b>{categoryCounts[category.id] ?? 0}</b>
                </button>
              ))}
          </div>
        </div>

        {/* ---------------- GALLERY SCROLL AREA ---------------- */}
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

      {/* ---------------- LIGHTBOX ---------------- */}
      <div
        id="lightbox"
        className={openCls("lightbox", lightboxOpen)}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            closeLightbox();
          }
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