# 英雄联盟极简面板 (Taste League Dashboard)

[English](./README.en.md) | 简体中文

本面板是一个极简、优雅且具备强安全性（本地自用）的英雄联盟多账号管理工具。它的设计严格恪守极致克制与高级感（"Taste"）的理念，专注于最纯粹的核心体验。

## ✨ 核心亮点

1. **绝对克制的视觉语言**
   - 全局深度暗黑背景（`#0a0a0c` 与 `#0d1117` 交织），告别所有冗杂的界面元素。
   - 登录界面极简化：只有一行悬空的无边框密码输入框，隔绝窥探。
   - 所有卡片及弹窗融入细微的发光与磨砂玻璃动效（Glassmorphism），极致高级感。

2. **丝滑的微交互 (Micro-interactions)**
   - 密码严格遮罩 `••••••••`，即使处于遮罩状态下直接点击，亦能精准复制出真实的明文密码。
   - 点击“复制”或“分享”时，内置极致平滑的反馈动效和顶部 Toast 通知。

3. **国防级数据落地保护**
   - 采用 `Node.js` 原生 `crypto` 模块的 `AES-256-GCM` 算法进行双向加密。
   - 数据库中不保存任何明文 LOL 密码，只有 `IV:Cipher:AuthTag` 组合密文落地。
   - 只要对应的 `ENCRYPTION_KEY` 妥善保存，即使数据库文件意外泄露，攻击者也只能看见无意义的乱码。

4. **全链路国际化 (i18n)**
   - 原生集成 `next-intl`，支持中英文双语无缝热切换。
   - 智能 IP 检测：系统能够通过 Edge 边缘计算节点，根据访客 IP（CN/TW/HK/MO）自动为您切换至中文模式。

---

## 🚀 部署与启动配置

### 1. 环境准备
克隆或下载项目后，复制环境示例文件，并按需修改 `.env` 环境变量文件中的凭证信息和端口：

```bash
cp .env.example .env
```

```env
# [极度危险⚠️] 32字节固定长度的加解密密钥 (务必为32个字符，如丢失会导致全部账号数据永久锁定)
ENCRYPTION_KEY="0123456789abcdef0123456789abcdef"

# JWT 签名安全密钥
JWT_SECRET="super-secret-jwt-key"

# 邮件 SMTP 配置 (用于注册时发送验证码)
SMTP_HOST="smtp.qq.com"
SMTP_PORT="465"
SMTP_SECURE="true"
SMTP_USER="your-email@qq.com"
SMTP_PASS="your-smtp-auth-code"
SMTP_FROM="admin@your-domain.com" # (可选) 自定义发件人邮箱，如果不填默认使用 SMTP_USER

# 运行端口配置
APP_PORT="3000"
DB_PORT="5432"

# 数据库连接独立变量
DB_USER="postgres"
DB_PASSWORD="your_secure_password"
DB_NAME="league_dashboard"

# PostgreSQL 数据库连接地址 (用于本地运行, Docker Compose 部署会自动覆盖这个变量)
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/${DB_NAME}?schema=public"
```

### 2. 一键部署 (推荐)
本项目已提供完善的 `compose.yaml`，内置了 PostgreSQL 数据库和 Next.js 应用容器化部署：

```bash
docker compose up -d --build
```
> Docker 将会自动下载数据库，构建应用镜像，同步数据表结构并在后台运行。

成功启动后，在浏览器访问 `http://localhost:3000`（如果你修改了 `.env` 里的 `APP_PORT`，请替换为对应的端口）。

### 3. 本地手动启动 (仅开发)
如果您不希望使用 Docker，在配置好本地 PostgreSQL 并修改 `.env` 后：

```bash
# 安装依赖
npm install

# 推送数据库结构
npx prisma db push

# 启动开发服务器
npm run dev
```

您将进入系统页面，首先需要点击“Create an Account”注册一个您的账户（注册时需收取邮件验证码），注册登录后即可进入控制台开始管理和分享您的账号。

## 📖 相关页面

项目包含了完整的开源、隐私以及使用协议说明：
- [关于项目](/about)
- [隐私政策](/privacy)
- [使用条款](/terms)
- [联系我们](/contact)

---
> 💡 本项目基于 [MIT 协议](LICENSE) 开源，欢迎在 [GitHub](https://github.com/alongLFB/league-dashboard) 提交 Issue 或参与共建！
