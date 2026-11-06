
import { useState, useEffect } from "react";
import bgImage from "../images/bgimg.png";
import "./Dashboard.css";

const StarterPack = () => {
    const [spotlightActive, setSpotlightActive] = useState(false);
    const [bookOpen, setBookOpen] = useState(false);
    const [uploadedImage, setUploadedImage] = useState(null);

    // Clean up the generated image URL
    useEffect(() => {
        return () => {
            if (uploadedImage) {
                URL.revokeObjectURL(uploadedImage);
            }
        };
    }, [uploadedImage]);

    // Handle image upload
    const handleImageUpload = (e) => {
        const file = e.target.files[0];

        if (file) {
            setUploadedImage(URL.createObjectURL(file));
        }
    };

    return (
        <>
            <div className="scene-container">
                <div className="zoom-wrapper">

                    <img
                        src={bgImage}
                        className="responsive-img"
                        alt="Background scene"
                    />

                    <div
                        className={`spotlight-beam ${spotlightActive ? "active" : ""}`}
                        id="yellowBeam"
                    />

                    <button
                        id="lightSwitch"
                        className="clickable-hotspot"
                        onClick={() => setSpotlightActive((prev) => !prev)}
                        aria-label="Toggle spotlight"
                    />

                    {/* Clickable books area */}
                    <button
                        className="book-hotspot"
                        id="openBook"
                        onClick={() => setBookOpen(true)}
                        aria-label="Open book"
                    />

                    <h1
                        className={`wall-heading ${spotlightActive ? "active" : ""}`}
                        id="wallHeading"
                    >
                        BLAH BLAH BLAH
                    </h1>

                </div>
            </div>

            {/* Book popup */}
            <div
                className={`book-overlay ${bookOpen ? "show" : ""}`}
                id="bookOverlay"
                onClick={(e) => {
                    if (e.target === e.currentTarget) {
                        setBookOpen(false);
                    }
                }}
            >
                <div className="book">

                    <button
                        className="close-book"
                        id="closeBook"
                        onClick={() => setBookOpen(false)}
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

                            <div className="image-area">
                                {uploadedImage && (
                                    <img
                                        id="uploadedImage"
                                        src={uploadedImage}
                                        alt="Uploaded image"
                                    />
                                )}
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

                            <textarea placeholder="Dear diary..." />

                            <span className="page-number">02</span>

                        </div>

                    </div>

                </div>
            </div>
        </>
    );
};

export default StarterPack;
