
import { useState } from "react";
import { Link } from "react-router-dom";
import "./Signup.css";

const Signup = ({ onSignup }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };



  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (formData.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!agreeTerms) {
      setError("Please accept the terms and conditions.");
      return;
    }

    try {
      setLoading(true);

      await onSignup({
        name: formData.fullName,
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

    } catch (error) {
      console.error("Signup error:", error);
      setError(error.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="signup-page">

      {/* LEFT BRANDING SECTION */}
      <section className="signup-visual">
        <div className="signup-visual-content">

          <div className="signup-brand">
            <div className="signup-brand-icon">B.</div>
            <span>Brainstorm</span>
          </div>

          <div className="signup-message">
            <span className="signup-eyebrow">
              YOUR IDEAS DESERVE A COMMUNITY
            </span>

            <h1>
              Don't just
              <br />
              have ideas.
              <br />
              <span>Grow them.</span>
            </h1>

            <p>
              Join a community of curious minds.
              Share your ideas, find collaborators,
              and build something meaningful together.
            </p>
          </div>

          <div className="signup-highlight">
            <div className="highlight-icon">✦</div>
            <div>
              <h3>Every big thing starts somewhere.</h3>
              <p>Make your somewhere a community.</p>
            </div>
          </div>

          <div className="signup-visual-footer">
            <span>Think. Share. Create.</span>
            <span>© 2026 Brainstorm</span>
          </div>

        </div>
      </section>

      {/* RIGHT SIGNUP SECTION */}
      <section className="signup-form-section">
        <div className="signup-form-container">

          <div className="signup-mobile-brand">
            <div className="signup-brand-icon">B.</div>
            <span>Brainstorm</span>
          </div>

          <div className="signup-heading">
            <span className="signup-welcome">
              GET STARTED
            </span>

            <h2>Create your account.</h2>

            <p>
              Start sharing ideas and connecting with
              people who think like you.
            </p>
          </div>

          <form onSubmit={handleSubmit}>

            <div className="signup-input-group">
              <label htmlFor="fullName">Full name</label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={handleChange}
                autoComplete="name"
                required
              />
            </div>

            <div className="signup-input-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                placeholder="Choose a username"
                value={formData.username}
                onChange={handleChange}
                autoComplete="username"
                minLength={3}
                required
              />
            </div>

            <div className="signup-input-group">
              <label htmlFor="signupEmail">Email address</label>
              <input
                id="signupEmail"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </div>

            <div className="signup-input-group">
              <label htmlFor="signupPassword">Password</label>

              <div className="signup-password-wrapper">
                <input
                  id="signupPassword"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  className="signup-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="signup-input-group">
              <label htmlFor="confirmPassword">
                Confirm password
              </label>

              <div className="signup-password-wrapper">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  className="signup-password-toggle"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <label className="signup-terms">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => {
                  setAgreeTerms(e.target.checked);
                  setError("");
                }}
              />

              <span>
                I agree to the <a href="/terms">Terms of Service</a>
                {" "}and <a href="/privacy">Privacy Policy</a>.
              </span>
            </label>

            {error && (
              <p className="signup-error" role="alert">
                {error}
              </p>
            )}
            {success && (
              <p className="signup-success" role="status">
                {success}
              </p>
            )}

            <button
              type="submit"
              className="signup-submit"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create account"}
              {!loading && <span>→</span>}
            </button>

          </form>

          <div className="signup-login-prompt">
            Already have an account?
            <Link to="/login">Sign in</Link>
          </div>

          <div className="signup-note">
            <span>✦</span>
            A community for ideas that matter.
          </div>

        </div>
      </section>

    </div>
  );
};

export default Signup;
