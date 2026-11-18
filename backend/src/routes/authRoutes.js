import { Router } from "express";
import jwt from "jsonwebtoken";

const router = Router();

router.post("/login", (req, res) => {
  const { username, password } = req.body || {};
  if (typeof username !== "string" || typeof password !== "string" || !username.trim() || !password) {
    return res.status(400).json({ message: "Username dan password wajib diisi." });
  }

  if (username.trim() !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ message: "Username atau password salah." });
  }

  const token = jwt.sign(
    { username: process.env.ADMIN_USERNAME },
    process.env.JWT_SECRET,
    { expiresIn: "8h", subject: process.env.ADMIN_USERNAME }
  );

  return res.json({
    token,
    admin: { username: process.env.ADMIN_USERNAME },
    expiresIn: "8h",
  });
});

export default router;
