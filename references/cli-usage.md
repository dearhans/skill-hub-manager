# Skillhub CLI Usage

Use `scripts/skillhub.js` only as the executable core behind baby-mode natural language operations.
Do not expose commands to ordinary users unless they ask for advanced mode.

## Runtime

Use Node.js. In Office Raccoon host tasks, prefer `$BOX_AGENT_NODE` when invoking from shell.

## Commands

### Initialize a hub

```bash
node scripts/skillhub.js init
```

Creates:

- `skillhub.config.json`
- `skills/`
- `registry/index.json`
- `logs/`
- `README.md`

### Create a skill

```bash
node scripts/skillhub.js create --name meeting-to-todos --zh 会议纪要转任务 --desc "把会议纪要整理成负责人、截止时间和下一步动作"
```

Returns JSON with path and `say_this`.

### Validate

```bash
node scripts/skillhub.js validate
```

Checks required fields, baby-mode metadata, duplicate names, and category validity.

### Build index

```bash
node scripts/skillhub.js build-index
```

Writes `registry/index.json`.

### Pick a skill

```bash
node scripts/skillhub.js pick --task "我要整理会议纪要"
```

Returns a single recommendation when there is a match.

### Preview a skill

```bash
node scripts/skillhub.js preview --name 会议纪要转任务
node scripts/skillhub.js preview
```

Shows metadata (name, name_zh, category, description, capabilities, best_for, not_for, say_this), file size, update time, heading structure, and file list. Without `--name`, lists all skills with a one-line summary.

### Sort skills

```bash
node scripts/skillhub.js sort --by name_zh
node scripts/skillhub.js sort --by updated --order desc
node scripts/skillhub.js sort --by score --task "整理会议纪要" --order desc
```

Supported `--by` keys: `name`, `name_zh`, `category`, `updated`, `size`, `score`. `score` requires `--task` and ranks by task-fit. `--order` is `asc` (default) or `desc`.

### Organize the hub

```bash
node scripts/skillhub.js organize
node scripts/skillhub.js organize --write
```

Dry-run by default. Produces a plan with `reclassify` (category suggestions), `duplicates` (same name / name_zh / description), `orphans` (files not referenced by any SKILL.md), `empty_dirs`, and `low_quality` (missing key metadata). `--write` applies reclassification and removes empty directories only after user confirmation.

### Fuse skills

```bash
node scripts/skillhub.js merge --names meeting-to-todos,meeting-minutes --name meeting-hub --zh 会议处理中心 --desc "统一处理会议纪要、任务提取与纪要整理"
node scripts/skillhub.js merge --names a,b --name merged --zh 融合技能 --write
```

Dry-run by default. Merges frontmatter (capabilities, use_cases, best_for, say_this, strengths, weaknesses) and appends each source's body under a per-source section. The merged SKILL.md records `merged_from`. Requires `--name` when an English slug cannot be derived from Chinese names. Refuses to overwrite an existing target unless `--force` is used after user confirmation.

### Sync

```bash
node scripts/skillhub.js sync --platform raccoon
```

Syncs scanned skills to enabled platform paths in `skillhub.config.json`.

### Repair

```bash
node scripts/skillhub.js repair
node scripts/skillhub.js repair --write
```

Dry-run by default. `--write` fills low-risk missing metadata and rebuilds the index.

## Safety rules

- `create` refuses to overwrite an existing Skill unless `--force` is used after user confirmation.
- `repair` is dry-run unless `--write` is explicit.
- `organize` is dry-run unless `--write` is explicit; it never deletes files, only reports and (with `--write`) reclassifies or removes empty directories.
- `merge` is dry-run unless `--write` is explicit; it refuses to overwrite an existing target unless `--force` is used after user confirmation.
- `sync` copies Skill folders to configured platform directories but does not delete target files.
- Deletion, publishing, and unknown external writes are outside the CLI MVP.
