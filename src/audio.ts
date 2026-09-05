/** A quiet, locally synthesized sea soundscape. Playback only starts after a user gesture. */
export class Soundscape {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private birds: ReturnType<typeof setInterval> | null = null;
  enabled = false;
  volume = .5;

  async toggle() {
    if (!this.context) this.create();
    this.enabled = !this.enabled;
    if (this.enabled) {
      await this.context!.resume();
      this.master!.gain.setTargetAtTime(this.volume * .24, this.context!.currentTime, .65);
      this.birds = setInterval(() => this.chirp(), 8800);
    } else {
      this.master!.gain.setTargetAtTime(0, this.context!.currentTime, .25);
      if (this.birds) clearInterval(this.birds);
      this.birds = null;
    }
    return this.enabled;
  }

  setVolume(value: number) {
    this.volume = value;
    if (this.context && this.master && this.enabled) this.master.gain.setTargetAtTime(value * .24, this.context.currentTime, .15);
  }

  private create() {
    this.context = new AudioContext();
    const ctx = this.context;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);
    const buffer = ctx.createBuffer(2, ctx.sampleRate * 6, ctx.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      let last = 0;
      for (let i = 0; i < data.length; i++) {
        last = (last + .035 * (Math.random() * 2 - 1)) / 1.035;
        data[i] = last * 8;
      }
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer; source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 1100;
    const wave = ctx.createGain(); wave.gain.value = .7;
    const tide = ctx.createOscillator(); tide.frequency.value = .105;
    const depth = ctx.createGain(); depth.gain.value = .26;
    tide.connect(depth).connect(wave.gain);
    source.connect(filter).connect(wave).connect(this.master);
    source.start(); tide.start();
  }

  private chirp() {
    if (!this.enabled || !this.context || !this.master || document.hidden) return;
    const ctx = this.context;
    for (let i = 0; i < 2; i++) {
      const at = ctx.currentTime + i * .18;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.frequency.setValueAtTime(1850 + i * 180, at);
      oscillator.frequency.exponentialRampToValueAtTime(2700, at + .06);
      oscillator.frequency.exponentialRampToValueAtTime(1600, at + .17);
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(.035, at + .025);
      gain.gain.exponentialRampToValueAtTime(.001, at + .23);
      oscillator.connect(gain).connect(this.master);
      oscillator.start(at); oscillator.stop(at + .25);
    }
  }
}
