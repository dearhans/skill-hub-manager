#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const VERSION = '0.1.0';
const DEFAULT_CONFIG = {
  version: 1,
  registryDir: 'registry',
  skillsDir: 'skills',
  defaultCategory: 'productivity',
  categories: ['search', 'thinking', 'tools', 'writing', 'finance', 'development', 'productivity', 'design', 'education'],
  platforms: {
    raccoon: {
      enabled: true,
      path: expandHome('~/.box-agent/skills')
    }
  }
};

function expandHome(value) {
  if (!value || typeof value !== 'string') return value;
  if (value === '~') return os.homedir();
  if (value.startsWith('~/') || value.startsWith('~\\')) return path.join(os.homedir(), value.slice(2));
  return value;
}

function cwd() { return process.cwd(); }
function hubPath(...parts) { return path.join(cwd(), ...parts); }
function exists(p) { return fs.existsSync(p); }
function readText(p) { return fs.readFileSync(p, 'utf8'); }
function writeText(p, text) { ensureDir(path.dirname(p)); fs.writeFileSync(p, text, 'utf8'); }
function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }

function loadConfig(root = cwd()) {
  const configPath = path.join(root, 'skillhub.config.json');
  if (!exists(configPath)) return { ...DEFAULT_CONFIG };
  const user = JSON.parse(readText(configPath));
  return {
    ...DEFAULT_CONFIG,
    ...user,
    platforms: { ...DEFAULT_CONFIG.platforms, ...(user.platforms || {}) },
    categories: user.categories || DEFAULT_CONFIG.categories
  };
}

function saveConfig(root = cwd(), config = DEFAULT_CONFIG) {
  writeText(path.join(root, 'skillhub.config.json'), JSON.stringify(config, null, 2) + '\n');
}

function slugify(input) {
  const raw = String(input || '').trim().toLowerCase();
  const ascii = raw
    .replace(/[\u2018\u2019]/g, '')
    .replace(/[\u201c\u201d]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
  if (ascii) return ascii;
  return 'skill-' + Date.now().toString(36);
}

function inferCategory(text, config) {
  const t = String(text || '').toLowerCase();
  const rules = [
    ['finance', ['财报', '股票', '估值', '龙虎榜', 'financial', 'stock', 'valuation']],
    ['writing', ['写', '文案', '报告', '方案', '总结', 'writing', 'copy', 'proposal']],
    ['design', ['设计', '海报', 'ppt', '原型', 'poster', 'design', 'slide']],
    ['development', ['代码', '开发', '测试', 'bug', 'api', 'code', 'test', 'debug']],
    ['search', ['搜索', '检索', '调研', 'research', 'search']],
    ['education', ['教育', '课程', '教学', '学习', '教案', 'education', 'course']],
    ['thinking', ['决策', '分析', '复盘', '战略', '判断', 'think', 'strategy']],
    ['tools', ['工具', '转换', '批处理', '自动化', 'tool', 'convert']],
    ['productivity', ['会议', '任务', 'todo', '纪要', '效率', 'productivity', 'meeting']]
  ];
  for (const [cat, keys] of rules) {
    if (keys.some(k => t.includes(k)) && config.categories.includes(cat)) return cat;
  }
  return config.defaultCategory || 'productivity';
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) { args[key] = next; i++; }
      else args[key] = true;
    } else args._.push(a);
  }
  return args;
}

function usage() {
  return `Skill Hub CLI v${VERSION}

Usage:
  node scripts/skillhub.js <command> [options]

Commands:
  init                         Initialize a local Skill Hub in current directory
  create --name <name> --desc <desc> [--zh <中文名>] [--category <cat>]
  validate                     Validate skills and metadata
  build-index                  Build registry/index.json
  list                         List skills from registry or scan
  pick --task <task>           Recommend one skill for a task
  preview [--name <skill>]     Preview skill metadata, structure and files
  sort --by <key> [--order asc|desc] [--task <task>]
                               Sort skills by name/name_zh/category/updated/size/score
  organize [--write]           Plan or apply reclassification, dedup, cleanup
  merge --names <a,b,c> [--name <new>] [--zh <中文名>] [--desc <desc>] [--write]
                               Fuse multiple skills into one unified skill
  sync [--platform raccoon]    Sync skills to configured platform(s)
  repair [--write]             Fill low-risk missing metadata; dry-run by default
  help                         Show this help

Baby-mode examples:
  node scripts/skillhub.js init
  node scripts/skillhub.js create --name meeting-to-todos --zh 会议纪要转任务 --desc "把会议纪要整理成负责人、截止时间和下一步动作"
  node scripts/skillhub.js pick --task "我要整理会议纪要"
`;
}

