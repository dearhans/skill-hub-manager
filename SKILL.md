---
name: skill-hub-manager
description: Use this skill when the user wants to create, find, sync, validate, repair, compare, or organize local AI Skills through natural language.
---

# Skill Hub Manager

Use this skill to act as the user's natural-language manager for a local Skill Hub. The user should not need to understand directories, YAML, CLI commands, platform paths, or sync internals.

## Product Promise

The user says what they want. You manage the Skills.

Supported MVP intents:

1. Create a new reusable Skill from a user-described workflow.
2. Find the best existing Skill for a task.
3. Preview a Skill's metadata, structure and files before using or changing it.
4. Sort and rank Skills by name, category, update time, size, or task fit.
5. Organize the Hub: reclassify, detect duplicates, find orphans and low-quality Skills.
6. Fuse multiple Skills into one unified Skill.
7. Sync Skills to configured AI platforms.
8. Check and repair the local Skill Hub.

## Default Interaction Rules

- Keep the user in baby mode by default: hide YAML, paths, scripts, and CLI commands unless the user asks for advanced mode.
- Ask at most one focused question when information is missing.
- Prefer a recommendation over a menu.
- Always tell the user the next sentence they can say to use the Skill.
- Convert technical errors into plain-language explanations.
- Do not delete, overwrite, merge, publish, or write to unknown external locations without explicit confirmation.
- Low-risk metadata fixes may be proposed or performed when safe; high-risk changes require confirmation.

## Local Hub Model

Assume the hub may contain these conceptual parts, even if not all exist yet:

```text
skill-hub/
├── skillhub.config.json
├── skills/
├── registry/index.json
└── logs/
```

This package includes an executable MVP CLI at `scripts/skillhub.js`. Use it when the user asks to initialize, create, validate, index, pick, sync, list, or repair an actual local Skill Hub. Keep CLI details hidden in baby mode; summarize results in plain language.

When working in a real filesystem, inspect actual files first. Do not invent existing Skills, paths, or sync results.

## Intent Routing

### Create Skill

Trigger examples:

- "帮我创建一个能力"
- "把这个方法沉淀成 Skill"
- "以后让 AI 按这个流程做"
- "Create a skill for..."

Procedure:

1. Understand the repeatable workflow, target user, input, output, and quality bar.
2. Search existing Skills or registry when available to avoid duplicates.
3. If an existing Skill fits, recommend enhancing or reusing it instead of creating another one.
4. If new Skill is needed, generate a lowercase hyphenated English `name` and clear Chinese name.
5. Create or draft a Skill package with lean `SKILL.md` and put long rules into `references/`.
6. Add Skill Hub metadata using `references/metadata-schema.md`.
7. Validate frontmatter and user-visible trigger wording.
8. If operating inside a Skill Hub root, run or emulate `scripts/skillhub.js create` and `build-index` so the registry is updated.
9. Return a concise success message and `say_this` examples.

Output format:

```text
已创建/已起草：[中文名]
适合：...
不适合：...
以后你可以直接说："..."
```

### Find Skill

Trigger examples:

- "我现在要做 X，用哪个能力？"
- "有没有适合 X 的 Skill？"
- "Which skill should I use for X?"

Procedure:

1. Read registry or inspect available Skill metadata; when inside a Hub root, prefer `scripts/skillhub.js pick --task ...`.
2. Match by capabilities, use cases, strengths, weaknesses, and trigger description.
3. Recommend one primary Skill.
4. Mention one non-recommended similar Skill only when useful.
5. Give the exact sentence the user can say next.

Do not show a long list by default.

### Preview Skill

Trigger examples:

- "这个 Skill 是干什么的？"
- "预览一下 X 这个能力"
- "X 里面有什么文件？"
- "Preview skill X"

Procedure:

1. When inside a Hub root, prefer `scripts/skillhub.js preview --name <skill>`; otherwise read the Skill's `SKILL.md` frontmatter and file tree directly.
2. Summarize in plain language: what it does, what it is best for, what it is not for, and its file structure.
3. Show the exact sentence the user can say next to invoke it.
4. Do not expose raw YAML or paths unless the user asks for advanced mode.

### Sort and Rank Skills

