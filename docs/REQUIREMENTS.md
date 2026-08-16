# dsh-cot-profile 需求规格（v0.1 讨论稿）

> 本文档是 dsh-thought-monitor 转型为思维链轨迹画像插件的需求基线。
> 状态：需求与设计均已与作者逐条确认，待实现。

## 1. 背景与定位

### 1.1 来源

本插件的需求源于对模型思维链（reasoning）措辞的观察研究：

- [`xiaobright/dsh-anchored-standard`](https://github.com/xiaobright/dsh-anchored-standard)：
  通过控制首轮工具 schema / system prompt 让模型进入 "minimal 锚定" 轨迹。
- [`xiaobright/modeltest`](https://github.com/xiaobright/modeltest) 轨迹分析
  （`docs/v4.1/DEEPSEEK_V4_TRAJECTORY_ANALYSIS_20260814.md`，11 份 DSH/OpenCode 导出）：
  不同轨迹族（minimal / anchored-standard / standard / PTC / 灰测）在 reasoning 措辞上
  呈现**稳定且分离度高的统计差异**。

### 1.2 核心洞察

reasoning 措辞的统计指标（`let me` / `we` / `let's` / `I` 计数、块长、块首行模式、
阶段性可见回复次数）构成可实时观测的**轨迹指纹**，可以区分当前会话处于哪个画像族
（minimal-like / standard-like / 灰测-like 等）。

### 1.3 诚实性原则（重要）

研究报告明确结论：**轨迹风格可以识别 scaffold 是否生效，但不能单独充当模型身份或
能力证据**。反例：V4 Flash 在 OpenCode 下 `let me=124`、切到 minimal 后 `let me=0`、
`we=209`——同样的措辞模式出现在不同模型上；minimal 下 Pro 与 Flash 措辞几乎一致。
措辞首先反映 **(模型 × 接口配置)** 的组合。

**三带/断层框架**（`yjh051108/dsh-router-standard`，作者勘误后仍保留实测数据）：
沿 persona 轴，V4 Pro 行为坍缩为三段不连续带——spec（集体 `We`，let me ≈ 0）、
过渡带（`We`/`The`/`Let` 混合、不稳定）、react（第一人称 `The`/`Let`，we ≈ 0）。
两侧没有普遍"更强"（维护任务偏好 spec 侧，greenfield 构建偏好 react 侧）。
**措辞是断层侧的指纹，不是能力度量、更非身份证明**（同一模型同一任务可 100% `We`
或全 `The`/`Let`）。

因此本工具：
- 结论表述为**轨迹画像**（spec 侧 / react 侧 / 灰测侧），不做"这就是某模型"的断言；
- **过渡带显式降级为"不确定"**，不硬套标签（过渡带会话存在真实失败风险，见 §4.2）；
- 提供**用户自定义画像族**的出口：用户可自行建立"某模型/版本 → 某画像"映射，
  工具不替用户下这个结论；基线按模型分桶（record 已带 model），跨模型复用阈值不成立。

## 2. 目标与非目标

### 2.1 目标

- **实时**：每块 reasoning 结束即刷新统计与画像判定，流式感知。
- **会话级**：统计按会话累计，会话切换/结束重置。
- **可视化**：会话头部实时徽章 + 右侧可折叠悬浮面板（完整仪表）。
- **可扩展**：事件 + 状态 API，供其他插件消费；画像族与阈值可配置。

### 2.2 非目标（v0.1）

- 不做模型身份/版本硬断言（见 1.3）。
- 统计持久化**已免费获得**：投影子系统 + `dsh-session-projection-cache` 服务对每个
  注册单位做节流写后的 checkpoint/restore——同一会话 resume 或进程重启后统计自动
  恢复，无需额外实现。
  **会话级聚合记录（记录模式，见 §7）在 v0.1 范围内**——只落聚合指标，不落原始思维链。
- 不做跨会话统计对比（v2）。
- 保留旧插件的告警/响铃能力（转型后移除；如社区需要，可后续作为独立模式回归）。

## 3. 指标集

统计口径沿用研究报告：**大小写不敏感、按词边界匹配**，**每个 reasoning 块只统计一次**
（在 `block-end` 时用完整块文本统计，避免流式 delta 重复计数）。

### 3.1 核心四计数

| 指标 | 说明 | 区分方向（研究中） |
|---|---|---|
| `let me` | 第一人称执行口吻 | minimal-like ≈ 0；standard-like 高（每百块 150+） |
| `we` | 集体口吻 | minimal-like 高；standard-like 低 |
| `let's` | 集体口吻变体 | minimal-like 高；standard-like 低 |
| `I` | 第一人称（含 I'm / I'll 等） | minimal-like 低；standard-like / 灰测高 |

### 3.2 首行模式

每个 reasoning 块首行前缀分类：`We need…` / `The user wants…` / `Let me…` / `I…` /
其他。只采样首行前若干 token，不做全文分析。

### 3.3 结构指标

| 指标 | 说明 |
|---|---|
| reasoning 块数 | 累计块数，作为归一化分母 |
| 块长 p50 | 中位块字符数（研究中 minimal 111–239，standard 437–550） |
| 阶段性可见回复次数 | 非最终回复的可见 assistant 消息数（minimal ≈ 1，standard 30+） |

## 4. 画像族与判定

### 4.1 内置基线（来自 modeltest 公开聚合数据，量化成指标向量）

| 画像族 | 期望形态 |
|---|---|
| minimal-like | `let me`≈0，`we`/`let's` 高，块短，阶段回复≈1 |
| standard-like | `let me` 高，`we`/`let's` 低，块长，阶段回复多 |
| 灰测-like | `I` 主导，`let me` 少 |

### 4.2 判定算法要求

- 指标需**按块数归一化**（绝对计数随会话增长，不可直接与基线比较）。
- 判定输出：最近画像族 + 置信度（距离比值或相似度）。
- **初步画像**：前 N 块（默认 10，可配置）后首次判定，之后随会话持续修正。
- 数据不足时（如块数 < N）显示"采样中"，不判定。
- **过渡带（mixed）降级**（router-standard 实测）：低置信（最近 vs 次近距离接近）
  或 `we`/`let me` 双高（We/The/Let 混合）时，输出"过渡带/不确定"而非硬归类——
  过渡带会话存在真实失败风险（router J 实验 1/3 整场失败），必须显式标记。
- **对装配扰动鲁棒**：工具目录晋升/单块瞬态（router 实测扰动 ≤1 块、let me 累积
  ≤0.1）不应触发翻判——累积计数天然免疫，不做单块敏感判定。
- 用户可编辑/新增画像族（指标向量 + 名称 + 说明）；基线按模型分桶（跨模型复用
  阈值不成立，Flash 窄 basin / Pro 宽 basin 响应形状不同）。

### 4.3 呈现规则

- 面板同时展示**原始统计**（让用户自己判断）与**画像判定结果**（工具的建议），
  二者并列，不互相遮蔽。

## 5. 实时语义与会话生命周期

- 数据源：`session/event` 的 `assistant/chunk`（复用现有缓冲机制，
  block-start / reasoning-delta / block-end）。
- 每块 `block-end` 统计一次并更新会话画像状态。
- `step/end` / `turn/end` / `session/disposed` 时清理对应缓冲与状态。
- 会话切换：统计按会话独立存储；显示跟随当前会话。
- 事件推送需**节流**（默认 500ms 或每块合并一次），避免逐 delta 轰炸。

## 6. 呈现与交互

### 6.1 会话头部徽章

- 槽位：`conversation.session.header.utilities`（additive，`replaceRisk: none`）。
- 内容：一行实时画像族，如 `minimal-like · we 45 · let me 0`。
- 可开关（设置页控制）。

### 6.2 右侧悬浮面板

- 槽位：`shell.overlay`（additive，可折叠）。
- 内容：完整仪表——四计数/比例、首行模式分布、结构指标、与基线对比条、
  画像判定进度与置信度。
- 折叠态只保留一个触发器，不遮挡会话内容。

> 说明：DSH 现无"右侧常驻列"的可扩展槽位（`details` 为单席位且遮蔽官方 UI）。
> 故 v0.1 采用"头部徽章 + 悬浮面板"；推动 upstream 增加
> `conversation.details.panel` 列表槽位列入 wishlist，落地后再升级为原生右侧列。

### 6.3 事件 / 状态 API

- 事件：`cot-profile/update`（节流），payload 含会话 id、指标快照、当前画像判定。
- 状态：会话级查询接口，返回累计统计与判定（供其他插件读取）。
- 设置页转型：画像族基线编辑、N 块阈值、徽章/面板开关、记录模式开关。

## 7. 记录模式（测量仪器）

把插件从"监控工具"升级为"测量工具"：每个会话结束时，把该会话的
{模型/预设（可获取时）、指标向量、画像判定} 落成一条**聚合记录**。
跨会话积累后即可用真实数据校准内置基线，并验证"措辞 ↔ (模型 × 配置)"的关系
——把 modeltest 的离线分析变成实时、分布式测量。

### 7.1 触发与落点

- 触发：每 turn 结束（`turn/end`）输出一条累计快照（`final: false`）；会话结束（`session/disposed`）
  输出最终记录（`final: true`）。DSH 会话极少销毁，turn 级快照是常态落盘。
- 落点（可配置）：
  - `record.emit`（默认 true）：发 `cot-profile/record` 事件，供其他插件自选消费；
  - `record.file`（默认空 = 不写文件）：非空时追加一行 JSON 到该路径（JSONL）。

### 7.2 记录 schema（v1）

```jsonc
{
  "v": 1,
  "sessionId": "...",
  "startedAt": 1720000000000,        // epoch ms
  "endedAt": 1720000100000,
  "preset": "anchored-standard",      // 来自 agent-preset/selected；未知留空
  "provider": "deepseek",             // 来自 agent/request 捕获；未知留空
  "model": "deepseek-v4-pro",
  "reasoningBlocks": 193,
  "indicators": { "letMe": 1, "we": 179, "lets": 88, "i": 17,
                  "p50BlockChars": 111, "visibleReplies": 1,
                  "firstLines": { "we-need": 120, "other": 73 } },
  "vector": [ /* 归一化指标向量 */ ],
  "judgment": { "family": "minimal-like", "confidence": 0.87, "distances": {} }
}
```

### 7.3 隐私边界（硬性要求）

- **绝不落原始思维链文本**——只落聚合指标与判定（与 modeltest 的公开原则一致：
  原始导出私有，公开只发聚合统计）。
- 记录文件默认关闭；开启由用户显式配置。

### 7.4 元数据捕获

- 预设 id：监听 `agent-preset/selected`。
- provider/model：通过 `agent/request` waterfall（Scoped<Agent> + LlmCallConfig）
  捕获；取会话内首次或最后一次皆可，缺失时留空，不阻塞记录。

## 8. 技术约束

- 纯 JS（host 与 client 均无构建步骤，沿用现插件形态）。
- host 侧依赖：`@deepseek-ai/cordis`、`@deepseek-ai/dsh-settings`（peer）；
  `@deepseek-ai/schemastery`（dependency）。移除未使用的 `dsh-session` peer。
- 判定与统计逻辑抽为独立纯模块（可零依赖单测）。
- 指标匹配：英文词边界用正则 `\b`；中文措辞（如"我们"）v0.1 先做包含匹配，
  边界语义留待 v2（待定项 3）。

## 9. 验收标准（草案）

- [ ] minimal 配置下完整跑一个会话：徽章显示 minimal-like，`let me=0`。
- [ ] standard 配置下：徽章显示 standard-like，`let me` 计数随块增长。
- [ ] 切换会话：统计清零、徽章回到"采样中"。
- [ ] 前 N 块内不判定；块数达到 N 后出现初步画像并随会话修正。
- [ ] 非法画像族配置（空向量、非法正则等）不崩溃，给出可读错误。
- [ ] 面板与徽章可独立开关。
- [ ] 事件节流生效，payload 字段完整。
- [ ] 设置页可编辑/新增画像族，保存后判定立即按新基线重算。
- [ ] 会话结束产生一条聚合记录（emit 开启时 `cot-profile/record` 事件可收到；
      file 配置时文件追加一行 JSONL）。
- [ ] 记录中不含任何原始思维链文本。
- [ ] provider/model/preset 可获取时出现在记录中，缺失时留空且不报错。

## 10. 决策记录与待定项

| # | 事项 | 决策 | 状态 |
|---|---|---|---|
| 1 | 结论语义 | 画像族，不硬断言模型身份 | 已定 |
| 2 | 指标集 | 四计数 + 首行模式 + 结构指标 | 已定 |
| 3 | 实时语义 | 流式累计 + 前 N 块初步画像 | 已定 |
| 4 | 呈现 | 头部徽章 + 悬浮面板 + 事件/API | 已定 |
| 5 | 旧插件关系 | 转型并改名 dsh-cot-profile | 已定 |
| 6 | 统计持久化 | 由 `dsh-session-projection-cache` 自动 checkpoint/restore 提供（已核实源码），无需自研 | 已具备 |
| 7 | `I` 指标用途 | 作为画像维度保留，不单独用于强弱判断 | 待定（默认保留） |
| 8 | 首行采样 | 只取首行前若干 token | 待定（默认采用） |
| 9 | 事件节流 | 500ms 或每块合并 | 待定（默认 500ms） |
| 10 | 中文措辞匹配 | v0.1 包含匹配，边界语义 v2 | 待定（默认包含匹配） |
| 11 | upstream 槽位 | `conversation.details.panel` 列入 wishlist | 待定（默认列入） |
| 12 | 记录模式 | 会话级聚合记录（事件 + 可选 JSONL），只落聚合不落原文 | 已定 |
| 13 | 过渡带降级 | 低置信或 we/letMe 双高 → "过渡带/不确定"，不硬归类（router-standard mixed 带实测）| 已定 |
| 14 | 画像族语义 | spec 侧/react 侧/灰测侧，断层框架、无强弱价值判断（含勘误立场）| 已定 |

## 11. 设计决策（已确认）

### 11.1 数据流

- 统计在 **host** 侧计算（client 无 reasoning 流订阅 API，已核实）。
- host → client 推送：**RPC 轮询**（`cotProfile.get`，Client→Host 是文档化唯一通道）。
  轮询自适应：快照 `revision` 变化 → 500ms；稳定 → 逐级退避至 5s。
  对块级统计（reasoning 块间隔数秒）满足"实时"。
- 对外 API：`cot-profile/update` 事件（节流 500ms），供其他 host 插件消费。
- 数据源仅依赖 `session/event` 流（含 `assistant/message` 阶段回复计数），
  不依赖 `agent/status` 等其他事件（已确认）。

### 11.2 画像判定

- 算法：**归一化指标向量 + 加权 Manhattan 距离 + 置信度**。
  - 归一化：计数按每 100 块折算（研究报告口径）；阶段回复按会话计。
  - 向量维度：`letMe100 / we100 / lets100 / i100`、首行模式分布、
    `p50 块长`、`阶段可见回复数`。
  - 置信度 = `1 − d₁/(d₁+d₂)`（最近 vs 次近画像族）。
  - 数据门槛：块数 < N（默认 10）只显示"采样中"。
- 默认权重：`let me` / `we` 高权重（研究中分离度最高），全部可配置。
- 用户自定义画像族 = 编辑指标向量 + 权重；保存后立即重算当前会话。
- 内置基线数据从 modeltest 公开聚合按块数粗略归一化，标注"估算值，待真实数据校准"。

### 11.3 命名与结构

- 包名 `dsh-cot-profile`；插件 id / 设置命名空间 / 事件名统一 `cot-profile`；
  RPC 方法 `cotProfile.get`；旧 `thought-monitor` 全部退役。
- 目录结构见需求 2 节目标 + 新增 `lib/analyzer.js`（纯逻辑，零依赖可单测）、
  `lib/profiles.js`（内置基线）、`test/`。
- 设置页保留（画像族/阈值/权重/开关编辑），仍受 apiproxy 白名单限制，
  沿用"三档并行"策略：配置驱动为主 + 可选补丁 + 推 upstream。

### 11.4 指标口径

- 英文：tokenize 后做短语边界匹配（`let me` 为双 token 短语；
  `I` 用 token 集合 I / I'm / I'll / I've…，非裸字母）。
- 中文：v0.1 包含匹配（待定项 10）。
- 阶段可见回复：统计 `assistant/message` 事件数，扣除每 turn 最后一条。

### 11.5 记录模式

- 触发：`session/disposed` 时输出一条聚合记录（不打断、不异步阻塞退出）。
- 落点：`cot-profile/record` 事件（默认开）+ 可选 JSONL 文件（配置路径，
  默认关）。
- 元数据捕获：`agent-preset/selected` 事件（preset id）；
  `agent/request` waterfall（provider/model，缺失留空）。
- 隐私：只落聚合指标，绝不落原始思维链文本。
- 记录写入失败（如路径不可写）降级为 warn 日志，不崩溃、不影响统计。