function frontmatterOf(text) {
  if (!text.startsWith('---')) return { data: {}, body: text, raw: '' };
  const end = text.indexOf('\n---', 3);
  if (end === -1) return { data: {}, body: text, raw: '' };
  const raw = text.slice(3, end).trim();
  const body = text.slice(end + 4).replace(/^\r?\n/, '');
  return { data: parseSimpleYaml(raw), body, raw };
}

function parseSimpleYaml(raw) {
  const data = {};
  const lines = raw.split(/\r?\n/);
  let current = null;
  let blockKey = null;
  for (const line of lines) {
    if (!line.trim()) continue;
    const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (m) {
      current = m[1];
      blockKey = null;
      const value = m[2].trim();
      if (value === '>' || value === '|') {
        data[current] = '';
        blockKey = current;
      } else {
        data[current] = value ? unquote(value) : [];
      }
      continue;
    }
    const listMatch = line.match(/^\s*-\s+(.*)$/);
    if (listMatch && current && !blockKey) {
      if (!Array.isArray(data[current])) data[current] = [];
      data[current].push(unquote(listMatch[1].trim()));
      continue;
    }
    if (blockKey && /^\s+/.test(line)) {
      data[blockKey] = `${data[blockKey]} ${line.trim()}`.trim();
    }
  }
  return data;
}

