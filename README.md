# 英雄联盟极简面板 (Taste League Dashboard)

本面板是一个极简、优雅且具备强安全性（本地自用）的英雄联盟多账号管理工具。它的设计严格恪守极致克制与高级感（"Taste"）的理念，专注于最纯粹的核心体验。

## ✨ 核心亮点

1. **绝对克制的视觉语言**
   - 全局深度暗黑背景（`#000000` 与 `#09090b` 交织），告别所有冗杂的界面元素。
   - 登录界面极简化：只有一行悬空的无边框密码输入框，隔绝窥探。

2. **丝滑的微交互 (Micro-interactions)**
   - 点击“账号”或“密码”信息时，告别粗鲁的全局提示框。系统会静默地通过淡入淡出动效，将图标暂时切换为成功勾选状态（Check），随后自动复原，全程极致丝滑。
   - 密码严格遮罩 `••••••••`，即使处于遮罩状态下直接点击，亦能精准复制出真实的明文密码，极大减少多余操作。

3. **国防级数据落地保护**
   - 采用 `Node.js` 原生 `crypto` 模块的 `AES-256-GCM` 算法进行双向加密。
   - 数据库中不保存任何明文 LOL 密码，只有 `IV:Cipher:AuthTag` 组合密文落地。
   - 只要对应的 `ENCRYPTION_KEY` 妥善保存，即使数据库文件意外泄露，攻击者也只能看见无意义的乱码。

---

## 🚀 部署与启动配置

### 1. 环境准备
克隆或下载项目后，在根目录下创建（或修改） `.env` 环境变量文件，并按如下格式配置必需的凭证信息：

```env
# 您的面板登录主密码（随意设定，登录系统时验证）
ADMIN_SECRET_KEY="my-secret-admin-password"

# [极度危险⚠️] 32字节固定长度的加解密密钥 (务必为32个字符，如丢失会导致全部账号数据永久锁定)
ENCRYPTION_KEY="0123456789abcdef0123456789abcdef"

# JWT 签名安全密钥
JWT_SECRET="super-secret-jwt-key"

# PostgreSQL 数据库连接地址
DATABASE_URL="postgresql://username:password@localhost:5432/league_dashboard?schema=public"
```

### 2. 同步数据库结构
当您配置好真实的 `DATABASE_URL` 之后，运行以下 Prisma 迁移指令将表结构推送到数据库中：

```bash
npx prisma db push
```

### 3. 安装依赖与启动服务
如果您尚未安装项目依赖，请先执行 `npm install`。然后通过以下命令启动开发环境服务器：

```bash
npm run dev
```

启动成功后，在浏览器访问 `http://localhost:3000`。
您将面对一个纯净的输入框界面，输入您在 `.env` 中设定的 `ADMIN_SECRET_KEY` 并按下回车，即可进入控制台开始管理您的账号。
