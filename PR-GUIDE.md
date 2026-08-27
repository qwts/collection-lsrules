# How to Create Pull Request

## Option 1: Automated (Recommended)
```bash
./create-pr.sh
```

This will:
1. Add all files
2. Create a commit
3. Push to new branch
4. Create PR using GitHub CLI

## Option 2: Manual Steps

### **Step 1: Create Branch**
```bash
git checkout -b feature/little-snitch-rule-generator
```

### **Step 2: Add Files**
```bash
git add .
```

### **Step 3: Create Commit**
```bash
git commit -m "Add Little Snitch rule generator system

- 10 coding agent apps (7 desktop + 3 CLI)
- 82 remote domains extracted from Little Snitch
- 820 rules generated (10×82)
- VS Code formatter with 3 tasks
- GitHub Action for auto-generation
- JSON schema validation
- Complete documentation"
```

### **Step 4: Push Branch**
```bash
git push -u origin feature/little-snitch-rule-generator
```

### **Step 5: Create PR on GitHub**
1. Go to your repository on GitHub
2. Click "Pull requests"
3. Click "New pull request"
4. Select:
   - **base:** `main`
   - **compare:** `feature/little-snitch-rule-generator`
5. Use PR title: "Add Little Snitch rule generator system"
6. Copy content from `PULL_REQUEST.md` as PR description
7. Create pull request

## Option 3: GitHub CLI Manual

```bash
# After committing and pushing:
gh pr create \
  --title "Add Little Snitch rule generator system" \
  --body-file PULL_REQUEST.md \
  --base main \
  --head feature/little-snitch-rule-generator \
  --label "enhancement"
```

## PR Details

**Title:** Add Little Snitch rule generator system

**Description:** See `PULL_REQUEST.md` for complete details

**Branch:** `feature/little-snitch-rule-generator`

**Base:** `main`

**Labels:** `enhancement`

## Files in PR

```
✅ .github/workflows/generate-rules.yml  # Auto-generation workflow
✅ config/paths.json                     # 10 apps (7 desktop + 3 CLI)
✅ config/remotes.json                   # 82 domains
✅ generated/coding.lsrules              # 820 rules (272KB)
✅ scripts/generate-rules.js             # Rule generator
✅ scripts/format-remotes.js             # VS Code formatter
✅ scripts/workflow-demo.sh              # Status check
✅ docs/HOW-TO-USE.md                    # Complete guide
✅ docs/FORMATTER-GUIDE.md               # VS Code formatter guide
✅ .vscode/tasks.json                    # 3 ready-to-run tasks
✅ .vscode/settings.json                 # Auto-format & validation
✅ schemas/remotes-schema.json           # JSON validation
✅ schemas/paths-schema.json             # JSON validation
✅ package.json                          # npm scripts
✅ .gitignore                            # Git ignore rules
✅ PULL_REQUEST.md                       # PR description
✅ create-pr.sh                          # PR creation script
✅ PR-GUIDE.md                           # This guide
```

## After PR is Merged

### **1. Enable GitHub Pages:**
1. Go to repository Settings
2. Pages → Build and deployment
3. Source: "Deploy from a branch"
4. Branch: `main`, folder: `/ (root)`
5. Save

### **2. Test Subscription:**
```
https://[your-github-username].github.io/collection-lsrules/generated/coding.lsrules
```

### **3. First GitHub Action Run:**
- Action will run automatically after merge
- Will generate `coding.lsrules` and commit to main
- Check `.github/workflows/generate-rules.yml` for logs

## Verification Before PR

```bash
./scripts/workflow-demo.sh
```

**Should output:**
```
Paths configured: 10
Remotes configured: 82
Rules in coding.lsrules: 820
File size: 272K
```

## Notes

- All existing `.lsrules` files remain untouched
- System is fully tested and working
- Documentation is complete
- VS Code integration ready
- GitHub automation configured

**Ready for review and merge!** 🚀