import dotenv from "dotenv";
import readline from "readline";
import bcrypt from "bcryptjs";
import connectDB from "../config/db.js";
import User from "../models/User.js";

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askQuestion = (question) => {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
};

const createAdmin = async () => {
  try {
    await connectDB();

    const name = await askQuestion("Admin name: ");
    const email = await askQuestion("Admin email: ");
    const password = await askQuestion("Admin password: ");

    const existingAdmin = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (existingAdmin) {
      console.log("A user with this email already exists.");
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: "Admin",
      isActive: true,
      isBlocked: false,
      isFieldVerifier: false,
    });

    console.log("Admin account created successfully.");
  } catch (error) {
    console.error(`Admin creation failed: ${error.message}`);
  } finally {
    rl.close();
    process.exit();
  }
};

createAdmin();