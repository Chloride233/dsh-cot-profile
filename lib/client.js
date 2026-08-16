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
      const j = profile.judgment;
      const c = profile.counts;
      const fl = profile.firstLines;
      const color = j.mixed ? '#d29922' : familyColor(j.family);
      const maxDist = Math.max(1, ...Object.values(j.distances));

      const verdict = !j.sufficient
        ? [
            React.createElement('div', { key: 'name', style: { ...contentStyles.familyName, color: 'var(--dsw-alias-label-tertiary)' } }, '采样中'),
            React.createElement('div', { key: 'conf', style: contentStyles.confidence }, profile.blocks + '/' + profile.minBlocks + ' 块（满 ' + profile.minBlocks + ' 块给出判定）'),
          ]
        : j.mixed
          ? [
              React.createElement('div', { key: 'name', style: { ...contentStyles.familyName, color: '#d29922' } }, '过渡带'),
              React.createElement('div', { key: 'conf', style: contentStyles.confidence }, '判定不稳定：We/The/Let 混合（断裂带）· 置信度 ' + Math.round(j.confidence * 100) + '%'),
            ]
          : [
              React.createElement('div', { key: 'name', style: { ...contentStyles.familyName, color } }, j.family),
              React.createElement('div', { key: 'conf', style: contentStyles.confidence }, '置信度 ' + Math.round(j.confidence * 100) + '% · ' + profile.blocks + ' 块'),
            ];

      return React.createElement(
        'div',
        { style: { display: 'flex', flexDirection: 'column', gap: 14 } },
        React.createElement(
          'div',
          { style: { ...contentStyles.familyCard, borderColor: color } },
          ...verdict,
          React.createElement(
            'div',
            { style: contentStyles.thinking },
            React.createElement('span', { className: 'cot-prof-glow', style: { ...contentStyles.dot, background: color } }),
            React.createElement('span', { className: 'cot-prof-pulse' }, j.sufficient ? '实时追踪中' : '正在思考…'),
          ),
        ),
        React.createElement('div', { style: contentStyles.sectionLabel }, '指标 · 按块累计'),
        React.createElement(
          'div',
          { style: contentStyles.grid },
          metric('we', c.we),
          metric('let me', c.letMe),
          metric("let's", c.lets),
          metric('I', c.i),
          metric('块长 p50', profile.p50BlockChars + ' 字符'),
          metric('阶段回复', profile.visibleReplies),
        ),
        React.createElement('div', { style: contentStyles.sectionLabel }, '首行模式'),
        React.createElement(
          'div',
          { style: contentStyles.grid },
          metric('We need…', fl['we-need']),
          metric('The user…', fl['the-user-wants']),
          metric('Let me…', fl['let-me']),
          metric('I…', fl.i),
        ),
        React.createElement('div', { style: contentStyles.sectionLabel }, '与基线距离（越小越近）'),
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
      );
    }

    // ---------------------------------------------------------------------
    // Session-header badge (upgraded: family color, pulse, larger)
    // ---------------------------------------------------------------------

    function Badge({ useProjection }) {
      const profile = useProjection(PROJECTION_KEY);
      if (!profile || !profile.ui?.badge) return null;
      const j = profile.judgment;
      const c = profile.counts;
      const color = j.mixed ? '#d29922' : familyColor(j.family);
      let text;
      if (j.mixed) text = '过渡带 · ' + Math.round(j.confidence * 100) + '%';
      else if (j.sufficient) text = j.family + ' · ' + Math.round(j.confidence * 100) + '%';
      else if (profile.blocks > 0) text = '采样中 ' + profile.blocks + '/' + profile.minBlocks;
      else text = '画像 —';
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

    function OverlayPanel({ useProjection }) {
      const profile = useProjection(PROJECTION_KEY);
      const [open, setOpen] = React.useState(true);
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
            title: '展开思维链画像',
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
          React.createElement('h3', { style: { margin: 0, fontSize: 15, fontWeight: 600 } }, '思维链轨迹画像'),
          React.createElement('button', { style: { border: 'none', background: 'transparent', color: 'var(--dsw-alias-label-tertiary)', fontSize: 18, cursor: 'pointer', padding: '2px 6px' }, onClick: () => setOpen(false), title: '收起' }, '\u00D7'),
        ),
        React.createElement('p', { style: { margin: 0, color: 'var(--dsw-alias-label-tertiary)', fontSize: 12, lineHeight: '18px' } }, '措辞指标反映 (模型 × 配置) 的轨迹画像，不是模型身份断言。'),
        React.createElement(ProfileContent, { profile }),
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

    function SettingsSection({ scope }) {
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
          React.createElement('h2', { style: { margin: 0, fontSize: 16, fontWeight: 600 } }, '思维链画像'),
          React.createElement(
            'p',
            { style: { margin: 0, color: 'var(--dsw-alias-label-tertiary)', fontSize: 12, lineHeight: '18px' } },
            '设置命名空间未暴露给浏览器。插件仍可通过 cordis 配置（cordis.yml 里的 cot-profile 行）工作；如需 Web 编辑，运行 scripts/install-patch.sh（临时补丁，见 README）。',
          ),
        );
      }

      const value = snapshot.value ?? {
        minBlocksForJudgment: 10,
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
          setWriteError('JSON 无效：' + (error instanceof Error ? error.message : String(error)));
        }
      };

      // --- GUI calibration (semi-automatic) ---
      const [scan, setScan] = React.useState({ loading: false, error: null, data: null });
      const [applied, setApplied] = React.useState(new Set());

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
        React.createElement('h2', { style: { margin: 0, fontSize: 16, fontWeight: 600 } }, '思维链画像'),
        React.createElement(
          'p',
          { style: { margin: 0, color: 'var(--dsw-alias-label-tertiary)', fontSize: 12, lineHeight: '18px' } },
          "实时统计会话思维链的措辞指标（let me / we / let's / I、首行模式、块长、阶段回复），与内置基线画像对比并给出画像族判定。画像族描述 (模型 × 配置) 的轨迹，不是模型身份。",
        ),
        React.createElement(
          'div',
          { style: colStyle },
          React.createElement('label', { style: labelStyle }, '判定门槛（reasoning 块数）'),
          React.createElement('input', {
            style: fieldStyle,
            type: 'number',
            min: 1,
            max: 500,
            step: 1,
            value: value.minBlocksForJudgment ?? 10,
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
            '会话头部徽章',
          ),
          React.createElement(
            'label',
            { style: checkStyle },
            React.createElement('input', { type: 'checkbox', checked: value.panel ?? true, onChange: (event) => set('panel', event.target.checked) }),
            '实时面板',
          ),
          React.createElement(
            'div',
            { style: colStyle },
            React.createElement('label', { style: labelStyle }, '面板形态'),
            React.createElement(
              'select',
              {
                style: fieldStyle,
                value: value.panelMode ?? 'overlay',
                onChange: (event) => set('panelMode', event.target.value),
              },
              React.createElement('option', { value: 'overlay' }, '悬浮面板（默认）'),
              React.createElement('option', { value: 'track' }, '右侧轨道栏（实验性）'),
            ),
          ),
        ),
        React.createElement(
          'p',
          { style: { margin: 0, color: 'var(--dsw-alias-label-tertiary)', fontSize: 12, lineHeight: '18px' } },
          '轨道栏直接操作布局网格（DOM），DSH 升级可能需要适配；悬浮面板零风险。',
        ),
        React.createElement(
          'div',
          { style: rowStyle },
          React.createElement(
            'div',
            { style: colStyle },
            React.createElement('label', { style: labelStyle }, '记录模式：事件'),
            React.createElement(
              'label',
              { style: checkStyle },
              React.createElement('input', {
                type: 'checkbox',
                checked: (value.record ?? {}).emit ?? true,
                onChange: (event) => set('record', { ...(value.record ?? {}), emit: event.target.checked }),
              }),
              '会话结束发 cot-profile/record 事件',
            ),
          ),
          React.createElement(
            'div',
            { style: colStyle },
            React.createElement('label', { style: labelStyle }, '记录模式：JSONL 文件（空 = 关闭）'),
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
              '支持 ~ 开头（自动展开为用户主目录）；留空 = 关闭文件记录。',
            ),
          ),
        ),
        React.createElement(
          'div',
          { style: colStyle },
          React.createElement('label', { style: labelStyle }, '数据校准（半自动）'),
          React.createElement(
            'p',
            { style: { margin: 0, color: 'var(--dsw-alias-label-tertiary)', fontSize: 12, lineHeight: '18px' } },
            '扫描记录文件，按模型/预设聚合指标；确认后一键应用为画像族（不会自动改写判定基线）。',
          ),
          React.createElement(
            'button',
            { style: { ...fieldStyle, width: 'auto', padding: '0 16px', cursor: 'pointer' }, onClick: scanRecords, disabled: scan.loading },
            scan.loading ? '扫描中…' : '扫描记录文件',
          ),
          scan.error !== null &&
            React.createElement('p', { style: { color: 'var(--dsw-alias-state-error-primary)', fontSize: 12 } }, '扫描失败：' + scan.error),
          scan.data !== null &&
            (scan.data.total === 0
              ? React.createElement(
                  'p',
                  { style: { margin: 0, color: 'var(--dsw-alias-label-tertiary)', fontSize: 12 } },
                  scan.data.exists
                    ? '记录文件存在但还没有数据：先跑几个会话，再回来扫描。'
                    : '记录文件还不存在：先在“记录模式 JSONL 文件”填入路径，跑几个会话后文件会自动生成，再回来扫描。',
                )
              : React.createElement(
                  'div',
                  { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
                  React.createElement(
                    'p',
                    { style: { margin: 0, color: 'var(--dsw-alias-label-tertiary)', fontSize: 12 } },
                    '共 ' + scan.data.total + ' 条记录' + (scan.data.file ? ' · ' + scan.data.file : '') + '：',
                  ),
                  scan.data.groups.map((group) =>
                    React.createElement(
                      'div',
                      {
                        key: group.key,
                        style: { display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, padding: '8px 10px', borderRadius: 8, background: 'var(--dsw-alias-bg-layer-2)', flexWrap: 'wrap' },
                      },
                      React.createElement('span', { style: { fontWeight: 600 } }, group.model || '(unknown model)'),
                      React.createElement(
                        'span',
                        { style: { color: 'var(--dsw-alias-label-tertiary)', fontSize: 12 } },
                        group.count + ' 会话 · ' + group.blocks + ' 块',
                      ),
                      React.createElement(
                        'span',
                        { style: { color: 'var(--dsw-alias-label-secondary)', fontSize: 12, fontVariantNumeric: 'tabular-nums' } },
                        'we ' + group.vector.we100 + ' · let me ' + group.vector.letMe100,
                      ),
                      applied.has(group.profile.id)
                        ? React.createElement('span', { style: { color: '#2ea043', fontSize: 12 } }, '✓ 已应用')
                        : React.createElement(
                            'button',
                            {
                              style: { ...fieldStyle, width: 'auto', padding: '0 12px', height: 28, fontSize: 12, cursor: 'pointer' },
                              onClick: () => applyProfile(group),
                            },
                            '应用为画像族',
                          ),
                    ),
                  ),
                )),
        ),
        React.createElement(
          'div',
          { style: colStyle },
          React.createElement('label', { style: labelStyle }, '权重（JSON，可选，留 {} 用默认）'),
          React.createElement('textarea', { style: textareaStyle, value: drafts.weights, onChange: setJson('weights') }),
        ),
        React.createElement(
          'div',
          { style: colStyle },
          React.createElement('label', { style: labelStyle }, '画像族（JSON 数组，可选，留 [] 用内置基线）'),
          React.createElement('textarea', { style: textareaStyle, value: drafts.profiles, onChange: setJson('profiles') }),
        ),
        writeError !== null &&
          React.createElement('p', { style: { color: 'var(--dsw-alias-state-error-primary)', fontSize: 13 } }, '保存失败：' + writeError),
        React.createElement(
          'p',
          { style: { margin: 0, color: 'var(--dsw-alias-label-tertiary)', fontSize: 12, lineHeight: '18px' } },
          '配置改动在下一个 reasoning 块完成后生效（判定随新配置重算）。',
        ),
      );
    }

    // ---------------------------------------------------------------------
    // Registration
    // ---------------------------------------------------------------------

    function apply(ctx) {
      const scope = ctx.settingsScope.bind({ namespace: SETTINGS_NAMESPACE });

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
            label: '思维链画像徽章',
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
            label: '思维链画像面板',
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
            label: '思维链画像轨道栏',
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
            label: '思维链画像',
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
