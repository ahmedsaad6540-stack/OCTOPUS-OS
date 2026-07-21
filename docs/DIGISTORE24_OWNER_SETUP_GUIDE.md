# Digistore24 Owner Setup Guide

This guide is intended for the **System Administrator / Workspace Owner** who is responsible for securely configuring the Digistore24 API integration in OCTOPUS OS.

## Security Preflight

Before entering your API Key, ensure that the environment is secure.

> [!CAUTION]
> Your API key gives programmatic access to your Digistore24 affiliate account. Never store the API Key in plaintext in any source control (Git), `.env` files that are committed, or diagnostic logs.

Ensure that the Node.js server has the `CREDENTIAL_ENCRYPTION_KEY` environment variable set to a secure, 64-character hex string (32 bytes). This key is used by the `SecretsManager` to encrypt your Digistore24 API credentials at rest (using AES-256-GCM).
If this key is missing, the API server will refuse to start in a `production` environment.

## Generating the API Key (Read-Only)

1. Log into your [Digistore24 Account](https://www.digistore24.com).
2. Go to **Settings > Account > API Keys**.
3. Click **New API Key**.
4. Configure the key:
   - **Access Rights**: Select **Read-Only** access. OCTOPUS OS does not require Full Access to generate tracking links or import products manually.
   - **IP Whitelist**: (Optional but Recommended) If your OCTOPUS OS server has a static outbound IP address, enter it here. Do not configure this if your deployment uses dynamic IPs (e.g., Vercel edge functions or un-pinned serverless hosts).
5. Click **Save** and copy the generated API Key.

## Connecting to OCTOPUS OS

1. Open your OCTOPUS OS dashboard.
2. Navigate to **Affiliate Networks** (Sidebar).
3. Select the **Connections** tab.
4. Select **Digistore24** from the list.
5. Enter your **Affiliate ID** (your Digistore24 username/identifier).
6. Enter the **API Key** you copied earlier.
7. Click **Save Credentials**.
   - The key is immediately encrypted before being stored in the `affiliate_connections` table.
8. Click **Test Connection**.
   - The system will perform a basic handshake. If successful, the status will change to **● Verified**.

## Troubleshooting

- **Invalid Credentials**: Double-check that there are no trailing spaces in your API Key or Affiliate ID.
- **Connection Refused**: If you configured IP restriction on Digistore24, ensure the server's outbound IP matches exactly.
- **Demo Mode**: If you see mocked data, ensure `VITE_AFFILIATE_DEMO_MODE=false` in your frontend environment.
