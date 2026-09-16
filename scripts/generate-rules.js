#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');

/**
 * Little Snitch Rule Generator
 * - Generates coding.lsrules from config/paths.json and config/domains.json
 * - Generates browsers.lsrules from config/domains.json
 * - Generates terminal.lsrules from config/domains.json
 *
 * config/domains.json is the single source of truth for allowed
 * destinations: each entry names the lists ("coding", "browsers",
 * "terminal") that consume it.
 */

const BROWSER_TARGETS = [
  {
    name: 'Brave',
    displayName: 'Brave Browser',
    process: 'identifier.KL8N8XSYF4/com.brave.Browser',
    sourceFile: 'brave.lsrules'
  },
  {
    name: 'Chrome',
    displayName: 'Google Chrome',
    process: 'identifier.EQHXZ8M8AV/com.google.Chrome',
    sourceFile: 'chrome.lsrules'
  },
  {
    name: 'Firefox',
    displayName: 'Firefox',
    process: 'identifier.2GN67GQWCV/org.mozilla.firefox',
    sourceFile: 'firefox.lsrules'
  },
  {
    name: 'Safari',
    displayName: 'Safari',
    process: '/Applications/Safari.app/Contents/MacOS/Safari',
    sourceFile: 'safari.lsrules'
  }
];

// Little Snitch matches processes by their literal filesystem path, it does
// not expand "~". Config entries may use "~" as a portable placeholder for
// the current user's home directory (e.g. CLI tools installed under
// ~/.local/bin), and we expand it here to the real path of whoever runs the
// generator, so the emitted rules work on their machine.
// Home directory baked into the committed outputs. A plain `npm run generate`
// uses this placeholder so a real local home directory can never leak into
// the public repo; set LSRULES_HOME=$HOME explicitly for machine-local output.
const PLACEHOLDER_HOME = '/Users/user';

function defaultHome() {
  return process.env.LSRULES_HOME || PLACEHOLDER_HOME;
}

function expandHome(processPath, targetHome = defaultHome()) {
  if (typeof processPath === 'string' && processPath.startsWith('~')) {
    return path.join(targetHome, processPath.slice(1));
  }
  return processPath;
}

// Single source of truth for allowed destinations. config/domains.json holds
// one entry per domain/host with a `lists` array naming the outputs that
// consume it ("coding", "browsers", "terminal").
function loadRegistry(registryPath = 'config/domains.json') {
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  return {
    domains: registry.domains || [],
    hosts: registry.hosts || [],
  };
}

function registryValues(entries, tag) {
  return entries
    .filter((entry) => (entry.lists || []).includes(tag))
    .map((entry) => entry.value);
}

// Fail closed: no allowed destination may also be denied in blocked.lsrules.
function checkBlockedContradictions(
  registry,
  blockedPath = 'blocked.lsrules'
) {
  const blocked = JSON.parse(fs.readFileSync(blockedPath, 'utf8'));
  const denied = new Set();
  for (const rule of blocked.rules || []) {
    for (const key of ['remote-domains', 'remote-hosts']) {
      if (rule[key]) {
        denied.add(rule[key]);
      }
    }
  }
  const allowed = [...registry.domains, ...registry.hosts]
    .map((entry) => entry.value);
  const conflicts = [...new Set(allowed.filter((value) => denied.has(value)))].sort();
  if (conflicts.length > 0) {
    throw new Error(
      `Allowed destinations also denied in ${blockedPath}: ${conflicts.join(', ')}`
    );
  }
}

