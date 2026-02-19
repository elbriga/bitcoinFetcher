# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript Node.js application that collects Bitcoin (BTC/USD) and USD/BRL exchange rates every minute and stores them in Firebase Firestore. It is designed to run as a persistent background service, typically deployed via systemd on Linux.

The application uses:
- **TypeScript** with `tsx` for execution
- **Firebase Admin SDK** for Firestore database operations
- **axios** for HTTP requests to external APIs (CoinGecko, Frankfurter.dev)
- **ESLint** for code linting

## Development Commands

- `npm start` – Run the main collector (`src/index.ts`)
- `npm run consolidate` – Run the consolidation script (not yet implemented, see `src/consolidate.ts`)
- `npm run lint` – Lint all TypeScript files in `src/`

Install dependencies with `npm install`. TypeScript configuration is in `tsconfig.json`.

## Architecture

The entire application logic resides in `src/index.ts`. The file is organized into sections:

1. **Firebase Initialization** – Loads `serviceAccountKey.json` from the project root and initializes the Firestore connection.
2. **Time Helpers** – Functions to compute the current minute (ISO timestamp) and milliseconds until the next minute boundary.
3. **Fetch Functions** – `fetchBitcoinPrice()` (CoinGecko) and `fetchDollarPrice()` (Frankfurter.dev).
4. **Database Helpers** – `hasPriceForMinute()` and `insertPrice()` for Firestore operations on the `prices` collection.
5. **Main Job** – `collectPrices()` fetches both prices, checks for duplicates, and stores them.
6. **Scheduler** – `start()` runs `collectPrices()` at the start of the next minute, then repeats every 60 seconds.

The scheduler aligns with whole minutes to avoid drift. The application handles `SIGINT` for graceful shutdown.

## Configuration

- A **Firebase service account key** is required. Create a `serviceAccountKey.json` file in the project root (see `FIREBASE.md` for detailed setup).
- The `.gitignore` excludes `serviceAccountKey.json`, `node_modules/`, and `prices.db*` (legacy SQLite files).
- The Firestore security rules should deny public access; the application authenticates via the service account.

## Deployment

The `scripts/install.sh` script automates systemd service installation. It assumes the application is placed in `/opt/btc-tracker/` and expects a service unit file at `config/btc-tracker.service`. The script:
- Creates a dedicated `btc` system user
- Installs npm dependencies
- Copies and enables the systemd service

To run manually in production, use `npm start`. For service management: `systemctl status btc-tracker`, `journalctl -u btc-tracker`.

## Notes

- The project previously used SQLite (`better-sqlite3`); the current version uses Firebase Firestore. The `consolidate` script may be intended for data aggregation but is not yet implemented.
- There are no automated tests. Linting follows the TypeScript ESLint recommended configuration with `@typescript-eslint/no-var-requires` disabled.