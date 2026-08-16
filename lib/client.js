window.__ModuleLoader__.load({
  id: 'dsh-cot-profile',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

    const React = require('react');
    const ReactDOM = require('react-dom');

    const SETTINGS_NAMESPACE = 'cot-profile';
    const PROJECTION_KEY = 'cot-profile';

    const inject = ['slots', 'settingsScope'];

    // ---------------------------------------------------------------------
    // Shared visuals
    // ---------------------------------------------------------------------

    const FAMILY_COLORS = {
      'minimal-like': '#2ea043',
      'standard-like': '#d29922',
      'gray-like': '#388bfd',
    };
    const familyColor = (family) => FAMILY_COLORS[family] || 'var(--dsw-alias-label-tertiary)';

    // ---------------------------------------------------------------------
    // i18n: dictionaries + module-level locale wiring
    // ---------------------------------------------------------------------

    const DICT = {
      'zh': {
        'badge.placeholder': '画像 —',
        'badge.sampling': '采样中 {blocks}/{minBlocks}',
        'badge.mixed': 'ambiguous · {pct}%',
        'badge.label': '思维链画像徽章',
        'panel.label': '思维链画像面板',
        'track.label': '思维链画像轨道栏',
        'panel.title': '思维链轨迹画像',
        'panel.tabLive': '实时',
        'panel.tabRecords': '记录分析',
        'panel.hint': '措辞指标反映 (模型 × 配置) 的轨迹画像，不是模型身份断言。',
        'panel.sampling': '采样中',
        'panel.sampling.desc': '{blocks}/{minBlocks} 块（满 {minBlocks} 块给出判定）',
        'panel.mixed': 'ambiguous',
                'panel.verdict': '置信度 {pct}% · {blocks} 块',
        'panel.tracking': '实时追踪中',
        'panel.thinking': '正在思考…',
        'panel.metrics': '指标 · 按块累计',
        'panel.firstLines': '首行模式',
        'panel.distances': '与基线距离（越小越近）',
        'panel.we': 'we',
        'panel.letMe': 'let me',
        'panel.lets': "let's",
        'panel.i': 'I',
        'panel.p50': '块长 p50',
        'panel.p50Unit': '字符',
        'panel.replies': '阶段回复',
        'panel.flWeNeed': 'We need…',
        'panel.flUserWants': 'The user…',
        'panel.flLetMe': 'Let me…',
        'panel.flI': 'I…',
        'panel.collapse': '收起',
        'panel.expand': '展开思维链画像',
                                                                'panel.axis.spec': 'spec',
        'panel.axis.react': 'react',
        'panel.axis.transition': '过渡带',
        'panel.verified': '✓ 已验证',
        'panel.verifiedHint': '判定经 119 个真实模型 run 金标准验证；监测经真实会话回放逐字段校验。',
        'panel.baseline.measured': '基线：实测（{count} 画像族）',
        'panel.baseline.estimated': '基线：内置估算',
        'panel.details': '详情',
        'panel.hide': '收起',
        'panel.confidence': '置信度',
        'settings.title': '思维链画像',
        'settings.unavailable': '设置命名空间未暴露给浏览器。插件仍可通过 cordis 配置（cordis.yml 里的 cot-profile 行）工作；如需 Web 编辑，运行 scripts/install-patch.sh（临时补丁，见 README）。',
        'settings.desc': '实时统计会话思维链的措辞指标（let me / we / let\'s / I、首行模式、块长、阶段回复），与内置基线画像对比并给出画像族判定。画像族描述 (模型 × 配置) 的轨迹，不是模型身份。',
        'settings.minBlocks': '判定门槛（reasoning 块数）',
        'settings.badge': '会话头部徽章',
        'settings.panel': '实时面板',
        'settings.panelMode': '面板形态',
        'settings.panelMode.overlay': '悬浮面板（默认）',
        'settings.panelMode.track': '右侧轨道栏（实验性）',
        'settings.panelMode.hint': '轨道栏直接操作布局网格（DOM），DSH 升级可能需要适配；悬浮面板零风险。',
        'settings.record.emit': '记录模式：事件',
        'settings.record.emitLabel': '会话结束发 cot-profile/record 事件',
        'settings.record.file': '记录模式：JSONL 文件（空 = 关闭）',
        'settings.record.fileHint': '支持 ~ 开头（自动展开为用户主目录）；留空 = 关闭文件记录。',
        'settings.calibrate': '数据校准（半自动）',
        'settings.calibrate.hint': '扫描记录文件，按模型/预设聚合指标；确认后一键应用为画像族（不会自动改写判定基线）。',
        'settings.calibrate.scan': '扫描记录文件',
        'settings.calibrate.scanning': '扫描中…',
        'settings.calibrate.error': '扫描失败：',
        'settings.calibrate.emptyExists': '记录文件存在但还没有数据：先跑几个会话，再回来扫描。',
        'settings.calibrate.emptyMissing': '记录文件还不存在：先在“记录模式 JSONL 文件”填入路径，跑几个会话后文件会自动生成，再回来扫描。',
        'settings.calibrate.total': '共 {total} 条记录 · {file}',
        'settings.calibrate.sessions': '{count} 会话 · {blocks} 块',
        'settings.calibrate.metrics': 'we {we} · let me {letMe}',
        'settings.calibrate.applied': '✓ 已应用',
        'settings.calibrate.apply': '应用为画像族',
        'settings.calibrate.details': '详情',
        'settings.calibrate.hide': '收起',
        'settings.calibrate.baseline': '最近基线',
        'settings.calibrate.distSpec': 'spec',
        'settings.calibrate.distReact': 'react',
        'settings.calibrate.distGray': 'gray',
        'settings.calibrate.distMixed': '过渡',
        'settings.calibrate.distSampling': '采样',
        'settings.calibrate.distHint': '会话判定分布',
        'settings.calibrate.diffs': '与基线 {profile} 的差异',
        'settings.calibrate.diffHigh': '偏高',
        'settings.calibrate.diffLow': '偏低',
        'settings.calibrate.readonlyHint': '仅查看：设置命名空间未暴露，无法应用画像族（可运行 scripts/install-patch.sh 启用）。',
        'settings.weights': '权重（JSON，可选，留 {} 用默认）',
        'settings.profiles': '画像族（JSON 数组，可选，留 [] 用内置基线）',
        'settings.saveError': '保存失败：',
        'settings.jsonInvalid': 'JSON 无效：',
        'settings.effect': '配置改动在下一个 reasoning 块完成后生效（判定随新配置重算）。',
      },
      en: {
        'badge.placeholder': 'profile —',
        'badge.sampling': 'sampling {blocks}/{minBlocks}',
        'badge.mixed': 'ambiguous · {pct}%',
        'badge.label': 'CoT profile badge',
        'panel.label': 'CoT profile panel',
        'track.label': 'CoT profile track column',
        'panel.title': 'CoT trajectory profile',
        'panel.tabLive': 'Live',
        'panel.tabRecords': 'Records',
        'panel.hint': 'Wording indicators reflect the (model × assembly) trajectory, not model identity.',
        'panel.sampling': 'sampling',
        'panel.sampling.desc': '{blocks}/{minBlocks} blocks (verdict after {minBlocks})',
        'panel.mixed': 'ambiguous',
                'panel.verdict': 'confidence {pct}% · {blocks} blocks',
        'panel.tracking': 'tracking live',
        'panel.thinking': 'thinking…',
        'panel.metrics': 'indicators · cumulative',
        'panel.firstLines': 'first-line patterns',
        'panel.distances': 'baseline distance (lower = closer)',
        'panel.we': 'we',
        'panel.letMe': 'let me',
        'panel.lets': "let's",
        'panel.i': 'I',
        'panel.p50': 'p50 block',
        'panel.p50Unit': 'chars',
        'panel.replies': 'interim replies',
        'panel.flWeNeed': 'We need…',
        'panel.flUserWants': 'The user…',
        'panel.flLetMe': 'Let me…',
        'panel.flI': 'I…',
        'panel.collapse': 'collapse',
        'panel.expand': 'expand profile',
                                                                'panel.axis.spec': 'spec',
        'panel.axis.react': 'react',
        'panel.axis.transition': 'transition',
        'panel.verified': '✓ verified',
        'panel.verifiedHint': 'judgment verified against 119 real model probe runs; monitoring verified by replay against real session logs.',
        'panel.baseline.measured': 'baseline: measured ({count} profiles)',
        'panel.baseline.estimated': 'baseline: built-in estimates',
        'panel.details': 'details',
        'panel.hide': 'hide',
        'panel.confidence': 'confidence',
        'settings.title': 'CoT profile',
        'settings.unavailable': 'Settings namespace is not exposed to the browser. The plugin still works via cordis config (the cot-profile row in cordis.yml); for Web editing run scripts/install-patch.sh (temporary patch, see README).',
        'settings.desc': "Real-time reasoning wording indicators (let me / we / let's / I, first-line patterns, block length, interim replies) judged against built-in trajectory baselines. A trajectory family describes (model × assembly) behavior, not model identity.",
        'settings.minBlocks': 'Judgment threshold (reasoning blocks)',
        'settings.badge': 'Session-header badge',
        'settings.panel': 'Live panel',
        'settings.panelMode': 'Panel mode',
        'settings.panelMode.overlay': 'Floating panel (default)',
        'settings.panelMode.track': 'Right track column (experimental)',
        'settings.panelMode.hint': 'The track column manipulates the layout grid (DOM) directly; a DSH upgrade may require adapting. The floating panel is zero-risk.',
        'settings.record.emit': 'Record mode: event',
        'settings.record.emitLabel': 'Emit cot-profile/record at session end',
        'settings.record.file': 'Record mode: JSONL file (empty = off)',
        'settings.record.fileHint': 'A leading ~ expands to your home directory; empty disables file recording.',
        'settings.calibrate': 'Calibration (semi-automatic)',
        'settings.calibrate.hint': 'Scan the record file, aggregate indicators by model/preset, and apply a group as a profile family with one click (baselines are never rewritten automatically).',
        'settings.calibrate.scan': 'Scan record file',
        'settings.calibrate.scanning': 'Scanning…',
        'settings.calibrate.error': 'Scan failed: ',
        'settings.calibrate.emptyExists': 'The record file exists but has no data yet: run a few sessions, then scan again.',
        'settings.calibrate.emptyMissing': 'The record file does not exist yet: set the JSONL path, run a few sessions (the file is created automatically), then scan again.',
        'settings.calibrate.total': '{total} records · {file}',
        'settings.calibrate.sessions': '{count} sessions · {blocks} blocks',
        'settings.calibrate.metrics': 'we {we} · let me {letMe}',
        'settings.calibrate.applied': '✓ applied',
        'settings.calibrate.apply': 'Apply as profile',
        'settings.calibrate.details': 'details',
        'settings.calibrate.hide': 'hide',
        'settings.calibrate.baseline': 'nearest baseline',
        'settings.calibrate.distSpec': 'spec',
        'settings.calibrate.distReact': 'react',
        'settings.calibrate.distGray': 'gray',
        'settings.calibrate.distMixed': 'transition',
        'settings.calibrate.distSampling': 'sampling',
        'settings.calibrate.distHint': 'session judgment distribution',
        'settings.calibrate.diffs': 'diff vs baseline {profile}',
        'settings.calibrate.diffHigh': 'high',
        'settings.calibrate.diffLow': 'low',
        'settings.calibrate.readonlyHint': 'View-only: the settings namespace is not exposed, profiles cannot be applied (run scripts/install-patch.sh to enable).',
        'settings.weights': 'Weights (JSON, optional; {} = defaults)',
        'settings.profiles': 'Profiles (JSON array, optional; [] = built-in baselines)',
        'settings.saveError': 'Save failed: ',
        'settings.jsonInvalid': 'Invalid JSON: ',
        'settings.effect': 'Config changes take effect after the next reasoning block (judgment recomputes).',
      },
    };

    let localeApi = null;
    let tFn = null;

    /** Subscribe to locale changes so components re-render and re-read `t`. */
    function useLocaleState() {
      if (localeApi === null) return null;
      return React.useSyncExternalStore(
        React.useCallback((onStoreChange) => localeApi.subscribe(onStoreChange), []),
        () => localeApi.getSnapshot(),
      );
    }

    /** Translate with a Chinese fallback when the locale service is absent. */
    function T(key, params) {
      if (tFn !== null) return tFn(key, params);
      const template = DICT['zh'][key] ?? key;
      if (!params) return template;
      return template.replace(/\{(\w+)\}/g, (whole, name) => (params[name] !== undefined ? String(params[name]) : whole));
    }

    const contentStyles = {
      familyCard: {
        borderRadius: 10,
        padding: '12px 14px',
        background: 'var(--dsw-alias-bg-layer-2)',
        border: '1px solid',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      },
      familyName: { fontSize: 24, fontWeight: 700, lineHeight: '30px' },
      confidence: { fontSize: 13, color: 'var(--dsw-alias-label-secondary)' },
      thinking: { fontSize: 12, color: 'var(--dsw-alias-label-tertiary)', display: 'flex', alignItems: 'center', gap: 6 },
      dot: { width: 8, height: 8, borderRadius: 4, display: 'inline-block' },
      grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px', fontSize: 13 },
      metric: { display: 'flex', justifyContent: 'space-between', gap: 8, color: 'var(--dsw-alias-label-secondary)' },
      metricValue: { color: 'var(--dsw-alias-label-primary)', fontVariantNumeric: 'tabular-nums', fontWeight: 600 },
      sectionLabel: { color: 'var(--dsw-alias-label-tertiary)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
      bar: { height: 6, borderRadius: 3, background: 'var(--dsw-alias-bg-layer-2)', overflow: 'hidden', flex: 1 },
      barFill: { height: '100%', borderRadius: 3 },
      distRow: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--dsw-alias-label-secondary)' },
    };

    const metric = (label, value) =>
      React.createElement(
        'div',
        { key: label, style: contentStyles.metric },
        React.createElement('span', null, label),
        React.createElement('span', { style: contentStyles.metricValue }, String(value)),
      );

    /** The panel content — shared by the overlay panel and the track column. */
    function ProfileContent({ profile }) {
      useLocaleState();
      const j = profile.judgment;
      const c = profile.counts;
      const fl = profile.firstLines;
      const color = j.mixed ? '#d29922' : familyColor(j.family);
      const maxDist = Math.max(1, ...Object.values(j.distances));
      const pct = Math.round(j.confidence * 100);
      const [showDetails, setShowDetails] = React.useState(false);

      // Fault-line axis: position from the we/letMe discrimination ratio.
      // 0 = spec end (we-led), 1 = react end (let-me-led), middle = transition.
      const we = profile.vector?.we100 ?? 0;
      const letMe = profile.vector?.letMe100 ?? 0;
      const axisPos = we + letMe > 0 ? letMe / (we + letMe) : 0.5;
      const inTransitionZone = axisPos > 0.3 && axisPos < 0.7 && we > 0 && letMe > 0;

      const detailRows = [
        [T('panel.we'), c.we],
        [T('panel.letMe'), c.letMe],
        [T('panel.lets'), c.lets],
        [T('panel.i'), c.i],
        [T('panel.p50'), profile.p50BlockChars + T('panel.p50Unit')],
        [T('panel.replies'), profile.visibleReplies],
        [T('panel.flWeNeed'), fl['we-need']],
        [T('panel.flUserWants'), fl['the-user-wants']],
        [T('panel.flLetMe'), fl['let-me']],
        [T('panel.flI'), fl.i],
      ];

      // Fault-line indicator.
      const axis = React.createElement(
        'div',
        { style: { display: 'flex', flexDirection: 'column', gap: 4 } },
        React.createElement(
          'div',
          {
            style: {
              position: 'relative',
              height: 8,
              borderRadius: 4,
              background: 'linear-gradient(to right, #2ea043, #d29922 35%, #f0883e 50%, #d29922 65%, #388bfd)',
            },
          },
          React.createElement('div', {
            style: {
              position: 'absolute',
              left: 'calc(' + Math.round(axisPos * 100) + '% - 5px)',
              top: -3,
              width: 10,
              height: 14,
              borderRadius: 3,
              background: color,
              border: '1px solid var(--dsw-alias-bg-layer-1)',
            },
          }),
        ),
        React.createElement(
          'div',
          { style: { display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--dsw-alias-label-tertiary)' } },
          React.createElement('span', null, T('panel.axis.spec')),
          React.createElement('span', null, T('panel.axis.transition')),
          React.createElement('span', null, T('panel.axis.react')),
        ),
      );

      // Verdict card (semi-pro: community classification label + confidence).
      const verdict = !j.sufficient
        ? React.createElement(
            'div',
            { style: { ...contentStyles.familyCard, borderColor: 'var(--dsw-alias-border-l2)' } },
            React.createElement('div', { style: { ...contentStyles.familyName, color: 'var(--dsw-alias-label-tertiary)' } }, T('panel.sampling')),
            React.createElement('div', { style: contentStyles.confidence }, T('panel.sampling.desc', { blocks: profile.blocks, minBlocks: profile.minBlocks })),
            React.createElement(
              'div',
              { style: contentStyles.thinking },
              React.createElement('span', { className: 'cot-prof-glow', style: { ...contentStyles.dot, background: color } }),
              React.createElement('span', { className: 'cot-prof-pulse' }, T('panel.thinking')),
            ),
          )
        : React.createElement(
            'div',
            { style: { ...contentStyles.familyCard, borderColor: color } },
            React.createElement('div', { style: { ...contentStyles.familyName, color } }, j.mixed ? T('panel.mixed') : j.family),
            React.createElement(
              'div',
              { style: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' } },
              React.createElement(
                'span',
                { style: { fontSize: 13, color: 'var(--dsw-alias-label-secondary)', fontVariantNumeric: 'tabular-nums' } },
                T('panel.confidence') + ' ' + pct + '%',
              ),
              React.createElement(
                'span',
                {
                  style: { fontSize: 12, color: '#2ea043', cursor: 'help' },
                  title: T('panel.verifiedHint'),
                },
                T('panel.verified'),
              ),
            ),
            React.createElement(
              'div',
              { style: { height: 3, borderRadius: 2, background: 'var(--dsw-alias-bg-layer-1)', overflow: 'hidden' } },
              React.createElement('div', {
                style: {
                  width: (j.mixed ? Math.min(100, pct) : Math.max(60, pct)) + '%',
                  height: '100%',
                  background: j.mixed || pct < 60 ? '#d29922' : pct < 80 ? '#9e6a03' : color,
                },
              }),
            ),
            React.createElement(
              'div',
              { style: contentStyles.thinking },
              React.createElement('span', { className: 'cot-prof-glow', style: { ...contentStyles.dot, background: color } }),
              React.createElement('span', { className: 'cot-prof-pulse' }, T('panel.tracking')),
            ),
          );

      return React.createElement(
        'div',
        { style: { display: 'flex', flexDirection: 'column', gap: 12 } },
        verdict,
        React.createElement(
          'div',
          { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 } },
          React.createElement(
            'span',
            { style: { fontSize: 12, color: 'var(--dsw-alias-label-tertiary)' } },
            (profile.ui?.profilesCount || 0) > 0
              ? T('panel.baseline.measured', { count: profile.ui.profilesCount })
              : T('panel.baseline.estimated'),
          ),
          React.createElement(
            'button',
            {
              style: { border: '1px solid var(--dsw-alias-border-l2)', background: 'transparent', color: 'var(--dsw-alias-label-secondary)', borderRadius: 6, padding: '2px 10px', fontSize: 12, cursor: 'pointer' },
              onClick: () => setShowDetails((prev) => !prev),
            },
            showDetails ? T('panel.hide') : T('panel.details'),
          ),
        ),
        showDetails &&
          React.createElement(
            'div',
            { style: { display: 'flex', flexDirection: 'column', gap: 10 } },
            axis,
            React.createElement('div', { style: contentStyles.sectionLabel }, T('panel.metrics')),
            React.createElement(
              'div',
              { style: contentStyles.grid },
              detailRows.map(([label, value]) => metric(label, value)),
            ),
            React.createElement('div', { style: contentStyles.sectionLabel }, T('panel.distances')),
            Object.entries(j.distances).map(([family, dist]) =>
              React.createElement(
                'div',
                { key: family, style: contentStyles.distRow },
                React.createElement('span', { style: { width: 92 } }, family),
                React.createElement('div', { style: contentStyles.bar },
                  React.createElement('div', { style: { ...contentStyles.barFill, width: Math.max(4, Math.round((1 - dist / maxDist) * 100)) + '%', background: familyColor(family) } })),
                React.createElement('span', { style: { width: 42, textAlign: 'right', fontVariantNumeric: 'tabular-nums' } }, dist.toFixed(2)),
              ),
            ),
          ),
      );
    }

    // ---------------------------------------------------------------------
    // Session-header badge (upgraded: family color, pulse, larger)
    // ---------------------------------------------------------------------

    function Badge({ useProjection }) {
      useLocaleState();
      const profile = useProjection(PROJECTION_KEY);
      if (!profile || !profile.ui?.badge) return null;
      const j = profile.judgment;
      const c = profile.counts;
      const color = j.mixed ? '#d29922' : familyColor(j.family);
      const pct = Math.round(j.confidence * 100);
      let text;
      if (j.mixed) text = T('badge.mixed', { pct });
      else if (j.sufficient) text = j.family + ' · ' + pct + '%';
      else if (profile.blocks > 0) text = T('badge.sampling', { blocks: profile.blocks, minBlocks: profile.minBlocks });
      else text = T('badge.placeholder');
      return React.createElement(
        'span',
        {
          style: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            height: 28,
            padding: '0 12px',
            borderRadius: 14,
            background: 'var(--dsw-alias-bg-layer-1)',
            border: '1px solid ' + color,
            color: 'var(--dsw-alias-label-secondary)',
            fontSize: 13,
            lineHeight: '28px',
            whiteSpace: 'nowrap',
          },
          title: 'we ' + c.we + ' · let me ' + c.letMe + " · let's " + c.lets + ' · I ' + c.i,
        },
        React.createElement('span', { className: 'cot-prof-glow', style: { width: 8, height: 8, borderRadius: 4, background: color, display: 'inline-block' } }),
        React.createElement('span', { style: { color: 'var(--dsw-alias-label-primary)', fontWeight: 700 } }, text),
        React.createElement('span', { style: { color: 'var(--dsw-alias-label-secondary)', fontSize: 12 } }, 'we ' + c.we + ' · let me ' + c.letMe),
      );
    }

    // ---------------------------------------------------------------------
    // Panel container B (default): floating overlay panel
    // ---------------------------------------------------------------------

    function OverlayPanel({ useProjection, scope }) {
      useLocaleState();
      const profile = useProjection(PROJECTION_KEY);
      const [open, setOpen] = React.useState(true);
      const [tab, setTab] = React.useState('live');
      const ui = profile?.ui;
      if (!ui?.panel || ui.panelMode === 'track') return null;

      if (!open) {
        return React.createElement(
          'button',
          {
            style: {
              position: 'fixed',
              right: 14,
              top: 76,
              zIndex: 60,
              width: 40,
              height: 40,
              borderRadius: 20,
              border: '1px solid ' + familyColor(profile.judgment.family),
              background: 'var(--dsw-alias-bg-layer-1)',
              color: familyColor(profile.judgment.family),
              fontSize: 18,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            },
            className: 'cot-prof-glow',
            onClick: () => setOpen(true),
            title: T('panel.expand'),
          },
          '\u25A7',
        );
      }

      return React.createElement(
        'div',
        {
          style: {
            position: 'fixed',
            right: 12,
            top: 64,
            bottom: 64,
            width: 380,
            zIndex: 60,
            borderRadius: 12,
            border: '1px solid var(--dsw-alias-border-l2)',
            background: 'var(--dsw-alias-bg-layer-1)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
            display: 'flex',
            flexDirection: 'column',
            padding: 16,
            gap: 14,
            overflowY: 'auto',
            pointerEvents: 'auto',
          },
        },
        React.createElement(
          'div',
          { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 } },
          React.createElement('h3', { style: { margin: 0, fontSize: 15, fontWeight: 600 } }, T('panel.title')),
          React.createElement('button', { style: { border: 'none', background: 'transparent', color: 'var(--dsw-alias-label-tertiary)', fontSize: 18, cursor: 'pointer', padding: '2px 6px' }, onClick: () => setOpen(false), title: T('panel.collapse') }, '\u00D7'),
        ),
        React.createElement(
          'div',
          { style: { display: 'flex', gap: 6 } },
          React.createElement(
            'button',
            {
              style: {
                ...(tab === 'live'
                  ? { background: 'var(--dsw-alias-bg-layer-2)', color: 'var(--dsw-alias-label-primary)' }
                  : { color: 'var(--dsw-alias-label-tertiary)' }),
                border: '1px solid var(--dsw-alias-border-l2)',
                borderRadius: 6,
                padding: '3px 10px',
                fontSize: 12,
                cursor: 'pointer',
              },
              onClick: () => setTab('live'),
            },
            T('panel.tabLive'),
          ),
          React.createElement(
            'button',
            {
              style: {
                ...(tab === 'records'
                  ? { background: 'var(--dsw-alias-bg-layer-2)', color: 'var(--dsw-alias-label-primary)' }
                  : { color: 'var(--dsw-alias-label-tertiary)' }),
                border: '1px solid var(--dsw-alias-border-l2)',
                borderRadius: 6,
                padding: '3px 10px',
                fontSize: 12,
                cursor: 'pointer',
              },
              onClick: () => setTab('records'),
            },
            T('panel.tabRecords'),
          ),
        ),
        tab === 'live'
          ? React.createElement(
              React.Fragment,
              null,
              React.createElement('p', { style: { margin: 0, color: 'var(--dsw-alias-label-tertiary)', fontSize: 12, lineHeight: '18px' } }, T('panel.hint')),
              React.createElement(ProfileContent, { profile }),
            )
          : React.createElement(CalibrationPanel, { scope }),
      );
    }

    // ---------------------------------------------------------------------
    // Panel container C (experimental): layout-track right column.
    // Appends a grid track to the shell's three-column frame and mounts the
    // same content in a real column — no overlay, no shipped-UI replacement.
    // Direct DOM manipulation: a DSH upgrade may change the frame structure
    // (see README 'Panel modes' for the risk).
    // ---------------------------------------------------------------------

    const TRACK_COL_ATTR = 'data-cot-profile-track-col';
    const TRACK_WIDTH_PX = 320;

    /** Split a grid-template-columns string; parentheses never split. */
    function parseGridTracks(input) {
      if (!input) return [];
      const tracks = [];
      let depth = 0;
      let start = 0;
      for (let i = 0; i < input.length; i += 1) {
        const ch = input[i];
        if (ch === '(') depth += 1;
        else if (ch === ')') depth -= 1;
        else if (ch === ' ' && depth === 0) {
          tracks.push(input.slice(start, i));
          start = i + 1;
        }
      }
      if (start < input.length) tracks.push(input.slice(start));
      return tracks.filter((t) => t.trim().length > 0);
    }

    function findFrame() {
      return (
        document.querySelector('[data-dsh-frame]') ||
        document.querySelector('[class*="sidebarCol"]')?.parentElement ||
        null
      );
    }

    const trackController = {
      frame: null,
      observer: null,
      col: null,
      root: null,
      mount() {
        const frame = findFrame();
        if (!frame) return { render: () => {}, teardown: () => {} };
        this.frame = frame;
        let col = frame.querySelector('[' + TRACK_COL_ATTR + ']');
        if (!col) {
          col = document.createElement('div');
          col.setAttribute(TRACK_COL_ATTR, '1');
          col.style.overflow = 'auto';
          col.style.minWidth = TRACK_WIDTH_PX + 'px';
          col.style.borderLeft = '1px solid var(--dsw-alias-border-l2)';
          frame.appendChild(col);
        }
        this.col = col;
        this.applyTracks();
        this.observer = new MutationObserver(() => this.applyTracks());
        this.observer.observe(frame, { attributes: true, attributeFilter: ['style'], childList: true });
        this.root = ReactDOM.createRoot(col);
        return {
          render: (node) => {
            if (this.root) this.root.render(node);
          },
          teardown: () => this.teardown(),
        };
      },
      applyTracks() {
        if (!this.frame) return;
        const tracks = parseGridTracks(this.frame.style.gridTemplateColumns);
        if (tracks.length === 0) return;
        if (tracks[tracks.length - 1] !== TRACK_WIDTH_PX + 'px') {
          this.frame.style.gridTemplateColumns = [...tracks, TRACK_WIDTH_PX + 'px'].join(' ');
        }
      },
      teardown() {
        if (this.observer) {
          this.observer.disconnect();
          this.observer = null;
        }
        if (this.root) {
          this.root.unmount();
          this.root = null;
        }
        if (this.col) {
          this.col.remove();
          this.col = null;
        }
        if (this.frame) {
          const tracks = parseGridTracks(this.frame.style.gridTemplateColumns);
          if (tracks.length > 1 && tracks[tracks.length - 1] === TRACK_WIDTH_PX + 'px') {
            this.frame.style.gridTemplateColumns = tracks.slice(0, -1).join(' ');
          }
          this.frame = null;
        }
      },
    };

    /** Invisible host that owns the track column while panelMode === 'track'. */
    function TrackHost({ useProjection }) {
      const profile = useProjection(PROJECTION_KEY);
      const ui = profile?.ui;
      const enabled = !!ui?.panel && ui.panelMode === 'track';
      const handleRef = React.useRef(null);

      React.useEffect(() => {
        if (!enabled) return undefined;
        handleRef.current = trackController.mount();
        return () => {
          handleRef.current?.teardown();
          handleRef.current = null;
        };
      }, [enabled]);

      React.useEffect(() => {
        if (enabled && handleRef.current && profile) {
          handleRef.current.render(React.createElement(ProfileContent, { profile }));
        }
      }, [enabled, profile]);

      return null;
    }

    // ---------------------------------------------------------------------
    // Settings section
    // ---------------------------------------------------------------------

    const DEFAULT_JSON = {
      weights: '{\n  "letMe100": 3,\n  "we100": 3\n}',
      profiles: '[]',
    };

    // ---------------------------------------------------------------------
    // Calibration analysis (shared by the settings section and the panel)
    // ---------------------------------------------------------------------

    function CalibrationPanel({ scope }) {
      useLocaleState();
      const snapshot = React.useSyncExternalStore(
        React.useCallback((onStoreChange) => scope.subscribe(onStoreChange), [scope]),
        () => scope.getSnapshot(),
      );
      const [writeError, setWriteError] = React.useState(null);
      const [scan, setScan] = React.useState({ loading: false, error: null, data: null });
      const [applied, setApplied] = React.useState(new Set());
      const [expanded, setExpanded] = React.useState(new Set());
      const value = snapshot.value ?? { profiles: [] };
      const canWrite = snapshot.status !== 'unavailable';

      // --- GUI calibration (semi-automatic) ---

      const scanRecords = () => {
        setScan({ loading: true, error: null, data: null });
        fetch('/cot-profile/records')
          .then((response) => response.json())
          .then((data) => setScan({ loading: false, error: null, data }))
          .catch((error) => setScan({ loading: false, error: error instanceof Error ? error.message : String(error), data: null }));
      };

      const applyProfile = (group) => {
        setWriteError(null);
        const existing = Array.isArray(value.profiles) ? value.profiles : [];
        const idx = existing.findIndex((p) => p && p.id === group.profile.id);
        const next =
          idx >= 0 ? existing.map((p, i) => (i === idx ? group.profile : p)) : [...existing, group.profile];
        scope
          .set('profiles', next)
          .then(() => {
            setApplied((prev) => new Set(prev).add(group.profile.id));
          })
          .catch((error) => {
            setWriteError(error instanceof Error ? error.message : String(error));
          });
      };

      const fieldStyle = {
        boxSizing: 'border-box',
        border: '1px solid var(--dsw-alias-border-l2)',
        background: 'var(--dsw-alias-bg-layer-1)',
        borderRadius: 8,
        color: 'var(--dsw-alias-label-primary)',
        font: 'inherit',
        fontSize: 13,
        padding: '0 10px',
        height: 36,
        outline: 'none',
      };
      const labelStyle = { color: 'var(--dsw-alias-label-secondary)', fontSize: 13, fontWeight: 500, lineHeight: '20px' };
      const colStyle = { display: 'flex', flexDirection: 'column', gap: 6 };

      return         React.createElement(
          'div',
          { style: colStyle },
          React.createElement('label', { style: labelStyle }, T('settings.calibrate')),
          React.createElement(
            'p',
            { style: { margin: 0, color: 'var(--dsw-alias-label-tertiary)', fontSize: 12, lineHeight: '18px' } },
            T('settings.calibrate.hint'),
          ),
          React.createElement(
            'button',
            { style: { ...fieldStyle, width: 'auto', padding: '0 16px', cursor: 'pointer' }, onClick: scanRecords, disabled: scan.loading },
            scan.loading ? T('settings.calibrate.scanning') : T('settings.calibrate.scan'),
          ),
          scan.error !== null &&
            React.createElement('p', { style: { color: 'var(--dsw-alias-state-error-primary)', fontSize: 12 } }, T('settings.calibrate.error') + scan.error),
          scan.data !== null &&
            (scan.data.total === 0
              ? React.createElement(
                  'p',
                  { style: { margin: 0, color: 'var(--dsw-alias-label-tertiary)', fontSize: 12 } },
                  scan.data.exists
                    ? T('settings.calibrate.emptyExists')
                    : T('settings.calibrate.emptyMissing'),
                )
              : React.createElement(
                  'div',
                  { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
                  React.createElement(
                    'p',
                    { style: { margin: 0, color: 'var(--dsw-alias-label-tertiary)', fontSize: 12 } },
                    T('settings.calibrate.total', { total: scan.data.total, file: scan.data.file || '' }),
                  ),
                  scan.data.groups.map((group) => {
                    const dist = group.judgmentDist ?? { spec: 0, react: 0, gray: 0, mixed: 0, sampling: 0 };
                    const distTotal = Math.max(1, group.count);
                    const distColors = { spec: '#2ea043', react: '#d29922', gray: '#388bfd', mixed: '#f0883e', sampling: 'var(--dsw-alias-label-tertiary)' };
                    const distKeys = ['spec', 'react', 'gray', 'mixed', 'sampling'];
                    const isOpen = expanded.has(group.key);
                    const diffs = group.baseline?.diffs ?? {};
                    const notableDiffs = Object.entries(diffs).filter(([, v]) => Math.abs(v) >= 0.5);
                    return React.createElement(
                      'div',
                      { key: group.key, style: { display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, padding: '8px 10px', borderRadius: 8, background: 'var(--dsw-alias-bg-layer-2)' } },
                      React.createElement(
                        'div',
                        { style: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' } },
                        React.createElement('span', { style: { fontWeight: 600 } }, group.model || '(unknown model)'),
                        React.createElement(
                          'span',
                          { style: { color: 'var(--dsw-alias-label-tertiary)', fontSize: 12 } },
                          T('settings.calibrate.sessions', { count: group.count, blocks: group.blocks }),
                        ),
                        React.createElement(
                          'span',
                          { style: { color: 'var(--dsw-alias-label-secondary)', fontSize: 12, fontVariantNumeric: 'tabular-nums' } },
                          T('settings.calibrate.metrics', { we: group.vector.we100, letMe: group.vector.letMe100 }),
                        ),
                        group.baseline?.profileId
                          ? React.createElement(
                              'span',
                              { style: { color: 'var(--dsw-alias-label-tertiary)', fontSize: 12 } },
                              T('settings.calibrate.baseline') + ': ' + group.baseline.profileId,
                            )
                          : null,
                        applied.has(group.profile.id)
                          ? React.createElement('span', { style: { color: '#2ea043', fontSize: 12 } }, T('settings.calibrate.applied'))
                          : canWrite
                            ? React.createElement(
                                'button',
                                {
                                  style: { ...fieldStyle, width: 'auto', padding: '0 12px', height: 28, fontSize: 12, cursor: 'pointer' },
                                  onClick: () => applyProfile(group),
                                },
                                T('settings.calibrate.apply'),
                              )
                            : null,
                        React.createElement(
                          'button',
                          {
                            style: { ...fieldStyle, width: 'auto', padding: '0 10px', height: 28, fontSize: 12, cursor: 'pointer' },
                            onClick: () => setExpanded((prev) => {
                              const next = new Set(prev);
                              if (next.has(group.key)) next.delete(group.key);
                              else next.add(group.key);
                              return next;
                            }),
                          },
                          isOpen ? T('settings.calibrate.hide') : T('settings.calibrate.details'),
                        ),
                      ),
                      React.createElement(
                        'div',
                        { style: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--dsw-alias-label-tertiary)' } },
                        React.createElement('span', null, T('settings.calibrate.distHint') + ':'),
                        React.createElement(
                          'div',
                          { style: { display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', flex: 1, maxWidth: 200, background: 'var(--dsw-alias-bg-layer-1)' } },
                          distKeys.map((k) =>
                            dist[k] > 0
                              ? React.createElement('div', { key: k, style: { width: (dist[k] / distTotal) * 100 + '%', background: distColors[k], minWidth: 3 } })
                              : null,
                          ),
                        ),
                        React.createElement(
                          'span',
                          { style: { fontVariantNumeric: 'tabular-nums' } },
                          distKeys.filter((k) => dist[k] > 0).map((k) => T('settings.calibrate.dist' + k[0].toUpperCase() + k.slice(1)) + ' ' + dist[k]).join(' · '),
                        ),
                      ),
                      isOpen &&
                        React.createElement(
                          'div',
                          { style: { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 } },
                          group.baseline?.profileId &&
                            React.createElement(
                              'div',
                              { style: { color: 'var(--dsw-alias-label-secondary)' } },
                              T('settings.calibrate.diffs', { profile: group.baseline.profileId }),
                            ),
                          React.createElement(
                            'div',
                            { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' } },
                            Object.entries(group.vector).map(([dim, value]) => {
                              const diff = diffs[dim];
                              const mark = diff >= 0.5 ? ' ↑' + T('settings.calibrate.diffHigh') : diff <= -0.5 ? ' ↓' + T('settings.calibrate.diffLow') : '';
                              return React.createElement(
                                'div',
                                { key: dim, style: { display: 'flex', justifyContent: 'space-between', gap: 8, color: 'var(--dsw-alias-label-secondary)' } },
                                React.createElement('span', null, dim),
                                React.createElement(
                                  'span',
                                  { style: { color: mark ? (diff > 0 ? '#d29922' : '#388bfd') : 'var(--dsw-alias-label-primary)', fontVariantNumeric: 'tabular-nums' } },
                                  value + (mark ? ' (' + (diff > 0 ? '+' : '') + diff + mark + ')' : ''),
                                ),
                              );
                            }),
                          ),
                          notableDiffs.length === 0 &&
                            React.createElement('div', { style: { color: 'var(--dsw-alias-label-tertiary)' } }, '与基线无显著差异。'),
                        ),
                    );
                  }),
                )),
          !canWrite &&
            React.createElement(
              'p',
              { style: { margin: 0, color: 'var(--dsw-alias-label-tertiary)', fontSize: 12 } },
              T('settings.calibrate.readonlyHint'),
            ),
          writeError !== null &&
            React.createElement('p', { style: { color: 'var(--dsw-alias-state-error-primary)', fontSize: 13 } }, T('settings.saveError') + writeError),
        );
    }

    function SettingsSection({ scope }) {
      useLocaleState();
      const snapshot = React.useSyncExternalStore(
        React.useCallback((onStoreChange) => scope.subscribe(onStoreChange), [scope]),
        () => scope.getSnapshot(),
      );
      const [writeError, setWriteError] = React.useState(null);
      const [drafts, setDrafts] = React.useState({ ...DEFAULT_JSON });

      if (snapshot.status === 'unavailable') {
        return React.createElement(
          'section',
          { style: { display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 760 } },
          React.createElement('h2', { style: { margin: 0, fontSize: 16, fontWeight: 600 } }, T('settings.title')),
          React.createElement(
            'p',
            { style: { margin: 0, color: 'var(--dsw-alias-label-tertiary)', fontSize: 12, lineHeight: '18px' } },
            T('settings.unavailable'),
          ),
        );
      }

      const value = snapshot.value ?? {
        minBlocksForJudgment: 3,
        badge: true,
        panel: true,
        panelMode: 'overlay',
        record: { emit: true, file: '' },
        weights: {},
        profiles: [],
      };

      const set = (field, fieldValue) => {
        setWriteError(null);
        scope.set(field, fieldValue).catch((error) => {
          setWriteError(error instanceof Error ? error.message : String(error));
        });
      };

      const setJson = (field) => (event) => {
        const raw = event.target.value;
        setDrafts((prev) => ({ ...prev, [field]: raw }));
        setWriteError(null);
        try {
          const parsed = JSON.parse(raw);
          scope.set(field, parsed).catch((error) => {
            setWriteError(error instanceof Error ? error.message : String(error));
          });
        } catch (error) {
          setWriteError(T('settings.jsonInvalid') + (error instanceof Error ? error.message : String(error)));
        }
      };

      const fieldStyle = {
        boxSizing: 'border-box',
        border: '1px solid var(--dsw-alias-border-l2)',
        background: 'var(--dsw-alias-bg-layer-1)',
        borderRadius: 8,
        color: 'var(--dsw-alias-label-primary)',
        font: 'inherit',
        fontSize: 13,
        padding: '0 10px',
        height: 36,
        outline: 'none',
      };
      const labelStyle = { color: 'var(--dsw-alias-label-secondary)', fontSize: 13, fontWeight: 500, lineHeight: '20px' };
      const rowStyle = { display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' };
      const colStyle = { display: 'flex', flexDirection: 'column', gap: 6 };
      const checkStyle = { display: 'flex', alignItems: 'center', gap: 8, color: 'var(--dsw-alias-label-secondary)', fontSize: 13, lineHeight: '20px' };
      const textareaStyle = {
        ...fieldStyle,
        height: 'auto',
        minHeight: 120,
        padding: '10px 12px',
        resize: 'vertical',
        lineHeight: '20px',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      };

      return React.createElement(
        'section',
        { style: { display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 760, width: '100%' } },
        React.createElement('h2', { style: { margin: 0, fontSize: 16, fontWeight: 600 } }, T('settings.title')),
        React.createElement(
          'p',
          { style: { margin: 0, color: 'var(--dsw-alias-label-tertiary)', fontSize: 12, lineHeight: '18px' } },
          T('settings.desc'),
        ),
        React.createElement(
          'div',
          { style: colStyle },
          React.createElement('label', { style: labelStyle }, T('settings.minBlocks')),
          React.createElement('input', {
            style: fieldStyle,
            type: 'number',
            min: 1,
            max: 500,
            step: 1,
            value: value.minBlocksForJudgment ?? 3,
            onChange: (event) => {
              const parsed = Number.parseInt(event.target.value, 10);
              if (Number.isFinite(parsed)) set('minBlocksForJudgment', parsed);
            },
          }),
        ),
        React.createElement(
          'div',
          { style: rowStyle },
          React.createElement(
            'label',
            { style: checkStyle },
            React.createElement('input', { type: 'checkbox', checked: value.badge ?? true, onChange: (event) => set('badge', event.target.checked) }),
            T('settings.badge'),
          ),
          React.createElement(
            'label',
            { style: checkStyle },
            React.createElement('input', { type: 'checkbox', checked: value.panel ?? true, onChange: (event) => set('panel', event.target.checked) }),
            T('settings.panel'),
          ),
          React.createElement(
            'div',
            { style: colStyle },
            React.createElement('label', { style: labelStyle }, T('settings.panelMode')),
            React.createElement(
              'select',
              {
                style: fieldStyle,
                value: value.panelMode ?? 'overlay',
                onChange: (event) => set('panelMode', event.target.value),
              },
              React.createElement('option', { value: 'overlay' }, T('settings.panelMode.overlay')),
              React.createElement('option', { value: 'track' }, T('settings.panelMode.track')),
            ),
          ),
        ),
        React.createElement(
          'p',
          { style: { margin: 0, color: 'var(--dsw-alias-label-tertiary)', fontSize: 12, lineHeight: '18px' } },
          T('settings.panelMode.hint'),
        ),
        React.createElement(
          'div',
          { style: rowStyle },
          React.createElement(
            'div',
            { style: colStyle },
            React.createElement('label', { style: labelStyle }, T('settings.record.emit')),
            React.createElement(
              'label',
              { style: checkStyle },
              React.createElement('input', {
                type: 'checkbox',
                checked: (value.record ?? {}).emit ?? true,
                onChange: (event) => set('record', { ...(value.record ?? {}), emit: event.target.checked }),
              }),
              T('settings.record.emitLabel'),
            ),
          ),
          React.createElement(
            'div',
            { style: colStyle },
            React.createElement('label', { style: labelStyle }, T('settings.record.file')),
            React.createElement('input', {
              style: { ...fieldStyle, width: 320 },
              type: 'text',
              placeholder: '如 ~/.dsh/cot-profile/records.jsonl',
              value: (value.record ?? {}).file ?? '',
              onChange: (event) => set('record', { ...(value.record ?? {}), file: event.target.value }),
            }),
            React.createElement(
              'p',
              { style: { margin: 0, color: 'var(--dsw-alias-label-tertiary)', fontSize: 12, lineHeight: '18px' } },
              T('settings.record.fileHint'),
            ),
          ),
        ),
        React.createElement(CalibrationPanel, { scope }),
        React.createElement(
          'div',
          { style: colStyle },
          React.createElement('label', { style: labelStyle }, T('settings.weights')),
          React.createElement('textarea', { style: textareaStyle, value: drafts.weights, onChange: setJson('weights') }),
        ),
        React.createElement(
          'div',
          { style: colStyle },
          React.createElement('label', { style: labelStyle }, T('settings.profiles')),
          React.createElement('textarea', { style: textareaStyle, value: drafts.profiles, onChange: setJson('profiles') }),
        ),
        writeError !== null &&
          React.createElement('p', { style: { color: 'var(--dsw-alias-state-error-primary)', fontSize: 13 } }, T('settings.saveError') + writeError),
        React.createElement(
          'p',
          { style: { margin: 0, color: 'var(--dsw-alias-label-tertiary)', fontSize: 12, lineHeight: '18px' } },
          T('settings.effect'),
        ),
      );
    }

    // ---------------------------------------------------------------------
    // Registration
    // ---------------------------------------------------------------------

    function apply(ctx) {
      const scope = ctx.settingsScope.bind({ namespace: SETTINGS_NAMESPACE });

      // i18n: register dictionaries and bind the translate function. The bind
      // reads the active locale at call time; useLocaleState() in components
      // re-renders on locale switches.
      const locale = ctx.get('locale');
      if (locale !== undefined) {
        ctx.effect(() => locale.register('cot-profile', DICT));
        tFn = locale.bind('cot-profile');
        localeApi = locale;
      }

      // Keyframes for the pulse/glow animations (static plugins own their CSS).
      ctx.effect(() => {
        const style = document.createElement('style');
        style.textContent =
          '@keyframes cotProfPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }' +
          '@keyframes cotProfGlow { 0%, 100% { box-shadow: 0 0 0 0 rgba(46,160,67,0.45); } 50% { box-shadow: 0 0 0 6px rgba(46,160,67,0); } }' +
          '.cot-prof-pulse { animation: cotProfPulse 1.4s ease-in-out infinite; }' +
          '.cot-prof-glow { animation: cotProfGlow 2s ease-in-out infinite; }';
        document.head.appendChild(style);
        return () => style.remove();
      });

      ctx.slots.inject('conversation.session.header.utilities', () =>
        ctx.slots.register(
          {
            name: 'conversation.session.header.utilities',
            id: 'cot-profile-badge',
            order: 200,
            label: () => T('badge.label'),
          },
          Badge,
        ),
      );

      // Panel containers: the overlay (B) and the track host (C) both mount
      // here; each renders only when the projection's ui.panelMode selects it.
      ctx.slots.inject('conversation.input.overlay', () =>
        ctx.slots.register(
          {
            name: 'conversation.input.overlay',
            id: 'cot-profile-panel',
            order: 200,
            label: () => T('panel.label'),
            inject: () => ({ scope }),
          },
          OverlayPanel,
        ),
      );

      ctx.slots.inject('conversation.input.overlay', () =>
        ctx.slots.register(
          {
            name: 'conversation.input.overlay',
            id: 'cot-profile-track-host',
            order: 201,
            label: () => T('track.label'),
          },
          TrackHost,
        ),
      );

      ctx.slots.inject('settings.section', () =>
        ctx.slots.register(
          {
            name: 'settings.section',
            id: 'cot-profile',
            order: 200,
            label: T('settings.title'),
            inject: () => ({ scope }),
          },
          SettingsSection,
        ),
      );
    }

    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  },
});
