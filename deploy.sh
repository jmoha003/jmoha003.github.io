#!/usr/bin/env bash
# Build and publish the site to the gh-pages branch that GitHub Pages serves.
set -euo pipefail
cd "$(dirname "$0")"
npm run build
TMP=$(mktemp -d)
cp -R dist/. "$TMP/"
touch "$TMP/.nojekyll"
SHA=$(git rev-parse --short HEAD)
cd "$TMP"
git init -q -b gh-pages
git config user.name "Joshit Mohanty"
git config user.email "jmoha003@odu.edu"
git add -A
git commit -q -m "Deploy site build from $SHA"
git remote add origin https://github.com/jmoha003/jmoha003.github.io.git
git push -f -q origin gh-pages
cd - >/dev/null
rm -rf "$TMP"
gh api -X POST repos/jmoha003/jmoha003.github.io/pages/builds >/dev/null
echo "Deployed $SHA. Pages build requested; live in about a minute."
