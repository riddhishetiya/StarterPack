import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/Signup.css";

const Signup = ({ onSignup }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [doorStage, setDoorStage] = useState("locked"); // locked | unlocked | lever | swinging | entered
  const [isRattling, setIsRattling] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const triggerRattle = (message) => {
    setError(message || "REGISTRATION FAILED — CHECK DETAILS");
    setIsRattling(false);
    setTimeout(() => setIsRattling(true), 10);
  };

  const playUnlockSequence = (payload) => {
    setDoorStage("unlocked");
    setTimeout(() => setDoorStage("lever"), 220);
    setTimeout(() => setDoorStage("swinging"), 420);
    setTimeout(() => {
      setDoorStage("entered");
      onSignup?.(payload);
    }, 1250);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      triggerRattle("PLEASE ENTER YOUR FULL NAME");
      return;
    }

    if (!email.trim()) {
      triggerRattle("PLEASE ENTER A VALID EMAIL");
      return;
    }

    if (password.length < 8) {
      triggerRattle("PASSCODE MUST BE AT LEAST 8 CHARACTERS");
      return;
    }

    if (password !== confirmPassword) {
      triggerRattle("PASSCODES DO NOT MATCH");
      return;
    }

    const payload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
    };

    if (onSignup) {
      try {
        setLoading(true);
        const result = await onSignup(payload);
        if (result === false || result?.success === false) {
          triggerRattle(result?.message || "ACCESS DENIED — REGISTRATION FAILED");
          setLoading(false);
          return;
        }
        playUnlockSequence(payload);
      } catch (err) {
        setLoading(false);
        triggerRattle(err?.message || "ACCESS DENIED — EMAIL ALREADY IN USE");
      }
      return;
    }

    // Default test fallback
    playUnlockSequence(payload);
  };

  const isUnlocked = doorStage !== "locked";
  const isLeverTurned = ["lever", "swinging", "entered"].includes(doorStage);
  const isSwinging = ["swinging", "entered"].includes(doorStage);

  return (
    <div
      id="doorOverlay"
      className={`door-overlay ${doorStage === "entered" ? "entered" : ""}`}
      aria-modal="true"
      role="dialog"
    >
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <filter id="doorWobble" x="-4%" y="-4%" width="108%" height="108%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.03"
            numOctaves="3"
            seed="9"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="4.8"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>

      <div className="room-plaque">ROOM 001 · NEW KEY ISSUANCE</div>

      <div className="door-frame signup-frame">
        <div
          id="doorLeaf"
          className={`door-leaf ${isSwinging ? "swing-open" : ""} ${
            isRattling ? "rattle" : ""
          }`}
        >
          {/* LEFT SIDE: Taped Paper Field Guide */}
          <aside className="door-paper">
            <div className="washi-tape tape-top-left"></div>
            <div className="washi-tape tape-bottom-right"></div>

            <div className="paper-header">
              <span className="paper-tag">NEW RESIDENT</span>
              <h2>CLAIM YOUR KEY TO THE ROOM</h2>
              <p className="paper-sub">Before you step inside:</p>
            </div>

            <ul className="guide-list">
              <li>
                <span className="guide-icon">🗝️</span>
                <div>
                  <strong>FORGE YOUR PASSCODE</strong>
                  <p>Pick your creator handle and set an 8+ character passcode to lock in your identity.</p>
                </div>
              </li>
              <li>
                <span className="guide-icon">🖼️</span>
                <div>
                  <strong>EXPLORE & CONTRIBUTE</strong>
                  <p>Step into the Gallery of Ideas & hop into live dial-up chatrooms to collaborate.</p>
                </div>
              </li>
              <li>
                <span className="guide-icon">📚</span>
                <div>
                  <strong>DROP UNEXECUTED IDEAS</strong>
                  <p>Pull a spine from the right bookshelf to sketch and share your raw concepts.</p>
                </div>
              </li>
            </ul>

            <div className="paper-footer">no gatekeeping · just raw ideas</div>
          </aside>

          {/* RIGHT SIDE: Frosted Door Window + Lockbox Form */}
          <div className="door-right-col">
            <div className="door-window signup-window">
              <div className="window-glare"></div>
            </div>

            <form id="doorSignupForm" className="lock-box signup-lock-box" onSubmit={handleSubmit}>
              <div className="lock-screws">
                <span></span>
                <span></span>
              </div>

              <div className="lock-status-row">
                <span className={`status-led ${isUnlocked ? "unlocked" : ""}`}></span>
                <span className="status-text">
                  {isUnlocked ? "KEY GRANTED · UNLOCKED" : "FORGE RESIDENT PASSCODE"}
                </span>
              </div>

              <label className="lock-field" htmlFor="signupName">
                <span>FULL NAME</span>
                <input
                  id="signupName"
                  type="text"
                  placeholder="your name or handle"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </label>

              <label className="lock-field" htmlFor="signupEmail">
                <span>EMAIL</span>
                <input
                  id="signupEmail"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </label>

              <label className="lock-field" htmlFor="signupPassword">
                <span>NEW PASSCODE</span>
                <div className="pass-wrap">
                  <input
                    id="signupPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="at least 8 chars..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "🙈" : "👁"}
                  </button>
                </div>
              </label>

              <label className="lock-field" htmlFor="signupConfirm">
                <span>CONFIRM PASSCODE</span>
                <div className="pass-wrap">
                  <input
                    id="signupConfirm"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="repeat passcode..."
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="eye-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? "🙈" : "👁"}
                  </button>
                </div>
              </label>

              <p className="lock-error" role="alert">
                {error}
              </p>

              <button type="submit" className="unlock-btn" disabled={loading}>
                {loading ? "FORGING KEY..." : "FORGE KEY & ENTER ↵"}
              </button>

              <div className="lock-signup-link">
                Already hold a key? <Link to="/login">Unlock door here</Link>
              </div>

              <div className="lock-screws bottom">
                <span></span>
                <span></span>
              </div>
            </form>
          </div>

          {/* Door Handle & Sliding Deadbolt */}
          <div className="door-hardware">
            <div className="deadbolt-housing">
              <div className={`deadbolt-bar ${isUnlocked ? "retracted" : ""}`}></div>
            </div>
            <div className="door-handle-plate">
              <div className={`door-lever ${isLeverTurned ? "turned" : ""}`}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="hallway-floor"></div>
    </div>
  );
};

export default Signup;
