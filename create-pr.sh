#!/bin/bash

echo "=== Creating Pull Request for Little Snitch Rule Generator ==="
echo ""

# Step 1: Add and commit changes
echo "1. Adding all files..."
git add .

echo ""
echo "2. Creating commit..."
git commit -m "Add Little Snitch rule generator system

- 10 coding agent apps (7 desktop + 3 CLI)
- 82 remote domains extracted from Little Snitch
- 820 rules generated (10×82)
- VS Code formatter with 3 tasks
- GitHub Action for auto-generation
- JSON schema validation
- Complete documentation"

echo ""
echo "3. Pushing branch to GitHub..."
git push -u origin feature/little-snitch-rule-generator

echo ""
echo "4. Creating Pull Request..."
echo ""
echo "Creating PR with title: 'Add Little Snitch rule generator system'"
echo ""

# Create the PR using GitHub CLI
gh pr create \
  --title "Add Little Snitch rule generator system" \
  --body-file PULL_REQUEST.md \
  --base main \
  --head feature/little-snitch-rule-generator \
  --label "enhancement" \
  --assignee "@me"

echo ""
echo "✅ Pull Request created!"
echo ""
echo "Next steps:"
echo "1. Review the PR on GitHub"
echo "2. Merge when ready"
echo "3. After merge, enable GitHub Pages:"
echo "   Settings → Pages → Source: Deploy from a branch → Branch: main → / (root)"
echo ""
echo "Subscription URL after enabling Pages:"
echo "   https://[your-github-username].github.io/collection-lsrules/generated/coding.lsrules"