import jwt from "jsonwebtoken";

export default function requireAuth(req, res, next) {
  const authorization = req.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return res.status(401).json({ message: "Silakan login sebagai admin." });
  }

  let decoded;
  try {
    decoded = jwt.verify(match[1], process.env.JWT_SECRET);
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "Sesi admin tidak valid atau sudah berakhir. Silakan login kembali." });
    }
    return next(error);
  }

  if (typeof decoded === "string" || typeof decoded.sub !== "string") {
    return res.status(401).json({ message: "Token admin tidak valid. Silakan login kembali." });
  }

  req.admin = { username: decoded.sub };
  return next();
}
