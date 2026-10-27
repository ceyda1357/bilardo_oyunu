// Web Audio API ile tamamen bağımsız, sıfır gecikmeli procedural ses motoru
class SoundManager {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
            this.initialized = true;
        } catch (e) {
            console.warn("Web Audio API desteklenmiyor:", e);
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        return this.muted;
    }

    // Istaka vuruş sesi (cue striking ball)
    playCueHit(powerRatio = 0.5, cueType = 'classic') {
        if (this.muted || !this.ctx) return;
        this.resume();

        const t = this.ctx.currentTime;
        const gain = this.ctx.createGain();
        gain.connect(this.ctx.destination);

        const vol = Math.min(1.0, Math.max(0.1, powerRatio));

        if (cueType === 'gravity') {
            // Bilim kurgu parıltılı rezonans sesi
            const osc = this.ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, t);
            osc.frequency.exponentialRampToValueAtTime(140, t + 0.25);

            gain.gain.setValueAtTime(0.35 * vol, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

            osc.connect(gain);
            osc.start(t);
            osc.stop(t + 0.25);
            return;
        }

        // Klasik ve Karbon için gerçekçi ahşap/deri vuruş
        // 1. Kısa gürültü darbesi (deri uç teması)
        const bufferSize = this.ctx.sampleRate * 0.04;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(cueType === 'carbon' ? 1800 : 1200, t);
        filter.Q.setValueAtTime(3, t);

        gain.gain.setValueAtTime(0.7 * vol, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

        whiteNoise.connect(filter);
        filter.connect(gain);
        whiteNoise.start(t);

        // 2. Gövde tonu (ahşap / karbon yankısı)
        const osc = this.ctx.createOscillator();
        osc.type = cueType === 'carbon' ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(cueType === 'carbon' ? 320 : 220, t);
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.07);

        const oscGain = this.ctx.createGain();
        oscGain.gain.setValueAtTime(0.5 * vol, t);
        oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

        osc.connect(oscGain);
        oscGain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.07);
    }

    // Topların birbirine çarpışma sesi (Ball-to-Ball collision)
    playBallHit(speed = 5) {
        if (this.muted || !this.ctx) return;
        this.resume();

        const t = this.ctx.currentTime;
        const normalizedSpeed = Math.min(1.0, Math.max(0.08, speed / 18));

        // Sert fenolik reçine bilardo topu tıkırtısı (yüksek frekanslı keskin darbe)
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1600 + Math.random() * 200, t);
        osc.frequency.exponentialRampToValueAtTime(450, t + 0.04);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.6 * normalizedSpeed, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.04);

        // İkincil rezonans
        const osc2 = this.ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(2400, t);
        osc2.frequency.exponentialRampToValueAtTime(600, t + 0.025);

        const gain2 = this.ctx.createGain();
        gain2.gain.setValueAtTime(0.3 * normalizedSpeed, t);
        gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.025);

        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);
        osc2.start(t);
        osc2.stop(t + 0.025);
    }

    // Masanın bantlarına (cushion) çarpma sesi
    playCushionHit(speed = 4) {
        if (this.muted || !this.ctx) return;
        this.resume();

        const t = this.ctx.currentTime;
        const normalizedSpeed = Math.min(1.0, Math.max(0.1, speed / 15));

        // Kauçuk bant için tok ve boğuk bas sesi
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, t);
        osc.frequency.exponentialRampToValueAtTime(50, t + 0.06);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.4 * normalizedSpeed, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.06);
    }

    // Topun cebe düşme sesi (Pocket pot)
    playPocketSound() {
        if (this.muted || !this.ctx) return;
        this.resume();

        const t = this.ctx.currentTime;

        // Derin "thump" ve yuvarlanma hissi
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, t);
        osc.frequency.exponentialRampToValueAtTime(60, t + 0.18);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.18);

        // İkincil file/cep tıkırtısı
        setTimeout(() => {
            if (this.muted || !this.ctx) return;
            const t2 = this.ctx.currentTime;
            const osc2 = this.ctx.createOscillator();
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(320, t2);
            osc2.frequency.exponentialRampToValueAtTime(90, t2 + 0.1);

            const gain2 = this.ctx.createGain();
            gain2.gain.setValueAtTime(0.25, t2);
            gain2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.1);

            osc2.connect(gain2);
            gain2.connect(this.ctx.destination);
            osc2.start(t2);
            osc2.stop(t2 + 0.1);
        }, 60);
    }

    // Zafer / Başarı sesi
    playVictorySound() {
        if (this.muted || !this.ctx) return;
        this.resume();

        const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
        notes.forEach((freq, index) => {
            setTimeout(() => {
                if (this.muted || !this.ctx) return;
                const t = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, t);

                const gain = this.ctx.createGain();
                gain.gain.setValueAtTime(0.3, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(t);
                osc.stop(t + 0.3);
            }, index * 100);
        });
    }

    // Faul uyarısı sesi
    playFoulSound() {
        if (this.muted || !this.ctx) return;
        this.resume();

        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.25);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.25);
    }

    // Tebeşir sürme sesi (Chalking cue tip)
    playChalkSound() {
        if (this.muted || !this.ctx) return;
        this.resume();

        const t = this.ctx.currentTime;
        // İki ardışık sürtünme darbesi
        [0, 0.09].forEach(delay => {
            const bufferSize = this.ctx.sampleRate * 0.06;
            const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                output[i] = (Math.random() * 2 - 1) * Math.sin(i / bufferSize * Math.PI);
            }

            const whiteNoise = this.ctx.createBufferSource();
            whiteNoise.buffer = noiseBuffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(2600 + Math.random() * 400, t + delay);
            filter.Q.setValueAtTime(4, t + delay);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.35, t + delay);
            gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.06);

            whiteNoise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);
            whiteNoise.start(t + delay);
        });
    }

    // Miscue (Istaka kayması ve ıskalama sesi)
    playMiscueSound() {
        if (this.muted || !this.ctx) return;
        this.resume();

        const t = this.ctx.currentTime;

        // Tiz kayma/cırlama tonu
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(850, t);
        osc.frequency.exponentialRampToValueAtTime(2200, t + 0.08);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(600, t);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.12);
    }
}

window.soundManager = new SoundManager();
