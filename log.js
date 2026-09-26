/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The logging seam: one dependency-free leaf that src and lib report through
 * instead of touching `console`.
 *
 * A module asks for a scoped logger once (`createLogger('reactions')`) and calls
 * `debug`, `info`, `warn` or `error` on it. Nothing here does I/O: every call is
 * a level check, and - only when the level is enabled - a record handed to the
 * installed sink. A disabled level allocates nothing.
 *
 * The default sink sends `error` records to `console.error` and drops everything
 * below, so a failure that reached the console before this seam existed still
 * does, and a catch that used to be silent stays silent until an application
 * installs a sink at `debug` or `warn`.
 *
 * Rule: no logging inside `src/engine/frame.js` or the `src/engine/renderer.js`
 * phases. The frame is the one place a sink's cost would be paid per pixel.
 */

/** The four levels, by rank; a sink at `warn` receives `warn` and `error`. */
export const LOG_LEVELS = Object.freeze({ debug: 10, info: 20, warn: 30, error: 40 });

const LEVEL_NAMES = Object.freeze(Object.keys(LOG_LEVELS));
const CONSOLE_PREFIX = '[CloudCanvas]';

/**
 * The default sink: `error` to `console.error`, `warn` to `console.warn`, and
 * the rest to `console.info` / `console.debug`, each falling back to `console.log`.
 * The console is looked up per call so an environment that stubs or lacks one
 * is honoured at the moment of the record, not at import.
 *
 * @param {{level: string, scope: string, message: string, args: unknown[]}} record
 */
export function consoleLogSink(record) {
  if (typeof console === 'undefined') return;
  const method = typeof console[record.level] === 'function' ? console[record.level] : console.log;
  if (typeof method !== 'function') return;
  method.call(console, `${CONSOLE_PREFIX} ${record.message}`, ...record.args);
}

let sink = consoleLogSink;
let threshold = LOG_LEVELS.error;

/**
 * Install the sink every logger reports to, or `null` to silence all of them.
 *
 * @param {((record: object) => void)|null} nextSink
 * @param {{level?: keyof LOG_LEVELS}} [options] the lowest level delivered; `error`
 *   when omitted, which is the default sink's own threshold
 * @returns {((record: object) => void)|null} the sink that was installed before
 */
export function setLogSink(nextSink, options = {}) {
  if (nextSink !== null && typeof nextSink !== 'function') {
    throw new TypeError('setLogSink expects a function or null');
  }
  const level = options.level === undefined ? 'error' : options.level;
  if (!LEVEL_NAMES.includes(level)) {
    throw new RangeError(`unknown log level "${level}"; expected one of ${LEVEL_NAMES.join(', ')}`);
  }
  const previous = sink;
  sink = nextSink;
  threshold = LOG_LEVELS[level];
  return previous;
}

/**
 * Deliver one record. The sink is contained: a sink that throws must never break
 * the frame, gesture or restore that logged, so the failure is swallowed here and
 * nowhere else in the codebase.
 */
function emit(level, scope, message, args) {
  if (sink === null || LOG_LEVELS[level] < threshold) return;
  try {
    sink({ level, scope, message, args });
  } catch {
    // A broken sink is the sink's problem, never the caller's.
  }
}

/**
 * A frozen `{debug, info, warn, error}` for one scope.
 *
 * @param {string} scope the module or subsystem name carried on every record
 */
export function createLogger(scope) {
  const name = typeof scope === 'string' && scope !== '' ? scope : 'cloudcanvas';
  const logger = {};
  for (const level of LEVEL_NAMES) {
    logger[level] = (message, ...args) => emit(level, name, String(message), args);
  }
  return Object.freeze(logger);
}
