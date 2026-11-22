
import jwt from "jsonwebtoken";

const authenticateToken = (req, res, next) => {
  try {
    // 1. Get JWT from HTTP-only cookie
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        message: "Authentication required"
      });
    }

    // 2. Verify JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // 3. Attach user information to request
    req.user = decoded;

    // 4. Allow request to continue
    next();

  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }
};

export default authenticateToken;
