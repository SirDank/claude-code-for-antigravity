import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

test('Antigravity Plugin manifest compliance', () => {
  const pluginPath = resolve('.antigravity-plugin', 'plugin.json');
  assert.ok(existsSync(pluginPath), 'plugin.json must exist');

  const content = JSON.parse(readFileSync(pluginPath, 'utf-8'));
  
  // Marketplace naming rules: must not start with forbidden prefixes
  const forbiddenPrefixes = ['antigravity', 'gemini', 'claude', 'cursor'];
  for (const prefix of forbiddenPrefixes) {
    assert.ok(
      !content.name.toLowerCase().startsWith(prefix),
      `Plugin name '${content.name}' must not start with '${prefix}'`
    );
    assert.ok(
      !content.displayName.toLowerCase().startsWith(prefix),
      `Plugin displayName '${content.displayName}' must not start with '${prefix}'`
    );
  }

  assert.match(content.name, /^[a-z0-9-]+$/, 'name must be kebab-case');
  assert.ok(content.suggestedPrompts.length <= 3, 'suggestedPrompts should have at most 3 items');
  assert.ok(content.description && content.description.length <= 1024, 'description must be under 1024 chars');
});

test('Skills compliance and frontmatter validation', () => {
  const skillsDir = resolve('skills');
  const folders = readdirSync(skillsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  assert.ok(folders.length >= 2, 'Must have at least 2 core skills');
  assert.ok(folders.includes('claude'), 'Must include unified claude skill');
  assert.ok(folders.includes('claude-setup'), 'Must include claude-setup skill');

  for (const folder of folders) {
    const file = join(skillsDir, folder, 'SKILL.md');
    assert.ok(existsSync(file), `SKILL.md must exist in ${folder}`);

    const text = readFileSync(file, 'utf-8');
    const lines = text.split(/\r?\n/);
    assert.ok(lines.length <= 500, `Skill ${folder} must not exceed 500 lines`);

    assert.ok(text.startsWith('---'), `Skill ${folder} missing opening frontmatter`);
    const end = text.indexOf('\n---', 3);
    assert.ok(end !== -1, `Skill ${folder} missing closing frontmatter`);

    const fm = text.slice(3, end);
    const nameMatch = fm.match(/^name:\s*(.+)$/m);
    assert.ok(nameMatch, `Skill ${folder} missing name in frontmatter`);
    assert.equal(nameMatch[1].trim(), folder, `Skill ${folder} name must match directory`);

    const descMatch = fm.match(/^description:\s*(?:>-\s*)?([\s\S]+?)(?=\n[a-zA-Z_-]+:|\n---|$)/m);
    assert.ok(descMatch, `Skill ${folder} missing description in frontmatter`);
    const desc = descMatch[1].replace(/\r?\n/g, ' ').trim();
    assert.ok(desc.length <= 1024, `Skill ${folder} description exceeds 1024 chars`);
  }
});

test('Hooks configuration format', () => {
  const hooksFile = resolve('hooks.json');
  assert.ok(existsSync(hooksFile), 'hooks.json must exist');

  const content = JSON.parse(readFileSync(hooksFile, 'utf-8'));
  assert.ok(content['claude-bridge-session'], 'Hook group claude-bridge-session must be configured');
  assert.ok(Array.isArray(content['claude-bridge-session'].SessionStart), 'SessionStart hook must be an array');
  assert.ok(Array.isArray(content['claude-bridge-session'].PreToolUse), 'PreToolUse hook must be an array');
});

