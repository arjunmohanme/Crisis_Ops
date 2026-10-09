import dotenv from "dotenv";

dotenv.config();

const { default: app } = await import("./app.js");
const { default: connectDB } = await import("./config/db.js");
const { default: Allocation } = await import("./models/Allocation.js");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  // Remove stale unique indexes from older Allocation schema versions.
  await Allocation.syncIndexes();

  app.listen(PORT, () => {
    console.log(`CrisisOps server running on port ${PORT}`);
  });
};

startServer();