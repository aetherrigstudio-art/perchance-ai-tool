// Microphone / line-in capture: getUserMedia with RAW constraints (no AGC,
// no noise suppression, no echo cancellation -> we want the true signal for
// music), an AudioContext that resumes on a user gesture, and a device picker
// backed by enumerateDevices (labels only populate after first permission).

export class AudioInput {
  constructor() {
    this.ctx = null;
    this.stream = null;
    this.source = null;      // MediaStreamAudioSourceNode
    this.deviceId = null;
    this.devices = [];       // [{deviceId, label}]
    this.started = false;
  }

  // Raw constraints: keep the signal untouched.
  _constraints(deviceId) {
    const audio = {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
      channelCount: 1,
    };
    if (deviceId) audio.deviceId = { exact: deviceId };
    return { audio, video: false };
  }

  // Start (or restart) capture. Must be called from a user gesture so the
  // AudioContext can resume on iOS/Safari. Returns the source node.
  async start(deviceId = null) {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC({ latencyHint: 'interactive' });
    }
    // Resume on the user gesture (iOS requirement).
    if (this.ctx.state === 'suspended') {
      try { await this.ctx.resume(); } catch (_) { /* ignore */ }
    }

    // Stop any prior stream when switching devices.
    this._stopStream();

    this.stream = await navigator.mediaDevices.getUserMedia(
      this._constraints(deviceId)
    );
    this.deviceId = deviceId;
    this.source = this.ctx.createMediaStreamSource(this.stream);
    this.started = true;

    // Now that we have permission, labels are available.
    await this.refreshDevices();
    return this.source;
  }

  _stopStream() {
    if (this.stream) {
      for (const tr of this.stream.getTracks()) tr.stop();
      this.stream = null;
    }
    if (this.source) {
      try { this.source.disconnect(); } catch (_) { /* ignore */ }
      this.source = null;
    }
  }

  // Switch to a different input device (keeps the AudioContext/graph alive).
  async setDevice(deviceId) {
    return this.start(deviceId);
  }

  async refreshDevices() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      this.devices = [];
      return this.devices;
    }
    const all = await navigator.mediaDevices.enumerateDevices();
    this.devices = all
      .filter((d) => d.kind === 'audioinput')
      .map((d, i) => ({
        deviceId: d.deviceId,
        label: d.label || ('Input ' + (i + 1)),
      }));
    return this.devices;
  }

  stop() {
    this._stopStream();
    this.started = false;
  }
}
