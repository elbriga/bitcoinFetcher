# Firebase Configuration

This document provides instructions on how to set up a Firebase project and configure it to work with the Bitcoin Price Collector application.

## 1. Project Setup

1.  **Go to the Firebase console:** [https://console.firebase.google.com/](https://console.firebase.google.com/)
2.  **Create a new project:**
    *   Click on **"Add project"**.
    *   Give your project a name (e.g., "btc-price-tracker").
    *   Accept the Firebase terms and click **"Continue"**.
    *   You can disable Google Analytics for this project if you don't need it.
    *   Click **"Create project"**.

## 2. Firestore Database

1.  **Go to the Firestore Database section:**
    *   In the Firebase console, click on **"Build"** in the left-hand menu and then click on **"Firestore Database"**.
2.  **Create a new database:**
    *   Click on **"Create database"**.
    *   Choose **"Start in production mode"**.
    *   Choose a location for your database (e.g., `us-central`).
    *   Click **"Enable"**.

## 3. Service Account

1.  **Go to the Service Accounts section:**
    *   In the Firebase console, click on the gear icon next to **"Project Overview"** and then click on **"Project settings"**.
    *   Click on the **"Service accounts"** tab.
2.  **Generate a new private key:**
    *   Click on **"Generate new private key"**.
    *   A warning will appear. Click on **"Generate key"**.
    *   A JSON file will be downloaded to your computer.

## 4. Configuration

1.  **Rename the downloaded file:**
    *   Rename the downloaded JSON file to `serviceAccountKey.json`.
2.  **Add the file to the project:**
    *   Place the `serviceAccountKey.json` file in the root directory of the project.
    *   **IMPORTANT:** Make sure to add this file to your `.gitignore` file to avoid committing it to your repository.

    ```
    # .gitignore
    serviceAccountKey.json
    ```

## 5. Security Rules

1.  **Go to the Firestore Rules section:**
    *   In the Firebase console, go to the **"Firestore Database"** section and then click on the **"Rules"** tab.
2.  **Update the rules:**
    *   Replace the existing rules with the following:

    ```
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        match /prices/{price} {
          allow read, write: if false; // Deny all public access
        }
      }
    }
    ```

    *   These rules deny all public access to your database. The application will still be able to access the database through the service account.

3.  **Publish the rules:**
    *   Click on **"Publish"**.
