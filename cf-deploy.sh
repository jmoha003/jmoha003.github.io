#!/usr/bin/env bash
# Build and deploy to Cloudflare Pages. Requires `npx wrangler login` once.
set -euo pipefail
cd "$(dirname "$0")"
PROJECT=joshitmohanty
# Token can live in .cf-token (gitignored) instead of the environment,
# so it never lands in shell history or the repo.
if [ -z "${CLOUDFLARE_API_TOKEN:-}" ] && [ -f .cf-token ]; then
  CLOUDFLARE_API_TOKEN=$(tr -d "[:space:]" < .cf-token)
  export CLOUDFLARE_API_TOKEN
fi
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
