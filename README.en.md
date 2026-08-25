# Taste League Dashboard

English | [简体中文](./README.md)

This dashboard is a minimalist, elegant, and highly secure multi-account management and sharing platform tailored for League of Legends players. It strictly adheres to the philosophy of extreme restraint and premium aesthetics ("Taste"), focusing purely on the core experience, ranked tracking, and granular account sharing permissions.

---

## 📸 Screenshots & UI Showcase

### 1. Multi-Account Dashboard (Dashboard Preview)
*Global deep dark aesthetics, frosted glassmorphism cards, live rank & win rate tracking, one-click password copy, and batch multi-select operations.*

![Dashboard Preview](./docs/screenshots/dashboard_preview.png)

### 2. Account Sharing & Secondary Permissions (Share Modal & Quick Select)
*Automatic registered users listing, real-time search & filtering, 1-click recipient selection, and secondary sharing authorization toggle.*

![Share Modal](./docs/screenshots/share_modal.png)

### 3. Grouped Management View (Manage Shared Users)
*Intelligent aggregation by shared recipient, collapsible accounts list, instant reshare permission toggle, and single/batch revocation.*

![Manage Shares](./docs/screenshots/manage_shares.png)

---

## ✨ Core Highlights

### 1. 🛡️ Granular Multi-Tier Sharing & Reshare Permission System
- **Single & Multi-Select Batch Sharing**: Share an individual account directly from its card, or enter "Multi-Select Mode" to batch share multiple accounts to a target recipient in one go.
- **Registered Users Quick Search & Select**: The share modal automatically fetches the system's registered users, supporting real-time filtering by nickname, username, or email for instant 1-click selection.
- **Secondary Sharing Authorization Control (`can_reshare`)**: Account owners can toggle "Allow recipient to reshare" when sharing. Only authorized recipients have permission to reshare the account to third parties.
- **Smart Permission Filtering in Batch Mode**: When batch sharing, the system automatically detects and excludes accounts for which the user lacks reshare permission, enforcing security on both client and server.
- **Grouped "Manage Sharing" Panel**: The management modal intelligently aggregates all shares by recipient. Account owners can toggle reshare permissions, revoke single accounts, or revoke all access with a single click.

### 2. 🌐 Google OAuth 2.0 Sign-In & Account Linking
- **Fast Sign-In & Registration**: Supports one-click sign-in and instant account creation using your Google account.
- **Profile Account Linking**: Bind or unbind your Google account anytime in the Profile settings, enabling dual password and Google authentication.
- **Adaptive Proxy & Origin Handling**: Automatically resolves request origins across environments and supports `HTTPS_PROXY` for local development behind proxies while directly communicating on production VPS instances.

### 3. 🎮 Live Ranked Stats Tracking (Riot Games API)
- **Deep Riot Games API Integration**: Automatically queries summoner Riot IDs to fetch and display the latest Solo/Duo and Flex rank tier badges, LP, win rates, and match statistics.
- **Multi-Level Live Refresh**: Supports on-demand single card refresh as well as CLI batch synchronization (`npm run rank:sync`), with data persisted in Cloudflare D1.

### 4. 🔒 Military-Grade Data Protection (AES-256-GCM)
- **Native Two-Way Encryption**: Uses Node.js native `crypto` module with the `AES-256-GCM` algorithm for hardware-accelerated encryption and decryption.
- **Zero Plaintext Storage**: The database only stores `IV:Cipher:AuthTag` combination ciphertext. Even if the database is exposed, passwords cannot be decrypted without the secret key.

### 5. 🎨 Aesthetic Restraint & Silky Micro-Interactions
- **Deep Dark Aesthetic**: Built on `#0a0a0c` and `#0d1117` dark backgrounds, blended with glassmorphism cards and Hextech neon glows.
- **Password Privacy & 1-Click Copy**: Passwords are masked as `••••••••` by default. Clicking the mask directly copies the true plaintext password with a smooth toast notification.

