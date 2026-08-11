# The Humanity Pledge — MVP+

A pledge-tracking app where people commit to personal acts of kindness, time, or generosity with targets and timeframes, log progress, and contribute to a collective, opt-in total.

## Quick Start

### 1. Clone and install
```bash
git clone https://github.com/ADayWellLived/humanity-pledge-mvp.git
cd humanity-pledge-mvp
npm install
```

### 2. Set up Supabase
- Go to https://supabase.com and create a free account
- Create a new project
- Go to Settings → API
- Copy your Project URL and Anon Key
- Create `.env.local` in the root:
```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

### 3. Set up database
- In Supabase, go to SQL Editor
- Create a new query
- Copy and paste everything from `scripts/schema.sql`
- Run it

### 4. Run locally
```bash
npm run dev
```
Open http://localhost:3000

### 5. Deploy to Vercel
- Push to GitHub (already done)
- Go to https://vercel.com
- Import your GitHub repo
- Add the same `.env.local` variables in Vercel project settings
- Deploy

## What's built
- Authentication (email + password)
- Pledge creation & logging
- Personal dashboard
- Progress calculation

## What's next
- Wall of Goodness
- Following & profiles
- Learn & Shop
