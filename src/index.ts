import axios from "axios";
import admin, { ServiceAccount } from "firebase-admin";
import serviceAccountJson from "../serviceAccountKey.json" with { type: "json" };

const serviceAccount = serviceAccountJson as ServiceAccount;
const HTTP_TIMEOUT_MS = 15000;

// === CONFIG ===
// ATENÇÃO: Configure o Firebase antes de executar
// Crie um arquivo "serviceAccountKey.json" na raiz do projeto
// com as credenciais de sua conta de serviço do Firebase.

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// === TIME HELPERS ===
function currentMinuteISO(): string {
  const now = new Date();
  now.setSeconds(0, 0);
  return now.toISOString();
}

function minutesAgoISO(minutes: number): string {
  const date = new Date(Date.now() - minutes * 60 * 1000);
  date.setSeconds(0, 0);
  return date.toISOString();
}

function msUntilNextMinute(): number {
  const now = new Date();
  return (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
}

// === FETCH FUNCTIONS ===
async function fetchWithTimeout<T = unknown>(url: string): Promise<T> {
  const response = await axios.get<T>(url, { timeout: HTTP_TIMEOUT_MS });
  return response.data;
}

async function fetchBitcoinPrice(): Promise<number> {
  const data = await fetchWithTimeout<{
    bitcoin: { usd: number };
  }>(
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
  );

  return data.bitcoin.usd;
}

async function fetchDollarPrice(): Promise<number> {
  const data = await fetchWithTimeout<{
    rates: { BRL: number };
  }>("https://api.frankfurter.dev/v1/latest?base=USD&symbols=BRL");

  return data.rates?.BRL ?? 0.0;
}

// === DB HELPERS ===
async function hasPriceForMinute(timestamp: string): Promise<boolean> {
  const doc = await db.collection("prices").doc(timestamp).get();
  return doc.exists;
}

async function insertPrice(
  timestamp: string,
  btcUsd: number,
  usdBrl: number,
): Promise<void> {
  await db.collection("prices").doc(timestamp).set({
    btc_usd: btcUsd,
    usd_brl: usdBrl,
  });
}

async function deletePricesOlderThan24h(): Promise<void> {
  const cutoff = minutesAgoISO(24 * 60); // 24 hours ago
  const pricesRef = db.collection("prices");
  const query = pricesRef.where(admin.firestore.FieldPath.documentId(), '<', cutoff).limit(100);

  try {
    let deletedCount = 0;
    while (true) {
      const snapshot = await query.get();
      if (snapshot.empty) {
        break;
      }
      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      deletedCount += snapshot.docs.length;
      console.log(`Deleted ${snapshot.docs.length} old price entries`);
      // If we got fewer docs than limit, we're done
      if (snapshot.docs.length < 100) {
        break;
      }
    }
    if (deletedCount > 0) {
      console.log(`Total deleted ${deletedCount} prices older than 24h`);
    }
  } catch (err) {
    console.error("Error deleting old prices:", err instanceof Error ? err.message : err);
  }
}

// === MAIN JOB ===
async function collectPrices(): Promise<void> {
  const timestamp = currentMinuteISO();

  if (await hasPriceForMinute(timestamp)) {
    console.log(`[${timestamp}] Já existe cotação, pulando este minuto`);
    await deletePricesOlderThan24h();
    return;
  }

  try {
    const [btcUsd, usdBrl] = await Promise.all([
      fetchBitcoinPrice(),
      fetchDollarPrice(),
    ]);

    await insertPrice(timestamp, btcUsd, usdBrl);
    await deletePricesOlderThan24h();

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
  // O SDK do Firebase Admin gerencia as conexões automaticamente
  process.exit(0);
});

// === START ===
start();
