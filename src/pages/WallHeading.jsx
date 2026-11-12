/* ------------------------------------------------------------------ */
/*  WALL HEADING (animated slider)                                     */
/* ------------------------------------------------------------------ */
import { useEffect, useRef, useState } from "react";

function WallHeading({ lightOn }) {
  const headingRef = useRef(null);
  const viewportRef = useRef(null);
  const slideRefs = useRef([]);
  const [current, setCurrent] = useState(0);

  const WALL_SLIDES = [
    "Where'd all the time go?",
    "Change is scary",
    "Stay a little longer",
  ];
  // keep the latest lightOn visible to the long-lived listeners below
  const lightOnRef = useRef(lightOn);
  useEffect(() => {
    lightOnRef.current = lightOn;
  }, [lightOn]);

  useEffect(() => {
    const heading = headingRef.current;
    const viewport = viewportRef.current;
    const slides = slideRefs.current.filter(Boolean);
    if (!heading || !viewport || slides.length === 0) return;

    const AUTOPLAY_MS = 4500;
    let cur = 0;
    let busy = false;
    let timer = null;
    let outTimeout = null;

    slides[0].classList.add("is-active");

    function go(dir, target) {
      if (busy || slides.length < 2) return;
      busy = true;
      const next =
        target !== undefined
          ? target
          : (cur + dir + slides.length) % slides.length;
      const out = slides[cur];
      const inn = slides[next];

      // start the incoming slide off-screen without a transition, then animate
      inn.style.transition = "none";
      inn.style.setProperty("--from", dir > 0 ? "70%" : "-70%");
      inn.style.visibility = "visible";
      inn.getBoundingClientRect(); // force reflow
      inn.style.transition = "";

      out.style.setProperty("--from", dir > 0 ? "-70%" : "70%");
      out.classList.remove("is-active");
      out.classList.add("is-leaving");
      inn.classList.add("is-active");

      cur = next;
      setCurrent(next);

      outTimeout = setTimeout(() => {
        out.classList.remove("is-leaving");
        out.style.removeProperty("--from");
        inn.style.removeProperty("--from");
        busy = false;
      }, 680);
    }

    function pause() {
      clearInterval(timer);
      timer = null;
    }
    function restart() {
      pause();
      if (!AUTOPLAY_MS) return;
      timer = setInterval(() => {
        if (lightOnRef.current && !document.hidden) go(1);
      }, AUTOPLAY_MS);
    }

    // keyboard (only while the light is on)
    const onKey = (e) => {
      if (!lightOnRef.current) return;
      if (e.key === "ArrowRight") {
        go(1);
        restart();
      }
      if (e.key === "ArrowLeft") {
        go(-1);
        restart();
      }
    };
    document.addEventListener("keydown", onKey);

    // drag / swipe
    let startX = null;
    let dx = 0;
    const onDown = (e) => {
      if (busy) return;
      startX = e.clientX;
      dx = 0;
      viewport.setPointerCapture(e.pointerId);
      viewport.classList.add("dragging");
      pause();
    };
    const onMove = (e) => {
      if (startX === null) return;
      dx = e.clientX - startX;
      const s = slides[cur];
      s.style.transform = `translateX(${dx}px)`;
      s.style.opacity = Math.max(
        0.15,
        1 - Math.abs(dx) / (viewport.clientWidth * 0.8)
      );
    };
    const endDrag = () => {
      if (startX === null) return;
      const s = slides[cur];
      viewport.classList.remove("dragging");
      s.style.transform = "";
      s.style.opacity = "";
      const moved = dx;
      const limit = Math.min(60, viewport.clientWidth * 0.2);
      startX = null;
      dx = 0;
      if (moved < -limit) go(1);
      else if (moved > limit) go(-1);
      restart();
    };
    viewport.addEventListener("pointerdown", onDown);
    viewport.addEventListener("pointermove", onMove);
    viewport.addEventListener("pointerup", endDrag);
    viewport.addEventListener("pointercancel", endDrag);

    // horizontal trackpad scroll (needs a non-passive listener)
    let wheelLock = false;
    let wheelTimeout = null;
    const onWheel = (e) => {
      if (Math.abs(e.deltaX) < Math.abs(e.deltaY) || Math.abs(e.deltaX) < 20)
        return;
      e.preventDefault();
      if (wheelLock) return;
      wheelLock = true;
      go(e.deltaX > 0 ? 1 : -1);
      restart();
      wheelTimeout = setTimeout(() => {
        wheelLock = false;
      }, 700);
    };
    viewport.addEventListener("wheel", onWheel, { passive: false });

    heading.addEventListener("mouseenter", pause);
    heading.addEventListener("mouseleave", restart);
    restart();

    return () => {
      pause();
      clearTimeout(outTimeout);
      clearTimeout(wheelTimeout);
      document.removeEventListener("keydown", onKey);
      viewport.removeEventListener("pointerdown", onDown);
      viewport.removeEventListener("pointermove", onMove);
      viewport.removeEventListener("pointerup", endDrag);
      viewport.removeEventListener("pointercancel", endDrag);
      viewport.removeEventListener("wheel", onWheel);
      heading.removeEventListener("mouseenter", pause);
      heading.removeEventListener("mouseleave", restart);
      slides.forEach((s) => {
        s.classList.remove("is-active", "is-leaving");
        s.removeAttribute("style");
      });
    };
  }, []);

  return (
    <div
      ref={headingRef}
      className={lightOn ? "wall-heading active" : "wall-heading"}
    >
      <div className="wall-viewport" ref={viewportRef}>
        {WALL_SLIDES.map((text, i) => (
          <div
            key={text}
            className="wall-slide"
            ref={(el) => (slideRefs.current[i] = el)}
          >
            {text}
          </div>
        ))}
      </div>
      <div className="wall-dots">
        {WALL_SLIDES.map((text, i) => (
          <i key={text} className={i === current ? "on" : undefined} />
        ))}
      </div>
    </div>
  );
}
export default WallHeading;