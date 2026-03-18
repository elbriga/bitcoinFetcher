import sqlite3 from "sqlite3";
import admin, { ServiceAccount } from "firebase-admin";
import serviceAccountJson from "../serviceAccountKey.json" with { type: "json" };

const serviceAccount = serviceAccountJson as ServiceAccount;

type TransactionRow = {
  id: number;
  type: string; // ajuste se for number
  from: string;
  to: string;
  amount: number;
  price: number;
  timestamp: string;
};

const user_id = process.argv[2];
if (user_id == undefined) {
  console.log("Digite o ID do usuario!");
  process.exit(1);
}

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Path to your SQLite database file
const SQLITE_DB_PATH = "btc_trainer.db";

console.log(`Starting migration from ${SQLITE_DB_PATH}...`);

const sqliteDb = new sqlite3.Database(SQLITE_DB_PATH, sqlite3.OPEN_READONLY);

// Using standard callback instead of Promise wrapper
sqliteDb.all("SELECT * FROM transactions", async (err, rows) => {
  if (err) {
    console.error("Error reading SQLite:", err.message);
    process.exit(1);
  }

  console.log(`Found ${rows.length} rows to migrate.`);

  const transactionsRef = db
    .collection("users")
    .doc(user_id)
    .collection("transactions");
  const snapshot = await transactionsRef.get();
  for (const doc of snapshot.docs) {
    await doc.ref.delete();
  }
  console.log(`Deleted ${snapshot.size} OLD transactions`);

  // Individual inserts instead of batching
  for (const row of rows as TransactionRow[]) {
    console.dir(row);

    await db
      .collection("users")
      .doc(user_id)
      .collection("transactions")
      .add(row);

    console.log(`Migrated: ${row["id"]}`);
  }

  sqliteDb.close();
  console.log("Migration completed successfully.");
});
