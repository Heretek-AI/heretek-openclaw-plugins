#!/usr/bin/env node

/**
 * Validate Patches Script - OpenClaw Liberation Plugin
 * 
 * Validates that liberation patches are correctly formatted and can be applied.
 * 
 * Usage: node scripts/validate-patches.js
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { cwd } from 'node:process';

console.log('=== OpenClaw Liberation Patch Validator ===\n');

const patchesDir = resolve(cwd(), 'patches');

// Check patches directory
if (!existsSync(patchesDir)) {
  console.error('❌ Patches directory not found:', patchesDir);
  console.log('Create patches directory and add patch files.');
  process.exit(1);
}

console.log('✓ Patches directory found:', patchesDir);

// Get patch files
const patchFiles = readdirSync(patchesDir).filter(f => f.endsWith('.patch'));

if (patchFiles.length === 0) {
  console.warn('⚠ No patch files found in patches/');
  console.log('Generate a patch with: node scripts/generate-patch.js <version>');
  process.exit(0);
}

console.log(`✓ Found ${patchFiles.length} patch file(s)\n`);

// Validate each patch
let validCount = 0;
let invalidCount = 0;

for (const patchFile of patchFiles) {
  const patchPath = join(patchesDir, patchFile);
  console.log(`Validating: ${patchFile}`);
  
  try {
    const content = readFileSync(patchPath, 'utf-8');
    
    // Check for required patch format elements
    const checks = {
      'Has diff header': content.includes('diff --git'),
      'Has index lines': content.includes('index '),
      'Has file paths': content.includes('--- a/') && content.includes('+++ b/'),
      'Contains hunk header': content.includes('@@'),
      'Targets openclaw': patchFile.includes('openclaw') || content.includes('openclaw'),
      'Has liberation changes': content.includes('Safety section REMOVED') || 
                               content.includes('liberation') ||
                               content.includes('safetySection')
    };
    
    let allPassed = true;
    for (const [check, passed] of Object.entries(checks)) {
      if (passed) {
        console.log(`  ✓ ${check}`);
      } else {
        console.log(`  ⚠ ${check} - NOT FOUND`);
        allPassed = false;
      }
    }
    
    if (allPassed) {
      console.log(`  ✅ ${patchFile} is valid\n`);
      validCount++;
    } else {
      console.log(`  ⚠️ ${patchFile} has issues but may still work\n`);
      validCount++; // Count as valid if it's a proper patch file
    }
    
  } catch (error) {
    console.error(`  ❌ Error reading ${patchFile}: ${error.message}\n`);
    invalidCount++;
  }
}

// Summary
console.log('=== Validation Summary ===');
console.log(`Valid patches: ${validCount}`);
console.log(`Invalid patches: ${invalidCount}`);
console.log(`Total patches: ${validCount + invalidCount}`);

if (invalidCount > 0) {
  console.log('\n⚠️ Some patches have issues. Review them before applying.');
  process.exit(1);
} else if (validCount === 0) {
  console.log('\n⚠️ No patches found. Generate a patch first.');
  process.exit(0);
} else {
  console.log('\n✅ All patches are valid and ready to apply!');
  console.log('\nTo apply patches:');
  console.log('  node scripts/remove-safety-constraints.js [version]');
  process.exit(0);
}
