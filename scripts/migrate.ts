import sqlite3 from "sqlite3";
import admin, { ServiceAccount } from "firebase-admin";
import serviceAccountJson from "../serviceAccountKey.json" with { type: "json" };

const serviceAccount = serviceAccountJson as ServiceAccount;

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Path to your SQLite database file
const SQLITE_DB_PATH = process.argv[2] || "./database.sqlite";

console.log(`Starting migration from ${SQLITE_DB_PATH}...`);

const sqliteDb = new sqlite3.Database(SQLITE_DB_PATH, sqlite3.OPEN_READONLY);

// Using standard callback instead of Promise wrapper
sqliteDb.all("SELECT * FROM transactions", async (err, rows) => {
  if (err) {
    console.error("Error reading SQLite:", err.message);
    process.exit(1);
  }

  console.log(`Found ${rows.length} rows to migrate.`);

  // Individual inserts instead of batching
  for (const row of rows) {
    console.log("ROW: " + row);
    /*
    if (row.timestamp && typeof row.btc_usd === 'number' && typeof row.usd_brl === 'number') {
      await db.collection("prices").doc(row.timestamp).set({
        btc_usd: row.btc_usd,
        usd_brl: row.usd_brl,
        migrated_at: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`Migrated: ${row.timestamp}`);
    } else {
      console.warn(`Skipping invalid row: ${JSON.stringify(row)}`);
    }
    */
  }

  sqliteDb.close();
  console.log("Migration completed successfully.");
});
