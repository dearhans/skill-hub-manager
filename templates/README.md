# Skill Hub Template

This folder is the local source of truth for AI Skills.

## Baby-mode actions

Most users should operate this hub through an agent using natural language:

- 帮我创建一个处理 X 的能力
- 我现在要做 X，用哪个能力
- 同步到所有平台
- 检查一下我的能力库

## Advanced commands

Run from the hub root:

```bash
node path/to/skillhub.js init
node path/to/skillhub.js create --name meeting-to-todos --zh 会议纪要转任务 --desc "把会议纪要整理成负责人、截止时间和下一步动作"
node path/to/skillhub.js validate
node path/to/skillhub.js build-index
node path/to/skillhub.js pick --task "我要整理会议纪要"
node path/to/skillhub.js sync --platform raccoon
```

## Structure

```text
skill-hub/
├── skillhub.config.json
├── skills/
├── registry/
│   └── index.json
└── logs/
```

## Safety

The MVP can create, validate, index, sync, and fill low-risk missing metadata.
It must not delete, merge, publish, or overwrite important user work without confirmation.
