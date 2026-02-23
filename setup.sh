#!/bin/bash
# Idempotent setup: safe to run multiple times.
# Run: chmod +x setup.sh && ./setup.sh
set -e

echo "Setting up project..."

# 1. Install dependencies
echo "Installing dependencies..."
npm install || { echo "Error: npm install failed. Fix the error above and try again."; exit 1; }

# 2. Start Supabase (idempotent: already running is OK)
echo "Starting Supabase..."
npx supabase start 2>/dev/null || true
npx supabase status >/dev/null 2>&1 || { echo "Error: Supabase is not running. Start Docker, then run: npx supabase start"; exit 1; }
echo "Supabase is running."

# 3. Extract credentials from env output (KEY=value per line)
STATUS_ENV=$(npx supabase status -o env 2>/dev/null) || true
SUPABASE_URL=$(echo "$STATUS_ENV" | grep '^API_URL=' | cut -d= -f2- | tr -d '\r\n"')
SUPABASE_PUBLISHABLE_KEY=$(echo "$STATUS_ENV" | grep -E '^(ANON_KEY|PUBLISHABLE_KEY)=' | head -1 | cut -d= -f2- | tr -d '\r\n"')
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_PUBLISHABLE_KEY" ]; then
  echo "Error: Could not get API URL or anon key from 'supabase status'. Is Supabase running?"
  exit 1
fi

# 4. Write .env.local
echo "Writing .env.local..."
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$SUPABASE_PUBLISHABLE_KEY
EOF

# 5. Run migrations
echo "Running migrations..."
npx supabase db reset || { echo "Error: Migrations failed. Fix the error above and try again."; exit 1; }

# 6. Done
echo ""
echo "Setup complete! Run 'npm run dev' to start the app."
echo "  http://localhost:3000"