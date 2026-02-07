import axios from "axios";
import sqlite3 from "sqlite3";

// === CONFIG ===
const DB_FILE = "./prices.db";
const INTERVAL_MS = 60 * 1000;

// === DATABASE ===
const db = new sqlite3.Database(DB_FILE);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      btc_usd REAL NOT NULL,
      usd_brl REAL NOT NULL
    )
  `);
});

// === FETCH FUNCTIONS ===
async function fetchBitcoinPrice(): Promise<number> {
  const url =
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd";

  const res = await axios.get<{
    bitcoin: { usd: number };
  }>(url);

  return res.data.bitcoin.usd;
}

async function fetchDollarPrice(): Promise<number> {
  const url = "https://api.frankfurter.dev/v1/latest?base=USD&symbols=BRL";

  const res = await axios.get<{
    rates: { BRL: number };
  }>(url);

  return res.data.rates.BRL;
}

// === MAIN JOB ===
async function collectPrices(): Promise<void> {
  try {
    const [btcUsd, usdBrl] = await Promise.all([
      fetchBitcoinPrice(),
      fetchDollarPrice(),
    ]);

    const timestamp = new Date().toISOString();

    db.run(
      `INSERT INTO prices (timestamp, btc_usd, usd_brl) VALUES (?, ?, ?)`,
      [timestamp, btcUsd, usdBrl],
    );

    console.log(`[${timestamp}] BTC/USD=${btcUsd} | USD/BRL=${usdBrl}`);
  } catch (err) {
    if (err instanceof Error) {
      console.error("Erro ao buscar cotações:", err.message);
    } else {
      console.error("Erro desconhecido:", err);
    }
  }
}

// === START ===
collectPrices().then(() => setInterval(collectPrices, INTERVAL_MS));
