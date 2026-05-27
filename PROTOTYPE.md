# Proto Fleet — Fork Prototype Strategy

This file lives on the `blockcell-shims` branch only. It documents how this
fork (`dylanwidick-eng/proto-fleet`) is used as a prototype / design
environment — **not** for upstream-bound feature work.

## Why this exists

The fork serves two purposes that pull in opposite directions:

1. **Build a feature locally** with the full Docker stack, as close to
   `block/proto-fleet` production behavior as possible. Code on these
   branches should be PR-clean — if a real engineer picks it up, no demo or
   hosting noise should come along.
2. **Share that feature** as a clickable prototype on Blockcell (static
   hosting, no backend). That requires shims: a demo-mode auth bypass, a
   HashRouter switch, base-path configuration, etc.

These two needs live on separate branches and are stitched together only at
deploy time.

## Branch roles

| Branch | Purpose |
|---|---|
| `main` | Tracks upstream `block/proto-fleet`. Don't commit here. |
| `proto/<feature>` (or any feature branch) | Day-to-day work. **Pure feature code, no demo shims.** Runs against the local Docker stack like normal. |
| `blockcell-shims` | Long-lived. Holds env-var-gated shims that make a static build work on Blockcell. Periodically rebase onto upstream `main`. |
| `deploy/<feature>-<timestamp>` | Throwaway. Created by the deploy script — merges `blockcell-shims` into a snapshot of your feature, builds, uploads. |

## The hard rule

**Never commit demo / hosting changes to a feature branch.**

Feature branches must stay clean enough that someone could review them or PR
them to upstream without seeing any demo-mode noise. If you find yourself
editing one of these files for hosting purposes, you're on the wrong branch:

- `client/vite.config.ts` (base path)
- `client/src/protoFleet/api/useLogin.ts` (auth bypass)
- `client/src/protoFleet/router.tsx` (router type / basename)
- `client/src/protoFleet/features/auth/pages/Auth/Auth.tsx` (post-login redirect)
- `scripts/deploy-prototype.sh` (the deploy script itself)

These changes belong on `blockcell-shims`.

## Deploy a feature to Blockcell

From your feature branch:

```bash
# Pull in the deploy script (only needs to happen once per fresh branch)
git checkout blockcell-shims -- scripts/deploy-prototype.sh

# Deploy
./scripts/deploy-prototype.sh proto-fleet-<feature>
```

The script:
1. Stashes any uncommitted work.
2. Creates a temp `deploy/<feature>-<timestamp>` branch from your current commit.
3. Merges `blockcell-shims` into it.
4. Builds with `VITE_DEMO_MODE=1` and `PROTOFLEET_BASE=/sites/<site>/`.
5. Zips `client/dist/protoFleet` and uploads via `sq curl`.
6. Returns you to your original branch with your stash restored.
7. Deletes the temp branch (pass `--keep-deploy-branch` to keep it).

After deploy, the script file should not be committed on the feature branch.
If it's still showing in `git status`, run:

```bash
rm scripts/deploy-prototype.sh
```

(It still exists on `blockcell-shims` and can be re-pulled.)

## Handing code off to engineering

When a feature is ready to share with a real engineer:

- Verify the feature branch is clean of any demo shims: `git diff main --stat`
  should not list any of the files in the "hard rule" section above.
- The branch should run end-to-end against the local Docker stack with no
  `VITE_DEMO_MODE` or `PROTOFLEET_BASE` env vars.
- Open a normal PR (against `block/proto-fleet`) or share the branch link.
  None of the hosting infrastructure travels with it.

## Working with collaborators

This fork is set up so multiple designers can prototype against the same
baseline. The fork owner adds collaborators via the GitHub repo settings;
once added, they can push branches directly.

### Branch naming

Use `proto/<initials>/<feature>` for personal feature branches:

- `proto/dw/notifications`
- `proto/jl/curtailment`
- `proto/jl/curtailment-v2`

This makes ownership scannable in `git branch -r` and prevents collisions
when two people prototype overlapping ideas.

### Shared branches

| Branch | Who edits |
|---|---|
| `main` | Tracks upstream `block/proto-fleet`. Don't push. |
| `blockcell-shims` | **Shared.** PR-review recommended — changes here affect every designer's deploys. Don't push directly without a heads-up. |
| `proto/<initials>/...` | Owned by that designer; others rebase/branch off only with their go-ahead. |

### Onboarding a new designer

1. **Get added as a collaborator** on the fork (ask the fork owner).
2. **Clone** the fork:
   ```bash
   git clone https://github.com/dylanwidick-eng/proto-fleet.git
   cd proto-fleet
   ```
3. **Activate Hermit** for the pinned toolchain:
   ```bash
   . ./bin/activate-hermit
   ```
4. **Install Docker Desktop** (on macOS/Windows). Enable host networking:
   Settings → Resources → Network → Enable host networking.
5. **Read this doc first.** `PROTOTYPE.md` (this file, on `blockcell-shims`)
   is the contract — branch hygiene matters here.
6. **Run the stack locally** to verify setup:
   ```bash
   just dev
   ```
   Browser: http://localhost:5173 — should boot a real login page against
   the Docker-backed fleet API.
7. **Branch off `main`** with the naming convention above, then iterate.

### Keeping in sync with upstream

When upstream `block/proto-fleet/main` moves forward:

```bash
git fetch origin
git checkout main && git merge --ff-only origin/main
git checkout blockcell-shims && git rebase main
git push fork blockcell-shims --force-with-lease   # if shims branch was rebased
```

Coordinate the `blockcell-shims` rebase with collaborators since a force-push
will require them to reset their local copy.

## For LLM agents

If you're working in this fork as an agent:

1. **Check the current branch before committing.** If you're on a feature
   branch and a change is for hosting/demo purposes, stop and ask the user
   to move to `blockcell-shims` first.
2. **Run `git diff --stat HEAD` before staging.** If any file in the
   "hard rule" section is modified for demo reasons, that change belongs on
   `blockcell-shims`, not the feature branch.
3. **Don't introduce new env-var-gated demo logic on feature branches.**
   Feature branches are upstream-shaped. The gating lives on the shims branch.
4. **When the user asks to "deploy to Blockcell" or "share on Blockcell",**
   the entire flow is `scripts/deploy-prototype.sh` — don't reinvent it.
5. **Periodic maintenance**: when upstream `main` moves significantly,
   `blockcell-shims` should be rebased onto it so shims stay applicable.
