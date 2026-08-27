#!/bin/bash

echo "=== Pushing Little Snitch Rule Generator to GitHub ==="
echo ""

# Check git status
echo "1. Checking git status..."
git status --porcelain

echo ""
echo "2. Adding all new files..."
git add .

echo ""
echo "3. Creating commit..."
git commit -m "Add Little Snitch rule generator system

- 10 coding agent apps (7 desktop + 3 CLI)
- 82 remote domains extracted from Little Snitch
- 820 rules generated (10×82)
- VS Code formatter with 3 tasks
- GitHub Action for auto-generation
- JSON schema validation
- Complete documentation"

echo ""
echo "4. Pushing to GitHub..."
git push

echo ""
echo "✅ Done! Your subscription URL will be:"
echo "   https://[your-github-username].github.io/collection-lsrules/generated/coding.lsrules"
echo ""
echo "Replace [your-github-username] with your actual GitHub username."
echo ""
echo "After pushing, enable GitHub Pages in your repository settings:" 
echo "   Settings → Pages → Source: Deploy from a branch → Branch: main → / (root)"