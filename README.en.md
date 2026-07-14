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

3. **Military-Grade Data Protection**
   - Utilizes Node.js native `crypto` module with the `AES-256-GCM` algorithm for two-way encryption.
   - No plaintext LoL passwords are saved in the database; only the `IV:Cipher:AuthTag` combination ciphertext is stored.
   - As long as the `ENCRYPTION_KEY` is kept safe, attackers will only see meaningless gibberish even if the database file is accidentally leaked.

4. **Full-Stack Internationalization (i18n)**
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
SMTP_SECURE="true"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-smtp-app-password"
SMTP_FROM="admin@your-domain.com" # (Optional) Custom sender email, defaults to SMTP_USER if empty

# Port Configuration
APP_PORT="3000"
DB_PORT="5432"

# Database variables
DB_USER="postgres"
DB_PASSWORD="your_secure_password"
DB_NAME="league_dashboard"

# PostgreSQL database connection URL (Used for local running; Docker Compose will override this)
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/${DB_NAME}?schema=public"
```

### 2. One-Click Deployment (Recommended)
This project provides a complete `compose.yaml` for containerized deployment of both the PostgreSQL database and the Next.js application:

```bash
docker compose up -d --build
```
> Docker will automatically download the database, build the application image, sync the database schema, and run it in the background.

After successfully starting, visit `http://localhost:3000` in your browser (if you modified `APP_PORT` in `.env`, replace 3000 with your configured port).

### 3. Local Manual Start (Development Only)
If you prefer not to use Docker, after setting up your local PostgreSQL and `.env`:

```bash
# Install dependencies
npm install

# Push database schema
npx prisma db push

# Start development server
npm run dev
```

You will be greeted by the system interface. First, you need to click "Create an Account" to register (an email verification code is required). After registering and logging in, you can access the dashboard to manage and share your accounts.

## 📖 Related Pages

The project includes complete documentation for open source, privacy, and terms of use:
- [About Project](/en/about)
- [Privacy Policy](/en/privacy)
- [Terms of Use](/en/terms)
- [Contact Us](/en/contact)

---
> 💡 This project is open-sourced under the [MIT License](LICENSE). Feel free to submit an Issue or contribute on [GitHub](https://github.com/alongLFB/league-dashboard)!
