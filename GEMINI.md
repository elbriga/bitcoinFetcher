# Bitcoin Price Collector

## Project Overview

This project is a TypeScript-based application designed to fetch and store cryptocurrency and fiat currency exchange rates. Specifically, it collects the price of Bitcoin in USD and the exchange rate of USD to BRL every minute. The collected data is stored in a local SQLite database.

The application is intended to run as a persistent background service on a Linux system using `systemd`.

### Key Technologies

*   **Language:** TypeScript
*   **Runtime:** Node.js
*   **Execution:** `tsx` for direct TypeScript execution
*   **HTTP Client:** `axios` for making requests to external APIs
*   **Database:** `better-sqlite3` for synchronous SQLite operations

### Architecture

The application consists of a single script (`src/index.ts`) that performs the following actions:

1.  **Database Initialization:** Sets up a SQLite database file (`prices.db`) and creates the necessary `prices` table.
2.  **API Data Fetching:**
    *   Fetches the Bitcoin price in USD from the CoinGecko API.
    *   Fetches the USD to BRL exchange rate from the Frankfurter.dev API.
3.  **Data Storage:** Inserts the fetched prices into the `prices` table with a timestamp for the current minute.
4.  **Scheduling:** A scheduler runs the data collection process once every minute, ensuring that prices are fetched and stored continuously. The scheduler is designed to align with the start of each minute.
5.  **Graceful Shutdown:** The application handles `SIGINT` signals to ensure the database connection is closed properly before the process exits.

## Building and Running

### Development

To run the application in a development environment, you can use the `start` script defined in `package.json`.

**Prerequisites:**

*   Node.js
*   npm

**Installation:**

```bash
npm install
```

**Running:**

```bash
npm start
```

This will start the price collector in your terminal. You can stop it by pressing `Ctrl+C`.

### Production (as a `systemd` service)

The project is designed to be deployed as a `systemd` service. The `scripts/install.sh` script automates this process.

**Deployment Steps (as described in `scripts/install.sh`):**

1.  **Create a dedicated user:**
    ```bash
    sudo useradd -r -s /usr/sbin/nologin btc
    ```
2.  **Place the application files in `/opt/btc-tracker` and set ownership:**
    ```bash
    sudo chown -R btc:btc /opt/btc-tracker/
    ```
3.  **Install dependencies:**
    ```bash
    npm install
    ```
4.  **Copy the service file and reload `systemd`:**
    ```bash
    sudo cp /opt/btc-tracker/config/btc-tracker.service /etc/systemd/system/
    sudo systemctl daemon-reload
    ```
5.  **Enable and start the service:**
    ```bash
    sudo systemctl enable btc-tracker
    sudo systemctl start btc-tracker
    ```

**Service Management:**

*   **Check status:** `systemctl status btc-tracker`
*   **View logs:** `journalctl -u btc-tracker`

## Development Conventions

*   The project uses TypeScript for static typing.
*   The code is written in a modular fashion, with clear separation of concerns for database operations, API fetching, and scheduling.
*   The project uses `better-sqlite3` for its performance benefits and synchronous API, which is suitable for this type of data collector.
*   There are currently no automated tests.
