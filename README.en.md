# Taste League Dashboard

English | [简体中文](./README.md)

This dashboard is a minimalist, elegant, and highly secure multi-account management tool tailored for League of Legends players. It strictly adheres to the philosophy of extreme restraint and premium aesthetics ("Taste"), focusing purely on the core experience.

## ✨ Core Highlights

1. **Absolute Restraint in Visual Language**
   - Global deep dark background (intertwined `#0a0a0c` and `#0d1117`), saying goodbye to all cluttered UI elements.
   - Minimalist login interface: Only a single hovering, borderless password input field to isolate snooping.
   - All cards and modals incorporate subtle glow and frosted glass effects (Glassmorphism) for a premium feel.

2. **Silky Micro-interactions**
   - Passwords are strictly masked as `••••••••`. Clicking directly on them, even while masked, accurately copies the true plaintext password.
   - Built-in ultra-smooth feedback animations and top Toast notifications when clicking "Copy" or "Share".

3. **Live Ranked Stats Tracking (Riot Games API)**
   - Deeply integrated with official Riot Games API to automatically fetch and display the latest Solo/Duo and Flex ranks, division, LP, wins, and losses by Riot ID.
   - Supports one-click live refresh per card as well as CLI batch synchronization, with rank data persisted in Cloudflare D1 database.

4. **Military-Grade Data Protection**
   - Utilizes Node.js native `crypto` module with the `AES-256-GCM` algorithm for two-way encryption.
   - No plaintext LoL passwords are saved in the database; only the `IV:Cipher:AuthTag` combination ciphertext is stored.
   - As long as the `ENCRYPTION_KEY` is kept safe, attackers will only see meaningless gibberish even if the database file is accidentally leaked.

5. **Full-Stack Internationalization (i18n)**
   - Natively integrated with `next-intl` for seamless hot-switching between English and Chinese.
   - Smart IP Detection: The system uses Edge computing nodes to automatically switch to Chinese for visitors with specific IPs (CN/TW/HK/MO).

---

## 🚀 Deployment & Configuration

### 1. Environment Setup
After cloning or downloading the project, copy the environment example file and modify the `.env` file to configure the necessary credentials and ports:

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

# Cloudflare D1 Database Configuration (HTTP API credentials)
CLOUDFLARE_ACCOUNT_ID="your-cloudflare-account-id"
CLOUDFLARE_D1_DATABASE_ID="your-cloudflare-d1-database-id"
CLOUDFLARE_API_TOKEN="your-cloudflare-api-token"

# Riot Games Developer API Key (used for live summoner ranked stats lookup)
RIOT_API_KEY="RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### 2. Local Development
After configuring the `.env` file:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# (Optional) Batch synchronize latest ranked stats for all accounts to database
npm run rank:sync
```

### 3. Docker Container Deployment
This project provides a standard `compose.yaml` for containerized deployment:

```bash
docker compose up -d --build
```

After successfully starting, visit `http://localhost:3021` in your browser.

You will be greeted by the system interface. First, you need to click "Create an Account" to register (an email verification code is required). After registering and logging in, you can access the dashboard to manage and share your accounts.

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

## 📖 Related Pages

The project includes complete documentation for open source, privacy, and terms of use:
- [About Project](/en/about)
- [Privacy Policy](/en/privacy)
- [Terms of Use](/en/terms)
- [Contact Us](/en/contact)

---
> 💡 This project is open-sourced under the [MIT License](LICENSE). Feel free to submit an Issue or contribute on [GitHub](https://github.com/alongLFB/league-dashboard)!

