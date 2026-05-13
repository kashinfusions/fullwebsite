# Environment Configuration Guide

## ✅ Quick Start (Local Development)

The `.env` file is already configured for local development:
- PORT: 3000
- Database: Your local MySQL instance
- API URL: http://localhost:3000

Just run: `npm start`

## 🚀 Production Deployment

### Step 1: Copy the Environment Template
```bash
cp .env.example .env.production
```

### Step 2: Update `.env.production` with Production Values
```
NODE_ENV=production
PORT=3000

DB_HOST=your_production_db_host
DB_USER=your_production_db_user
DB_PASSWORD=your_production_db_password
DB_NAME=kashinfusions

API_BASE_URL=https://kashinfusions.com
```

### Step 3: Run with Production Config
```bash
NODE_ENV=production node server.js
```

OR with a specific .env file:
```bash
node -r dotenv/config server.js dotenv_config_path=.env.production
```

## 🔄 Switching Between Environments

### Local to Production (Before Deployment)
1. Update `.env` with production values
2. Test locally: `npm start`
3. Change API_BASE_URL back to localhost for local testing
4. OR create separate `.env.local` for local testing

### Recommended Structure
```
.env              ← Local development (your current setup)
.env.example      ← Template (commit to git)
.env.production   ← Production config (DO NOT commit)
.gitignore        ← Prevents .env files from being committed
```

## 🔗 API Configuration

The frontend uses `api-config.js` which:
- Auto-detects localhost and uses `http://localhost:3000`
- Falls back to the current domain on production
- Can be customized per environment

### How API URLs Work

**Local Development:**
```
http://localhost:3000/classic_candles.html
  → Fetches from http://localhost:3000/products
```

**Production (kashinfusions.com):**
```
https://kashinfusions.com/classic_candles.html
  → Fetches from https://kashinfusions.com/products
```

## 📝 Environment Variables Available

| Variable | Default | Purpose |
|----------|---------|---------|
| `NODE_ENV` | development | Application environment |
| `PORT` | 3000 | Server port |
| `DB_HOST` | localhost | MySQL host |
| `DB_USER` | sylkyla | Database user |
| `DB_PASSWORD` | Gu!doM!sta5466! | Database password |
| `DB_NAME` | kashinfusions | Database name |
| `API_BASE_URL` | http://localhost:3000 | Frontend API URL |

## ⚠️ Security Notes

- **NEVER commit `.env` files** (only `.env.example`)
- `.gitignore` already prevents this
- Rotate database passwords before production
- Use environment variables for all secrets
- Store production `.env` securely (not in git)

## 🧪 Testing Your Configuration

```bash
# Local development
npm start
# Visit http://localhost:3000/classic_candles.html
# Check browser console for "✅ Products loaded"

# Production (when deployed)
# Visit https://kashinfusions.com/classic_candles.html
# Should automatically use production API
```
