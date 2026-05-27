import jwt from "jsonwebtoken";
import { getDatabaseStatus, isDatabaseConnected } from "../config/db.js";
import Admin from "../models/Admin.js";

export async function adminLogin(req, res, next) {
  try {
    if (!isDatabaseConnected()) {
      const status = getDatabaseStatus();
      return res.status(503).json({
        success: false,
        databaseConnected: false,
        database: status.database,
        retryCount: status.retryCount,
        nextRetryAt: status.nextRetryAt,
        message: "Database temporarily unavailable. Admin login requires MongoDB."
      });
    }

    const { email, password } = req.body;
    const admin = await Admin.findOne({ email: String(email || "").toLowerCase() });
    const ok = admin ? await admin.comparePassword(password) : false;

    if (!admin || !ok) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    const token = jwt.sign({ id: admin._id, email: admin.email, role: admin.role, name: admin.name }, process.env.JWT_SECRET || "dev-secret-change-me", { expiresIn: "8h" });
    res.json({ token, role: admin.role, email: admin.email, name: admin.name });
  } catch (error) {
    next(error);
  }
}

export async function adminMe(req, res) {
  res.json({ user: req.user });
}
