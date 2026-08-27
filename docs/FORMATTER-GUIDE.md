# VS Code Formatter for Little Snitch Remotes

## Quick Start

### **From VS Code:**
1. **Open config/remotes.json**
2. **Run Task:** `Cmd+Shift+P` → "Tasks: Run Task" → Choose:
   - **Format Remotes JSON** - Format current file
   - **Extract Domains from Clipboard** - Paste & format from clipboard
   - **Merge Domains from Clipboard** - Merge new domains with existing

### **From Terminal:**
```bash
# Format current config file
node scripts/format-remotes.js --format

# Extract from clipboard (macOS)
pbpaste | node scripts/format-remotes.js --extract

# Extract from file
node scripts/format-remotes.js --extract raw-ls-output.txt

# Merge new domains with existing config
pbpaste | node scripts/format-remotes.js --merge
```

## Workflow Examples

### **1. Fresh Paste & Format**
```
1. Copy Little Snitch output to clipboard
2. Run: pbpaste | node scripts/format-remotes.js --extract
3. Copy output JSON
4. Paste into config/remotes.json
```

### **2. Merge New Rules**
```
1. Copy new Little Snitch rules to clipboard
2. Run: pbpaste | node scripts/format-remotes.js --merge
3. Done! Config file automatically updated
```

### **3. VS Code Quick Format**
```
1. Open config/remotes.json in VS Code
2. Cmd+Shift+P → "Tasks: Run Task"
3. Choose "Format Remotes JSON"
```

## Input Format Support

The formatter supports:
- **Little Snitch plain text export** (with `destination: domain` lines)
- **.lsrules JSON files** (with `remote-domains` fields)
- **Already formatted JSON** (just reformats)

## Features

✅ **Extracts domains** from Little Snitch output  
✅ **Removes duplicates** automatically  
✅ **Sorts alphabetically**  
✅ **Preserves existing config** when merging  
✅ **Updates timestamp** automatically  
✅ **VS Code integration** with tasks  

## File Structure

```
scripts/
├── format-remotes.js      # Main formatter
└── generate-rules.js      # Rule generator

.vscode/
├── tasks.json            # VS Code tasks
├── launch.json          # Debug configurations
└── settings.json        # Editor settings

schemas/
├── remotes-schema.json  # JSON schema validation
└── paths-schema.json    # JSON schema validation
```

## Usage Tips

### **MacOS Clipboard:**
```bash
# Copy Little Snitch output
# Then use pbpaste with the formatter
pbpaste | node scripts/format-remotes.js --extract
```

### **Validation:**
VS Code will validate `config/remotes.json` against the JSON schema for:
- Required fields
- Duplicate domains
- Proper JSON structure

### **Debugging:**
Open Debug panel (`Cmd+Shift+D`) and run:
- **Format Remotes** - Debug formatting
- **Extract Domains** - Debug extraction

## Example Input

```text
action: allow
direction: outgoing
priority: regular
process: /Applications/Test.app
owner: me
destination: domain example.com
ports: any
protocol: any
notes: Test connection
```

## Example Output

```json
{
  "description": "Remote destinations for coding agents",
  "domains": ["example.com"],
  "hosts": [],
  "notes": "Extracted from Little Snitch rule export - 1 unique domains",
  "lastUpdated": "2026-08-27"
}
```

## Troubleshooting

**Problem:** No domains extracted  
**Solution:** Ensure input contains `destination: domain` lines

**Problem:** JSON validation errors  
**Solution:** Run formatter first, then edit

**Problem:** VS Code tasks not showing  
**Solution:** Reload VS Code window or check `.vscode/tasks.json` exists