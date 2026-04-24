# How to apply _skill-patch to blue-agent

## File mapping

```
_skill-patch/security.ts  →  packages/blueagent-skill/src/skills/security.ts
_skill-patch/research.ts  →  packages/blueagent-skill/src/skills/research.ts
_skill-patch/data.ts      →  packages/blueagent-skill/src/skills/data.ts      (NEW)
_skill-patch/earn.ts      →  packages/blueagent-skill/src/skills/earn.ts      (NEW)

_skill-patch/runner.ts    →  packages/blueagent-skill/src/runner.ts
_skill-patch/server.ts    →  packages/blueagent-skill/src/index.ts   (replace existing)
_skill-patch/install.ts   →  packages/blueagent-skill/bin/install.ts (NEW)
```

## Step 1 — Copy files

```bash
SKILL=packages/blueagent-skill

cp _skill-patch/security.ts  $SKILL/src/skills/security.ts
cp _skill-patch/research.ts  $SKILL/src/skills/research.ts
cp _skill-patch/data.ts      $SKILL/src/skills/data.ts
cp _skill-patch/earn.ts      $SKILL/src/skills/earn.ts
cp _skill-patch/runner.ts    $SKILL/src/runner.ts
cp _skill-patch/server.ts    $SKILL/src/index.ts
cp _skill-patch/install.ts   $SKILL/bin/install.ts
```

## Step 2 — Update package.json

```json
{
  "main": "dist/index.js",
  "bin": {
    "@blueagent/skill": "dist/index.js",
    "blueagent-install": "dist/bin/install.js"
  },
  "scripts": {
    "build": "tsc",
    "install-claude": "ts-node bin/install.ts"
  }
}
```

## Step 3 — Build & publish

```bash
cd packages/blueagent-skill
npm run build
npm version patch
npm publish --access public
```

## Step 4 — Test

```bash
# Install into Claude Code
npx @blueagent/skill install --claude

# Set wallet
export WALLET_PRIVATE_KEY=0x...

# Restart Claude Code → 25 tools appear automatically
```
