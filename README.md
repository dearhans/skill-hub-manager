# skill-hub-manager

A complete MVP Skill package for managing a local Skill Hub in baby mode.

## What is included

- `SKILL.md` — agent-facing operating protocol.
- `scripts/skillhub.js` — executable CLI core.
- `references/metadata-schema.md` — extended metadata fields.
- `references/core-flows.md` — create, pick, sync, check/repair flows.
- `references/acceptance-checklist.md` — MVP acceptance and safety checks.
- `references/cli-usage.md` — CLI usage for advanced mode.
- `templates/` — starter config and README for new hubs.

## MVP commands

```bash
node scripts/skillhub.js init
node scripts/skillhub.js create --name meeting-to-todos --zh 会议纪要转任务 --desc "把会议纪要整理成负责人、截止时间和下一步动作"
node scripts/skillhub.js validate
node scripts/skillhub.js build-index
node scripts/skillhub.js pick --task "我要整理会议纪要"
node scripts/skillhub.js repair
node scripts/skillhub.js sync --platform raccoon
```

Ordinary users should not need these commands. The agent should wrap them as natural-language operations.
