/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The one line under the toolbar: what the selection can do, said from the
 * callbacks the host gave - a verb the host did not take is not offered. A
 * bar, a group heading, a selected link and nothing selected each have their
 * own; the words are the timeline's labels, so a host says them its own way.
 */

/** The verbs of a bar. */
function barVerbs(tl, item) {
  const { labels, callbacks: cb } = tl;
  const editable = Boolean(cb.onChange) && item.movable;
  return [cb.onActivate && labels.hintOpen, editable && labels.hintMove, editable && item.end && labels.hintResize,
    editable && labels.hintKeys, cb.onLink && labels.hintLink, cb.onDelete && labels.hintDelete];
}

/** The verbs of a group's heading. */
function groupVerbs(tl, groupId) {
  const { labels, callbacks: cb } = tl;
  const folds = Boolean(cb.onToggleGroup) && tl.groups.has(groupId);
  return [cb.onActivate && labels.hintOpen, cb.onAdd && labels.hintAdd, folds && labels.hintFold];
}

/** What nothing selected says: how to begin. */
function startVerbs(tl) {
  return [tl.labels.hintNone, tl.callbacks.onCreate && tl.labels.hintCreate];
}

/** The hint for the timeline's selection, or '' when it has nothing to say. */
export function hintOf(tl) {
  const { selectedId, selectedLink } = tl.state;
  let verbs = startVerbs(tl);
  if (selectedLink) verbs = [tl.callbacks.onUnlink && tl.labels.hintUnlink];
  else if (tl.byId.has(selectedId)) verbs = barVerbs(tl, tl.byId.get(selectedId));
  else if (tl.groups.has(selectedId)) verbs = groupVerbs(tl, selectedId);
  return verbs.filter(Boolean).join(' · ');
}
