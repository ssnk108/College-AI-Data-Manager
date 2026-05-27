import dotenv from "dotenv";
import { connectDB } from "../src/config/db.js";
import Admin from "../src/models/Admin.js";

dotenv.config();

async function main() {
  const name = process.env.ADMIN_NAME || "Admin";
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required in backend/.env");
  }

  await connectDB();
  const existing = await Admin.findOne({ email: email.toLowerCase() });
  if (existing) {
    existing.name = name;
    existing.password = password;
    await existing.save();
    console.log(`Updated admin: ${email}`);
  } else {
    await Admin.create({ name, email, password, role: "admin" });
    console.log(`Created admin: ${email}`);
  }
  process.exit(0);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
