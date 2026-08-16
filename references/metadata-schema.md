# Skill Hub Metadata Schema

Use this schema when creating or repairing a Skill Hub managed skill.

## Required frontmatter

Every skill must keep the host-compatible fields:

```yaml
---
name: meeting-to-todos
description: Use this skill when turning meeting notes into owner-based action items.
---
```

Rules:

- `name` must be lowercase, English, hyphenated, and match the folder name.
- `description` must be trigger-focused and tell the agent when to use the skill.
- Do not put secrets, local absolute paths, or user-private data in frontmatter.

## Skill Hub extension fields

Prefer adding these fields after the required fields:

```yaml
name_zh: 会议纪要转任务
desc_zh: 把会议纪要整理成负责人、截止时间和下一步动作
category: productivity
capabilities:
  - 行动项提取
  - 责任人识别
  - 截止时间整理
use_cases:
  - 会议纪要整理
  - 任务清单生成
strengths:
  - 结构清晰
  - 适合管理层快速跟进
weaknesses:
  - 不处理音频文件
  - 不自动创建日历事件
best_for:
  - 文字版会议记录
  - 会后任务追踪
not_for:
  - 会议录音转写
  - 复杂项目排期
say_this:
  - 用会议纪要转任务帮我整理这段会议记录
  - 从这段会议纪要里提取任务、负责人和截止时间
```

## Category set

MVP categories:

- `search`
- `thinking`
- `tools`
- `writing`
- `finance`
- `development`
- `productivity`
- `design`
- `education`
- `other`

If uncertain, choose `other` and add a clear `desc_zh`.

## Registry item shape

`registry/index.json` should expose user-friendly discovery information:

```json
{
  "id": "meeting-to-todos",
  "name": "meeting-to-todos",
  "name_zh": "会议纪要转任务",
  "plain_desc": "把会议纪要整理成负责人、截止时间和下一步动作",
  "category": "productivity",
  "capabilities": ["行动项提取", "责任人识别", "截止时间整理"],
  "best_for": ["会议纪要整理", "任务清单生成"],
  "not_for": ["会议录音转写", "复杂项目排期"],
  "strengths": ["结构清晰", "适合管理层快速跟进"],
  "weaknesses": ["不处理音频文件", "不自动创建日历事件"],
  "say_this": ["用会议纪要转任务帮我整理这段会议记录"],
  "platforms": {
    "raccoon": "synced"
  }
}
```

## Plain-language requirement

Every final user response must include what the user can say next, for example:

> 以后你可以直接说：“用会议纪要转任务帮我整理这段会议记录。”
