# dsh-cot-profile 开源社区推广执行手册

> 每个渠道：发在哪 → 怎么发 → 时机 → 规则。文案全文见文末（可直接复制）。

---

## 渠道总览

| 渠道 | 位置 | 形态 | 门槛 | 最佳时机 | 文案 |
|---|---|---|---|---|---|
| GitHub Discussions | deepseek-ai/deepseek-harness → Discussions | 讨论帖（英文）| 无（GitHub 账号）| 任何时间，工作日白天 | 文案① |
| 生态地图收录 | zoahdev/dsh-ecosystem → Issues | 收录请求 | 无 | 发完自荐帖之后 | 文案② |
| Linux.do | linux.do → 技术分享板块 | 帖子（中文）| 注册账号 | 国内晚上（高活跃）| 文案③ |
| ~~Show HN~~ | 不采用 | — | — | — | — |
| ~~掘金 / 知乎~~ | 不采用 | — | — | — | — |
| 生态联动 | 作者仓库 issue / X 私信 | 互链请求 | 礼貌即可 | 其他渠道跑完后 | 文案⑤⑥ |

---

## 逐个怎么用

### ① GitHub Discussions 插件专区（主入口，先做这个）

官方已开设插件专区「Show Your Plugins!」（https://github.com/deepseek-ai/deepseek-harness/discussions/categories/show-your-plugins），
发帖指南在 #2004。**必须按官方格式，否则可能被删：**

1. 标题格式：`DSH｜项目名称｜一句话说明`
2. 正文用官方模板：非官方声明 → 项目地址 → 介绍 → **截图** → 与 DSH 的集成方式
3. 一个主题一个项目
4. 发布前准备 2-3 张截图（面板判定卡、校准页）——模板明确要求截图/GIF/视频，没截图先补
5. 发布后守评论区回帖

发帖前截图清单：
- [ ] 面板判定卡（家族名 + 置信度）
- [ ] 校准页面（分组 + 基线差异/判定分布）
- [ ] 可选：会话头部徽章

### ② dsh-ecosystem 收录（让插件进"生态目录"）

1. 打开 https://github.com/zoahdev/dsh-ecosystem
2. 先看 **CONTRIBUTING / issue 模板 / 现有 catalog 格式**（仓库有收录格式要求就照抄）
3. 没有模板就提 issue，粘贴文案②
4. 收录后插件会出现在社区生态地图里，白赚一个入口

### ③ Linux.do（中文开发者浓度最高的渠道）

1. 注册 linux.do（邀请码制，没有就先注册排队）
2. 发到 **技术分享**（或 AI 相关板块，看板块命名）
3. 标题参考：`分享：我把模型轨迹评测研究做成了 DSH 实时插件`
4. 粘贴文案③；**正文要干货打底**（原理+实测数据段落不要省，硬广会被喷）
5. 发完在楼里补安装 FAQ

### ④ Show HN（英文圈一次机会）

1. news.ycombinator.com 注册，**karma 不够发不了 Show HN**（新号先回帖攒 karma）
2. 标题必须 `Show HN: ` 前缀：`Show HN: Real-time chain-of-thought fingerprint monitor for agent harnesses`
3. 正文粘贴文案④（要点式 + 链接）
4. **发布后 1-2 小时内守在评论区回复**——HN 的排名取决于早期互动
5. 时机：美东早 8-10 点（北京晚 8-10 点），避开周末

规则：HN 社区对 self-promotion 敏感，诚实声明（"我写的"）+ 技术深度是护城河；别用多个账号顶帖（会封）。

### ⑤ 掘金 / 知乎（图文版长尾）

- 视频发布后，把脚本内容扩成图文：安装教程 + 原理（措辞指纹研究）+ 实测数据（README 里"On-machine verification"现成素材）
- 掘金发 **前端/后端/开源** 分类；知乎发 **AI/大模型** 话题
- 互相引流：图文里放视频链接，视频简介放图文链接

### ⑥ 生态联动（精准流量，一对一）

- **xiaobright**（modeltest / anchored-standard 作者）：我们的指纹方法论源自他的研究，请求互链。发他的仓库 issue（礼貌）或 X 私信，文案⑥a
- **yjh051108**（dsh-router-standard，golden 数据源）：README 已引用他的数据，请求互链，文案⑥b

