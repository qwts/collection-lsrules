# Little Snitch Rule Generator for Coding Agents

A generator that stops cloning the same remotes for every new binary. Two lists (`remotes.json` and `paths.json`) cross into one subscribed group (`coding.lsrules`).

## What This Does

Instead of maintaining separate `.lsrules` files for each coding agent (Claude, Codex, Cursor, Devin, etc.), you maintain:
1. **`remotes.json`** - A single list of destinations (domains, hosts, IPs)
2. **`paths.json`** - A list of binaries/apps with their Little Snitch process values

The generator crosses every path with every remote to produce `coding.lsrules` - one rule group for all coding agents.

## 🚀 Quick Start (Already Configured!)

### **Current Status (Ready to Use):**
- **10 Apps configured:** 7 desktop + 3 CLI tools (ChatGPT, Claude, Cursor, Devin, Kiro, Muse, OpenCode, Claude CLI, Devin CLI, Codex CLI)
- **82 Domains configured:** Extracted from your Little Snitch rules
- **820 Rules generated:** `generated/coding.lsrules` (10×82)
- **VS Code integration:** Formatter tasks ready

### **1. Subscribe in Little Snitch:**
```
https://[your-github-username].github.io/collection-lsrules/generated/coding.lsrules
```
*(Replace `[your-github-username]` with your GitHub username)*

### **2. Add New App:**
Edit `config/paths.json` → Add app → Commit → GitHub Action auto-updates rules

### **3. Add New Domains:**
Copy Little Snitch output → `Cmd+Shift+P` → "Merge Domains from Clipboard"

### **4. Check Status:**
```bash
./scripts/workflow-demo.sh
```

## Files

### `paths.json` - Binaries/Applications
```json
[
  {
    "name": "Claude",
    "displayName": "Claude Code",
    "process": "/Applications/Claude.app/Contents/MacOS/Claude",
    "description": "Anthropic's coding agent"
  }
]
```

**Process format options:**
- Absolute path: `/Applications/App.app/Contents/MacOS/App`
- Bundle identifier: `identifier.TEAMID/com.example.app`
- See existing `.lsrules` files for examples

### `remotes.json` - Remote Destinations
```json
{
  "description": "Remote destinations for coding agents",
  "domains": [
    "anthropic.com",
    "claude.ai",
    "github.com"
  ],
  "hosts": [
    "192.168.1.100"
  ],
  "notes": "Extracted from ~82 existing Little Snitch rules"
}
```

## Setup for Chris

1. **Extract remotes from your ~82 existing rules**:
   ```bash
   # For each .lsrules file you have:
   npm run extract -- brave.lsrules
   npm run extract -- chrome.lsrules
   # etc...
   ```

2. **Combine all unique domains** into `remotes.json` → `domains` array

3. **Update paths with real values** in `paths.json`:
   - Check actual bundle identifiers using:
     ```bash
     defaults read "/Applications/Claude.app/Contents/Info.plist" CFBundleIdentifier
     ```
   - Or find Team ID in existing rules

4. **First generation**:
   ```bash
   npm run generate
   ```

## Automation

### GitHub Action
- Auto-runs when `paths.json` or `remotes.json` changes
- Commits updated `coding.lsrules` back to repo
- Works on push to `main` branch

### Manual Generation
```bash
npm run generate           # Generate coding.lsrules
npm run extract -- file.lsrules  # Extract remotes from existing file
```

## GitHub Pages Subscription

**For private repositories:**
- Requires **GitHub Pro** (personal) or **GitHub Team/Enterprise** (organizations)
- Private Pages sites are only accessible to repository collaborators
- If you don't have the required plan, use local file subscription

**Subscribe URL:**
```
https://[your-github-username].github.io/collection-lsrules/generated/coding.lsrules
```

**Alternative local subscription:**
1. Clone repo locally
2. Point Little Snitch to: `file:///path/to/collection-lsrules/generated/coding.lsrules`
3. Regenerate when configs change

## Adding a New Binary

1. Add one object to `paths.json`:
   ```json
   {
     "name": "new-app",
     "displayName": "New Coding Agent",
     "process": "/Applications/NewApp.app/Contents/MacOS/NewApp",
     "description": "Description here"
   }
   ```

2. Commit the change
3. GitHub Action auto-regenerates `coding.lsrules` with full remote set for the new app

## Project Structure

```
collection-lsrules/
├── config/                       # CONFIGURATION - Edit these
│   ├── paths.json               # 7 real apps (ChatGPT, Claude, Cursor, Devin, Kiro, Muse, OpenCode)
│   └── remotes.json             # 82 domains (extracted from Little Snitch)
├── generated/                    # GENERATED OUTPUT
│   └── coding.lsrules           # 2,460 rules (30×82) - subscribe to this!
├── scripts/                     # TOOLS
│   ├── generate-rules.js        # Main generator: npm run generate
│   ├── format-remotes.js       # VS Code formatter: npm run format-remotes
│   └── workflow-demo.sh        # Quick demo: ./scripts/workflow-demo.sh
├── docs/                        # DOCUMENTATION
│   ├── README.md              # Main documentation (you are here)
│   ├── HOW-TO-USE.md          # Complete step-by-step guide
│   └── FORMATTER-GUIDE.md    # VS Code formatter guide
├── .vscode/                    # VS CODE INTEGRATION
│   ├── tasks.json             # Ready-to-run formatter tasks
│   ├── launch.json            # Debug configurations
│   └── settings.json          # Auto-format & validation
├── schemas/                    # JSON VALIDATION
│   ├── remotes-schema.json    # Schema for config/remotes.json
│   └── paths-schema.json      # Schema for config/paths.json
├── .github/workflows/          # AUTOMATION
│   └── generate-rules.yml     # Auto-generates on config changes
├── package.json                # npm scripts
├── OVERVIEW.md                 # Folder structure cheat sheet
├── .gitignore                  # Git ignore rules
└── (root)                      # Original per-app rules (untouched)
    ├── brave.lsrules
    ├── chrome.lsrules
    ├── vscode.lsrules
    └── ...
```

## Notes

- **No Cloudflare**: This is a simple static generator
- **No production scanner**: Doesn't find binaries on your Mac
- **No collapsing arrays**: Domains vs hosts vs IPs kept separate per spec
- **Compatible**: Output matches existing `.lsrules` format exactly

## Verification

**Done when:**
1. Edit `paths.json` with one new app
2. Regenerate `coding.lsrules`
3. File has the full remote set for that app **and** for every other path
4. Subscribe URL works in Little Snitch

## License

MIT