function generateCodingRules(options = {}) {
  const {
    outputPath = 'generated/coding.lsrules',
    home = defaultHome(),
  } = options;

  try {
    // Read configuration files
    const pathsData = JSON.parse(fs.readFileSync('config/paths.json', 'utf8'))
      .map(entry => ({ ...entry, process: expandHome(entry.process, home) }));
    const registry = loadRegistry();

    const duplicateNames = pathsData.filter((entry, index) =>
      pathsData.findIndex(candidate => candidate.name === entry.name) !== index);
    const duplicateProcesses = pathsData.filter((entry, index) =>
      pathsData.findIndex(candidate => candidate.process === entry.process) !== index);
    if (duplicateNames.length || duplicateProcesses.length) {
      throw new Error('paths.json contains duplicate names or process paths');
    }
    
    // Extract all remote destinations, tagging each with its rule key so
    // domains and hosts produce the correct "remote-domains"/"remote-hosts"
    // field instead of being collapsed into remote-domains.
    const domains = registryValues(registry.domains, 'coding');
    const hosts = registryValues(registry.hosts, 'coding');
    const allRemotes = [
      ...domains.map(value => ({ value, key: 'remote-domains' })),
      ...hosts.map(value => ({ value, key: 'remote-hosts' }))
    ];
    
    console.log(`[Coding] Loaded ${pathsData.length} paths and ${allRemotes.length} remote destinations`);
    
    if (allRemotes.length === 0) {
      console.warn('Warning: No destinations tagged "coding" found in config/domains.json');
      console.warn('Add "coding" to the lists of the domains or hosts to allow and run again');
    }
    
    // Generate rules by crossing paths with remotes
    const rules = [];
    
    for (const pathEntry of pathsData) {
      for (const remote of allRemotes) {
        const rule = {
          priority: "regular",
          process: pathEntry.process,
          owner: "any",
          [remote.key]: remote.value,
          ports: "443",
          protocol: "any",
          notes: `Generated rule for ${pathEntry.displayName} to connect to ${remote.value}`,
          action: "allow",
          direction: "outgoing"
        };
        rules.push(rule);
      }
    }
    
    console.log(`[Coding] Generated ${rules.length} rules (${pathsData.length} paths × ${allRemotes.length} remotes)`);
    
    // Create the final .lsrules structure
    const output = {
      description: "Generated coding agent rules - cross of config/paths.json and the coding-tagged entries of config/domains.json",
      name: "Coding agents",
      rules: rules
    };
    
    // Ensure directory exists
    if (!fs.existsSync('generated')) {
      fs.mkdirSync('generated', { recursive: true });
    }

    // Write output file
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2) + '\n');
    
    console.log(`[Coding] Successfully wrote ${outputPath}`);
    console.log(`[Coding] Subscribe URL: https://[your-github-username].github.io/collection-lsrules/generated/coding.lsrules`);
    
    return outputPath;
    
  } catch (error) {
    console.error('Error generating coding rules:', error.message);
    process.exit(1);
  }
}

/**
 * Collect the tagged browser destinations from the domain registry.
 */
function browserRemotesFromRegistry(registry) {
  const allRemotes = [
    ...registryValues(registry.domains, 'browsers')
      .map((value) => ({ key: 'remote-domains', value })),
    ...registryValues(registry.hosts, 'browsers')
      .map((value) => ({ key: 'remote-hosts', value })),
  ];

  return allRemotes.sort((a, b) => a.value.localeCompare(b.value));
}

/**
 * Generate browsers.lsrules from individual browser files
 */
function generateBrowserRules(options = {}) {
  const {
    outputPath = 'generated/browsers.lsrules',
    browserTargets = BROWSER_TARGETS
  } = options;

  try {
    const registry = loadRegistry();
    const allRemotes = browserRemotesFromRegistry(registry);
    console.log(`[Browsers] Loaded ${allRemotes.length} unique remote destinations from config/domains.json`);

    const rules = [];

    for (const browser of browserTargets) {
      for (const remote of allRemotes) {
        rules.push({
          priority: "regular",
          process: browser.process,
          owner: "any",
          [remote.key]: remote.value,
          ports: "443",
          protocol: "any",
          notes: `Generated rule for ${browser.displayName} to connect to ${remote.value}`,
          action: "allow",
          direction: "outgoing"
        });
      }
    }

    console.log(`[Browsers] Generated ${rules.length} rules (${browserTargets.length} browsers × ${allRemotes.length} destinations)`);

    const output = {
      description: "Generated browser rules aggregated from individual browser rule files (Brave, Chrome, Firefox, Safari)",
      name: "Browsers",
      rules: rules
    };

    if (!fs.existsSync('generated')) {
      fs.mkdirSync('generated', { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2) + '\n');
    console.log(`[Browsers] Successfully wrote ${outputPath}`);
    console.log('[Browsers] Subscribe URL: https://[your-github-username].github.io/collection-lsrules/generated/browsers.lsrules');

    return outputPath;
  } catch (error) {
    console.error('Error generating browser rules:', error.message);
    process.exit(1);
  }
}

const TERMINAL_PROCESS = 'identifier.APPLE/com.apple.Terminal';

/**
 * Generate terminal.lsrules from the domain registry. Terminal rules carry
 * no port restriction: the live Terminal allows are port-unrestricted, and
 * pinning 443 would break non-HTTPS dev traffic such as git-over-SSH.
 */
function generateTerminalRules(options = {}) {
  const {
    outputPath = 'terminal.lsrules',
  } = options;

  try {
    const registry = loadRegistry();
    // Domains and hosts both feed the terminal list, keyed the same way the
    // coding and browsers generators key them.
    const allRemotes = [
      ...registryValues(registry.domains, 'terminal')
        .map((value) => ({ key: 'remote-domains', value })),
      ...registryValues(registry.hosts, 'terminal')
        .map((value) => ({ key: 'remote-hosts', value })),
    ];
    const codingValues = new Set([
      ...registryValues(registry.domains, 'coding'),
      ...registryValues(registry.hosts, 'coding'),
    ]);
    console.log(`[Terminal] Loaded ${allRemotes.length} destinations from config/domains.json`);

    const rules = allRemotes.map((remote) => ({
      priority: 'regular',
      process: TERMINAL_PROCESS,
      owner: 'any',
      [remote.key]: remote.value,
      protocol: 'any',
      notes: codingValues.has(remote.value)
        ? 'Shared with the coding agents harness (config/domains.json).'
        : 'Allowed via Little Snitch connection alert; synced from local model export.',
      action: 'allow',
      direction: 'outgoing',
    }));

    console.log(`[Terminal] Generated ${rules.length} rules`);

    const output = {
      description: 'Allow outgoing connections from Terminal.app to development tooling and the coding agents harness destinations.',
      name: 'Terminal',
      rules: rules,
    };

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2) + '\n');
    console.log(`[Terminal] Successfully wrote ${outputPath}`);

    return outputPath;
  } catch (error) {
    console.error('Error generating terminal rules:', error.message);
    process.exit(1);
  }
}

