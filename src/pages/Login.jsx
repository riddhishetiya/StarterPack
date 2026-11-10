
import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/Login.css";

const Login = ({ onLogin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Pass credentials to the parent component
    // where the backend API can be called.
    onLogin?.({ email, password, rememberMe });
  };

  return (
    <div className="login-page">
      {/* Left branding section */}
      <section className="login-visual">
        <div className="visual-content">
          <div className="brand">
            <div className="brand-icon">B.</div>
            <span>Brainstorm</span>
          </div>

          <div className="visual-message">
            <span className="eyebrow">
              THINK TOGETHER. BUILD TOGETHER.
            </span>

            <h1>
              Great ideas
              <br />
              start with a
              <br />
              <span>conversation.</span>
            </h1>

            <p>
              A space where ambitious minds meet,
              challenge ideas, and turn possibilities
              into something real.
            </p>
          </div>

          <div className="idea-card">
            <div className="idea-card-top">
              <span className="live-dot"></span>
              <span>COMMUNITY DISCUSSION</span>
              <span className="idea-members">+ 12 people</span>
            </div>

            <h3>
              What if local businesses could
              go completely digital?
            </h3>

            <div className="idea-tags">
              <span>Technology</span>
              <span>Startups</span>
            </div>

            <div className="idea-card-bottom">
              <div className="avatar-stack">
                <span>R</span>
                <span>A</span>
                <span>S</span>
                <span>M</span>
              </div>
              <span>24 thoughts shared</span>
            </div>
          </div>

          <div className="visual-footer">
            <span>Ideas are better when shared.</span>
            <span>© 2026 Brainstorm</span>
          </div>
        </div>
      </section>

      {/* Right login section */}
      <section className="login-form-section">
        <div className="login-form-container">
          <div className="mobile-brand">
            <div className="brand-icon">B.</div>
            <span>Brainstorm</span>
          </div>

          <div className="form-heading">
            <span className="welcome-label">WELCOME BACK</span>
            <h2>Good to see you again.</h2>
            <p>
              Sign in to continue exploring ideas
              and collaborating with others.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <div className="password-label">
                <label htmlFor="password">Password</label>
                <a href="/forgot-password">
                  Forgot password?
                </a>
              </div>

              <div className="password-input">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="show-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <label className="remember-option">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember me</span>
            </label>

            <button type="submit" className="login-button">
              Sign in <span>→</span>
            </button>
          </form>

          <div className="signup-prompt">
            Don't have an account?
            <Link to="/signup">Create one</Link>
          </div>

          <div className="login-note">
            <span>✦</span>
            Your next big idea could start here.
          </div>
        </div>
      </section>
    </div>
  );
};

export default Login;
