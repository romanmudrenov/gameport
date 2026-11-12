export class ChiptuneSynth {
    constructor() {
        this.ctx = null;
        this.isPlaying = false;
        this.muted = false;
        this.tempo = 145;
        this.step = 0;
        this.timer = null;

        this.bassNotes = [
            110, 110, 0, 110, 130.81, 0, 146.83, 0,
            110, 110, 0, 110, 164.81, 0, 146.83, 130.81,
            87.31, 87.31, 0, 87.31, 98.00, 0, 110.00, 0,
            98.00, 98.00, 0, 98.00, 130.81, 123.47, 110.00, 98.00
        ];

        this.leadNotes = [
            440, 0, 523.25, 0, 587.33, 523.25, 440, 0,
            659.25, 0, 587.33, 0, 523.25, 493.88, 440, 0,
            349.23, 0, 440, 0, 523.25, 440, 349.23, 0,
            392.00, 0, 493.88, 0, 587.33, 523.25, 493.88, 392.00
        ];
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playTone(freq, type, duration, vol = 0.1, slideTo = null) {
        if (!this.ctx || freq <= 0) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);
        if (slideTo) {
            osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
        }

        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + duration);
    }

    playNoise(duration, vol = 0.15, filterFreq = 1000) {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const bufferSize = Math.floor(this.ctx.sampleRate * duration);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(filterFreq, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(now);
    }

    sfxShoot(spread = false) {
        this.init();
        if (spread) {
            this.playTone(700, 'sawtooth', 0.12, 0.12, 120);
            this.playNoise(0.08, 0.1, 2500);
        } else {
            this.playTone(550, 'square', 0.09, 0.1, 150);
        }
    }

    sfxJump() {
        this.init();
        this.playTone(180, 'square', 0.18, 0.1, 520);
    }

    sfxExplosion() {
        this.init();
        this.playNoise(0.45, 0.3, 600);
        this.playTone(120, 'sawtooth', 0.4, 0.2, 30);
    }

    sfxPowerup() {
        this.init();
        const notes = [330, 440, 554.37, 659.25, 880];
        notes.forEach((note, idx) => {
            setTimeout(() => this.playTone(note, 'square', 0.1, 0.12), idx * 55);
        });
    }

    sfxHit() {
        this.init();
        this.playTone(160, 'sawtooth', 0.25, 0.2, 45);
        this.playNoise(0.2, 0.2, 800);
    }

    startMusic() {
        this.init();
        if (this.isPlaying) return;
        this.isPlaying = true;
        const stepTime = (60 / this.tempo / 4) * 1000;

        this.timer = setInterval(() => {
            if (this.muted || !this.isPlaying) return;
            const idx = this.step % 32;

            if (idx % 4 === 0) {
                this.playTone(130, 'triangle', 0.09, 0.18, 35);
            } else if (idx % 4 === 2) {
                this.playNoise(0.08, 0.09, 1800);
            } else if (idx % 2 === 1) {
                this.playNoise(0.03, 0.03, 5000);
            }

            const bNote = this.bassNotes[idx];
            if (bNote > 0) this.playTone(bNote, 'sawtooth', 0.11, 0.08);

            const lNote = this.leadNotes[idx];
            if (lNote > 0) this.playTone(lNote, 'square', 0.14, 0.06);

            this.step++;
        }, stepTime);
    }

    toggleMute() {
        this.muted = !this.muted;
        const el = document.getElementById('music-status');
        if (el) el.innerText = `SYNTH: ${this.muted ? 'OFF' : 'ON'} (Клавиша M)`;
    }
}

export const synth = new ChiptuneSynth();
