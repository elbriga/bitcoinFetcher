import axios from "axios";
import Database from "better-sqlite3";

// === CONFIG ===
const DB_FILE = "./prices.db";

// === DATABASE ===
const db = new Database(DB_FILE);

// Performance + segurança adequadas para coletor contínuo
db.pragma("journal_mode = WAL");
db.pragma("synchronous = NORMAL");

// Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL UNIQUE,
    btc_usd REAL NOT NULL,
    usd_brl REAL NOT NULL
  )
`);

// === TIME HELPERS ===
function currentMinuteISO(): string {
  const now = new Date();
  now.setSeconds(0, 0);
  return now.toISOString();
}

function msUntilNextMinute(): number {
  const now = new Date();
  return (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
}

// === FETCH FUNCTIONS ===
async function fetchBitcoinPrice(): Promise<number> {
  const res = await axios.get<{
    bitcoin: { usd: number };
  }>(
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
  );

  return res.data.bitcoin.usd;
}

async function fetchDollarPrice(): Promise<number> {
  const res = await axios.get<{
    rates: { BRL: number };
  }>("https://api.frankfurter.dev/v1/latest?base=USD&symbols=BRL");

  return res.data.rates.BRL;
}

// === DB HELPERS ===
const hasPriceStmt = db.prepare(
  `SELECT 1 FROM prices WHERE timestamp = ? LIMIT 1`,
);

function hasPriceForMinute(timestamp: string): boolean {
  return !!hasPriceStmt.get(timestamp);
}

const insertStmt = db.prepare(`
  INSERT INTO prices (timestamp, btc_usd, usd_brl)
  VALUES (?, ?, ?)
`);

function insertPrice(timestamp: string, btcUsd: number, usdBrl: number): void {
  insertStmt.run(timestamp, btcUsd, usdBrl);
}

// === MAIN JOB ===
async function collectPrices(): Promise<void> {
  const timestamp = currentMinuteISO();

  if (hasPriceForMinute(timestamp)) {
    console.log(`[${timestamp}] Já existe cotação, pulando este minuto`);
    return;
  }

  try {
    const [btcUsd, usdBrl] = await Promise.all([
      fetchBitcoinPrice(),
      fetchDollarPrice(),
    ]);

    insertPrice(timestamp, btcUsd, usdBrl);

    console.log(`[${timestamp}] BTC/USD=${btcUsd} | USD/BRL=${usdBrl}`);
  } catch (err) {
    if (err instanceof Error) {
      console.error("Erro ao coletar cotações:", err.message);
    } else {
      console.error("Erro desconhecido:", err);
    }
  }
}

// === SCHEDULER ===
async function start(): Promise<void> {
  await collectPrices();

  setTimeout(() => {
    collectPrices();
    setInterval(collectPrices, 60_000);
  }, msUntilNextMinute());
}

// === SHUTDOWN CLEAN ===
process.on("SIGINT", () => {
  console.log("Encerrando...");
  db.close();
  process.exit(0);
});

// === START ===
start();
