#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');

/**
 * Little Snitch Rule Generator
 * - Generates coding.lsrules from config/paths.json and config/remotes.json
 * - Generates browsers.lsrules from individual browser .lsrules files
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
function expandHome(processPath) {
  if (typeof processPath === 'string' && processPath.startsWith('~')) {
    const targetHome = process.env.LSRULES_HOME || os.homedir();
    return path.join(targetHome, processPath.slice(1));
  }
  return processPath;
}

function generateCodingRules() {
  try {
    // Read configuration files
    const pathsData = JSON.parse(fs.readFileSync('config/paths.json', 'utf8'))
      .map(entry => ({ ...entry, process: expandHome(entry.process) }));
    const remotesData = JSON.parse(fs.readFileSync('config/remotes.json', 'utf8'));

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
    const domains = remotesData.domains || [];
    const hosts = remotesData.hosts || [];
    const allRemotes = [
      ...domains.map(value => ({ value, key: 'remote-domains' })),
      ...hosts.map(value => ({ value, key: 'remote-hosts' }))
    ];
    
    console.log(`[Coding] Loaded ${pathsData.length} paths and ${allRemotes.length} remote destinations`);
    
    if (allRemotes.length === 0) {
      console.warn('Warning: No remote destinations found in remotes.json');
      console.warn('Add domains or hosts to remotes.json and run again');
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
      description: "Generated coding agent rules - cross of paths.json and remotes.json",
      name: "Coding agents",
      rules: rules
    };
    
    // Ensure directory exists
    if (!fs.existsSync('generated')) {
      fs.mkdirSync('generated', { recursive: true });
    }

    // Write output file
    const outputPath = 'generated/coding.lsrules';
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
 * Extract all unique remotes from individual browser .lsrules files
 */
function extractBrowserRemotes(browserTargets = BROWSER_TARGETS) {
  const remotesMap = new Map();

  for (const target of browserTargets) {
    if (!fs.existsSync(target.sourceFile)) {
      console.warn(`Warning: Browser file not found: ${target.sourceFile}`);
      continue;
    }

    try {
      const data = JSON.parse(fs.readFileSync(target.sourceFile, 'utf8'));
      if (data.rules && Array.isArray(data.rules)) {
        for (const rule of data.rules) {
          if (rule['remote-domains']) {
            const domain = rule['remote-domains'].trim();
            if (domain) {
              remotesMap.set(`domain:${domain}`, { key: 'remote-domains', value: domain });
            }
          }
          if (rule['remote-hosts']) {
            const host = rule['remote-hosts'].trim();
            if (host) {
              remotesMap.set(`host:${host}`, { key: 'remote-hosts', value: host });
            }
          }
          if (rule['remote-addresses']) {
            const addr = rule['remote-addresses'].trim();
            if (addr) {
              remotesMap.set(`addr:${addr}`, { key: 'remote-addresses', value: addr });
            }
          }
        }
      }
    } catch (err) {
      console.error(`Error reading ${target.sourceFile}:`, err.message);
      throw err;
    }
  }

  return Array.from(remotesMap.values()).sort((a, b) => a.value.localeCompare(b.value));
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
    const allRemotes = extractBrowserRemotes(browserTargets);
    console.log(`[Browsers] Loaded ${allRemotes.length} unique remote destinations from ${browserTargets.length} browser files`);

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
    console.log(`[Browsers] Subscribe URL: https://[your-github-username].github.io/collection-lsrules/${outputPath}`);

    return outputPath;
  } catch (error) {
    console.error('Error generating browser rules:', error.message);
    process.exit(1);
  }
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
  
  if (args[0] === 'extract' && args[1]) {
    // Extract mode: node generate-rules.js extract path/to/exported.lsrules
    extractRemotes(args[1]);
  } else if (args[0] === 'extract') {
    console.error('Usage: node generate-rules.js extract <path-to-lsrules-file>');
    console.error('Example: node generate-rules.js extract chrome.lsrules');
    process.exit(1);
  } else if (args[0] === 'coding') {
    // Generate only coding agent rules
    generateCodingRules();
  } else if (args[0] === 'browsers') {
    // Generate only browser rules
    generateBrowserRules();
  } else {
    // Default mode: generate all rules (coding and browsers)
    generateCodingRules();
    console.log('');
    generateBrowserRules();
  }
}

module.exports = {
  generateCodingRules,
  generateBrowserRules,
  generateRules: generateCodingRules, // Backward compatibility
  extractRemotes,
  extractBrowserRemotes,
  BROWSER_TARGETS
};
