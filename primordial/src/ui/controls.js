// HUD controls: builds the panel (sliders from the schema, device picker, look
// switcher, tap-tempo, perf sliders), wires DOM events to the param store and
// callbacks, and exposes updaters for the live readout. No frameworks.

import { PARAM_SCHEMA, PERF_SCHEMA } from '../params/schema.js';

// Small DOM helper.
function el(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  if (attrs) {
    for (const k in attrs) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'text') e.textContent = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
  }
  for (const kid of kids) {
    if (kid == null) continue;
    e.appendChild(typeof kid === 'string' ? document.createTextNode(kid) : kid);
  }
  return e;
}

function fmt(entry, v) {
  if (entry.type === 'color') return '';
  return entry.step >= 1 ? String(Math.round(v)) : v.toFixed(2);
}

export class Controls {
  // store: ParamStore. callbacks: {onParam, onPerf, onLook, onDevice, onTap, onManualBpm, onReset}
  constructor(store, callbacks) {
    this.store = store;
    this.cb = callbacks || {};
    this.readoutEl = document.getElementById('readout');
    this.panel = document.getElementById('panel');
    this._valEls = new Map(); // key -> value <span>
    this._rangeEls = new Map();
    this.looks = [];
    this.lookSelect = null;
    this.deviceSelect = null;
    this.bpmLabel = null;
  }

  mount() {
    const panel = this.panel;
    panel.innerHTML = '';

    // Toggle handle (mobile pull-up).
    const toggle = el('button', { id: 'panelToggle', type: 'button' }, 'Controls');
    toggle.addEventListener('click', () => panel.classList.toggle('open'));
    panel.appendChild(toggle);

    // --- Look + device + tempo ---
    panel.appendChild(el('div', { class: 'section-title' }, 'Source / Look'));

    // Look switcher.
    this.lookSelect = el('select');
    this.lookSelect.addEventListener('change', () => {
      if (this.cb.onLook) this.cb.onLook(this.lookSelect.value);
    });
    panel.appendChild(el('div', { class: 'row' },
      el('label', { text: 'Look' }), this.lookSelect));

    // Device picker.
    this.deviceSelect = el('select');
    this.deviceSelect.addEventListener('change', () => {
      if (this.cb.onDevice) this.cb.onDevice(this.deviceSelect.value);
    });
    panel.appendChild(el('div', { class: 'row' },
      el('label', { text: 'Input' }), this.deviceSelect));

    // Tap tempo.
    this.bpmLabel = el('span', { class: 'val' }, '--');
    const tapBtn = el('button', { class: 'btn', type: 'button' }, 'Tap Tempo');
    tapBtn.addEventListener('click', () => {
      if (this.cb.onTap) this.cb.onTap();
    });
    // Spacebar also taps.
    window.addEventListener('keydown', (ev) => {
      if (ev.code === 'Space' && !ev.repeat) {
        ev.preventDefault();
        if (this.cb.onTap) this.cb.onTap();
      }
    });
    panel.appendChild(el('div', { class: 'row' },
      el('label', { text: 'Tempo' }), tapBtn, this.bpmLabel));

    // --- Look params ---
    panel.appendChild(el('div', { class: 'section-title' }, 'Look Params'));
    for (const entry of PARAM_SCHEMA) {
      if (entry.type === 'color') continue; // colors come from looks, not sliders
      panel.appendChild(this._slider(entry, this.store.params[entry.key], (v) => {
        this.store.setParam(entry.key, v);
        if (this.cb.onParam) this.cb.onParam(entry.key, v);
      }));
    }

    // --- Performance ---
    panel.appendChild(el('div', { class: 'section-title' }, 'Performance'));
    for (const entry of PERF_SCHEMA) {
      panel.appendChild(this._slider(entry, this.store.perf[entry.key], (v) => {
        this.store.setPerf(entry.key, v);
        if (this.cb.onPerf) this.cb.onPerf(entry.key, v);
      }, true));
    }

    // --- Actions ---
    const resetBtn = el('button', { class: 'btn', type: 'button' }, 'Reset');
    resetBtn.addEventListener('click', () => {
      if (this.cb.onReset) this.cb.onReset();
    });
    panel.appendChild(el('div', { class: 'btnrow' }, resetBtn));
  }

  _slider(entry, value, onInput, isPerf) {
    const input = el('input', {
      type: 'range',
      min: String(entry.min),
      max: String(entry.max),
      step: String(entry.step),
    });
    input.value = String(value);
    const valEl = el('span', { class: 'val' }, fmt(entry, value));
    input.addEventListener('input', () => {
      const v = entry.step >= 1 ? Math.round(Number(input.value)) : Number(input.value);
      valEl.textContent = fmt(entry, v);
      onInput(v);
    });
    this._valEls.set((isPerf ? 'perf:' : '') + entry.key, valEl);
    this._rangeEls.set((isPerf ? 'perf:' : '') + entry.key, input);
    return el('div', { class: 'row' },
      el('label', { text: entry.label }), input, valEl);
  }

  // Populate the look <select>.
  setLooks(looks, selectedId) {
    this.looks = looks;
    this.lookSelect.innerHTML = '';
    for (const lk of looks) {
      const opt = el('option', { value: lk.id }, lk.name);
      if (lk.id === selectedId) opt.selected = true;
      this.lookSelect.appendChild(opt);
    }
  }

  // Populate the device <select>.
  setDevices(devices, selectedId) {
    this.deviceSelect.innerHTML = '';
    if (!devices.length) {
      this.deviceSelect.appendChild(el('option', { value: '' }, 'Default'));
      return;
    }
    for (const d of devices) {
      const opt = el('option', { value: d.deviceId }, d.label);
      if (d.deviceId === selectedId) opt.selected = true;
      this.deviceSelect.appendChild(opt);
    }
  }

  // Reflect perf changes made by the dynamic-resolution controller back into UI.
  reflectPerf(key, value) {
    const entry = PERF_SCHEMA.find((e) => e.key === key);
    if (!entry) return;
    const range = this._rangeEls.get('perf:' + key);
    const val = this._valEls.get('perf:' + key);
    if (range) range.value = String(value);
    if (val) val.textContent = fmt(entry, value);
  }

  // Reflect a slider param changed externally (e.g. applying a look).
  reflectParam(key, value) {
    const entry = PARAM_SCHEMA.find((e) => e.key === key);
    if (!entry || entry.type === 'color') return;
    const range = this._rangeEls.get(key);
    const val = this._valEls.get(key);
    if (range) range.value = String(value);
    if (val) val.textContent = fmt(entry, value);
  }

  setBpm(bpm) {
    if (this.bpmLabel) this.bpmLabel.textContent = bpm ? String(bpm) : '--';
  }

  // Update the FPS / ms / resolution readout with a verdict.
  setReadout(fps, ms, resW, resH, scale) {
    if (!this.readoutEl) return;
    let cls = 'smooth';
    let verdict = 'SMOOTH';
    if (fps < 30) { cls = 'bad'; verdict = 'TOO MUCH'; }
    else if (fps < 50) { cls = 'ok'; verdict = 'OK'; }
    this.readoutEl.innerHTML =
      'FPS ' + fps.toFixed(0) + '  ' + ms.toFixed(1) + 'ms\n' +
      resW + 'x' + resH + ' @' + scale.toFixed(2) + '\n' +
      '<span class="verdict ' + cls + '">' + verdict + '</span>';
  }
}
