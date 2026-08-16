---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: 8f7b7fe8641bd17be8255ec21b76c7d7_39989844991511f1a98a525400f8a581
    ReservedCode1: uffFBJmkZBfGplpnRU3Sd3oyPKV9K1o4HuNHDzduzpW7jGeAXz2sZI/VtVHFZz/8G8iC3/9nzJ0vI5tY9CPO4f6NkiPt6MgFHkVOvZRNLnj5DxLwhcpXhgC4qmRWf8lsKRWd7WEg31HC3VjP/S+E47ItCkax2V/J5YJ0qg5eMBznctY2fruesYITJTk=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: 8f7b7fe8641bd17be8255ec21b76c7d7_39989844991511f1a98a525400f8a581
    ReservedCode2: uffFBJmkZBfGplpnRU3Sd3oyPKV9K1o4HuNHDzduzpW7jGeAXz2sZI/VtVHFZz/8G8iC3/9nzJ0vI5tY9CPO4f6NkiPt6MgFHkVOvZRNLnj5DxLwhcpXhgC4qmRWf8lsKRWd7WEg31HC3VjP/S+E47ItCkax2V/J5YJ0qg5eMBznctY2fruesYITJTk=
---

# skill-hub-manager

> [English](README.en.md) | 中文

本地 Skill Hub 管理技能（MVP 完整包）。以「婴儿模式」（自然语言）管理本地技能库：创建、查找、同步、检查修复，并支持**结果预览、排序、整理、融合**四大进阶能力。

## 功能特性

- **创建**：把重复性任务沉淀为 Skill，自动生成 SKILL.md 与元数据
- **查找**：根据当前任务推荐最合适的 Skill（`pick`）
- **同步**：将技能同步到已配置的平台目录（`sync`）
- **检查修复**：校验元数据、自动补全低风险缺失项（`repair`）
- **预览**：查看技能元信息、文件结构、大小与更新时间（`preview`）
- **排序**：按名称/类别/更新时间/大小/任务匹配度排序（`sort`）
- **整理**：输出分类建议、重复候选、孤儿文件、空目录、低质量技能清单（`organize`）
- **融合**：将多个技能合并为一个统一技能，保留来源记录（`merge`）

## 目录结构

```
skill-hub-manager/
├── SKILL.md                        # Agent 操作协议（触发词 + 流程）
├── README.md                       # 本说明
├── scripts/
│   └── skillhub.js                 # 可执行 CLI 核心
├── references/
│   ├── metadata-schema.md          # 扩展元数据字段
│   ├── core-flows.md               # 用户流程（创建/预览/排序/整理/融合/同步/修复）
│   ├── acceptance-checklist.md     # 验收与安全检查清单
│   └── cli-usage.md                # 高级模式 CLI 用法
└── templates/
    ├── skillhub.config.json        # 新 Hub 的起始配置
    └── README.md                   # 新 Hub 的起始 README
```

## 快速开始

```bash
# 初始化一个本地 Skill Hub
node scripts/skillhub.js init

# 创建一个技能
node scripts/skillhub.js create --name meeting-to-todos --zh 会议纪要转任务 --desc "把会议纪要整理成负责人、截止时间和下一步动作"

# 校验技能与元数据
node scripts/skillhub.js validate

# 构建注册索引
node scripts/skillhub.js build-index

# 根据任务推荐技能
node scripts/skillhub.js pick --task "我要整理会议纪要"
```

## 进阶命令

```bash
# 预览技能（不带 --name 时列出全部技能摘要）
node scripts/skillhub.js preview --name 会议纪要转任务

# 排序：按更新时间倒序 / 按任务匹配度评分
node scripts/skillhub.js sort --by updated --order desc
node scripts/skillhub.js sort --by score --task "整理会议纪要" --order desc

# 整理：默认 dry-run 输出计划，--write 需确认后应用
node scripts/skillhub.js organize
node scripts/skillhub.js organize --write

# 融合：默认 dry-run 生成融合计划，--write 需确认后写入
node scripts/skillhub.js merge --names meeting-to-todos,meeting-minutes --name meeting-hub --zh 会议处理中心 --desc "统一处理会议纪要、任务提取与纪要整理"
node scripts/skillhub.js merge --names a,b --name merged --zh 融合技能 --write
```

## 安全说明

- `organize` / `merge` / `repair` 默认均为 dry-run，`--write` 才落盘
- 覆盖已有技能需 `--force` 且经用户确认
- `organize` 只报告与重分类、清理空目录，绝不删除文件
- 普通用户无需直接运行 CLI，Agent 会以自然语言包装这些命令

## 使用方式

普通用户不需要接触命令行。直接对 Agent 说：

- 「帮我创建一个处理 X 的能力」
- 「这个 Skill 是干什么的？」
- 「按更新时间排一下我的能力」
- 「整理一下我的能力库」
- 「把 A 和 B 融合成一个能力」

*（内容由AI生成，仅供参考）*
