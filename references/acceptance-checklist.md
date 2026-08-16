# Acceptance Checklist

Use this checklist before saying a Skill Hub operation is complete.

## Create skill

- [ ] User's repeatable task is clear enough to create a skill.
- [ ] Similar existing skills were checked when registry or installed skills are available.
- [ ] Skill name is lowercase, English, and hyphenated.
- [ ] `SKILL.md` exists.
- [ ] Frontmatter includes `name` and trigger-focused `description`.
- [ ] Skill Hub metadata includes Chinese name or plain-language description where appropriate.
- [ ] `say_this` examples tell the user how to invoke the skill next time.
- [ ] No existing skill was overwritten without confirmation.
- [ ] Final response states the file path and next invocation sentence.

## Pick skill

- [ ] Recommendation is based on the user's current task.
- [ ] One primary skill is recommended.
- [ ] Reasoning compares suitability, not just keyword overlap.
- [ ] If a similar skill is mentioned, the difference is clear.
- [ ] Final response includes “你可以直接说：...”.

## Preview skill

- [ ] Metadata shown is read from the actual SKILL.md, not guessed.
- [ ] Plain-language summary covers what it does, best for, not for.
- [ ] File structure is summarized without dumping raw paths in baby mode.
- [ ] Final response includes the next invocation sentence.

## Sort and rank skills

- [ ] Sort key and order match the user's request.
- [ ] Task-fit ranking (score) is based on the user's stated task.
- [ ] Result is a compact ranked list, not a raw dump.
- [ ] Top recommendation is explained briefly.

## Organize the hub

- [ ] Plan is shown before any change is applied.
- [ ] Duplicate candidates are based on real metadata (name / name_zh / description), not false positives.
- [ ] No file is deleted, moved, or reclassified without user confirmation.
- [ ] `--write` is only used after explicit confirmation.

## Fuse skills

- [ ] Source skills and target name are confirmed with the user before writing.
- [ ] Merged frontmatter keeps capabilities, use_cases, best_for, say_this, strengths, weaknesses.
- [ ] Merged SKILL.md records `merged_from`.
- [ ] Existing target is not overwritten without `--force` after confirmation.
- [ ] Final response states the merged skill path and next invocation sentence.

## Sync skill

- [ ] Source and target are clear.
- [ ] Target platform directories were checked.
- [ ] Skills were validated before sync.
- [ ] Overwrite or path changes were confirmed by the user.
- [ ] Per-platform status is reported.
- [ ] Technical errors are translated into plain language.

## Check and repair

- [ ] All relevant skills were scanned.
- [ ] Low-risk fixes are listed separately from pending risky decisions.
- [ ] No skill was deleted, merged, or overwritten without confirmation.
- [ ] Registry/index status is reported if applicable.
- [ ] Remaining issues include a clear next step.

## Baby-mode usability

- [ ] User did not need to run CLI commands.
- [ ] User did not need to edit YAML manually.
- [ ] User did not need to know platform paths unless setup is blocked.
- [ ] At most one focused question was asked at a time.
- [ ] Final output tells the user what to say next.
