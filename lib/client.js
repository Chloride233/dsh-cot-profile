window.__ModuleLoader__.load({
  id: 'dsh-cot-profile',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

    const React = require('react');

    const SETTINGS_NAMESPACE = 'cot-profile';
    const PROJECTION_KEY = 'cot-profile';

    const inject = ['slots', 'settingsScope'];

    const styles = {
      badge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        height: 24,
        padding: '0 10px',
        borderRadius: 12,
        background: 'var(--dsw-alias-bg-layer-1)',
        border: '1px solid var(--dsw-alias-border-l2)',
        color: 'var(--dsw-alias-label-secondary)',
        fontSize: 12,
        lineHeight: '24px',
        whiteSpace: 'nowrap',
      },
      badgeStrong: {
        color: 'var(--dsw-alias-label-primary)',
        fontWeight: 600,
      },
      panelToggle: {
        position: 'fixed',
        right: 14,
        top: 76,
        zIndex: 60,
        width: 34,
        height: 34,
        borderRadius: 17,
        border: '1px solid var(--dsw-alias-border-l2)',
        background: 'var(--dsw-alias-bg-layer-1)',
        color: 'var(--dsw-alias-label-secondary)',
        fontSize: 15,
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        pointerEvents: 'auto',
      },
      panel: {
        position: 'fixed',
        right: 14,
        top: 76,
        zIndex: 60,
        width: 320,
        maxHeight: 'calc(100vh - 120px)',
        overflowY: 'auto',
        boxSizing: 'border-box',
        borderRadius: 10,
        border: '1px solid var(--dsw-alias-border-l2)',
        background: 'var(--dsw-alias-bg-layer-1)',
        color: 'var(--dsw-alias-label-primary)',
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        boxShadow: '0 8px 24px rgba(0,0,0,0.16)',
        pointerEvents: 'auto',
      },
      panelHead: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
      },
      panelTitle: {
        margin: 0,
        fontSize: 14,
        fontWeight: 600,
        lineHeight: '20px',
      },
      close: {
        border: 'none',
        background: 'transparent',
        color: 'var(--dsw-alias-label-tertiary)',
        fontSize: 16,
        cursor: 'pointer',
        padding: '2px 6px',
      },
      verdict: {
        borderRadius: 8,
        padding: '8px 10px',
        background: 'var(--dsw-alias-bg-layer-2)',
        fontSize: 13,
        lineHeight: '20px',
      },
      verdictStrong: {
        fontWeight: 600,
      },
      grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '6px 16px',
        fontSize: 13,
        lineHeight: '20px',
      },
      metric: {
        display: 'flex',
        justifyContent: 'space-between',
        gap: 8,
        color: 'var(--dsw-alias-label-secondary)',
      },
      metricValue: {
        color: 'var(--dsw-alias-label-primary)',
        fontVariantNumeric: 'tabular-nums',
      },
      sectionLabel: {
        color: 'var(--dsw-alias-label-tertiary)',
        fontSize: 12,
        lineHeight: '16px',
        textTransform: 'uppercase',
        letterSpacing: 0.4,
      },
      hint: {
        margin: 0,
        color: 'var(--dsw-alias-label-tertiary)',
        fontSize: 12,
        lineHeight: '18px',
      },
    };

    // ---------------------------------------------------------------------
    // Session-header badge (live family + key counts)
    // ---------------------------------------------------------------------
    function Badge({ useProjection }) {
      const profile = useProjection(PROJECTION_KEY);
      if (!profile || !profile.ui?.badge) return null;
      const j = profile.judgment;
      const counts = profile.counts;
      let text;
      if (j.sufficient) {
        text = `${j.family} · ${Math.round(j.confidence * 100)}%`;
      } else if (profile.blocks > 0) {
        text = `采样中 ${profile.blocks}/${profile.minBlocks}`;
      } else {
        text = '画像 —';
      }
      return React.createElement(
        'span',
        { style: styles.badge, title: `we ${counts.we} · let me ${counts.letMe} · let's ${counts.lets} · I ${counts.i}` },
        React.createElement('span', { style: styles.badgeStrong }, text),
        React.createElement('span', null, `we ${counts.we}`),
        React.createElement('span', null, `let me ${counts.letMe}`),
      );
    }

    // ---------------------------------------------------------------------
    // Floating right-side panel (full仪表, collapsible)
    // ---------------------------------------------------------------------
    function Panel({ useProjection }) {
      const profile = useProjection(PROJECTION_KEY);
      const [open, setOpen] = React.useState(false);
      if (!profile || !profile.ui?.panel) return null;

      if (!open) {
        return React.createElement(
          'button',
          { style: styles.panelToggle, onClick: () => setOpen(true), title: '思维链画像' },
          '\u25A0',
        );
      }

      const j = profile.judgment;
      const c = profile.counts;
      const fl = profile.firstLines;
      const rows = [
        ['reasoning 块', String(profile.blocks)],
        ['let me', String(c.letMe)],
        ['we', String(c.we)],
        ["let's", String(c.lets)],
        ['I（第一人称）', String(c.i)],
        ['块长 p50', `${profile.p50BlockChars} 字符`],
        ['阶段可见回复', String(profile.visibleReplies)],
        ['首行 We need…', String(fl['we-need'])],
        ['首行 The user wants…', String(fl['the-user-wants'])],
        ['首行 Let me…', String(fl['let-me'])],
        ['首行 I…', String(fl.i)],
      ];

      const verdict = j.sufficient
        ? React.createElement(
            'div',
            { style: styles.verdict },
            React.createElement('span', { style: styles.verdictStrong }, `画像族：${j.family}`),
            `　置信度 ${Math.round(j.confidence * 100)}%`,
          )
        : React.createElement(
            'div',
            { style: styles.verdict },
            `采样中 ${profile.blocks}/${profile.minBlocks} 块（满 ${profile.minBlocks} 块后给出判定）`,
          );

      return React.createElement(
        'div',
        { style: styles.panel },
        React.createElement(
          'div',
          { style: styles.panelHead },
          React.createElement('h3', { style: styles.panelTitle }, '思维链轨迹画像'),
          React.createElement(
            'button',
            { style: styles.close, onClick: () => setOpen(false), title: '收起' },
            '\u00D7',
          ),
        ),
        React.createElement('p', { style: styles.hint }, '措辞指标反映 (模型 × 配置) 的轨迹画像，不是模型身份断言。'),
        verdict,
        React.createElement('div', { style: styles.sectionLabel }, '指标（按块累计）'),
        React.createElement(
          'div',
          { style: styles.grid },
          rows.map(([label, value]) =>
            React.createElement(
              'div',
              { key: label, style: styles.metric },
              React.createElement('span', null, label),
              React.createElement('span', { style: styles.metricValue }, value),
            ),
          ),
        ),
      );
    }

    // ---------------------------------------------------------------------
    // Settings section (config editor; needs the optional apiproxy patch to
    // be reachable from the browser, otherwise configure via cordis config)
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
            { style: styles.hint },
            '设置命名空间未暴露给浏览器。插件仍可通过 cordis 配置（cordis.yml 里的 cot-profile 行）工作；' +
              '如需 Web 编辑，运行 scripts/install-patch.sh（临时补丁，见 README）。',
          ),
        );
      }

      const value = snapshot.value ?? {
        minBlocksForJudgment: 10,
        badge: true,
        panel: true,
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
          setWriteError(`JSON 无效：${error instanceof Error ? error.message : String(error)}`);
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
      const labelStyle = {
        color: 'var(--dsw-alias-label-secondary)',
        fontSize: 13,
        fontWeight: 500,
        lineHeight: '20px',
      };
      const rowStyle = { display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' };
      const colStyle = { display: 'flex', flexDirection: 'column', gap: 6 };
      const checkStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        color: 'var(--dsw-alias-label-secondary)',
        fontSize: 13,
        lineHeight: '20px',
      };
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
          { style: styles.hint },
          '实时统计会话思维链的措辞指标（let me / we / let\'s / I、首行模式、块长、阶段回复），' +
            '与内置基线画像对比并给出画像族判定。画像族描述 (模型 × 配置) 的轨迹，不是模型身份。',
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
            React.createElement('input', {
              type: 'checkbox',
              checked: value.badge ?? true,
              onChange: (event) => set('badge', event.target.checked),
            }),
            '会话头部徽章',
          ),
          React.createElement(
            'label',
            { style: checkStyle },
            React.createElement('input', {
              type: 'checkbox',
              checked: value.panel ?? true,
              onChange: (event) => set('panel', event.target.checked),
            }),
            '右侧悬浮面板',
          ),
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
          ),
        ),
        React.createElement(
          'div',
          { style: colStyle },
          React.createElement('label', { style: labelStyle }, '权重（JSON，可选，留 {} 用默认）'),
          React.createElement('textarea', {
            style: textareaStyle,
            value: drafts.weights,
            onChange: setJson('weights'),
          }),
        ),
        React.createElement(
          'div',
          { style: colStyle },
          React.createElement('label', { style: labelStyle }, '画像族（JSON 数组，可选，留 [] 用内置基线）'),
          React.createElement('textarea', {
            style: textareaStyle,
            value: drafts.profiles,
            onChange: setJson('profiles'),
          }),
        ),
        writeError !== null && React.createElement('p', { style: { color: 'var(--dsw-alias-state-error-primary)', fontSize: 13 } }, `保存失败：${writeError}`),
        React.createElement('p', { style: styles.hint }, '配置改动在下一个 reasoning 块完成后生效（判定随新配置重算）。'),
      );
    }

    // ---------------------------------------------------------------------
    // Registration
    // ---------------------------------------------------------------------
    function apply(ctx) {
      const scope = ctx.settingsScope.bind({ namespace: SETTINGS_NAMESPACE });

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

      ctx.slots.inject('conversation.input.overlay', () =>
        ctx.slots.register(
          {
            name: 'conversation.input.overlay',
            id: 'cot-profile-panel',
            order: 200,
            label: '思维链画像面板',
          },
          Panel,
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