### 6. 🌍 Full-Stack Internationalization (i18n)
- **Seamless Language Switching**: Native `next-intl` integration for instantaneous hot-switching between English and Chinese.
- **Edge Smart IP Detection**: Edge nodes automatically detect visitor geography (CN/TW/HK/MO) to default to the appropriate locale.

---

## 🚀 Deployment & Configuration

### 1. Environment Setup
After cloning or downloading the project, copy the environment template and modify the `.env` file to configure your credentials:

```bash
cp .env.example .env
```

```env
# [EXTREMELY DANGEROUS ⚠️] 32-byte fixed-length encryption/decryption key (Must be exactly 32 characters; losing this permanently locks all account data)
ENCRYPTION_KEY="0123456789abcdef0123456789abcdef"

# JWT signing secret key
JWT_SECRET="super-secret-jwt-key"

# Email SMTP Configuration (used for sending verification codes during registration)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-smtp-app-password"
SMTP_FROM="admin@your-domain.com" # (Optional) Custom sender email, defaults to SMTP_USER if empty

# Port Configuration
PORT="3021"

# Google OAuth 2.0 Configuration (One-click Google Sign-in / Account Binding)
GOOGLE_CLIENT_ID="xxxxxxxx-xxxxxxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx"

# Application Public Base URL (http://localhost:3021 for local, domain for production, without trailing slash)
NEXT_PUBLIC_APP_URL="https://league-dashboard.alonglfb.com"

# Local Debugging Google OAuth Proxy (Configure only if local environment cannot reach Google APIs directly)
# HTTPS_PROXY="http://127.0.0.1:7890"

# Cloudflare D1 Database Configuration (HTTP API credentials)
CLOUDFLARE_ACCOUNT_ID="your-cloudflare-account-id"
CLOUDFLARE_D1_DATABASE_ID="your-cloudflare-d1-database-id"
CLOUDFLARE_API_TOKEN="your-cloudflare-api-token"

# Riot Games Developer API Key (used for live summoner ranked stats lookup)
RIOT_API_KEY="RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

---

### 2. Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# (Optional) Batch synchronize latest ranked stats for all accounts to database
npm run rank:sync
```

---

### 3. Docker Container Deployment

This project provides a standard `compose.yaml` for containerized deployment:

```bash
docker compose up -d --build
```

After starting, navigate to `http://localhost:3021` in your browser.

You can register a new account (via email verification code) or sign in directly with your Google account to start managing and sharing accounts.

---

### 4. Automated CI/CD Deployment with GitHub Actions

The project includes a built-in GitHub Actions workflow ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)) supporting both push-to-deploy and manual trigger.

#### 1) Configure GitHub Secrets
Navigate to your repository's **Settings** -> **Secrets and variables** -> **Actions**, and add the following Repository secrets:

| Secret Name | Required | Description |
| :--- | :--- | :--- |
| `SERVER_HOST` | Yes | Target server public IP or domain |
| `SERVER_USER` | Yes | SSH login username (e.g. `root`) |
| `SERVER_SSH_KEY` | Yes | SSH private key for passwordless login |
| `SERVER_PORT` | No | SSH port (defaults to `22`) |
| `DOT_ENV` | No | **Full production `.env` file content** (automatically written to the server and reloaded; if omitted, preserves existing server `.env`) |

#### 2) Triggering Deployments
- **Automatic**: Automatically triggered on `git push` to the `master` branch.
- **Manual**: Go to **Actions** -> **Deploy to Server** -> click **Run workflow** in GitHub repository web UI.

---

## 📖 Related Pages

The project includes complete documentation for open source, privacy, and terms of use:
- [About Project](/en/about)
- [Privacy Policy](/en/privacy)
- [Terms of Use](/en/terms)
- [Contact Us](/en/contact)

---
> 💡 This project is open-sourced under the [MIT License](LICENSE). Feel free to submit an Issue or contribute on [GitHub](https://github.com/alongLFB/league-dashboard)!
