#!/usr/bin/env bash
# Build and deploy to Cloudflare Pages. Requires `npx wrangler login` once.
set -euo pipefail
cd "$(dirname "$0")"
PROJECT=joshitmohanty
npm run build
if ! npx wrangler pages project list 2>/dev/null | grep -q "$PROJECT"; then
  echo "Creating Pages project '$PROJECT'..."
  npx wrangler pages project create "$PROJECT" --production-branch main
fi
npx wrangler pages deploy dist --project-name "$PROJECT" --branch main --commit-dirty=true
echo
echo "Deployed. If the custom domain is not attached yet, run:"
echo "  npx wrangler pages domain add $PROJECT joshitmohanty.com"
echo "  npx wrangler pages domain add $PROJECT www.joshitmohanty.com"
