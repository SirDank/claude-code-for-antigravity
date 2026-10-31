#!/usr/bin/env node

/**
 * Generator and CI drift checker for Antigravity and Claude Code skill targets.
 * Validates skill frontmatter and synchronizes skills across targets.
 */

import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, cpSync } from 'node:fs';
import { resolve, join } from 'node:path';

const isCheck = process.argv.includes('--check');
const skillsDir = resolve('skills');
const errors = [];

if (!existsSync(skillsDir)) {
  console.error('Error: skills directory not found');
  process.exit(1);
}

const skillFolders = readdirSync(skillsDir, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

console.log(`Validating ${skillFolders.length} skills...`);

for (const folder of skillFolders) {
  const skillFile = join(skillsDir, folder, 'SKILL.md');
  if (!existsSync(skillFile)) {
    errors.push(`Missing SKILL.md in ${folder}`);
    continue;
  }

  const content = readFileSync(skillFile, 'utf-8');
  const lines = content.split(/\r?\n/);

  if (lines.length > 500) {
    errors.push(`Skill ${folder}/SKILL.md exceeds 500 lines (${lines.length} lines)`);
  }

  // Parse YAML frontmatter
  if (!content.startsWith('---')) {
    errors.push(`Skill ${folder}/SKILL.md missing opening frontmatter delimiter '---'`);
    continue;
  }

  const endDelim = content.indexOf('\n---', 3);
  if (endDelim === -1) {
    errors.push(`Skill ${folder}/SKILL.md missing closing frontmatter delimiter '---'`);
    continue;
  }

  const frontmatter = content.slice(3, endDelim);
  const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
  const descMatch = frontmatter.match(/^description:\s*(?:>-\s*)?([\s\S]+?)(?=\n[a-zA-Z_-]+:|\n---|$)/m);

  if (!nameMatch) {
    errors.push(`Skill ${folder} missing 'name' in frontmatter`);
  } else {
    const name = nameMatch[1].trim();
    if (name !== folder) {
      errors.push(`Skill ${folder} name '${name}' does not match directory name`);
    }
    if (name.length > 64) {
      errors.push(`Skill ${folder} name exceeds 64 characters`);
    }
    if (!/^[a-z0-9-]+$/.test(name)) {
      errors.push(`Skill ${folder} name must be lowercase kebab-case`);
    }
  }

  if (!descMatch) {
    errors.push(`Skill ${folder} missing 'description' in frontmatter`);
  } else {
    const desc = descMatch[1].replace(/\r?\n/g, ' ').trim();
    if (desc.length > 1024) {
      errors.push(`Skill ${folder} description exceeds 1,024 characters (${desc.length} chars)`);
    }
  }
}

if (errors.length > 0) {
  console.error('\nValidation errors found:');
  for (const err of errors) {
    console.error(`- ${err}`);
  }
  process.exit(1);
}

console.log('All skills passed validation checks.');

// Synchronization targets
const targets = [
  resolve('.agents', 'skills'),
  resolve('.claude', 'skills')
];

if (isCheck) {
  // Check for drift
  let drifted = false;
  for (const target of targets) {
    if (!existsSync(target)) {
      console.warn(`[WARN] Target directory does not exist: ${target}`);
      continue;
    }
    for (const folder of skillFolders) {
      const srcFile = join(skillsDir, folder, 'SKILL.md');
      const destFile = join(target, folder, 'SKILL.md');
      if (!existsSync(destFile)) {
        console.error(`[DRIFT] Missing destination skill file: ${destFile}`);
        drifted = true;
      } else {
        const srcContent = readFileSync(srcFile, 'utf-8').replace(/\r\n/g, '\n');
        const destContent = readFileSync(destFile, 'utf-8').replace(/\r\n/g, '\n');
        if (srcContent !== destContent) {
          console.error(`[DRIFT] Content mismatch in: ${destFile}`);
          drifted = true;
        }
      }
    }
  }

  if (drifted) {
    console.error('\nDrift check failed. Run "node scripts/build-targets.mjs" to synchronize.');
    process.exit(1);
  }
  console.log('CI Drift Check: Zero drift detected across targets.');
} else {
  // Sync files
  for (const target of targets) {
    if (!existsSync(target)) {
      mkdirSync(target, { recursive: true });
    }
    for (const folder of skillFolders) {
      const src = join(skillsDir, folder);
      const dest = join(target, folder);
      cpSync(src, dest, { recursive: true });
    }
  }
  console.log('Synchronized skills to .agents/skills/ and .claude/skills/');
}

