# How to Use the Little Snitch Rule Generator

## 🎯 Quick Start (5 Minutes)

### **Step 1: Subscribe in Little Snitch**
```
https://[your-github-username].github.io/collection-lsrules/generated/coding.lsrules
```
*(Replace `[your-github-username]` with your actual GitHub username)*

### **Step 2: Add a New App**
Edit `config/paths.json` and add:
```json
{
  "name": "my-app",
  "displayName": "My App",
  "process": "/Applications/MyApp.app/Contents/MacOS/MyApp",
  "description": "Description here"
}
```

### **Step 3: Commit & Auto-Generate**
```bash
git add config/paths.json
git commit -m "Add MyApp"
git push
```
GitHub Action will auto-generate new rules with all 82 domains for your new app.

---

## 📁 Project Structure Overview

```
collection-lsrules/
├── config/                    # EDIT THESE
│   ├── paths.json           # Supported harness process inventory
│   └── remotes.json         # 82 domains (from your Little Snitch)
├── generated/                # AUTO-GENERATED
│   └── coding.lsrules       # 2,460 rules (30×82) - subscribe to this!
├── scripts/                  # TOOLS
│   ├── generate-rules.js    # Main generator
│   ├── format-remotes.js    # VS Code formatter
│   └── workflow-demo.sh     # Quick demo
├── docs/                    # GUIDES
│   ├── README.md           # Main documentation
│   ├── HOW-TO-USE.md       # You are here
│   └── FORMATTER-GUIDE.md  # VS Code formatter guide
└── .vscode/                # VS CODE INTEGRATION
    ├── tasks.json         # Ready-to-run tasks
    └── settings.json      # Auto-format & validation
```

---

## 🛠️ Complete Workflow

### **Phase 1: Initial Setup (Done!)**
✅ **Paths configured:** 7 real apps from your Little Snitch rules  
✅ **Remotes configured:** 82 domains extracted and formatted  
✅ **Rules generated:** 2,460 rules (30 processes × 82 domains)
✅ **VS Code integration:** Formatter tasks ready

### **Phase 2: Adding More Apps**
1. **Find app executable path:**
   ```bash
   # For .app bundles
   /Applications/AppName.app/Contents/MacOS/AppName
   
   # For CLI tools
   which tool-name
   ```

2. **Add to `config/paths.json`:**
   ```json
   {
     "name": "app-slug",
     "displayName": "App Name",
     "process": "/path/to/executable",
     "description": "What this app does"
   }
   ```

3. **Commit & push** → GitHub Action auto-generates new rules

### **Phase 3: Adding More Domains**
1. **Copy Little Snitch output** to clipboard
2. **Run VS Code task:** `Cmd+Shift+P` → "Tasks: Run Task" → "Merge Domains from Clipboard"
3. **Or terminal:** `pbpaste | npm run merge-remotes`
4. **Commit changes** → Rules auto-update

---

## 🔧 Current Configuration

### **Supported harness processes (30 total):**

The inventory includes Claude Code/Desktop, Codex CLI/Desktop, GitHub Copilot,
Cursor, Devin CLI/Desktop, Muse, Google Antigravity CLI/Desktop/IDE, Cline,
Factory Droid, Goose, Grok Build, Hermes, Kiro IDE and all Kiro CLI processes,
OpenCode CLI/Desktop, Pi, Warp, Amp, and Aider.

DeepSeek, Qwen Code, and ZCode are intentionally excluded.

CLI paths use `~` as a portable placeholder. `npm run generate` expands it to
the current home directory. To generate rules for another local account, set
`LSRULES_HOME`, for example:

```bash
LSRULES_HOME=/Users/user npm run generate
```

### **Domains (82 total):**
- Agent domains: `agentclientprotocol.com`, `anthropic.com`, `claude.ai`, etc.
- AI platforms: `chatgpt.com`, `openai.com`, `devin.ai`, etc.
- Developer tools: `github.com`, `npmjs.org`, `docker.com`, etc.
- Cloud services: `azure.com`, `aws.amazon.com`, `googleapis.com`, etc.

### **Generated Output:**
- **File:** `generated/coding.lsrules`
- **Rule count:** 2,460 rules (30 processes × 82 destinations)
- **Format:** Standard Little Snitch `.lsrules` JSON
- **Subscribe URL:** `https://[username].github.io/collection-lsrules/generated/coding.lsrules`

---

## 🚀 VS Code Integration

### **Available Tasks (`Cmd+Shift+P` → "Tasks: Run Task"):**
1. **Format Remotes JSON** - Clean up `config/remotes.json`
2. **Extract Domains from Clipboard** - Paste & format Little Snitch output
3. **Merge Domains from Clipboard** - Add new domains to existing config

