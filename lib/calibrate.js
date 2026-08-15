/**
 * dsh-cot-profile — record aggregation for GUI calibration.
 *
 * Pure, zero-dependency functions: group raw `cot-profile/record` entries by
 * (provider, model, preset), aggregate their indicator vectors (per-dimension
 * mean over the group), and synthesize profile-family candidates the settings
 * UI can apply with one click.
 *
 * Semi-automatic by design: aggregation is automatic, applying a candidate is
 * a human decision (the settings UI writes it into `profiles` config, never
 * silently into the built-in baselines).
 */

/** Vector dims aggregated per group (mirrors buildVector's output keys). */
export const VECTOR_DIMS = [
  'letMe100',
  'we100',
  'lets100',
  'i100',
  'firstLineWeNeed',
  'firstLineUserWants',
  'firstLineLetMe',
  'firstLineI',
  'firstLineOther',
  'p50BlockChars',
  'visibleReplies100',
];

/** Stable group key: provider | model | preset (unknowns tolerated). */
export function groupKey(record) {
  return [record.provider || '(unknown provider)', record.model || '(unknown model)', record.preset || '(default preset)'].join('|');
}

/** Group records by (provider, model, preset), preserving first-seen order. */
export function groupRecords(records) {
  const groups = new Map();
  for (const record of records) {
    const key = groupKey(record);
    let group = groups.get(key);
    if (!group) {
      group = {
        key,
        provider: record.provider ?? null,
        model: record.model ?? null,
        preset: record.preset ?? null,
        records: [],
      };
      groups.set(key, group);
    }
    group.records.push(record);
  }
  return [...groups.values()];
}

/** Per-group mean vector plus sample count and total reasoning blocks. */
export function aggregateGroups(groups) {
  return groups.map((group) => {
    const vector = {};
    for (const dim of VECTOR_DIMS) {
      let sum = 0;
      let n = 0;
      for (const record of group.records) {
        const value = record.vector?.[dim];
        if (typeof value === 'number' && Number.isFinite(value)) {
          sum += value;
          n += 1;
        }
      }
      vector[dim] = n > 0 ? Math.round((sum / n) * 1000) / 1000 : 0;
    }
    return {
      key: group.key,
      provider: group.provider,
      model: group.model,
      preset: group.preset,
      count: group.records.length,
      blocks: group.records.reduce((sum, r) => sum + (r.reasoningBlocks || 0), 0),
      vector,
    };
  });
}

/** One-stop aggregation over raw records. */
export function aggregateRecords(records) {
  return aggregateGroups(groupRecords(records));
}

/** Derive a stable profile id from a group's model or preset label. */
export function profileIdFromGroup(group) {
  const base = String(group.model || group.preset || 'custom')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${base || 'custom'}-like`;
}

/** A profile-family candidate ready to write into the `profiles` config. */
export function profileFromGroup(group) {
  const model = group.model || '(unknown model)';
  const preset = group.preset ? ` under preset ${group.preset}` : '';
  return {
    id: profileIdFromGroup(group),
    name: `${model} (measured)`,
    description: `Calibrated from ${group.count} session record(s)${preset}.`,
    vector: { ...group.vector },
  };
}
