
/* ------------------------------------------------------------------ */
/*  BOOK (diary) OVERLAY                                               */
/* ------------------------------------------------------------------ */
import { useEffect, useState, useRef, useLayoutEffect } from "react";
import {diaryInputServices} from "../services/diaryInputServices.js"

function BookOverlay({ open, onClose }) {
  const [imageSrc, setImageSrc] = useState("");
  const [title, setTitle] = useState("")
  const [desc, setDesc] = useState("")

  //Handling the Title Input ( Auto fitting title )
  const ref = useRef(null);

  useLayoutEffect(() => {
    const title = ref.current;
    if (!title) return;

    const LINES = 3;
    const LH = 1.05;
    const MIN = 6;
    const RATIO = 0.6;
    const STEP = 0.5;

    const mirror = document.createElement("div");
    document.body.appendChild(mirror);

    const setSize = (s) => {
      title.style.fontSize = s + "px";
      title.style.letterSpacing = s * 0.09 + "px";
    };

    const textHeight = (s) => {
      const cs = getComputedStyle(title);
      const m = mirror.style;
      m.cssText =
        "position:absolute;left:-9999px;top:0;visibility:hidden;" +
        "box-sizing:border-box;white-space:pre-wrap;" +
        "overflow-wrap:anywhere;word-break:break-word;";
      m.width = title.clientWidth + "px";
      m.fontFamily = cs.fontFamily;
      m.fontWeight = cs.fontWeight;
      m.paddingLeft = cs.paddingLeft;
      m.paddingRight = cs.paddingRight;
      m.fontSize = s + "px";
      m.letterSpacing = s * 0.09 + "px";
      m.lineHeight = LH;
      mirror.textContent = (title.value || " ") + "\u200b";
      return mirror.offsetHeight;
    };

    const fitTitle = () => {
      const boxH = title.clientHeight;
      if (!boxH) return;
      const MAX = Math.floor(boxH / (LINES * LH));
      let size = MAX;
      while (textHeight(size) > size * LH * 1.5 && size > MAX * RATIO)
        size -= STEP;
      while (textHeight(size) > boxH && size > MIN) size -= STEP;
      setSize(size);
      title.scrollTop = 0;
    };

    const onKeyDown = (e) => {
      if (e.key === "Enter") e.preventDefault();
    };
    const onInput = () => {
      if (/\n/.test(title.value))
        title.value = title.value.replace(/\s*\n+\s*/g, " ");
      fitTitle();
    };

    title.addEventListener("keydown", onKeyDown);
    title.addEventListener("input", onInput);
    const ro = new ResizeObserver(fitTitle);
    ro.observe(title);
    window.addEventListener("resize", fitTitle);
    fitTitle();

    return () => {
      title.removeEventListener("keydown", onKeyDown);
      title.removeEventListener("input", onInput);
      ro.disconnect();
      window.removeEventListener("resize", fitTitle);
      mirror.remove();
    };
  }, []);


  // free the blob URL when it's replaced / on unmount
  useEffect(() => {
    return () => {
      if (imageSrc) URL.revokeObjectURL(imageSrc);
    };
  }, [imageSrc]);

  const handleSave = async(e) => {
    console.log("Stick : ",imageSrc)
    const response = await diaryInputServices({title , desc , imageSrc})
    console.log(response)
    // return response;
  };

  return (
    <div
      className={open ? "book-overlay show" : "book-overlay"}
      id="bookOverlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="book">
        <button className="close-book" id="closeBook" onClick={onClose}>
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
              onClick={handleSave}
            >
              stick
            </button>
            <div className="image-area">
              <img
                id="uploadedImage"
                src={imageSrc || undefined}
                alt="Uploaded image"
                style={imageSrc ? { display: "block" } : undefined}
              />
            </div>

            <input
              type="file"
              id="imageUpload"
              accept="image/*"
              hidden
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) setImageSrc(URL.createObjectURL(file));
              }}
            />

            <label htmlFor="imageUpload" className="pencil-btn" title="Add image">
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
              ref={ref}
              className="title-input"
              placeholder="Title"
              rows={3}
              maxLength={60}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              placeholder="Your vision(no essays, show us that it was YOUR idea)"
              className="descriptionArea"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
            <span className="page-number">02</span>
          </div>
        </div>
      </div>
    </div>
  );
}
export default BookOverlay;