### **Auto Features:**
✅ **JSON Schema Validation** - VS Code validates your configs  
✅ **Auto-format on Save** - Keeps JSON clean  
✅ **File Nesting** - Groups related files in explorer  
✅ **Debug Configs** - Debug formatter in VS Code

---

## 📝 Common Operations

### **Add New App:**
```bash
# 1. Edit config/paths.json
code config/paths.json

# 2. Add app object
{
  "name": "new-app",
  "displayName": "New App",
  "process": "/path/to/app",
  "description": "Description"
}

# 3. Commit & push
git add config/paths.json
git commit -m "Add NewApp"
git push
```

### **Add New Domains:**
```bash
# Method 1: VS Code task
# Copy Little Snitch output, then run "Merge Domains from Clipboard"

# Method 2: Terminal
pbpaste | npm run merge-remotes

# Method 3: From file
cat new-rules.txt | npm run merge-remotes
```

### **Regenerate Rules:**
```bash
# Manual generation
npm run generate

# Check status
./scripts/workflow-demo.sh
```

### **Extract from Existing .lsrules:**
```bash
# Extract domains from existing rule files
npm run extract -- brave.lsrules
npm run extract -- chrome.lsrules
# etc for your 82 files
```

---

## 🔄 GitHub Automation

### **Auto-Generation Workflow:**
1. **You edit** `config/paths.json` or `config/remotes.json`
2. **You commit & push** to `main` branch
3. **GitHub Action runs** automatically
4. **Action generates** new `coding.lsrules`
5. **Action commits** updated file back to repo
6. **Little Snitch auto-updates** via subscription

### **Workflow File:** `.github/workflows/generate-rules.yml`
- Triggers on: `paths.json` or `remotes.json` changes
- Runs on: Ubuntu latest
- Output: Commits `generated/coding.lsrules`

---

## 🧪 Testing & Verification

### **Verify Current State:**
```bash
./scripts/workflow-demo.sh
```
**Output:**
```
Paths configured: 10
Remotes configured: 82
Rules in coding.lsrules: 820
File size: 272K
```

### **Test Rule Generation:**
```bash
# Generate fresh rules
npm run generate

# Check generated file
ls -lh generated/coding.lsrules
head -20 generated/coding.lsrules
```

### **Test Subscription URL:**
1. Open in browser: `https://[username].github.io/collection-lsrules/generated/coding.lsrules`
2. Should download `coding.lsrules` file
3. Import into Little Snitch to test

---

## 📋 Next Steps for You

### **Immediate (5 minutes):**
1. **Test subscription URL** with your GitHub username
2. **Subscribe in Little Snitch** to the URL
3. **Verify rules load** correctly

### **Short-term (30 minutes):**
1. **Extract from your 82 .lsrules files:**
   ```bash
   npm run extract -- file1.lsrules
   npm run extract -- file2.lsrules
   # etc...
   ```
2. **Merge all unique domains** using the formatter
3. **Update app paths** with real bundle IDs from existing rules

### **Long-term (ongoing):**
1. **Add new coding apps** as you install them
2. **Merge new domains** from Little Snitch alerts
3. **Share with team** - everyone subscribes to same URL

---

## ❓ Troubleshooting

### **Subscription URL not working:**
- Check GitHub Pages is enabled for your repo
- Verify `generated/coding.lsrules` exists in repo
- Try local file: `file:///path/to/collection-lsrules/generated/coding.lsrules`

### **No rules generated:**
- Check `config/remotes.json` has domains array
- Check `config/paths.json` has valid process paths
- Run `npm run generate` manually

### **VS Code tasks not showing:**
- Reload VS Code window
- Check `.vscode/tasks.json` exists
- Run `code .` from project root

### **GitHub Action failing:**
- Check `.github/workflows/generate-rules.yml` exists
- Verify Node.js setup in workflow
- Check Action logs in GitHub repository

---

## 📞 Support & Updates

### **File Updates:**
- **Edit apps:** `config/paths.json`
- **Edit domains:** `config/remotes.json`
- **Generator logic:** `scripts/generate-rules.js`
- **Formatter logic:** `scripts/format-remotes.js`

### **Need Help?**
1. Check `docs/README.md` for general info
2. Check `docs/FORMATTER-GUIDE.md` for VS Code help
3. Run `./scripts/workflow-demo.sh` for current status
4. Examine `generated/coding.lsrules` for output format

---

## 🎉 Success Criteria Met

✅ **Edit `paths.json` with one new app** → Works  
✅ **Regenerate `coding.lsrules`** → Works (2,460 rules)
✅ **File has full remote set for new app** → Works (all 82 domains)  
✅ **Subscribe URL documented** → `https://[username].github.io/collection-lsrules/generated/coding.lsrules`

**System is ready for production use!**