---

## 执行顺序建议（时间线）

```
第 1 步（今天）：① GitHub Discussions 自荐帖
第 2 步（明天）：② dsh-ecosystem 收录请求 + ⑥ 两位作者的互链请求
第 3 步（视频发布后）：③ Linux.do 帖子（带视频）
```

> 已确认：④ Show HN 与 ⑤ 掘金/知乎 不采用。

原则：**先官方生态、再中文社区、最后英文圈**；每个渠道的文案都要带一句"这是行为画像不是模型身份"的诚实声明——这是项目可信度的标志，也是社区最看重的点。

---

## 文案全文

### 文案① GitHub Discussions 插件专区帖（按官方模板 · 排版优化版）

> **标题：`DSH｜dsh-cot-profile｜实时思维链轨迹画像：措辞指纹监控 + GUI 校准基线`**

````markdown
> **_> 非官方项目，由社区成员独立开发和维护。_**

> **项目地址：** https://github.com/Chloride233/dsh-cot-profile

---

**dsh-cot-profile** 是 DeepSeek Harness 的实时思维链轨迹画像插件。与常见的工具型插件不同，它是**分析测量类**：不替你操作，而是把模型思考的措辞指纹变成实时可观测的画像证据——监听会话 reasoning 流，统计措辞指纹（`let me` / `we` / `let's` / `I`、首行模式、块长、阶段回复），用加权距离匹配内置基线，实时判定当前会话的画像族（minimal-like / standard-like / gray-like）并给出置信度。

