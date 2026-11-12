/* ------------------------------------------------------------------ */
/*  GALLERY + LIGHTBOX                                                 */
/* ------------------------------------------------------------------ */
import { useState,useEffect,useMemo,useRef,useCallback } from "react";

const GALLERY_IMAGES = Array.from({ length: 24 }, (_, i) => ({
  id: i + 1,
  src: `/gallery/${i + 1}.jpg`,
  category: ["Art", "Photos", "Sketches"][i % 3],
  description:
    "A cool retro aesthetic piece capturing the raw energy of underground web culture and creative vision.",
}));

// The original CSS toggles a state class on overlays. Since gallery.css /
// carousel.css weren't included, apply the usual candidates so either works.
const openCls = (base, isOpen) => (isOpen ? `${base} show active open` : base);

const PAGE_SIZE = 12;

function GalleryOverlay({ open, onClose, onOpenChat }) {
  const [category, setCategory] = useState("All");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const sentinelRef = useRef(null);
  const scrollRef = useRef(null);

  const categories = useMemo(
    () => ["All", ...new Set(GALLERY_IMAGES.map((i) => i.category))],
    []
  );

  const filtered = useMemo(
    () =>
      category === "All"
        ? GALLERY_IMAGES
        : GALLERY_IMAGES.filter((i) => i.category === category),
    [category]
  );

  const shown = filtered.slice(0, visible);
  const lightboxOpen = lightboxIndex !== null;
  const lbImage = lightboxOpen ? filtered[lightboxIndex] : null;

  // infinite scroll: reveal the next batch when the sentinel scrolls into view
  useEffect(() => {
    if (!open || !sentinelRef.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting)
          setVisible((v) => Math.min(v + PAGE_SIZE, filtered.length));
      },
      { root: scrollRef.current, rootMargin: "200px" }
    );
    io.observe(sentinelRef.current);
    return () => io.disconnect();
  }, [open, filtered.length, visible]);

  const pickCategory = (c) => {
    setCategory(c);
    setVisible(PAGE_SIZE);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  };

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

  // keyboard controls while the lightbox is open
  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightboxOpen, closeLightbox, prev, next]);

  // closing the gallery also closes the lightbox
  useEffect(() => {
    if (!open) setLightboxIndex(null);
  }, [open]);

  return (
    <>
      <div
        id="galleryOverlay"
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

          <div className="cat-bar">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                className={c === category ? "cat-btn active" : "cat-btn"}
                onClick={() => pickCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="gallery-scroll" ref={scrollRef}>
          <div className="gallery-grid">
            {shown.map((img, i) => (
              <button
                key={img.id}
                type="button"
                className="gallery-item"
                onClick={() => setLightboxIndex(i)}
              >
                <img src={img.src} alt={`${img.category} ${img.id}`} loading="lazy" />
              </button>
            ))}
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
          src={lbImage ? lbImage.src : undefined}
          alt="Full size preview"
          onClick={() => lbImage && onOpenChat(lbImage)}
        />
      </div>
    </>
  );
}
export default GalleryOverlay