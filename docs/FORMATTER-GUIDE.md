# VS Code Formatter for the Domain Registry

## Quick Start

### **From VS Code:**
1. **Open config/domains.json**
2. **Run Task:** `Cmd+Shift+P` → "Tasks: Run Task" → Choose:
   - **Format Domain Registry** - Sort and de-duplicate the registry
   - **Extract Domains from Clipboard** - Paste & format from clipboard
   - **Merge Domains from Clipboard** - Merge new domains with existing

### **From Terminal:**
```bash
# Sort and de-duplicate config/domains.json
node scripts/format-remotes.js --format

# Extract from clipboard (macOS)
pbpaste | node scripts/format-remotes.js --extract

# Extract from file
node scripts/format-remotes.js --extract raw-ls-output.txt

# Merge new domains into the registry (tagged "coding" by default)
pbpaste | node scripts/format-remotes.js --merge

# Merge and tag for other outputs
pbpaste | node scripts/format-remotes.js --merge --lists browsers,terminal
```

## Workflow Examples

### **1. Fresh Paste & Format**
```
1. Copy Little Snitch output to clipboard
2. Run: pbpaste | node scripts/format-remotes.js --extract
3. Review the list
4. Merge it: pbpaste | node scripts/format-remotes.js --merge --lists <outputs>
```

### **2. Merge New Rules**
```
1. Copy new Little Snitch rules to clipboard
2. Run: pbpaste | node scripts/format-remotes.js --merge
3. Run: npm run generate (refreshes the .lsrules outputs)
```

### **3. VS Code Quick Format**
```
1. Open config/domains.json in VS Code
2. Cmd+Shift+P → "Tasks: Run Task"
3. Choose "Format Domain Registry"
```

## Input Format Support

The formatter supports:
- **Little Snitch plain text export** (with `destination: domain` lines)
- **.lsrules JSON files** (with `remote-domains` fields)
- **Registry / .lsrules JSON** (values are read structurally)

## Features

✅ **Extracts domains** from Little Snitch output  
✅ **Removes duplicates** automatically  
✅ **Sorts alphabetically**  
✅ **Preserves existing entries and tags** when merging  
✅ **Tags new entries** with `--lists` (default `coding`)  
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
├── domains-schema.json  # JSON schema validation
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
VS Code will validate `config/domains.json` against the JSON schema for:
- Required fields (`value`, `lists`)
- Valid list tags (`coding`, `browsers`, `terminal`)
- Proper JSON structure

### **Debugging:**
Open Debug panel (`Cmd+Shift+D`) and run:
- **Format Domain Registry** - Debug formatting
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

```
$ pbpaste | node scripts/format-remotes.js --merge
Merged 1 extracted domains into config/domains.json (lists: coding)
  new entries:        1 - example.com
  existing re-tagged: 0
```

`config/domains.json` then contains:

```json
{ "value": "example.com", "lists": ["coding"] }
```

## Troubleshooting

**Problem:** No domains extracted  
**Solution:** Ensure input contains `destination: domain` lines

**Problem:** JSON validation errors  
**Solution:** Run formatter first, then edit

**Problem:** VS Code tasks not showing  
**Solution:** Reload VS Code window or check `.vscode/tasks.json` exists