| minimal-like 判定 | standard-like 判定 |
|---|---|
| ![minimal-like](https://github.com/Chloride233/dsh-cot-profile/raw/main/docs/screenshots/panel-verdict.png) | ![standard-like](https://github.com/Chloride233/dsh-cot-profile/raw/main/docs/screenshots/panel-standard.png) |

| GUI 校准（扫描 → 分组 → 一键应用基线） |
|---|
| ![GUI 校准](https://github.com/Chloride233/dsh-cot-profile/raw/main/docs/screenshots/calibration.png) |

## 功能

- **实时面板**：会话投影推送驱动（无轮询、resume 安全），判定卡为核心，原始指标与判定并列展示
- **记录模式**：按回合自动落聚合记录——只存统计，绝不落原文
- **GUI 校准**：设置页扫描记录文件 → 按模型/预设分组 → 基线差异与判定分布 → 一键应用为自己的基线

## 与 DSH 的集成方式

- Host 注册 `cot-profile` 会话投影，Client 通过 `useProjection` 实时读取（官方 session-projection 机制）
- 面板/徽章挂载在官方 additive 槽位（`conversation.session.header.utilities` / `conversation.input.overlay`）
- 记录与校准走 webServer 路由 + settings 命名空间

## 安装

```bash
dsh plugin --profile web add github:Chloride233/dsh-cot-profile

## 诚实边界

措辞指纹描述的是 **(模型 × 配置)** 的行为画像，不是模型身份（研究中的 Flash 反例：同样措辞可能出现在不同模型上）。工具提供证据，结论由使用者判断。

方法论源自 [xiaobright/modeltest](https://github.com/xiaobright/modeltest) 的轨迹分析研究；golden 验证基于 [yjh051108/dsh-router-standard](https://github.com/yjh051108/dsh-router-standard) 的探针数据。MIT 开源 · 40 个零依赖单测 · 双语 README。
```

**排版要点**：非官方声明保留在顶部引用块；截图用 `raw` 链接直接嵌进表格（GitHub Discussion 会渲染图片）；功能/集成用分节标题；安装命令用代码块；结尾带来源链接。发帖时把正文复制进输入框即可，标题另外填。

````
### 文案② dsh-ecosystem 收录请求（英文 issue）

> **Request: add dsh-cot-profile to the catalog**
>
> - Repo: github.com/Chloride233/dsh-cot-profile
> - Category: reasoning / monitoring
> - One-liner: real-time chain-of-thought trajectory profiling — wording fingerprints, profile-family judgment, per-turn records, GUI baseline calibration
> - Topics: dsh-plugin, chain-of-thought, reasoning, monitoring
> - Distinguishing angle: turns offline model-trait research (modeltest) into a live measurement instrument; data-driven calibration workflow.

### 文案③ Linux.do 帖（中文）

> **分享：我把模型轨迹评测研究做成了 DSH 实时插件**
>
> 思路来源是 xiaobright 的模型轨迹研究——不同轨迹族在思维链措辞上分离度极高（minimal 系 we/let's 为主、let me≈0；standard 系 let me 爆炸）。我把它做成了实时监控插件 dsh-cot-profile：
>
> - 面板跟着思维链实时跳，判定当前会话的画像族（minimal-like / standard-like / gray-like，带置信度）
> - 按回合自动记录聚合数据（只存统计不存原文）；设置页扫描后一键校准成你自己的基线（含与当前基线差异、判定分布）
> - 纯 JS、零依赖单测 30+、双语 README
>
> 诚实边界：这是 (模型×配置) 的行为画像，不是模型身份判定——同样措辞可能出现在不同模型上（研究里的 Flash 反例）。
>
> 安装：`dsh plugin --profile web add github:Chloride233/dsh-cot-profile`
> 仓库：github.com/Chloride233/dsh-cot-profile（MIT）

### 文案④ Show HN（英文）

> **Show HN: Real-time chain-of-thought fingerprint monitor for agent harnesses**
>
> dsh-cot-profile watches the reasoning stream and classifies the session's trajectory family from wording fingerprints (we/let me/let's/I ratios, first-line patterns, block-length median). Built on the public trajectory research in xiaobright/modeltest; honest about limits — it's a trajectory fingerprint, not a model-ID tool. Per-turn aggregate records + one-click GUI baseline calibration. MIT, zero-dependency testable core.
>
> Repo: https://github.com/Chloride233/dsh-cot-profile

### 文案⑤⑥ 生态联动（互链请求）

**⑥a 给 xiaobright（modeltest / anchored-standard 作者）：**

> 你好！我基于你的轨迹分析方法论做了个开源插件 dsh-cot-profile（实时监控思维链措辞指纹、判定轨迹画像族、记录模式校准基线），README 里标注了你的研究为来源。如果你的项目页方便，可以互链一下吗？我的仓库：github.com/Chloride233/dsh-cot-profile

**⑥b 给 yjh051108（dsh-router-standard）：**

> 你好！dsh-cot-profile 的 golden 验证使用了 dsh-router-standard 的探针数据（README 已注明来源与 NOTICE）。如果方便的话，希望两个仓库可以互链——你的数据让我的判定验证有了真实模型依据，感谢！


---

## 推广台账（执行记录）

> 更新于 2026-08-16。按计划顺序推进；④⑤ 已确认不采用。

| 渠道 | 链接 | 状态 | 备注 |
|---|---|---|---|
| ① 官方插件专区主帖 | https://github.com/deepseek-ai/deepseek-harness/discussions/2284 | ✅ 已发布 | 标题按官方格式，0 评论起步，需守评论区 |
| ② 生态目录收录 | https://github.com/zoahdev/dsh-ecosystem/issues/1 | ⏳ 待合并 | 等维护者收录进 catalog |
| ⑥a 方法论来源互链 | https://github.com/xiaobright/modeltest/issues/4 | ⏳ 待回复 | 同意后更新 README Credits |
| ⑥b golden 数据源互链 | https://github.com/yjh051108/dsh-router-standard/issues/24 | ⏳ 待回复 | 同上 |
| 附加：能力索引自荐 | https://github.com/deepseek-ai/deepseek-harness/discussions/2282#discussioncomment-18038242 | ✅ 已发 | dsh-capability-index |
| 附加：社区合集自荐 | https://github.com/deepseek-ai/deepseek-harness/discussions/2260#discussioncomment-18038244 | ✅ 已发 | 社区项目介绍合集 |
| ③ Linux.do | 待发 | ⏳ 未开始 | 视频发布后发（文案③） |
| B 站视频 | 待录 | ⏳ 未开始 | 脚本 docs/VIDEO_SCRIPT.md（v0.2） |

### 待办追踪
- [ ] 守 #2284 评论区，回复安装/校准问题
- [ ] 盯 3 个 issue 回复；作者同意后更新 README Credits 段并回帖确认
- [ ] 录 B 站视频（脚本已就绪）→ 发布后发 Linux.do（③）
- [ ] dsh-ecosystem 收录后，把插件加入其 catalog 格式要求的字段
