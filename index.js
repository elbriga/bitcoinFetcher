const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();

// === CONFIG ===
const DB_FILE = './prices.db';
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
async function fetchBitcoinPrice() {
  const url = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd';
  const res = await axios.get(url);
  return res.data.bitcoin.usd;
}

async function fetchDollarPrice() {
  const url = 'https://api.frankfurter.dev/v1/latest?base=USD&symbols=BRL';
  const res = await axios.get(url);
  return res.data.rates.BRL;
}

// === MAIN JOB ===
async function collectPrices() {
  try {
    const [btcUsd, usdBrl] = await Promise.all([
      fetchBitcoinPrice(),
      fetchDollarPrice()
    ]);

    const timestamp = new Date().toISOString();

    db.run(
      `INSERT INTO prices (timestamp, btc_usd, usd_brl) VALUES (?, ?, ?)`,
      [timestamp, btcUsd, usdBrl]
    );

    console.log(`[${timestamp}] BTC/USD=${btcUsd} | USD/BRL=${usdBrl}`);
  } catch (err) {
    console.error('Erro ao buscar cotações:', err.message);
  }
}

// === START ===
await collectPrices(); // roda imediatamente
setInterval(collectPrices, INTERVAL_MS);
