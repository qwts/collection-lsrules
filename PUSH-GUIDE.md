# How to Push to GitHub

## Option 1: Quick Push (Recommended)
```bash
./push-changes.sh
```

## Option 2: Manual Steps

### **Step 1: Add all files**
```bash
git add .
```

### **Step 2: Create commit**
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

### **Step 3: Push to GitHub**
```bash
git push
```

## Option 3: VS Code Git Interface
1. Open Source Control panel (`Ctrl+Shift+G`)
2. Stage All Changes (+ button)
3. Enter commit message
4. Click Commit & Push button

## After Pushing

### **1. Enable GitHub Pages:**
1. Go to your repository on GitHub
2. Settings → Pages
3. Source: "Deploy from a branch"
4. Branch: `main`, folder: `/ (root)`
5. Save

### **2. Test Subscription URL:**
```
https://[your-github-username].github.io/collection-lsrules/generated/coding.lsrules
```
*(Replace `[your-github-username]` with your GitHub username)*

### **3. First GitHub Action Run:**
- The Action will run automatically after push
- It will generate `coding.lsrules` and commit it
- Check `.github/workflows/generate-rules.yml` for logs

## Files Being Pushed

```
✅ .github/workflows/generate-rules.yml  # Auto-generation
✅ config/paths.json                     # 10 apps
✅ config/remotes.json                   # 82 domains  
✅ generated/coding.lsrules              # 820 rules
✅ scripts/format-remotes.js             # VS Code formatter
✅ scripts/generate-rules.js             # Rule generator
✅ docs/HOW-TO-USE.md                    # Complete guide
✅ docs/FORMATTER-GUIDE.md               # VS Code guide
✅ .vscode/tasks.json                    # 3 ready-to-run tasks
✅ schemas/*.json                        # JSON validation
✅ package.json                          # npm scripts
✅ .gitignore                            # Git ignore rules
```

## Verification

After pushing, run:
```bash
./scripts/workflow-demo.sh
```

Should show:
```
Paths configured: 10
Remotes configured: 82  
Rules in coding.lsrules: 820
File size: 272K
```