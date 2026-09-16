#!/usr/bin/env node

const fs = require('fs');

/**
 * Formatter and merger for the unified domain registry (config/domains.json).
 *
 * Usage:
 *   node scripts/format-remotes.js --format
 *       Sort and de-duplicate config/domains.json in place.
 *   pbpaste | node scripts/format-remotes.js --extract
 *   node scripts/format-remotes.js --extract raw-ls-output.txt
 *       Print the destinations found in a Little Snitch export.
 *   pbpaste | node scripts/format-remotes.js --merge [--lists coding,terminal]
 *   node scripts/format-remotes.js --merge new-rules.txt --lists browsers
 *       Merge the destinations found in the input into config/domains.json.
 *       New entries are tagged with --lists (default: coding); existing
 *       entries gain any tags they were missing. Run `npm run generate`
 *       afterwards to refresh the .lsrules outputs.
 */

const REGISTRY_PATH = 'config/domains.json';
const VALID_LISTS = ['coding', 'browsers', 'terminal'];
const DEFAULT_LISTS = ['coding'];

function addValues(target, values) {
  for (const value of values || []) {
    if (typeof value === 'string' && value.trim().length > 0) {
      target.add(value.trim());
    } else if (value && typeof value.value === 'string' && value.value.trim().length > 0) {
      target.add(value.value.trim());
    }
  }
}

function extractDomainsFromJSON(text) {
  const domains = new Set();

  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    return null; // Not JSON, caller should fall back to plain-text parsing
  }

  // Registry shape ({ domains: [{ value, lists }] }) and the legacy
  // remotes.json shape ({ domains: ["..."] }).
  if (Array.isArray(data.domains)) {
    addValues(domains, data.domains);
  }

  // .lsrules shape: { rules: [ { "remote-domains": "..." | [...] }, ... ] }
  if (Array.isArray(data.rules)) {
    for (const rule of data.rules) {
      const remoteDomains = rule && rule['remote-domains'];
      if (typeof remoteDomains === 'string') {
        domains.add(remoteDomains.trim());
      } else if (Array.isArray(remoteDomains)) {
        addValues(domains, remoteDomains);
      }
    }
  }

  return Array.from(domains).sort();
}

function extractDomainsFromText(text) {
  // Prefer structural JSON parsing for JSON inputs (config/domains.json,
  // .lsrules files). Only fall back to the plain-text regex parser for
  // Little Snitch's plain-text export, which is not valid JSON.
  const jsonDomains = extractDomainsFromJSON(text);
  if (jsonDomains !== null) {
    return jsonDomains;
  }

  const domains = new Set();
  const lines = text.split('\n');
  
  for (const line of lines) {
    // Look for "destination: domain " pattern (Little Snitch plain-text export)
    if (line.includes('destination: domain')) {
      const match = line.match(/destination: domain\s+(\S+)/);
      if (match && match[1]) {
        const domain = match[1].trim();
        // Remove any trailing punctuation or notes
        const cleanDomain = domain.split(/[,\s]/)[0];
        if (cleanDomain && cleanDomain.length > 0) {
          domains.add(cleanDomain);
        }
      }
    }
  }
  
  return Array.from(domains).sort();
}

function parseLists(spec) {
  const lists = String(spec)
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  const invalid = lists.filter((item) => !VALID_LISTS.includes(item));
  if (lists.length === 0 || invalid.length > 0) {
    throw new Error(
      `--lists expects a comma-separated subset of ${VALID_LISTS.join(', ')} (got "${spec}")`
    );
  }
  return sortLists(lists);
}

function sortLists(lists) {
  return Array.from(new Set(lists)).sort();
}

function loadRegistry(registryPath = REGISTRY_PATH) {
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  return {
    ...registry,
    domains: Array.isArray(registry.domains) ? registry.domains : [],
    hosts: Array.isArray(registry.hosts) ? registry.hosts : [],
  };
}

function normalizeEntries(entries, section) {
  const byValue = new Map();
  for (const entry of entries) {
    if (!entry || typeof entry.value !== 'string' || entry.value.trim().length === 0) {
      throw new Error(`${section}: every entry needs a non-empty "value"`);
    }
    if (!Array.isArray(entry.lists) || entry.lists.length === 0) {
      throw new Error(`${section}: "${entry.value}" needs a non-empty "lists" array`);
    }
    const invalid = entry.lists.filter((item) => !VALID_LISTS.includes(item));
    if (invalid.length > 0) {
      throw new Error(
        `${section}: "${entry.value}" has unknown lists ${invalid.join(', ')} (valid: ${VALID_LISTS.join(', ')})`
      );
    }
    const value = entry.value.trim();
    const existing = byValue.get(value);
    byValue.set(value, {
      ...(existing || {}),
      ...entry,
      value,
      lists: sortLists([...(existing ? existing.lists : []), ...entry.lists]),
    });
  }
  return Array.from(byValue.values()).sort((a, b) => (a.value < b.value ? -1 : a.value > b.value ? 1 : 0));
}