function unquote(v) {
  return String(v).replace(/^['"]|['"]$/g, '');
}

function yamlValue(value) {
  if (Array.isArray(value)) {
    if (!value.length) return '[]';
    return '\n' + value.map(v => `  - ${String(v).replace(/\n/g, ' ')}`).join('\n');
  }
  if (value && typeof value === 'object') {
    const lines = [''];
    for (const [k, v] of Object.entries(value)) lines.push(`  ${k}: ${v}`);
    return lines.join('\n');
  }
  const s = String(value ?? '').replace(/\n/g, ' ').trim();
  if (!s) return '""';
  if (s === '>' || s === '|') return JSON.stringify(s);
  if (/[:#\[\]{}]|^[-?]|\s$/.test(s)) return JSON.stringify(s);
  return s;
}

function isMissingText(value) {
  const s = String(value ?? '').trim();
  return !s || s === '>' || s === '|';
}

function buildFrontmatter(data) {
  const order = ['name','description','name_zh','desc_zh','category','capabilities','use_cases','best_for','not_for','strengths','weaknesses','say_this'];
  const keys = [...order.filter(k => k in data), ...Object.keys(data).filter(k => !order.includes(k))];
  return '---\n' + keys.map(k => `${k}: ${yamlValue(data[k])}`).join('\n') + '\n---\n';
}

function skillTemplate(meta) {
  const fm = buildFrontmatter(meta);
  return `${fm}\n# ${meta.name_zh || meta.name}\n\nUse this skill when the user needs ${meta.desc_zh || meta.description}.\n\n## Baby-mode behavior\n\n- Understand the user's goal before exposing implementation details.\n- Ask at most one focused question when required information is missing.\n- Return the next sentence the user can say to invoke this skill.\n- Do not expose YAML, paths, or CLI commands unless the user asks for advanced mode.\n\n## Workflow\n\n1. Clarify the target outcome.\n2. Apply the reusable method encoded by this skill.\n3. Produce a concise, usable result.\n4. Tell the user the next natural-language action.\n\n## Not for\n\n${(meta.not_for || ['Tasks outside this skill boundary']).map(x => `- ${x}`).join('\n')}\n`;
}

function initHub() {
  const root = cwd();
  const configPath = path.join(root, 'skillhub.config.json');
  if (exists(configPath)) return result('ok', 'Skill Hub already initialized.', { path: configPath });
  saveConfig(root, DEFAULT_CONFIG);
  ensureDir(path.join(root, 'skills'));
  ensureDir(path.join(root, 'registry'));
  ensureDir(path.join(root, 'logs'));
  writeText(path.join(root, 'README.md'), `# Skill Hub\n\nA local source of truth for AI Skills.\n\nBaby-mode commands are usually invoked by an agent, not by end users.\n\n## Core actions\n\n- Create a skill from a natural-language goal.\n- Build registry/index.json.\n- Pick the best skill for a task.\n- Sync skills to configured platforms.\n- Validate and repair low-risk metadata gaps.\n`);
  writeText(path.join(root, 'registry', 'index.json'), '[]\n');
  return result('ok', 'Skill Hub initialized.', { root });
}

function makeMeta(args, config) {
  const name = slugify(args.name || args.zh || args.desc || args._.join(' '));
  const zh = args.zh || args['name-zh'] || args.name || name;
  const desc = args.desc || args.description || `Use this skill when handling ${zh}.`;
  const category = args.category || inferCategory(`${zh} ${desc}`, config);
  const capabilities = splitList(args.capabilities) || [zh, desc].filter(Boolean).slice(0, 2);
  const useCases = splitList(args['use-cases'] || args.use_cases) || [desc];
  const bestFor = splitList(args['best-for'] || args.best_for) || useCases;
  const notFor = splitList(args['not-for'] || args.not_for) || ['Tasks that require external publishing, deletion, or unsafe side effects without confirmation'];
  const say = splitList(args['say-this'] || args.say_this) || [`用${zh}帮我处理这个任务`];
  return {
    name,
    description: desc,
    name_zh: zh,
    desc_zh: desc,
    category,
    capabilities,
    use_cases: useCases,
    best_for: bestFor,
    not_for: notFor,
    strengths: splitList(args.strengths) || ['流程清晰', '适合重复任务沉淀'],
    weaknesses: splitList(args.weaknesses) || ['不替代人工确认高风险操作'],
    say_this: say
  };
}

function splitList(value) {
  if (!value) return null;
  const arr = String(value).split(/[，,;；|]/).map(s => s.trim()).filter(Boolean);
  return arr.length ? arr : null;
}

function createSkill(args) {
  const config = loadConfig();
  if (!args.name && !args.zh && !args.desc && !args.description) {
    return result('error', 'Missing skill name or description. Use --name/--zh/--desc.', {});
  }
  const meta = makeMeta(args, config);
  const dir = path.join(cwd(), config.skillsDir, meta.category, meta.name);
  const skillFile = path.join(dir, 'SKILL.md');
  if (exists(skillFile) && !args.force) {
    return result('needs_confirmation', 'Skill already exists. Re-run with --force only after user confirmation.', { path: skillFile });
  }
  writeText(skillFile, skillTemplate(meta));
  const index = buildIndex({ quiet: true });
  return result('ok', `Created skill: ${meta.name_zh}`, {
    path: skillFile,
    say_this: meta.say_this,
    index_count: index.data.length
  });
}

function scanSkills(root = cwd()) {
  const config = loadConfig(root);
  const base = path.join(root, config.skillsDir);
  const items = [];
  if (!exists(base)) return items;
  for (const categoryEntry of fs.readdirSync(base, { withFileTypes: true })) {
    if (!categoryEntry.isDirectory()) continue;
    const categoryDir = path.join(base, categoryEntry.name);
    for (const skillEntry of fs.readdirSync(categoryDir, { withFileTypes: true })) {
      if (!skillEntry.isDirectory()) continue;
      const p = path.join(categoryDir, skillEntry.name, 'SKILL.md');
      if (!exists(p)) continue;
      const text = readText(p);
      const fm = frontmatterOf(text);
      const rel = path.relative(root, p).replace(/\\/g, '/');
      const inferredCategory = categoryEntry.name || config.defaultCategory;
      items.push({ file: rel, absFile: p, meta: fm.data, category: fm.data.category || inferredCategory });
    }
  }
  return items;
}

function normalizeRecord(item, platformStates = {}) {
  const m = item.meta || {};
  const name = m.name || slugify(path.basename(path.dirname(item.file || 'skill')));
  return {
    id: name,
    name,
    name_zh: m.name_zh || m.name || name,
    plain_desc: m.desc_zh || m.description || '',
    category: m.category || item.category || 'productivity',
    capabilities: asArray(m.capabilities),
    best_for: asArray(m.best_for || m.use_cases),
    not_for: asArray(m.not_for),
    strengths: asArray(m.strengths),
    weaknesses: asArray(m.weaknesses),
    say_this: asArray(m.say_this).length ? asArray(m.say_this) : [`用${m.name_zh || name}帮我处理这个任务`],
    source: item.file,
    platforms: platformStates[name] || {}
  };
}

function asArray(v) {
  if (Array.isArray(v)) return v.filter(Boolean);
  if (typeof v === 'string' && v.trim()) return [v.trim()];
  return [];
}

function buildIndex(opts = {}) {
  const config = loadConfig();
  const records = scanSkills().map(item => normalizeRecord(item));
  records.sort((a, b) => a.name.localeCompare(b.name));
  const out = path.join(cwd(), config.registryDir, 'index.json');
  writeText(out, JSON.stringify(records, null, 2) + '\n');
  if (!opts.quiet) console.log(JSON.stringify(resultObj('ok', 'Index built.', { path: out, count: records.length }), null, 2));
  return resultObj('ok', 'Index built.', { path: out, count: records.length, data: records });
}

function validate() {
  const config = loadConfig();
  const items = scanSkills();
  const issues = [];
  const seen = new Map();
  for (const item of items) {
    const m = item.meta;
    const file = item.file;
    for (const k of ['name', 'description']) {
      if (!m[k]) issues.push({ level: 'error', file, field: k, message: `Missing required field: ${k}` });
    }
    for (const k of ['name_zh', 'desc_zh', 'category', 'say_this']) {
      if (!m[k] || (Array.isArray(m[k]) && !m[k].length)) issues.push({ level: 'warning', file, field: k, message: `Missing baby-mode metadata: ${k}` });
    }
    if (m.name) {
      if (seen.has(m.name)) issues.push({ level: 'error', file, field: 'name', message: `Duplicate skill name with ${seen.get(m.name)}` });
      seen.set(m.name, file);
    }
    if (m.category && !config.categories.includes(m.category)) {
      issues.push({ level: 'warning', file, field: 'category', message: `Unknown category: ${m.category}` });
    }
  }
  return result('ok', 'Validation complete.', {
    skills: items.length,
    errors: issues.filter(i => i.level === 'error').length,
    warnings: issues.filter(i => i.level === 'warning').length,
    issues
  });
}

function listSkills() {
  const config = loadConfig();
  const indexPath = path.join(cwd(), config.registryDir, 'index.json');
  let data = [];
  if (exists(indexPath)) data = JSON.parse(readText(indexPath));
  else data = scanSkills().map(item => normalizeRecord(item));
  return result('ok', 'Skills listed.', { count: data.length, skills: data.map(s => ({ name: s.name, name_zh: s.name_zh, category: s.category, say_this: s.say_this })) });
}

function pick(args) {
  const task = args.task || args._.join(' ');
  if (!task) return result('error', 'Missing --task.', {});
  const config = loadConfig();
  const indexPath = path.join(cwd(), config.registryDir, 'index.json');
  const data = exists(indexPath) ? JSON.parse(readText(indexPath)) : scanSkills().map(item => normalizeRecord(item));
  const scored = data.map(s => ({ skill: s, score: scoreSkill(s, task) })).sort((a, b) => b.score - a.score);
  const best = scored[0];
  if (!best || best.score <= 0) return result('ok', 'No strong match found. Consider creating a new skill.', { task, recommendation: null });
  const alternatives = scored.slice(1, 3).filter(x => x.score > 0).map(x => x.skill.name);
  return result('ok', `Recommended: ${best.skill.name_zh || best.skill.name}`, {
    task,
    recommendation: best.skill,
    score: best.score,
    alternatives,
    say_this: best.skill.say_this && best.skill.say_this[0]
  });
}

function scoreSkill(skill, task) {
  const hay = [skill.name, skill.name_zh, skill.description, skill.desc_zh, skill.plain_desc, skill.category, ...(skill.capabilities || []), ...(skill.best_for || []), ...(skill.say_this || [])].join(' ').toLowerCase();
  const query = String(task || '').toLowerCase();
  const words = query.split(/[\s,，。；;：:、]+/).filter(Boolean);
  const names = [skill.name, skill.name_zh].filter(Boolean).map(x => String(x).toLowerCase());
  let score = 0;
  for (const n of names) {
    if (n && query.includes(n)) score += 40;
    for (const part of n.split(/[-_\s]+/).filter(Boolean)) {
      if (part.length >= 2 && query.includes(part)) score += 14;
    }
  }
  for (const w of words) {
    if (!w) continue;
    if (hay.includes(w)) score += Math.max(1, Math.min(8, w.length));
    for (const g of grams(w)) if (hay.includes(g)) score += g.length >= 2 ? 2 : 0;
  }
  for (const g of grams(query)) if (hay.includes(g)) score += 1;
  if (hay.includes(query)) score += 10;
  return score;
}

function grams(text) {
  const clean = String(text || '').replace(/[\s,，。；;：:、]/g, '');
  const out = [];
  for (let i = 0; i < clean.length - 1; i++) out.push(clean.slice(i, i + 2));
  return out;
}

function repair(args) {
  const config = loadConfig();
  const items = scanSkills();
  const changes = [];
  for (const item of items) {
    const text = readText(item.absFile);
    const fm = frontmatterOf(text);
    const m = { ...fm.data };
    let changed = false;
    if (isMissingText(m.name)) { m.name = slugify(path.basename(path.dirname(item.absFile))); changed = true; }
    if (isMissingText(m.description)) { m.description = `Use this skill when handling ${m.name}.`; changed = true; }
    if (isMissingText(m.name_zh)) { m.name_zh = m.name; changed = true; }
    if (isMissingText(m.desc_zh)) { m.desc_zh = m.description; changed = true; }
    const pathCategory = item.category || inferCategory(`${m.name_zh} ${m.desc_zh}`, config);
    if (isMissingText(m.category) || !config.categories.includes(m.category)) { m.category = pathCategory; changed = true; }
    if (!asArray(m.say_this).length) { m.say_this = [`用${m.name_zh}帮我处理这个任务`]; changed = true; }
    if (changed) {
      changes.push({ file: item.file, fields: Object.keys(m).filter(k => JSON.stringify(m[k]) !== JSON.stringify(fm.data[k])) });
      if (args.write) writeText(item.absFile, buildFrontmatter(m) + '\n' + fm.body);
    }
  }
  if (args.write) buildIndex({ quiet: true });
  return result('ok', args.write ? 'Repair applied.' : 'Repair dry-run complete.', { write: !!args.write, changes });
}

function findSkill(items, name) {
  const key = String(name || '').trim().toLowerCase();
  return items.find(i => {
    const dirName = path.basename(path.dirname(i.absFile)).toLowerCase();
    return (i.meta.name || '').toLowerCase() === key
      || (i.meta.name_zh || '').toLowerCase() === key
      || dirName === key
      || (i.meta.name || '').toLowerCase().includes(key)
      || (i.meta.name_zh || '').toLowerCase().includes(key);
  });
}

function walkFiles(dir) {
  const out = [];
  if (!exists(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(p));
    else out.push(p);
  }
  return out;
}

function dirSize(dir) {
  let total = 0;
  if (!exists(dir)) return total;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) total += dirSize(p);
    else total += fs.statSync(p).size;
  }
  return total;
}

function extractHeadings(body) {
  const out = [];
  for (const line of String(body || '').split(/\r?\n/)) {
    const m = line.match(/^(#{1,4})\s+(.*)$/);
    if (m) out.push({ level: m[1].length, title: m[2].trim() });
  }
  return out;
}

function previewSkill(item) {
  const text = readText(item.absFile);
  const fm = frontmatterOf(text);
  const dir = path.dirname(item.absFile);
  const files = walkFiles(dir).map(f => path.relative(dir, f).replace(/\\/g, '/'));
  const stat = fs.statSync(item.absFile);
  return {
    name: fm.data.name || path.basename(dir),
    name_zh: fm.data.name_zh || fm.data.name || '',
    category: fm.data.category || item.category,
    description: fm.data.description || '',
    desc_zh: fm.data.desc_zh || '',
    capabilities: asArray(fm.data.capabilities),
    best_for: asArray(fm.data.best_for),
    not_for: asArray(fm.data.not_for),
    strengths: asArray(fm.data.strengths),
    weaknesses: asArray(fm.data.weaknesses),
    say_this: asArray(fm.data.say_this),
    file: item.file,
    size_bytes: stat.size,
    updated_at: stat.mtime.toISOString(),
    structure: extractHeadings(fm.body),
    files
  };
}

function preview(args) {
  const name = (args.name || args._.join(' ')).trim();
  const items = scanSkills();
  if (name) {
    const item = findSkill(items, name);
    if (!item) return result('error', `Skill not found: ${name}`, {});
    return result('ok', `Preview: ${item.meta.name_zh || item.meta.name || name}`, { preview: previewSkill(item) });
  }
  return result('ok', 'Preview all skills.', { count: items.length, previews: items.map(previewSkill) });
}

function sortSkills(args) {
  const config = loadConfig();
  const by = args.by || 'name';
  const order = String(args.order || 'asc').toLowerCase() === 'desc' ? -1 : 1;
  const indexPath = path.join(cwd(), config.registryDir, 'index.json');
  const data = exists(indexPath) ? JSON.parse(readText(indexPath)) : scanSkills().map(item => normalizeRecord(item));
  const items = scanSkills();
  const statMap = {};
  for (const item of items) {
    const key = item.meta.name || path.basename(path.dirname(item.absFile));
    statMap[key] = { mtime: fs.statSync(item.absFile).mtimeMs, size: dirSize(path.dirname(item.absFile)) };
  }
  const valid = ['name', 'name_zh', 'category', 'updated', 'size', 'score'];
  if (!valid.includes(by)) return result('error', `Unknown sort key: ${by}. Valid: ${valid.join(', ')}`, {});
  const getter = {
    name: a => String(a.name || '').toLowerCase(),
    name_zh: a => String(a.name_zh || a.name || ''),
    category: a => String(a.category || ''),
    updated: a => statMap[a.name] ? statMap[a.name].mtime : 0,
    size: a => statMap[a.name] ? statMap[a.name].size : 0,
    score: a => args.task ? scoreSkill(a, args.task) : 0
  }[by];
  const sorted = [...data].sort((a, b) => {
    const va = getter(a);
    const vb = getter(b);
    const cmp = (typeof va === 'string' && typeof vb === 'string') ? va.localeCompare(vb, 'zh') : (va - vb);
    return cmp * order;
  });
  return result('ok', `Skills sorted by ${by} (${args.order || 'asc'}).`, {
    by, order: args.order || 'asc', count: sorted.length,
    skills: sorted.map(s => ({
      name: s.name,
      name_zh: s.name_zh,
      category: s.category,
      updated_at: statMap[s.name] ? new Date(statMap[s.name].mtime).toISOString() : null,
      size_bytes: statMap[s.name] ? statMap[s.name].size : null,
      score: by === 'score' ? getter(s) : null
    }))
  });
}

function organize(args) {
  const config = loadConfig();
  const items = scanSkills();
  const plan = { reclassify: [], duplicates: [], orphans: [], empty_dirs: [], low_quality: [] };
  const base = path.join(cwd(), config.skillsDir);
  for (const item of items) {
    const m = item.meta;
    if (!m.category || !config.categories.includes(m.category)) {
      const suggested = inferCategory(`${m.name_zh || ''} ${m.desc_zh || m.description || ''}`, config);
      plan.reclassify.push({ file: item.file, current: m.category || '(none)', suggested });
    }
  }
  const seen = new Map();
  for (const item of items) {
    const m = item.meta;
    const nameKey = (m.name || '').toLowerCase();
    const zhKey = (m.name_zh || '').trim();
    const descKey = (m.desc_zh || m.description || '').trim();
    let dup = null;
    let reason = '';
    if (nameKey && seen.has('name:' + nameKey)) { dup = seen.get('name:' + nameKey); reason = 'same name'; }
    else if (zhKey && seen.has('zh:' + zhKey)) { dup = seen.get('zh:' + zhKey); reason = 'same name_zh'; }
    else if (descKey && seen.has('desc:' + descKey)) { dup = seen.get('desc:' + descKey); reason = 'same description'; }
    if (dup) plan.duplicates.push({ file: item.file, duplicate_of: dup, reason });
    else {
      if (nameKey) seen.set('name:' + nameKey, item.file);
      if (zhKey) seen.set('zh:' + zhKey, item.file);
      if (descKey) seen.set('desc:' + descKey, item.file);
    }
  }
  if (exists(base)) {
    for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
      if (entry.isFile()) plan.orphans.push(path.join(base, entry.name));
    }
    for (const categoryEntry of fs.readdirSync(base, { withFileTypes: true })) {
      if (!categoryEntry.isDirectory()) continue;
      const categoryDir = path.join(base, categoryEntry.name);
      const sub = fs.readdirSync(categoryDir, { withFileTypes: true });
      if (!sub.length) { plan.empty_dirs.push(categoryDir); continue; }
      for (const skillEntry of sub) {
        if (!skillEntry.isDirectory()) continue;
        const skillDir = path.join(categoryDir, skillEntry.name);
        if (!fs.readdirSync(skillDir).length) plan.empty_dirs.push(skillDir);
      }
    }
  }
  for (const item of items) {
    const m = item.meta;
    const missing = [];
    if (!m.name_zh) missing.push('name_zh');
    if (!m.desc_zh && !m.description) missing.push('desc_zh');
    if (!asArray(m.capabilities).length) missing.push('capabilities');
    if (!asArray(m.say_this).length) missing.push('say_this');
    if (missing.length >= 2) plan.low_quality.push({ file: item.file, missing });
  }
  if (args.write) {
    const applied = [];
    for (const r of plan.reclassify) {
      const item = items.find(i => i.file === r.file);
      if (!item) continue;
      const text = readText(item.absFile);
      const fm = frontmatterOf(text);
      const m = { ...fm.data, category: r.suggested };
      writeText(item.absFile, buildFrontmatter(m) + '\n' + fm.body);
      applied.push({ file: r.file, action: 'reclassify', category: r.suggested });
    }
    buildIndex({ quiet: true });
    return result('ok', 'Organize applied.', {
      write: true, applied,
      remaining: { duplicates: plan.duplicates, orphans: plan.orphans, empty_dirs: plan.empty_dirs, low_quality: plan.low_quality }
    });
  }
  return result('ok', 'Organize plan ready (dry-run).', { write: false, plan });
}

function mergeMeta(targets, base, config) {
  const union = (key) => {
    const out = [];
    for (const t of targets) for (const v of asArray(t.meta[key])) if (!out.includes(v)) out.push(v);
    return out;
  };
  const category = targets[0].meta.category && config.categories.includes(targets[0].meta.category)
    ? targets[0].meta.category
    : inferCategory(`${base.name_zh} ${base.desc_zh}`, config);
  return {
    name: base.name,
    description: base.description,
    name_zh: base.name_zh,
    desc_zh: base.desc_zh,
    category,
    capabilities: union('capabilities'),
    use_cases: union('use_cases'),
    best_for: union('best_for'),
    not_for: union('not_for'),
    strengths: union('strengths'),
    weaknesses: union('weaknesses'),
    say_this: union('say_this'),
    merged_from: targets.map(t => t.meta.name || path.basename(path.dirname(t.absFile)))
  };
}

function mergeBody(targets, merged) {
  const lines = [];
  lines.push(`# ${merged.name_zh}`);
  lines.push('');
  lines.push(`Use this skill when the user needs ${merged.desc_zh}.`);
  lines.push('');
  lines.push('## Capabilities');
  lines.push('');
  for (const c of merged.capabilities) lines.push(`- ${c}`);
  lines.push('');
  lines.push('## 来源能力');
  lines.push('');
  for (const t of targets) {
    const fm = frontmatterOf(readText(t.absFile));
    const zh = t.meta.name_zh || t.meta.name || path.basename(path.dirname(t.absFile));
    lines.push(`### ${zh}`);
    lines.push('');
    const stripped = fm.body.replace(/^#\s+.*\n+/, '').trim();
    lines.push(stripped);
    lines.push('');
  }
  lines.push('## Not for');
  lines.push('');
  for (const n of merged.not_for) lines.push(`- ${n}`);
  lines.push('');
  return lines.join('\n');
}

function mergeSkills(args) {
  const config = loadConfig();
  const names = splitList(args.names || args.ids || args._.join(','));
  if (!names || names.length < 2) return result('error', 'Need at least two skills to merge. Use --names a,b,c.', {});
  const items = scanSkills();
  const targets = names.map(n => findSkill(items, n)).filter(Boolean);
  if (targets.length !== names.length) {
    return result('error', 'Some skills were not found.', {
      requested: names,
      found: targets.map(t => t.meta.name || path.basename(path.dirname(t.absFile)))
    });
  }
  const newName = args.name || slugify(args.zh || targets.map(t => t.meta.name || path.basename(path.dirname(t.absFile))).join('-'));
  if (/^skill-[a-z0-9]+$/.test(newName) && !args.name) {
    return result('error', 'Cannot derive an English slug from Chinese names. Provide --name <english-slug>.', {});
  }
  const newZh = args.zh || targets.map(t => t.meta.name_zh || t.meta.name || path.basename(path.dirname(t.absFile))).join('+');
  const newDesc = args.desc || `融合自 ${targets.map(t => t.meta.name_zh || t.meta.name).join('、')} 的能力，统一入口处理相关任务。`;
  const merged = mergeMeta(targets, { name: newName, name_zh: newZh, description: newDesc, desc_zh: newDesc }, config);
  const body = mergeBody(targets, merged);
  const dir = path.join(cwd(), config.skillsDir, merged.category, newName);
  const skillFile = path.join(dir, 'SKILL.md');
  if (exists(skillFile) && !args.force) {
    return result('needs_confirmation', 'Target skill already exists. Re-run with --force after user confirmation.', { path: skillFile });
  }
  if (args.write) {
    writeText(skillFile, buildFrontmatter(merged) + '\n' + body);
    buildIndex({ quiet: true });
  }
  return result('ok', args.write ? 'Skills merged.' : 'Merge plan ready (dry-run).', {
    write: !!args.write,
    path: skillFile,
    sources: targets.map(t => t.file),
    merged: { name: newName, name_zh: newZh, category: merged.category, capabilities: merged.capabilities, say_this: merged.say_this }
  });
}

function sync(args) {
  const config = loadConfig();
  const platformFilter = args.platform;
  const platforms = Object.entries(config.platforms || {}).filter(([name, p]) => p && p.enabled !== false && (!platformFilter || platformFilter === name));
  const items = scanSkills();
  const results = [];
  if (!platforms.length) return result('ok', 'No enabled platforms found.', { results });
  for (const [platform, pconf] of platforms) {
    const targetRoot = expandHome(pconf.path);
    if (!targetRoot) {
      results.push({ platform, status: 'not_configured', message: 'Platform path is not configured.' });
      continue;
    }
    try {
      ensureDir(targetRoot);
      for (const item of items) {
        const record = normalizeRecord(item);
        const sourceDir = path.dirname(item.absFile);
        const targetDir = path.join(targetRoot, record.name);
        copyDir(sourceDir, targetDir, { overwrite: true });
      }
      results.push({ platform, status: 'synced', path: targetRoot, count: items.length });
    } catch (err) {
      results.push({ platform, status: 'failed', path: targetRoot, message: humanError(err) });
    }
  }
  return result('ok', 'Sync complete.', { results });
}

function copyDir(src, dest, opts = {}) {
  ensureDir(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const sp = path.join(src, entry.name);
    const dp = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(sp, dp, opts);
    else {
      if (exists(dp) && !opts.overwrite) continue;
      fs.copyFileSync(sp, dp);
    }
  }
}

function humanError(err) {
  const code = err && err.code;
  if (code === 'EACCES' || code === 'EPERM') return '没有写入权限。请确认目录权限或换一个同步路径。';
  if (code === 'ENOENT') return '目标目录不存在或路径无法访问。';
  return err && err.message ? err.message : '未知错误。';
}

function result(status, message, data) {
  console.log(JSON.stringify(resultObj(status, message, data), null, 2));
}

function resultObj(status, message, data) {
  return { status, message, data: data || {} };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._.shift() || 'help';
  try {
    if (cmd === 'help' || cmd === '--help' || cmd === '-h') { console.log(usage()); return; }
    if (cmd === 'init') return initHub();
    if (cmd === 'create') return createSkill(args);
    if (cmd === 'validate') return validate();
    if (cmd === 'build-index') return buildIndex();
    if (cmd === 'list') return listSkills();
    if (cmd === 'pick') return pick(args);
    if (cmd === 'preview') return preview(args);
    if (cmd === 'sort') return sortSkills(args);
    if (cmd === 'organize') return organize(args);
    if (cmd === 'merge') return mergeSkills(args);
    if (cmd === 'sync') return sync(args);
    if (cmd === 'repair') return repair(args);
    console.error(`Unknown command: ${cmd}\n`);
    console.log(usage());
    process.exitCode = 1;
  } catch (err) {
    console.error(JSON.stringify(resultObj('error', humanError(err), { raw: err.message }), null, 2));
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = { initHub, createSkill, validate, buildIndex, listSkills, pick, repair, sync, preview, sortSkills, organize, mergeSkills, parseSimpleYaml, frontmatterOf, slugify, inferCategory };