/**
 * Drift check for CI and local use: fails when any generated output is
 * stale or when the registry contradicts blocked.lsrules. Regenerates into
 * a temp dir and byte-compares against the working tree.
 */
function checkRules() {
  // The committed outputs are always rendered with the placeholder home, so
  // the check must compare against placeholder output too, regardless of
  // any LSRULES_HOME set in the caller's environment.
  if (process.env.LSRULES_HOME && process.env.LSRULES_HOME !== PLACEHOLDER_HOME) {
    console.log(`[Check] Ignoring LSRULES_HOME=${process.env.LSRULES_HOME}; comparing against ${PLACEHOLDER_HOME} output.`);
  }
  const registry = loadRegistry();
  checkBlockedContradictions(registry);
  console.log('[Check] No blocked-list contradictions.');

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lsrules-check-'));
  const cases = [
    ['generated/coding.lsrules', (p) => generateCodingRules({ outputPath: p, home: PLACEHOLDER_HOME })],
    ['generated/browsers.lsrules', (p) => generateBrowserRules({ outputPath: p })],
    ['terminal.lsrules', (p) => generateTerminalRules({ outputPath: p })],
  ];

  let drifted = false;
  for (const [relative, run] of cases) {
    const tmpPath = path.join(tmpDir, path.basename(relative));
    run(tmpPath);
    const fresh = fs.readFileSync(tmpPath, 'utf8');
    const current = fs.existsSync(relative)
      ? fs.readFileSync(relative, 'utf8')
      : null;
    if (current === null) {
      console.error(`[Check] missing ${relative} — run npm run generate`);
      drifted = true;
    } else if (fresh !== current) {
      console.error(`[Check] drift in ${relative} — run npm run generate`);
      drifted = true;
    } else {
      console.log(`[Check] ${relative} up to date.`);
    }
  }

  if (drifted) {
    process.exit(1);
  }
  console.log('[Check] All generated files up to date.');
}

/**
 * Helper script to extract remotes from existing .lsrules files
 */
function extractRemotes(lsrulesPath) {
  try {
    const data = JSON.parse(fs.readFileSync(lsrulesPath, 'utf8'));
    const domains = new Set();
    
    if (data.rules && Array.isArray(data.rules)) {
      for (const rule of data.rules) {
        if (rule['remote-domains']) {
          domains.add(rule['remote-domains']);
        }
      }
    }
    
    console.log(`Extracted ${domains.size} unique domains from ${lsrulesPath}:`);
    const domainArray = Array.from(domains).sort();
    console.log(JSON.stringify(domainArray, null, 2));
    
    return domainArray;
    
  } catch (error) {
    console.error('Error extracting remotes:', error.message);
    process.exit(1);
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args[0] === 'check' || args[0] === '--check') {
    // Check mode: verify generated outputs are fresh and consistent
    checkRules();
  } else if (args[0] === 'extract' && args[1]) {
    // Extract mode: node generate-rules.js extract path/to/exported.lsrules
    extractRemotes(args[1]);
  } else if (args[0] === 'extract') {
    console.error('Usage: node generate-rules.js extract <path-to-lsrules-file>');
    console.error('Example: node generate-rules.js extract chrome.lsrules');
    process.exit(1);
  } else {
    // Every generation fails closed on blocked-list contradictions.
    checkBlockedContradictions(loadRegistry());

    if (args[0] === 'coding') {
      // Generate only coding agent rules
      generateCodingRules();
    } else if (args[0] === 'browsers') {
      // Generate only browser rules
      generateBrowserRules();
    } else if (args[0] === 'terminal') {
      // Generate only terminal rules
      generateTerminalRules();
    } else {
      // Default mode: generate all rules (coding, browsers, terminal)
      generateCodingRules();
      console.log('');
      generateBrowserRules();
      console.log('');
      generateTerminalRules();
    }
  }
}

module.exports = {
  generateCodingRules,
  generateBrowserRules,
  generateTerminalRules,
  generateRules: generateCodingRules, // Backward compatibility
  extractRemotes,
  browserRemotesFromRegistry,
  loadRegistry,
  registryValues,
  checkBlockedContradictions,
  checkRules,
  expandHome,
  PLACEHOLDER_HOME,
  TERMINAL_PROCESS,
  BROWSER_TARGETS
};
