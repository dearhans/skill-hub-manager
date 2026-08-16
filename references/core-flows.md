# Skill Hub Core Flows

Use these flows to keep Skill Hub Assistant simple enough for non-technical users.

## Flow 1: Create a skill

Trigger examples:

- 帮我创建一个处理 X 的能力
- 把这个方法沉淀成 Skill
- 以后我想让 AI 都按这个流程做 X

Procedure:

1. Understand the user's repeatable task and desired output.
2. Search existing skills or registry if available.
3. If a similar skill exists, recommend reuse or enhancement instead of creating duplicates.
4. If creation is appropriate, infer:
   - English slug
   - Chinese name
   - category
   - trigger description
   - capabilities
   - use cases
   - strengths / weaknesses
   - `say_this` examples
5. Create the skill folder and `SKILL.md` only after the target path is clear.
6. Update or propose `registry/index.json` if a Skill Hub repo exists.
7. Sync only to configured local platforms; ask before overwriting.
8. Return a plain-language summary and next invocation sentence.

User-facing success shape:

```text
已创建：会议纪要转任务

它适合：
- 会议纪要整理
- 行动项提取
- 负责人和截止时间梳理

以后你可以直接说：
“用会议纪要转任务帮我整理这段会议记录。”
```

## Flow 2: Pick a skill

Trigger examples:

- 我现在要做 X，用哪个能力？
- 有没有适合 X 的 Skill？
- 帮我找一个适合 X 的能力

Procedure:

1. Understand the current task.
2. Search registry and installed skills.
3. Compare candidates by `best_for`, `capabilities`, `not_for`, and `weaknesses`.
4. Recommend one primary skill.
5. Mention at most two alternatives only if useful.
6. Provide the exact next sentence the user can say.

Do not default to long lists.

## Flow 3: Preview a skill

Trigger examples:

- 这个 Skill 是干什么的？
- 预览一下 X 这个能力
- X 里面有什么文件？

Procedure:

1. Locate the skill (by name, Chinese name, or task description).
2. Read its `SKILL.md` frontmatter and file tree.
3. Summarize: what it does, best for, not for, and structure.
4. Provide the exact next sentence the user can say.

## Flow 4: Sort and rank skills

Trigger examples:

- 按更新时间排一下我的能力
- 哪些能力最适合做 X？
- 把能力按类别整理一下

Procedure:

1. Confirm the sort key (name / name_zh / category / updated / size / score).
2. For task-fit ranking, confirm the task first.
3. Present a compact ranked list.
4. Explain the top recommendation briefly.

## Flow 5: Organize the hub

Trigger examples:

- 整理一下我的能力库
- 有没有重复的 Skill？
- 把能力重新分个类

Procedure:

1. Scan skills and produce a plan (reclassify / duplicates / orphans / empty_dirs / low_quality).
2. Present the plan in plain language.
3. Ask which items to apply; apply only after confirmation.
4. Never delete files; only reclassify or remove empty directories with `--write`.

## Flow 6: Fuse skills

Trigger examples:

- 把 A 和 B 融合成一个能力
- 合并这几个 Skill
- 把这两个能力合成一个

Procedure:

1. Confirm source skills and the target name with the user.
2. Merge frontmatter and append each source body under a per-source section.
3. Record `merged_from` in the merged SKILL.md.
4. Ask before overwriting an existing target.
5. Report the merged skill and next invocation sentence.

## Flow 7: Sync skills

Trigger examples:

- 同步到所有平台
- 把这个 Skill 同步到小浣熊
- 更新一下我的能力库

Procedure:

1. Identify source Skill Hub repo or installed skill folder.
2. Read platform configuration if present.
3. Check target directories and write permissions.
4. Validate skills before copying.
5. Ask for confirmation before overwriting, deleting, or writing outside known skill directories.
6. Return per-platform status in plain language.

Translate errors:

- `ENOENT` -> 目录不存在
- `EACCES` -> 没有写入权限
- YAML parse error -> 说明区格式有问题

## Flow 8: Check and repair

Trigger examples:

- 检查一下我的能力库
- 看看这些 Skill 有没有问题
- 为什么这个 Skill 没同步成功？

Procedure:

1. Scan skills and registry.
2. Validate `SKILL.md` existence and frontmatter.
3. Check required Skill Hub metadata.
4. Identify duplicate or overlapping skills.
5. Auto-fix only low-risk metadata omissions.
6. Ask before merge, delete, overwrite, or platform config changes.
7. Summarize fixed items and pending confirmations.

Low-risk automatic fixes:

- Add missing Chinese description based on existing content.
- Add missing category.
- Add missing `say_this` examples.
- Rebuild local index.

High-risk actions requiring confirmation:

- Delete a skill.
- Merge two skills.
- Overwrite an existing skill.
- Change platform paths.
- Publish, upload, or share externally.