Trigger examples:

- "按更新时间排一下我的能力"
- "哪些能力最适合做 X？"
- "把能力按类别整理一下"
- "Sort my skills by X"

Procedure:

1. When inside a Hub root, prefer `scripts/skillhub.js sort --by <key> [--order asc|desc] [--task <task>]`.
2. Supported keys: `name`, `name_zh`, `category`, `updated`, `size`, `score` (task-fit score when `--task` is given).
3. Present a compact ranked list in plain language; keep the top few and summarize the rest.
4. For task-fit ranking, explain briefly why the top Skill fits best.

### Organize the Hub

Trigger examples:

- "整理一下我的能力库"
- "有没有重复的 Skill？"
- "把能力重新分个类"
- "Organize my skills"

Procedure:

1. When inside a Hub root, prefer `scripts/skillhub.js organize` (dry-run by default) to get a plan: reclassification suggestions, duplicate candidates, orphan files, empty directories, low-quality Skills.
2. Present the plan in plain language and ask which items to apply.
3. Apply changes only after explicit confirmation, and only with `--write`.
4. Never delete or move files without user confirmation.

### Fuse Skills

Trigger examples:

- "把 A 和 B 融合成一个能力"
- "合并这几个 Skill"
- "Fuse/merge these skills"

Procedure:

1. When inside a Hub root, prefer `scripts/skillhub.js merge --names <a,b,c> [--name <new>] [--zh <中文名>] [--desc <desc>]` (dry-run by default).
2. Confirm the source Skills and the target name with the user before writing.
3. Run with `--write` only after confirmation; the merged Skill keeps a `merged_from` record and a per-source capability section.
4. If the target name already exists, ask the user whether to overwrite (requires `--force`).
5. Report the merged Skill's capabilities and the next sentence the user can say to use it.

### Sync Skills

Trigger examples:

- "同步到所有平台"
- "让这个 Skill 在小浣熊里可用"
- "Sync my skills"

Procedure:

1. Inspect actual platform configuration before claiming support; when inside a Hub root, prefer `scripts/skillhub.js sync`.
2. Validate candidate Skills before syncing.
3. Sync only to configured/allowed local platform directories.
4. Report per-platform status: synced, skipped, not configured, failed.
5. Translate failures into plain language.

Never claim sync succeeded unless file writes or tool results prove it.

### Check and Repair

Trigger examples:

- "检查一下我的能力库"
- "这个 Skill 为什么不能用？"
- "修复 Skill Hub"

Procedure:

1. Scan actual Skill directories; when inside a Hub root, prefer `scripts/skillhub.js validate` and `scripts/skillhub.js repair`.
2. Check for `SKILL.md`, valid frontmatter, required trigger description, metadata completeness, duplicate names, and similar capabilities.
3. Auto-fix only low-risk missing metadata when the target file is clearly identified and the user has requested repair.
4. Ask confirmation before overwriting, deleting, merging, or moving Skills.
5. Return a short health report.

## Skill Package Rules

When creating or editing Skills:

- Folder name and frontmatter `name` must match.
- Use lowercase hyphenated English names.
- Keep `description` trigger-focused.
- Keep `SKILL.md` lean.
- Move long schemas, rubrics, examples, and checklists into `references/`.
- Avoid absolute user-local paths inside portable Skill packages.
- Do not include secrets, caches, generated output, or machine-specific config.

## Plain-Language Error Style

Bad:

```text
YAMLParseError: unexpected token
ENOENT
EACCES
```

Good:

```text
这个 Skill 的说明区格式有问题，我现在不能安全同步。
我可以只修复说明区，不改正文。是否继续？
```

## References

- `references/metadata-schema.md` — Skill Hub metadata fields.
- `references/core-flows.md` — Baby-mode user flows.
- `references/acceptance-checklist.md` — Acceptance and safety checklist.
- `references/cli-usage.md` — Executable MVP CLI commands and examples.
- `scripts/skillhub.js` — Local Skill Hub CLI for init/create/validate/build-index/list/pick/preview/sort/organize/merge/sync/repair.
- `templates/skillhub.config.json` — Starter platform configuration.
- `templates/README.md` — Starter Hub README.
