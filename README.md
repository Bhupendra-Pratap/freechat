# 💬 FreeChatCU

Anonymous campus chat for university students.  
Pick a nickname → choose your department → chat freely.

---

## Features

- 🔐 **Nickname + password login** (auto-registers on first use)
- 🏫 **15 department tags** — each message shows your dept
- 💬 **Global chat** — everyone sees everyone's messages
- ⚡ **Live updates** — polls every 3 seconds, no refresh needed
- 🎭 **Fully anonymous** — no email, no real name, ever
- 📱 **Mobile-friendly** responsive layout

---

## Deploy to Vercel (5 minutes)

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "init freechatcu"
# create a repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/freechatcu.git
git push -u origin main
```

### Step 2 — Import to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repo
3. Framework: **Next.js** (auto-detected)
4. Click **Deploy** — wait ~1 minute

### Step 3 — Add KV Storage

1. In your Vercel project → **Storage** tab → **Create Database**
2. Choose **KV** → give it a name → **Create & Continue**
3. Click **Connect to Project** → select your project → **Connect**
4. Vercel will automatically add all KV environment variables

### Step 4 — Redeploy

In your Vercel project → **Deployments** → click the **three dots** on the latest deployment → **Redeploy**.

That's it! Your app is live. 🎉

---

## Run Locally

```bash
npm install

# Create a .env.local from Vercel KV credentials
# (copy from your Vercel project → Storage → your KV → .env.local tab)
cp .env.example .env.local
# fill in the KV values

npm run dev
# → http://localhost:3000
```

---

## Customize

### Change departments
Edit the `DEPARTMENTS` array in `app/department/page.tsx`.

### Change message history limit
In `lib/kv.ts`, adjust the `limit` default in `getMessages()` and the `ltrim` cap in `addMessage()`.

### Change poll interval
In `app/chat/page.tsx`, adjust the `setInterval(fetchMessages, 3000)` value (milliseconds).

---

## Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 14 (App Router) |
| Runtime | Node.js (Vercel Edge optional) |
| Storage | Vercel KV (Redis) |
| Auth | bcryptjs + session tokens |
| Styling | Pure CSS custom properties |
| Fonts | Bebas Neue · Space Mono · DM Sans |
| Deploy | Vercel (free tier) |

---

## Security Notes

- Passwords are hashed with **bcrypt** (10 rounds)
- Sessions expire after **7 days**
- Messages are capped at **500** (oldest auto-purged)
- Nicknames are **case-insensitive** (stored lowercase)
- Input is **sanitised** — max 500 chars per message

---

Made with ❤️ for campus life.
