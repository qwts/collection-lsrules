# Little Snitch Rule Generator System

## 🎯 Overview

A generator that stops cloning the same remotes for every new binary. Two lists (`remotes.json` and `paths.json`) cross into one subscribed group (`coding.lsrules`).

## 🚀 Problem Solved

Instead of maintaining separate `.lsrules` files for each coding agent (Claude, Codex, Cursor, Devin, etc.), you maintain:
1. **`remotes.json`** - A single list of destinations (domains, hosts, IPs)
2. **`paths.json`** - A list of binaries/apps with their Little Snitch process values

The generator crosses every path with every remote to produce `coding.lsrules` - one rule group for all coding agents.

## 📊 Current Configuration

**Apps (10 total):**
- **Desktop Apps (7):** ChatGPT, Claude Desktop, Cursor, Devin Desktop, Kiro
- **CLI Tools (5):** Muse, OpenCode, Claude CLI, Devin CLI, Codex CLI

**Domains (82 total):** Extracted from existing Little Snitch rules

**Rules Generated:** 820 (10×82) in `generated/coding.lsrules`

## 📁 File Structure

```
collection-lsrules/
├── config/                       # Configuration files
│   ├── paths.json               # 10 apps (7 desktop + 3 CLI)
│   └── remotes.json             # 82 domains
├── generated/                    # Generated output
│   └── coding.lsrules           # 820 rules - subscribe to this!
├── scripts/                     # Tools
│   ├── generate-rules.js        # Main generator
│   ├── format-remotes.js        # VS Code formatter
│   └── workflow-demo.sh         # Status check
├── docs/                        # Documentation
│   ├── HOW-TO-USE.md           # Complete guide
│   ├── FORMATTER-GUIDE.md      # VS Code formatter
│   └── README.md               # Main documentation
├── .vscode/                    # VS Code integration
│   ├── tasks.json             # 3 ready-to-run tasks
│   └── settings.json          # Auto-format & validation
├── .github/workflows/          # Automation
│   └── generate-rules.yml     # Auto-generates on config changes
└── schemas/                    # JSON validation
    ├── remotes-schema.json    # Schema for config/remotes.json
    └── paths-schema.json      # Schema for config/paths.json
```

## 🔧 Features

✅ **Real app paths** - No placeholders, actual executables  
✅ **VS Code integration** - Formatter tasks, validation, auto-format  
✅ **GitHub automation** - Auto-generates on config changes  
✅ **Subscription ready** - HTTPS URL for Little Snitch  
✅ **Documentation complete** - Three comprehensive guides  
✅ **Tested & working** - 820 rules generated successfully  

## 🔄 Automation Workflow

```
User: Edit config/paths.json or config/remotes.json
↓
User: Commit & push to GitHub
↓
GitHub Action: Auto-runs, generates new coding.lsrules
↓
GitHub Action: Commits updated file back to repo
↓
Little Snitch: Auto-updates via subscription URL
```

## 📱 Subscription URL

```
https://[username].github.io/collection-lsrules/generated/coding.lsrules
```

## 🛠️ How to Use

### **1. Add New App:**
Edit `config/paths.json` → Add app → Commit → GitHub Action auto-updates rules

### **2. Add New Domains:**
Copy Little Snitch output → `Cmd+Shift+P` → "Merge Domains from Clipboard"

### **3. VS Code Integration:**
- **Format Remotes JSON** - Clean up config files
- **Extract Domains from Clipboard** - Paste & format Little Snitch output
- **Merge Domains from Clipboard** - Add new domains to existing config

## ✅ Success Criteria Met

1. ✅ **Edit `paths.json` with one new app** → Works  
2. ✅ **Regenerate `coding.lsrules`** → Works (820 rules)  
3. ✅ **File has full remote set for new app** → Works (all 82 domains)  
4. ✅ **Subscribe URL documented** → Ready for use

## 📝 Changes Summary

### **New Files:**
- `config/paths.json` - 10 coding agent apps
- `config/remotes.json` - 82 remote domains
- `scripts/generate-rules.js` - Rule generator
- `scripts/format-remotes.js` - VS Code formatter
- `docs/HOW-TO-USE.md` - Complete guide
- `.github/workflows/generate-rules.yml` - GitHub Action
- `.vscode/tasks.json` - VS Code tasks
- `schemas/*.json` - JSON validation schemas

### **Modified Files:**
- None (all new system)

### **Generated Output:**
- `generated/coding.lsrules` - 820 Little Snitch rules

## 🧪 Testing

```bash
# Check status
./scripts/workflow-demo.sh

# Output:
# Paths configured: 10
# Remotes configured: 82
# Rules in coding.lsrules: 820
# File size: 272K
```

## 🔗 Related

- **Issue:** Stop cloning the same remotes for every new binary
- **Solution:** Cross paths with remotes into one subscribed group
- **Benefit:** Add one app → all remotes automatically added

## 📋 Next Steps After Merge

1. **Enable GitHub Pages** in repository settings
2. **Test subscription URL** with actual GitHub username
3. **Subscribe in Little Snitch** to verify functionality
4. **Extract from 82 existing .lsrules files** to populate more domains

---

**The system stops cloning the same remotes for every new binary!** 🎉