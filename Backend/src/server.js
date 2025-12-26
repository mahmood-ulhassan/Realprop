const mongoose = require("mongoose");
const dotenv = require("dotenv");
const app = require("./app");

dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

async function start() {
  try {
    if (!MONGO_URI) {
      throw new Error("MONGO_URI missing in .env");
    }

    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected");

    // Drop the unique index on tasks.number if it exists (to allow reusing numbers from deleted tasks)
    try {
      const Task = mongoose.connection.collection('tasks');
      const indexes = await Task.indexes();
      const numberIndex = indexes.find(idx => idx.name === 'number_1');
      if (numberIndex) {
        await Task.dropIndex('number_1');
        console.log("✅ Dropped unique index on tasks.number");
      }
    } catch (err) {
      // Index might not exist, which is fine
      if (err.code !== 27) { // 27 = IndexNotFound
        console.log("⚠️ Could not drop index (may not exist):", err.message);
      }
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Server start error:", err.message);
    process.exit(1);
  }
}

start();
