#!/usr/bin/env bash
# Deploy the current feature branch as a Blockcell prototype site.
#
# Flow:
#   1. Save current branch + stash any uncommitted work
#   2. Create a temp deploy branch from where you are
#   3. Merge `blockcell-shims` into it (HashRouter + demo auth + base path support)
#   4. Build with VITE_DEMO_MODE=1 and PROTOFLEET_BASE=/sites/<site>/
#   5. Zip dist + upload via sq curl
#   6. Restore original branch + stash, optionally delete temp branch
#
# Usage:
#   ./scripts/deploy-prototype.sh <site-name> [--keep-deploy-branch]
#
# Example:
#   ./scripts/deploy-prototype.sh proto-fleet-noti

set -euo pipefail

SITE_NAME="${1:-}"
KEEP_BRANCH=0
if [[ "${2:-}" == "--keep-deploy-branch" ]]; then
  KEEP_BRANCH=1
fi

if [[ -z "$SITE_NAME" ]]; then
  echo "Usage: $0 <site-name> [--keep-deploy-branch]" >&2
  echo "Example: $0 proto-fleet-noti" >&2
  exit 1
fi

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

ORIGINAL_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$ORIGINAL_BRANCH" == "main" || "$ORIGINAL_BRANCH" == "blockcell-shims" ]]; then
  echo "Refusing to deploy from $ORIGINAL_BRANCH — switch to a feature branch first." >&2
  exit 1
fi

if ! git rev-parse --verify blockcell-shims >/dev/null 2>&1; then
  echo "Missing 'blockcell-shims' branch. Create it first (see scripts/deploy-prototype.sh header)." >&2
  exit 1
fi

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
DEPLOY_BRANCH="deploy/${ORIGINAL_BRANCH//\//-}-${TIMESTAMP}"
STASH_REF=""

cleanup() {
  set +e
  echo "→ Returning to $ORIGINAL_BRANCH"
  git checkout "$ORIGINAL_BRANCH" >/dev/null 2>&1 || true
  if [[ -n "$STASH_REF" ]]; then
    echo "→ Restoring stash"
    git stash pop "$STASH_REF" >/dev/null 2>&1 || git stash pop >/dev/null 2>&1 || true
  fi
  if [[ "$KEEP_BRANCH" == "0" ]]; then
    echo "→ Deleting temp branch $DEPLOY_BRANCH"
    git branch -D "$DEPLOY_BRANCH" >/dev/null 2>&1 || true
  else
    echo "→ Keeping temp branch $DEPLOY_BRANCH"
  fi
}
trap cleanup EXIT

# 1. Stash uncommitted work
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "→ Stashing uncommitted changes"
  git stash push -u -m "deploy-prototype-$TIMESTAMP" >/dev/null
  STASH_REF="$(git stash list | grep -m1 "deploy-prototype-$TIMESTAMP" | cut -d: -f1)"
fi

# 2. Create temp deploy branch
echo "→ Creating temp branch $DEPLOY_BRANCH from $ORIGINAL_BRANCH"
git checkout -b "$DEPLOY_BRANCH" >/dev/null

# 3. Merge blockcell-shims
echo "→ Merging blockcell-shims"
if ! git merge --no-edit blockcell-shims; then
  echo "" >&2
  echo "Merge conflict with blockcell-shims. Resolve manually, then re-run." >&2
  echo "Temp branch '$DEPLOY_BRANCH' kept for inspection." >&2
  KEEP_BRANCH=1
  exit 1
fi

# 4. Build
echo "→ Building protoFleet with VITE_DEMO_MODE=1, PROTOFLEET_BASE=/sites/$SITE_NAME/"
pushd client >/dev/null
PATH="$REPO_ROOT/bin:$PATH" PROTOFLEET_BASE="/sites/$SITE_NAME/" VITE_DEMO_MODE=1 npm run build:protoFleet
popd >/dev/null

# 5. Zip dist + upload
ZIP_PATH="$REPO_ROOT/.deploy-$SITE_NAME.zip"
rm -f "$ZIP_PATH"
echo "→ Zipping dist/protoFleet"
(cd client/dist/protoFleet && zip -rq "$ZIP_PATH" .)

echo "→ Uploading to Blockcell as '$SITE_NAME'"
RESPONSE="$(sq curl -X POST "https://blockcell.sqprod.co/api/v1/sites/$SITE_NAME/upload" -F "file=@$ZIP_PATH" 2>&1 | tail -1)"
rm -f "$ZIP_PATH"

if echo "$RESPONSE" | grep -q '"success":true'; then
  echo ""
  echo "✓ Deployed: https://blockcell.sqprod.co/sites/$SITE_NAME/"
  echo "  $RESPONSE"
else
  echo ""
  echo "✗ Upload failed: $RESPONSE" >&2
  exit 1
fi
