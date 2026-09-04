#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');

/**
 * Little Snitch Rule Generator
 * Crosses paths.json with remotes.json to produce coding.lsrules
 */

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

function generateRules() {
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
    
    console.log(`Loaded ${pathsData.length} paths and ${allRemotes.length} remote destinations`);
    
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
    
    console.log(`Generated ${rules.length} rules (${pathsData.length} paths × ${allRemotes.length} remotes)`);
    
    // Create the final .lsrules structure
    const output = {
      description: "Generated coding agent rules - cross of paths.json and remotes.json",
      name: "Coding agents",
      rules: rules
    };
    
    // Write output file
    const outputPath = 'generated/coding.lsrules';
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    
    console.log(`Successfully wrote ${outputPath}`);
    console.log(`Subscribe URL: https://[your-github-username].github.io/collection-lsrules/generated/coding.lsrules`);
    
    return outputPath;
    
  } catch (error) {
    console.error('Error generating rules:', error.message);
    console.error('Make sure paths.json and remotes.json exist and are valid JSON');
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
        // Could also extract remote-hosts, remote-addresses if needed
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
  } else {
    // Default mode: generate rules
    generateRules();
  }
}

module.exports = { generateRules, extractRemotes };
