# skill-hub-manager

A complete MVP Skill package for managing a local Skill Hub in baby mode (natural language). Create, find, sync, and repair skills, plus four advanced capabilities: **preview, sort, organize, and fuse**.

## Features

- **Create**: Turn repeatable tasks into Skills with auto-generated `SKILL.md` and metadata.
- **Find**: Recommend the best Skill for the current task (`pick`).
- **Sync**: Copy skills to configured platform directories (`sync`).
- **Check & repair**: Validate metadata and auto-fill low-risk missing fields (`repair`).
- **Preview**: Inspect skill metadata, file structure, size, and update time (`preview`).
- **Sort**: Rank skills by name / category / update time / size / task-fit score (`sort`).
- **Organize**: Produce a plan with reclassification, duplicate candidates, orphan files, empty directories, and low-quality skills (`organize`).
- **Fuse**: Merge multiple skills into one unified skill, keeping a source record (`merge`).

## Directory Structure

```
skill-hub-manager/
├── SKILL.md                        # Agent-facing operating protocol (triggers + flows)
├── README.md                       # Chinese README
├── README.en.md                    # English README (this file)
├── scripts/
│   └── skillhub.js                 # Executable CLI core
├── references/
│   ├── metadata-schema.md          # Extended metadata fields
│   ├── core-flows.md               # User flows (create/preview/sort/organize/fuse/sync/repair)
│   ├── acceptance-checklist.md     # Acceptance and safety checklist
│   └── cli-usage.md                # Advanced-mode CLI usage
└── templates/
    ├── skillhub.config.json        # Starter config for a new hub
    └── README.md                   # Starter README for a new hub
```

## Quick Start

```bash
# Initialize a local Skill Hub
node scripts/skillhub.js init

# Create a skill
node scripts/skillhub.js create --name meeting-to-todos --zh 会议纪要转任务 --desc "把会议纪要整理成负责人、截止时间和下一步动作"

# Validate skills and metadata
node scripts/skillhub.js validate

# Build the registry index
node scripts/skillhub.js build-index

# Recommend a skill for a task
node scripts/skillhub.js pick --task "我要整理会议纪要"
```

## Advanced Commands

```bash
# Preview a skill (without --name, lists all skills as one-line summaries)
node scripts/skillhub.js preview --name 会议纪要转任务

# Sort: by update time (desc) / by task-fit score
node scripts/skillhub.js sort --by updated --order desc
node scripts/skillhub.js sort --by score --task "整理会议纪要" --order desc

# Organize: dry-run by default; --write applies only after confirmation
node scripts/skillhub.js organize
node scripts/skillhub.js organize --write

# Fuse: dry-run by default; --write applies only after confirmation
node scripts/skillhub.js merge --names meeting-to-todos,meeting-minutes --name meeting-hub --zh 会议处理中心 --desc "统一处理会议纪要、任务提取与纪要整理"
node scripts/skillhub.js merge --names a,b --name merged --zh 融合技能 --write
```

## Safety Notes

- `organize` / `merge` / `repair` are dry-run by default; `--write` is required to apply changes.
- Overwriting an existing skill requires `--force` after user confirmation.
- `organize` only reports, reclassifies, and removes empty directories; it never deletes files.
- Ordinary users do not need to run the CLI directly; the agent wraps these commands as natural-language operations.

## Usage

Ordinary users never touch the command line. Just tell the agent:

- "Create a skill that handles X"
- "What does this Skill do?"
- "Sort my skills by update time"
- "Organize my skill library"
- "Fuse A and B into one skill"
