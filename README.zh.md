# dsh-cot-profile

[中文](./README.zh.md) · [English](./README.md)

面向 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的实时思维链轨迹画像插件：边流式边统计 reasoning 里的签名措辞指标（`let me` / `we` / `let's` / `I`），对照内置基线判断当前会话的轨迹画像族，并可选的按会话记录测量聚合数据。

## 先读：关于"推断模型"的诚实边界

措辞指纹描述的是 **(模型 × 装配)** 组合——system prompt、工具 schema、reasoning effort——**不是模型身份**。来源研究（[`xiaobright/modeltest`](https://github.com/xiaobright/modeltest)）证明：接口变化时，不同模型会呈现完全相同的措辞模式（V4 Flash 反例：minimal 装配下与 Pro 同样 `we` 高、`let me` 为零，但能力不同档）。

[`yjh051108/dsh-router-standard`](https://github.com/yjh051108/dsh-router-standard) 把同一套词法映射到一条**断层线**：沿 persona 轴，V4 Pro 行为坍缩为三段带——**spec**（集体 `We`，let me ≈ 0）、**过渡带**（`mixed`：`We`/`The`/`Let` 混合、不稳定）、**react**（第一人称 `The`/`Let`，we ≈ 0）。两侧没有普遍"更强"（维护任务偏好 spec 侧、greenfield 构建偏好 react 侧）；作者勘误明确反对把措辞读成模型身份或能力证据。

因此本插件回答的是**"当前会话的轨迹落在断层的哪一侧"**（minimal-like / standard-like / ambiguous），把**过渡带显式标记为"不确定"**而不是硬套标签，并把原始指标并列展示，结论由你自己下。**不做"这就是某模型"的断言**。

**画像族名字的来源**：`minimal-like` / `standard-like` / `ambiguous` 是
[`xiaobright/modeltest`](https://github.com/xiaobright/modeltest) 探针分类器
（`evaluator/trigger_probe/src/classifier.mjs`，MIT）的标签——轨迹按它出现时的
DSH 预设命名（`minimal` 预设的集体 `We` 口吻 vs `standard` 预设的第一人称
`Let me` 口吻），无法归类的叫 `ambiguous`。
[`yjh051108/dsh-router-standard`](https://github.com/yjh051108/dsh-router-standard)
随后把同一词法映射到 spec/mixed/react 三带。本插件沿用分类器标签作画像族 id，
三带作为专业层词汇。

## 功能

- **实时 UI**：会话头部徽章 + 可折叠悬浮面板，由会话投影推送帧驱动——无轮询、无自定义 RPC。
- **指标**：`let me` / `we` / `let's` / `I` 计数、首行模式（`We need…` / `The user wants…` / `Let me…` / `I…`）、块长中位数、阶段性可见回复数。
- **判定**：加权距离匹配内置基线画像 + 置信度；满 N 块（默认 10，可配置）才下结论。无法可靠归类的轨迹——低置信、或 `we` 与 `let me` 同时偏高（router-standard 的**过渡带**）——显示为"过渡带 / 不确定"，不硬套可能错误的标签。
- **可扩展**：画像族与各维度权重均可编辑（Web 设置页或 cordis 配置）。
- **记录模式**：每个 turn 结束落一条累计 JSON 快照（事件和/或 JSONL；DSH 会话极少销毁，所以快照在每次 turn/end 落盘）——用真实数据校准基线的测量仪器。
- **隐私**：只有聚合数据离开 host 计算；原始思维链文本从不记录、从不传输。

## 截图

| minimal-like 判定 | standard-like 判定 |
|---|---|
| ![minimal-like 判定](docs/screenshots/panel-verdict.png) | ![standard-like 判定](docs/screenshots/panel-standard.png) |

| GUI 校准（扫描 → 分组 → 一键应用基线） |
|---|
| ![GUI 校准](docs/screenshots/calibration.png) |

## 安装

```bash
dsh plugin --profile web add github:Chloride233/dsh-cot-profile
```

核心插件（徽章、面板、记录）立即可用。**Web 设置页**额外需要一个对 DeepSeek Harness 0.1.0-rc.6 的临时一次性补丁（见下文）；不打补丁也可用——改用 cordis 配置。

## 配置

配置在 `cot-profile` 插件行（本仓库 `cordis.patch.yml` 或你的 profile 的 cordis.yml）。默认值：

```yaml
- id: cot-profile
  config:
    minBlocksForJudgment: 3    # 满 N 块 reasoning 才给判定（默认 3；置信度+过渡带兜底短任务）
    badge: true                # 会话头部徽章
    panel: true                # 实时面板
    panelMode: overlay         # 'overlay'（默认，零风险）| 'track'（实验性右侧轨道栏）
    weights: {}                # 各维度权重；{} = 内置默认
    profiles: []               # 自定义画像族；[] = 内置基线
    record:
      emit: true               # 每 turn 发 cot-profile/record（会话结束也发）
      file: ''                 # 可选 JSONL 路径（~ 开头会自动展开为用户主目录）
```

**面板形态：**

- `overlay`（默认）：悬浮面板，钉在会话右侧——官方 additive 槽位，零风险。
- `track`（**实验性**）：真正的右侧列，通过直接操作 DOM 往 shell 的三栏网格追加轨道（MutationObserver 监听 `grid-template-columns`）。不遮内容、不替换任何官方 UI，但运行在官方槽位系统之外——DSH 升级若改变框架结构可能需要适配此模式。默认关闭。

权重默认（`let me`/`we` 权重最高，对应研究中的分离度）：

```json
{ "letMe100": 3, "we100": 3, "lets100": 2, "i100": 1.5,
  "firstLineWeNeed": 1.5, "firstLineUserWants": 1, "firstLineLetMe": 1.5,
  "firstLineI": 1, "firstLineOther": 0.5, "p50BlockChars": 1, "visibleReplies": 1.5 }
```

自定义画像族形如 `{ "id", "name", "description", "vector" }`，vector 可取任意上述维度；想追踪的每个模型/版本加一个画像族即可参与判定。

## 可选：Web 设置页

DeepSeek Harness 0.1.0-rc.6 只对浏览器暴露一份硬编码的 settings 命名空间白名单（`dsh-host-apiproxy` 的 `WEB_SETTINGS_NAMESPACES`；其源码注释称把该决策挪进 `settings.register()` 是 deferred work）。上游支持插件自声明暴露之前，运行：

```bash
sh scripts/install-patch.sh
```

脚本把已安装的 `dsh-host-apiproxy` 复制进 web profile 并把 `cot-profile` 加入白名单。**幂等、可选**——不打补丁插件也完整可用。注意事项：

- profile 里执行 `pnpm install` 会移除复制品；之后重新运行本脚本即可。
- dsh 升级可能改变白名单布局；脚本找不到目标结构时会明确报错，绝不静默失效。

## FAQ

- **本地路径安装加载失败？** `dsh plugin add <本地目录>` 走 pnpm 的 `link:` 协议，link 包的依赖从**它自己所在目录**解析——所以检出目录里需要可解析的 `node_modules`。在检出目录跑 `pnpm install`（或软链到运行中 harness 的 node_modules）即可。用 GitHub 地址安装（`github:...`）没有这个问题——pnpm 从商店原生解析依赖。

## 事件与数据

| 出口 | 形态 |
| --- | --- |
| 投影键 | `cot-profile`——任意会话级槽位用 `useProjection('cot-profile')` 读取（类型见 `lib/index.d.ts` 的 `CotProfileView`） |
| `cot-profile/update` | `{ sessionId, blocks, counts, firstLines, p50BlockChars, visibleReplies, vector, judgment, ui, revision, seq }`（500ms 节流） |
| `cot-profile/record` | 每 turn/end 一条累计快照 + 会话结束一条最终记录（仅当会话有 ≥1 个 reasoning 块） |

### 记录 schema（v1）

```jsonc
{
  "v": 1,
  "sessionId": "...",
  "startedAt": 1720000000000,
  "endedAt": 1720000100000,
  "preset": "anchored-standard",        // 已知时（agent-preset/selected）
  "provider": "deepseek",               // 已知时（agent/request 捕获）
  "model": "deepseek-v4-pro",           // 已知时
  "reasoningBlocks": 193,
  "turn": 4,                          // 快照所在 turn（final 记录为 null）
  "final": false,                     // false = 每 turn 累计快照，true = 会话结束
  "indicators": { "letMe": 1, "we": 179, "lets": 88, "i": 17,
                  "p50BlockChars": 111, "visibleReplies": 1,
                  "firstLines": { "we-need": 120, "other": 73 } },
  "vector": { /* 归一化指标向量 */ },
  "judgment": { "family": "minimal-like", "confidence": 0.87, "distances": {},
                "mixed": false, "mixedReason": "" }
}
```

**隐私边界（硬性要求）**：记录只含聚合指标，绝不含原始思维链文本。文件记录默认关闭、显式开启。

### GUI 校准（半自动）

设置页（**Settings → 思维链画像 → 数据校准**）会扫描配置的记录文件，按（provider, model, preset）分组、聚合每组指标向量均值，并提供一键 **「应用为画像族」**——把实测分组写成一条新的画像族进入 `profiles` 配置。聚合全自动，应用永远是人工决定；内置基线绝不被动改写。

扫描读取 `GET /cot-profile/records`——插件在 web server 上注册的路由。它**只**读配置的 `record.file` 路径并返回聚合结果（绝不含原始思维链文本）；未配置文件时返回空结果。若设置页扫描报错，先确认 JSONL 路径已填且已跑完几个会话。

## 开发

```bash
npm test          # node --test test/*.test.js（零依赖）
```

- `lib/analyzer.js` — 纯分析逻辑（tokenize、计数、首行分类、向量、距离、判定）
- `lib/profiles.js` — 内置基线（标注为**估算值**——用记录模式数据校准）
- `lib/index.js` — host：会话投影、事件、记录落盘
- `lib/client.js` — 徽章、面板、设置页

## 判定能力如何被验证

三层验证，强度递增：

1. **单元测试**（`test/analyzer.test.js`、`test/projection.test.js`）——纯逻辑：tokenize、计数、向量、加权距离、过渡带检测。确定性、快速。
2. **真实模型数据的金标准验证**（`test/golden-verify.test.js` + `test/golden/probes.csv`）——119 个真实 DeepSeek V4 Pro / V4 Flash 单请求探针 run，来自 [`yjh051108/dsh-router-standard`](https://github.com/yjh051108/dsh-router-standard)（MIT，见 `test/golden/NOTICE`），每个 run 带已知的词法真值分类与本插件同口径的措辞指标。当前结果：**spec 侧 83/83 判对（100%）、方向错误为零、react 侧永不误判为 spec 侧、ambiguous 有 ≥55% 被标记为过渡带**。这验证的是对真实模型行为的判别力，而不只是逻辑自洽。
3. **端到端回放验证**（`scripts/replay-verify.mjs`）——把真实 DSH 会话日志（`session.jsonl.zstd`）回放进投影 fold，并用独立的真值统计（直接对原始 reasoning 文本计数）逐字段对照。在本仓库历史会话日志上验证：**所有 reasoning 块、四计数、首行分布、块长中位数全部精确一致**。这验证的是单元测试覆盖不到的监测链（事件流 → fold → 统计）。
4. **记录模式校准**（见上文）——插件自己的会话记录按模型积累聚合数据，可在设置页查看并一键应用为实测基线。

诚实的边界：措辞是断层侧指纹，所以这里的"验证通过"意味着**与已知装配下的真实模型轨迹一致**——它不能证明当前跑的是哪个模型（单一装配下的措辞做不到）。

### 受控探针（你的环境、你的装配）

金标准数据验证的是判定逻辑在他人探针上的表现；要在**你自己的模型、你的 harness、你的任务**下验证：

1. **选一个已知装配**。spec 侧轨迹来自 minimal/RL 极简装配（`We` 口吻、let me ≈ 0）；react 侧来自 Standard/PTC 类装配（`The`/`Let` 口吻）；混合侧来自中间态 persona。`dsh-router-standard` 的预设族是现成的两侧来源。
2. **每个探针跑一个微任务会话**——如"检查仓库，然后定位并阅读 README"（router 探针用的微任务），每次一个短任务、让思维链可见。
3. **导出并验证**：
   ```bash
   node scripts/probe-verify.mjs --expect spec ~/.dsh/sessions/<工作区>/<session>/session.jsonl.zstd
   node scripts/probe-verify.mjs --expect react --dir ~/.dsh/sessions/probe-react
   ```
   脚本把每个日志回放进插件的 fold，逐会话报告判定；遇到方向错误（spec 预期被判成 react 侧，或反之）即失败。spec/react 预期下出现过渡带判定属"保守"（数据不足），不算错误——与金标准判据一致。

### 本机实测验证结果（本项目自己的探针）

本机受控探针（DeepSeek V4 Pro，同一任务同一工作区，仅装配不同）——见 `docs/experiments/`：

| 装配 | n | 判定 | 归纳 |
|---|---|---|---|
| standard | 3 | react、react、mixed(3块不足) | **react 侧**（let me / I 口吻）|
| minimal | 3 | spec、spec、mixed(真实 we+letMe 混合) | **spec 侧**（we / let's 口吻）|

- "装配 → 轨迹侧"的映射在本机复现，与 router-standard / modeltest 一致。
- 探针暴露并修复了一个真实判定缺陷：工具密集会话的 `let me` 爆表（letMe100 ≈ 1700）
  因软距离饱和被误判为"不确定"——**strong-signal 覆盖**现以高置信（≥85%）判定此类轨迹。
- 本机记录校准显示实测强度远超内置估算（minimal we100 ≈ 469 vs 基线 126；standard
  letMe100 ≈ 1706 vs 208）——内置估算是他人环境/任务手算，应用实测基线时需注意这一背景。

方法学备注：会话的实际装配应读取 `agent-preset/selected` 事件 + 工具调用集（会话头部的
`agentPreset` 只是创建时默认值，不可靠）。

## Upstream wishlist

以下均为 DeepSeek Harness 0.1.0-rc.6 的临时缺口，本插件暂以变通方式绕过：

1. **插件自声明 settings 暴露** —— 把命名空间白名单从 `dsh-host-apiproxy` 挪进 `settings.register()`，让插件免补丁暴露自己的配置。
2. **右侧列的可加槽位** —— 提供 `conversation.details.panel` 这类列表席位，让悬浮面板升级为原生右侧列。

## 致谢

本项目站在社区成果之上，按贡献类型鸣谢：

**方法论与数据**

- [`xiaobright/modeltest`](https://github.com/xiaobright/modeltest) — 内置画像族的轨迹指标基线与评测数据（V4.1b，frozen）。
- [`xiaobright/dsh-anchored-standard`](https://github.com/xiaobright/dsh-anchored-standard) — 锚定机制，本插件最初需求的来源。
- [`yjh051108/dsh-router-standard`](https://github.com/yjh051108/dsh-router-standard) — 画像族语义采用的三带/断层框架；金标准验证数据（119 个真实探针 run，见 `test/golden/NOTICE`）。

**设计参考**

- [`zhu1090093659/dsh-web-ui`](https://github.com/zhu1090093659/dsh-web-ui) — 实验性 `track` 面板模式的布局轨道思路（基于实测行为重新实现，非复制代码）。

**生态**

- [`yjh051108/dsh-routing-suite`](https://github.com/yjh051108/dsh-routing-suite) — 注入器 + 路由预设套装，与本项目方向交汇。

## License

MIT，见 [LICENSE](./LICENSE)。
