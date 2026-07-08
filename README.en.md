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
After cloning or downloading the project, create (or modify) a `.env` file in the root directory and configure the necessary credentials as follows:

```env
# Your master password for logging into the dashboard (set randomly, verified on login)
ADMIN_SECRET_KEY="my-secret-admin-password"

# [EXTREMELY DANGEROUS ⚠️] 32-byte fixed-length encryption/decryption key (Must be exactly 32 characters; losing this permanently locks all account data)
ENCRYPTION_KEY="0123456789abcdef0123456789abcdef"

# JWT signing secret key
JWT_SECRET="super-secret-jwt-key"

# PostgreSQL database connection URL
DATABASE_URL="postgresql://username:password@localhost:5432/league_dashboard?schema=public"
```

### 2. Sync Database Schema
Once you have configured the real `DATABASE_URL`, run the following Prisma migration command to push the schema to the database:

```bash
npx prisma db push
```

### 3. Install Dependencies & Start Server
If you haven't installed the project dependencies, execute `npm install` first. Then start the development server with the following command:

```bash
npm run dev
```

After successfully starting, visit `http://localhost:3000` in your browser.
You will be greeted by a pure input interface. Enter the `ADMIN_SECRET_KEY` you set in `.env` and press Enter to access the dashboard and manage your accounts.

## 📖 Related Pages

The project includes complete documentation for open source, privacy, and terms of use:
- [About Project](/en/about)
- [Privacy Policy](/en/privacy)
- [Terms of Use](/en/terms)
- [Contact Us](/en/contact)

---
> 💡 This project is open-sourced under the [MIT License](LICENSE). Feel free to submit an Issue or contribute on [GitHub](https://github.com/alongLFB/league-dashboard)!
