#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * VS Code Formatter for Little Snitch remotes
 * 
 * Usage:
 * 1. Copy Little Snitch output to clipboard
 * 2. Open config/remotes.json in VS Code
 * 3. Run: node scripts/format-remotes.js --format
 * 
 * Or pipe output directly:
 * cat raw-ls-output.txt | node scripts/format-remotes.js
 */

function extractDomainsFromJSON(text) {
  const domains = new Set();

  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    return null; // Not JSON, caller should fall back to plain-text parsing
  }

  // config/remotes.json shape: { domains: [...], hosts: [...] }
  if (Array.isArray(data.domains)) {
    for (const domain of data.domains) {
      if (typeof domain === 'string' && domain.length > 0) {
        domains.add(domain.trim());
      }
    }
  }

  // .lsrules shape: { rules: [ { "remote-domains": "..." | [...] }, ... ] }
  if (Array.isArray(data.rules)) {
    for (const rule of data.rules) {
      const remoteDomains = rule && rule['remote-domains'];
      if (typeof remoteDomains === 'string') {
        domains.add(remoteDomains.trim());
      } else if (Array.isArray(remoteDomains)) {
        for (const domain of remoteDomains) {
          if (typeof domain === 'string' && domain.length > 0) {
            domains.add(domain.trim());
          }
        }
      }
    }
  }

  return Array.from(domains).sort();
}

function extractDomainsFromText(text) {
  // Prefer structural JSON parsing for JSON inputs (config/remotes.json,
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

function createRemotesJSON(domains, existingConfig = null) {
  const today = new Date().toISOString().split('T')[0];
  
  return {
    description: existingConfig?.description || "Remote destinations for coding agents",
    domains: domains,
    hosts: existingConfig?.hosts || [],
    notes: existingConfig?.notes || `Extracted from Little Snitch rule export - ${domains.length} unique domains`,
    lastUpdated: today
  };
}

function formatRemotesJSON(inputText, existingConfigPath = null) {
  const domains = extractDomainsFromText(inputText);
  
  let existingConfig = null;
  if (existingConfigPath && fs.existsSync(existingConfigPath)) {
    try {
      existingConfig = JSON.parse(fs.readFileSync(existingConfigPath, 'utf8'));
    } catch (e) {
      console.warn(`Could not parse existing config at ${existingConfigPath}:`, e.message);
    }
  }
  
  const formatted = createRemotesJSON(domains, existingConfig);
  
  return {
    domains: domains,
    formatted: formatted,
    stats: {
      totalDomains: domains.length,
      formattedJSON: JSON.stringify(formatted, null, 2)
    }
  };
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args[0] === '--format' || args[0] === '-f') {
    // Format mode: reads from config/remotes.json, formats, writes back
    const configPath = 'config/remotes.json';
    
    if (!fs.existsSync(configPath)) {
      console.error(`Config file not found: ${configPath}`);
      process.exit(1);
    }
    
    const currentContent = fs.readFileSync(configPath, 'utf8');
    const result = formatRemotesJSON(currentContent, configPath);
    
    console.log(`Extracted ${result.domains.length} domains from config file`);
    console.log(JSON.stringify(result.formatted, null, 2));
    
    // Write back if domains were found
    if (result.domains.length > 0) {
      fs.writeFileSync(configPath, JSON.stringify(result.formatted, null, 2));
      console.log(`\n✅ Updated ${configPath}`);
    }
    
  } else if (args[0] === '--extract' || args[0] === '-e') {
    // Extract mode: reads from stdin or file, outputs formatted JSON
    const inputFile = args[1];
    let inputText;
    
    if (inputFile && fs.existsSync(inputFile)) {
      inputText = fs.readFileSync(inputFile, 'utf8');
    } else {
      // Read from stdin
      inputText = fs.readFileSync(0, 'utf8');
    }
    
    const result = formatRemotesJSON(inputText);
    
    console.log(`Extracted ${result.domains.length} domains:`);
    console.log(result.stats.formattedJSON);
    
  } else if (args[0] === '--merge' || args[0] === '-m') {
    // Merge mode: merge new domains with existing config
    const configPath = 'config/remotes.json';
    
    if (!fs.existsSync(configPath)) {
      console.error(`Config file not found: ${configPath}`);
      process.exit(1);
    }
    
    const inputFile = args[1];
    let inputText;
    
    if (inputFile && fs.existsSync(inputFile)) {
      inputText = fs.readFileSync(inputFile, 'utf8');
    } else {
      // Read from stdin
      inputText = fs.readFileSync(0, 'utf8');
    }
    
    const existingConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const newDomains = extractDomainsFromText(inputText);
    const existingDomains = new Set(existingConfig.domains || []);
    
    // Merge domains
    const mergedDomains = Array.from(new Set([...existingDomains, ...newDomains])).sort();
    
    const updatedConfig = {
      ...existingConfig,
      domains: mergedDomains,
      lastUpdated: new Date().toISOString().split('T')[0],
      notes: `${existingConfig.notes || 'Extracted from Little Snitch rules'} + ${newDomains.length} new domains merged`
    };
    
    console.log(`Merged ${mergedDomains.length} domains (${existingDomains.size} existing + ${newDomains.length} new)`);
    console.log(JSON.stringify(updatedConfig, null, 2));
    
    fs.writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2));
    console.log(`\n✅ Merged and updated ${configPath}`);
    
  } else {
    // Help mode
    console.log(`
Little Snitch Remotes Formatter
===============================

Usage:
  node scripts/format-remotes.js [option]

Options:
  --format, -f      Format existing config/remotes.json file
  --extract, -e     Extract domains from stdin or file and output formatted JSON
  --merge, -m       Merge new domains with existing config file

Examples:
  1. Format current config file:
     node scripts/format-remotes.js --format

  2. Extract from Little Snitch output file:
     node scripts/format-remotes.js --extract raw-output.txt

  3. Pipe Little Snitch output:
     pbpaste | node scripts/format-remotes.js --extract

  4. Merge new domains with existing config:
     pbpaste | node scripts/format-remotes.js --merge
    `);
  }
}

module.exports = {
  extractDomainsFromText,
  formatRemotesJSON,
  createRemotesJSON
};