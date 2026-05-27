import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function adminLogin(req, res) {
  const { email, password } = req.body;
  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  const passwordHash = process.env.ADMIN_PASSWORD_HASH || "";
  const devPassword = process.env.ADMIN_PASSWORD || "admin123";
  const ok = passwordHash ? await bcrypt.compare(password || "", passwordHash) : password === devPassword;

  if (email !== adminEmail || !ok) {
    return res.status(401).json({ message: "Invalid admin credentials" });
  }

  const token = jwt.sign({ email, role: "admin" }, process.env.JWT_SECRET || "dev-secret-change-me", { expiresIn: "8h" });
  res.json({ token, role: "admin", email });
}

