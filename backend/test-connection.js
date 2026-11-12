/**
 * test-connection.js
 *
 * A standalone test case to verify your MongoDB Atlas setup is ACTUALLY working —
 * not just that the IP Access List looks right. This checks four separate things:
 *
 *   1. Can we connect to the cluster at all? (network access + credentials correct)
 *   2. Can we WRITE a document? (database user has write permission)
 *   3. Can we READ it back? (confirms the write really persisted)
 *   4. Can we DELETE it? (cleans up after itself, leaves your DB untouched)
 *
 * USAGE:
 *   1. Copy this file into your backend/ folder (next to server.js)
 *   2. Make sure backend/.env has a valid MONGODB_URI
 *   3. Run:  node test-connection.js
 *
 * A green "ALL TESTS PASSED" at the end means your Atlas setup is genuinely
 * ready to use. Any red FAIL tells you exactly which step is broken.
 */

require("dotenv").config();
const mongoose = require("mongoose");

const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const BOLD = "\x1b[1m";

function pass(msg) {
  console.log(`${GREEN}✔ PASS${RESET} — ${msg}`);
}
function fail(msg, detail) {
  console.log(`${RED}✘ FAIL${RESET} — ${msg}`);
  if (detail) console.log(`  ${RED}${detail}${RESET}`);
}
function info(msg) {
  console.log(`${YELLOW}ℹ${RESET} ${msg}`);
}

// Temporary schema — only used for this test, never touches your real collections
const PingSchema = new mongoose.Schema(
  { note: String, testedAt: Date },
  { collection: "_connection_test" }
);

async function run() {
  console.log(`${BOLD}\nMongoDB Atlas Connection Test${RESET}`);
  console.log("================================\n");

  const uri = process.env.MONGODB_URI;
  let allPassed = true;

  // --- Test 0: env var present ---
  if (!uri) {
    fail(
      "MONGODB_URI is not set",
      "Add MONGODB_URI=... to your backend/.env file (see .env.example)."
    );
    process.exit(1);
  }
  pass("MONGODB_URI is set in environment");

  // --- Test 1: connect ---
  const start = Date.now();
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    pass(`Connected to MongoDB Atlas (${Date.now() - start}ms)`);
  } catch (err) {
    fail("Could not connect to MongoDB", err.message);
    console.log("\nCommon causes:");
    console.log("  - IP Access List doesn't include 0.0.0.0/0 (or your current IP)");
    console.log("  - Wrong username/password in the connection string");
    console.log("  - Cluster is still provisioning (wait a minute and retry)");
    console.log("  - Typo in the connection string (missing database name, etc.)");
    process.exit(1);
  }

  const Ping = mongoose.model("ConnectionTest", PingSchema);
  let createdId = null;

  // --- Test 2: write ---
  try {
    const doc = await Ping.create({ note: "connection test", testedAt: new Date() });
    createdId = doc._id;
    pass("Wrote a test document (database user has write permission)");
  } catch (err) {
    fail("Could not write a document", err.message);
    allPassed = false;
  }

  // --- Test 3: read ---
  if (createdId) {
    try {
      const found = await Ping.findById(createdId);
      if (found) {
        pass("Read the test document back (write actually persisted)");
      } else {
        fail("Document not found after writing", "Write may not have persisted correctly.");
        allPassed = false;
      }
    } catch (err) {
      fail("Could not read the document back", err.message);
      allPassed = false;
    }
  }

  // --- Test 4: delete (cleanup) ---
  if (createdId) {
    try {
      await Ping.deleteOne({ _id: createdId });
      pass("Deleted the test document (cleanup successful, no leftover data)");
    } catch (err) {
      fail("Could not delete the test document", err.message);
      info(`You may need to manually remove document ${createdId} from the '_connection_test' collection.`);
      allPassed = false;
    }
  }

  await mongoose.disconnect();

  console.log("\n================================");
  if (allPassed) {
    console.log(`${GREEN}${BOLD}ALL TESTS PASSED${RESET} — your MongoDB Atlas setup is ready to use.\n`);
    process.exit(0);
  } else {
    console.log(`${RED}${BOLD}SOME TESTS FAILED${RESET} — see details above.\n`);
    process.exit(1);
  }
}

run().catch((err) => {
  fail("Unexpected error", err.message);
  process.exit(1);
});