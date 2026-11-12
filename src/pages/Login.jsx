import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/door.css";

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [doorStage, setDoorStage] = useState("locked"); // locked | unlocked | lever | swinging | entered
  const [isRattling, setIsRattling] = useState(false);
  const [error, setError] = useState("");

  const triggerRattle = (message) => {
    setError(message || "ACCESS DENIED — WRONG PASSCODE");
    setIsRattling(false);
    setTimeout(() => setIsRattling(true), 10);
  };

  const playUnlockSequence = (payload) => {
    setDoorStage("unlocked");
    setTimeout(() => setDoorStage("lever"), 220);
    setTimeout(() => setDoorStage("swinging"), 420);
    setTimeout(() => {
      setDoorStage("entered");
      onLogin?.(payload);
    }, 1250);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const payload = { email, password };

    if (onLogin) {
      try {
        const result = await onLogin(payload);
        if (result === false || result?.success === false) {
          triggerRattle(result?.message || "ACCESS DENIED — INVALID CREDENTIALS");
          return;
        }
        playUnlockSequence(payload);
      } catch (err) {
        triggerRattle(err?.message || "ACCESS DENIED — CHECK EMAIL OR PASSCODE");
      }
      return;
    }

    // Local test passcode before backend is wired up
    if (password.trim().toLowerCase() === "starterpack") {
      playUnlockSequence(payload);
    } else {
      triggerRattle("ACCESS DENIED — WRONG PASSCODE");
    }
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

      <div className="room-plaque">ROOM 001 · STARTER PACK</div>

      <div className="door-frame">
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
              <span className="paper-tag">FIELD GUIDE</span>
              <h2>BEFORE YOU WALK IN...</h2>
              <p className="paper-sub">Here’s how the room works:</p>
            </div>

            <ul className="guide-list">
              <li>
                <span className="guide-icon">📚</span>
                <div>
                  <strong>CLICK THE BOOKS</strong>
                  <p>Pull a spine off the right shelf to sketch & drop your own unexecuted ideas.</p>
                </div>
              </li>
              <li>
                <span className="guide-icon">🖼️</span>
                <div>
                  <strong>CLICK THE PAINTINGS</strong>
                  <p>Step into the Gallery of Ideas & hop into live dial-up chatrooms on every piece.</p>
                </div>
              </li>
              <li>
                <span className="guide-icon">💡</span>
                <div>
                  <strong>FLIP THE LIGHT SWITCH</strong>
                  <p>
                    Turn on the spotlight to reveal the <b>Top 3 Ideas of the Month</b> on the wall.
                  </p>
                </div>
              </li>
            </ul>

            <div className="paper-footer">no gatekeeping · just raw ideas</div>
          </aside>

          {/* RIGHT SIDE: Frosted Door Window + Lockbox */}
          <div className="door-right-col">
            <div className="door-window">
              <div className="window-glare"></div>
            </div>

            <form id="doorLoginForm" className="lock-box" onSubmit={handleSubmit}>
              <div className="lock-screws">
                <span></span>
                <span></span>
              </div>

              <div className="lock-status-row">
                <span className={`status-led ${isUnlocked ? "unlocked" : ""}`}></span>
                <span className="status-text">
                  {isUnlocked ? "UNLOCKED" : "DOOR LOCKED"}
                </span>
              </div>

              <label className="lock-field" htmlFor="email">
                <span>EMAIL</span>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </label>

              <label className="lock-field" htmlFor="password">
                <span>PASSCODE</span>
                <div className="pass-wrap">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="enter key..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
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

              <p className="lock-error" role="alert">
                {error}
              </p>

              <button type="submit" className="unlock-btn">
                UNLOCK DOOR ↵
              </button>

              <div className="lock-signup-link">
                No key yet? <Link to="/signup">Get one here</Link>
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

export default Login;