/**
 * Canonical registry form: entries de-duplicated (lists merged) and sorted
 * by value, list tags sorted. Idempotent on an already-formatted file.
 */
function normalizeRegistry(registry) {
  return {
    ...registry,
    domains: normalizeEntries(registry.domains, 'domains'),
    hosts: normalizeEntries(registry.hosts, 'hosts'),
  };
}

function writeRegistry(registry, registryPath = REGISTRY_PATH) {
  fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2) + '\n');
}

/**
 * Merge domains into the registry. New values are added with `lists`;
 * existing values gain any of `lists` they were missing.
 */
function mergeDomains(registry, domains, lists = DEFAULT_LISTS) {
  const byValue = new Map(registry.domains.map((entry) => [entry.value, entry]));
  const added = [];
  const retagged = [];
  for (const value of domains) {
    const existing = byValue.get(value);
    if (!existing) {
      byValue.set(value, { value, lists: sortLists(lists) });
      added.push(value);
      continue;
    }
    const merged = sortLists([...existing.lists, ...lists]);
    if (merged.length !== existing.lists.length) {
      existing.lists = merged;
      retagged.push(value);
    }
  }
  return {
    registry: normalizeRegistry({ ...registry, domains: Array.from(byValue.values()) }),
    added,
    retagged,
  };
}

function readInput(inputFile) {
  if (inputFile && fs.existsSync(inputFile)) {
    return fs.readFileSync(inputFile, 'utf8');
  }
  // Read from stdin
  return fs.readFileSync(0, 'utf8');
}

function parseArgs(args) {
  const positional = [];
  let lists = null;
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--lists' || args[i] === '-l') {
      lists = parseLists(args[i + 1]);
      i += 1;
    } else if (args[i].startsWith('--lists=')) {
      lists = parseLists(args[i].slice('--lists='.length));
    } else {
      positional.push(args[i]);
    }
  }
  return { positional, lists };
}

function requireRegistry() {
  if (!fs.existsSync(REGISTRY_PATH)) {
    console.error(`Registry not found: ${REGISTRY_PATH}`);
    process.exit(1);
  }
}

// Command line interface
if (require.main === module) {
  const { positional, lists } = parseArgs(process.argv.slice(2));
  const mode = positional[0];

  if (mode === '--format' || mode === '-f') {
    // Format mode: sort and de-duplicate config/domains.json in place
    requireRegistry();
    const registry = normalizeRegistry(loadRegistry());
    writeRegistry(registry);
    console.log(
      `✅ Formatted ${REGISTRY_PATH}: ${registry.domains.length} domains, ${registry.hosts.length} hosts`
    );

  } else if (mode === '--extract' || mode === '-e') {
    // Extract mode: reads from stdin or file, prints the sorted destinations
    const domains = extractDomainsFromText(readInput(positional[1]));
    console.log(`Extracted ${domains.length} domains:`);
    console.log(JSON.stringify(domains, null, 2));

  } else if (mode === '--merge' || mode === '-m') {
    // Merge mode: add extracted destinations to config/domains.json
    requireRegistry();
    const tags = lists || DEFAULT_LISTS;
    const domains = extractDomainsFromText(readInput(positional[1]));
    const result = mergeDomains(loadRegistry(), domains, tags);
    writeRegistry(result.registry);

    console.log(`Merged ${domains.length} extracted domains into ${REGISTRY_PATH} (lists: ${tags.join(', ')})`);
    console.log(`  new entries:        ${result.added.length}${result.added.length ? ' - ' + result.added.join(', ') : ''}`);
    console.log(`  existing re-tagged: ${result.retagged.length}${result.retagged.length ? ' - ' + result.retagged.join(', ') : ''}`);
    console.log(`  registry now holds ${result.registry.domains.length} domains`);
    console.log('\n✅ Run `npm run generate` to refresh the .lsrules outputs');

  } else {
    // Help mode
    console.log(`
Little Snitch Domain Registry Formatter
=======================================

Usage:
  node scripts/format-remotes.js [option] [file] [--lists coding,browsers,terminal]

Options:
  --format, -f      Sort and de-duplicate ${REGISTRY_PATH} in place
  --extract, -e     Extract domains from stdin or file and print them as JSON
  --merge, -m       Merge extracted domains into ${REGISTRY_PATH}
  --lists, -l       Lists to tag merged domains with (default: ${DEFAULT_LISTS.join(',')})

Examples:
  1. Format the registry:
     node scripts/format-remotes.js --format

  2. Extract from a Little Snitch export file:
     node scripts/format-remotes.js --extract raw-output.txt

  3. Pipe Little Snitch output:
     pbpaste | node scripts/format-remotes.js --extract

  4. Merge new coding-agent domains from the clipboard:
     pbpaste | node scripts/format-remotes.js --merge

  5. Merge new browser domains from a file:
     node scripts/format-remotes.js --merge new-rules.txt --lists browsers
    `);
  }
}

module.exports = {
  extractDomainsFromText,
  normalizeRegistry,
  mergeDomains,
  REGISTRY_PATH,
  VALID_LISTS,
  DEFAULT_LISTS
};
