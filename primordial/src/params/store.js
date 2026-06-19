// Versioned localStorage persistence for the current look + slider values +
// perf knobs. Multiple generators can share an origin's storage, so we use a
// versioned key and validate/coerce everything on load. Provides a reset().

import {
  PARAM_SCHEMA,
  PERF_SCHEMA,
  DEFAULTS,
  PERF_DEFAULTS,
  coerceParams,
} from './schema.js';

const STORAGE_KEY = 'primordialV1';
const STORAGE_VERSION = 1;

export class ParamStore {
  constructor() {
    this.lookId = null;          // id of the selected look (or null = custom)
    this.params = { ...DEFAULTS };
    this.perf = { ...PERF_DEFAULTS };
    this._load();
  }

  _load() {
    let raw = null;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch (_) {
      raw = null; // storage may be blocked (file:// in some browsers)
    }
    if (!raw) return;

    let data;
    try {
      data = JSON.parse(raw);
    } catch (_) {
      return; // corrupt -> keep defaults
    }
    if (!data || data.version !== STORAGE_VERSION) return; // version mismatch -> defaults

    this.lookId = typeof data.lookId === 'string' ? data.lookId : null;
    this.params = coerceParams(PARAM_SCHEMA, data.params);
    this.perf = coerceParams(PERF_SCHEMA, data.perf);
  }

  save() {
    const data = {
      version: STORAGE_VERSION,
      lookId: this.lookId,
      params: this.params,
      perf: this.perf,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (_) {
      /* ignore quota / blocked storage */
    }
  }

  setParam(key, value) {
    this.params[key] = value;
    this.save();
  }

  setPerf(key, value) {
    this.perf[key] = value;
    this.save();
  }

  // Apply a look (a full params set) and remember its id.
  applyLook(lookId, lookParams) {
    this.lookId = lookId;
    this.params = coerceParams(PARAM_SCHEMA, lookParams);
    this.save();
  }

  reset() {
    this.lookId = null;
    this.params = { ...DEFAULTS };
    this.perf = { ...PERF_DEFAULTS };
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (_) {
      /* ignore */
    }
  }
}
