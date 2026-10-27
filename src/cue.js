// Istaka Çizimi, Nişan Alma Kılavuz Çizgileri ve Vuruş Animasyonları
class CueRenderer {
    constructor(ctx) {
        this.ctx = ctx;

        // Istaka tipleri ve özellikleri
        this.cueTypes = {
            classic: {
                id: 'classic',
                name: 'Klasik Ahşap Istaka',
                powerMultiplier: 1.0,
                description: 'Dengeli ağırlık, geleneksel akçaağaç gövde ve pirinç bilezik.',
                tipColor: '#38bdf8',
                ferruleColor: '#fef08a',
                shaftGrad: ['#fde047', '#eab308', '#ca8a04'],
                buttGrad: ['#78350f', '#451a03', '#1e140d'],
                glow: null
            },
            carbon: {
                id: 'carbon',
                name: 'Karbon Fiber Istaka',
                powerMultiplier: 1.2, // 1.2x maksimum güç çarpanı
                description: 'Hafif ve sert kompozit gövde, %20 ekstra vuruş gücü, neon detaylar.',
                tipColor: '#00f2fe',
                ferruleColor: '#09090b',
                shaftGrad: ['#27272a', '#18181b', '#09090b'],
                buttGrad: ['#09090b', '#0284c7', '#09090b'],
                glow: 'rgba(0, 242, 254, 0.45)'
            },
            gravity: {
                id: 'gravity',
                name: 'Yerçekimi (Gravity) Istakası',
                powerMultiplier: 1.05,
                smoothControl: true, // Yumuşak hassas güç rampası
                description: 'Kozmik enerji alanı, ultra hassas güç modülasyonu ve parlayan tasarım.',
                tipColor: '#d946ef',
                ferruleColor: '#a855f7',
                shaftGrad: ['#4c1d95', '#6d28d9', '#8b5cf6'],
                buttGrad: ['#2e1065', '#c026d3', '#3b0764'],
                glow: 'rgba(192, 38, 211, 0.7)'
            }
        };

        this.currentCue = this.cueTypes.classic;
        this.particles = [];
    }

    setCueType(typeId) {
        if (this.cueTypes[typeId]) {
            this.currentCue = this.cueTypes[typeId];
        }
    }

    // Parçacık ekleme (Vuruş anında)
    spawnStrikeParticles(x, y, angle, powerRatio) {
        const count = this.currentCue.id === 'gravity' ? 24 : (this.currentCue.id === 'carbon' ? 14 : 8);
        const baseColor = this.currentCue.id === 'gravity' ? '#c026d3' : (this.currentCue.id === 'carbon' ? '#38bdf8' : '#fef08a');

        for (let i = 0; i < count; i++) {
            const spread = (Math.random() - 0.5) * 1.2;
            const pAngle = angle + Math.PI + spread;
            const speed = (2 + Math.random() * 5) * (powerRatio + 0.3);

            this.particles.push({
                x,
                y,
                vx: Math.cos(pAngle) * speed,
                vy: Math.sin(pAngle) * speed,
                radius: 1.5 + Math.random() * 2.5,
                color: baseColor,
                alpha: 1.0,
                decay: 0.03 + Math.random() * 0.03
            });
        }
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.94;
            p.vy *= 0.94;
            p.alpha -= p.decay;

            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    drawParticles(ctx) {
        ctx.save();
        for (let p of this.particles) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.max(0, p.alpha);
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 6;
            ctx.fill();
        }
        ctx.restore();
    }

    // Kılavuz çizgilerini çiz (Zorluk: Acemi veya Usta)
    drawAimGuide(ctx, trajectory, difficulty) {
        // Usta (Master) modunda hiçbir kılavuz çizgisi ÇİZİLMEZ!
        if (difficulty === 'master' || !trajectory) {
            return;
        }

        ctx.save();

        // 1. Beyaz Topun Birincil Yörünge Çizgisi (Noktalı Kılavuz)
        ctx.beginPath();
        ctx.setLineDash([6, 6]);
        ctx.lineWidth = 2.0;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.moveTo(trajectory.cuePath.start.x, trajectory.cuePath.start.y);
        ctx.lineTo(trajectory.cuePath.end.x, trajectory.cuePath.end.y);
        ctx.stroke();

        // 2. Bir topa çarpacaksa:
        if (trajectory.type === 'ball_hit') {
            // A. Hayalet Beyaz Top (Ghost Ball)
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.arc(trajectory.ghostBall.x, trajectory.ghostBall.y, 13.5, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.lineWidth = 1.8;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
            ctx.fill();
            ctx.stroke();

            // Merkez noktası
            ctx.beginPath();
            ctx.arc(trajectory.ghostBall.x, trajectory.ghostBall.y, 2, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();

            // B. Hedef Topun Gideceği İkincil Çizgi (Altın / Sarı Ok Çizgisi)
            ctx.beginPath();
            ctx.setLineDash([4, 4]);
            ctx.lineWidth = 2.2;
            ctx.strokeStyle = '#facc15'; // Parlak altın sarısı
            ctx.moveTo(trajectory.targetPath.start.x, trajectory.targetPath.start.y);
            ctx.lineTo(trajectory.targetPath.end.x, trajectory.targetPath.end.y);
            ctx.stroke();

            // Hedef doğrultusundaki minik ok ucu
            this.drawArrowHead(ctx, trajectory.targetPath.start, trajectory.targetPath.end, '#facc15');

            // C. Beyaz Topun Teğetsel Sapma Çizgisi (Mavi / Beyaz İnce Çizgi)
            ctx.beginPath();
            ctx.setLineDash([3, 4]);
            ctx.lineWidth = 1.6;
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
            ctx.moveTo(trajectory.cueDeflectPath.start.x, trajectory.cueDeflectPath.start.y);
            ctx.lineTo(trajectory.cueDeflectPath.end.x, trajectory.cueDeflectPath.end.y);
            ctx.stroke();

        } else if (trajectory.type === 'cushion_hit') {
            // Masa bandına çarpıp sekecekse yansıma çizgisi
            ctx.beginPath();
            ctx.setLineDash([4, 4]);
            ctx.lineWidth = 1.8;
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
            ctx.moveTo(trajectory.reflectPath.start.x, trajectory.reflectPath.start.y);
            ctx.lineTo(trajectory.reflectPath.end.x, trajectory.reflectPath.end.y);
            ctx.stroke();
        }

        ctx.restore();
    }

    // Ok ucu çizim yardımcısı
    drawArrowHead(ctx, from, to, color) {
        const headlen = 9;
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const angle = Math.atan2(dy, dx);

        ctx.save();
        ctx.setLineDash([]);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(to.x, to.y);
        ctx.lineTo(to.x - headlen * Math.cos(angle - Math.PI / 6), to.y - headlen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(to.x - headlen * Math.cos(angle + Math.PI / 6), to.y - headlen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    // Istakanın Kendisini Çiz
    drawCueStick(ctx, cueBallPos, aimAngle, powerRatio = 0, strikeOffset = 0) {
        if (!cueBallPos) return;

        const cue = this.currentCue;
        const ballR = 13.5;

        // Vuruş geriye çekilme mesafesi (Power pullback)
        const maxPull = 75;
        const pullback = (powerRatio * maxPull) - strikeOffset;
        const distFromBall = ballR + 8 + pullback;

        ctx.save();
        ctx.translate(cueBallPos.x, cueBallPos.y);
        ctx.rotate(aimAngle + Math.PI); // Istaka topun ters tarafında durur

        // Istaka Boyutları
        const cueLength = 340;
        const tipWidth = 5.0;
        const buttWidth = 11.0;
        const startX = distFromBall;
        const endX = distFromBall + cueLength;

        // Gravity veya Carbon için Glow efekti
        if (cue.glow) {
            ctx.shadowColor = cue.glow;
            ctx.shadowBlur = 14;
        }

        // 1. Deri Uç (Cue Tip)
        ctx.fillStyle = cue.tipColor;
        ctx.fillRect(startX, -tipWidth / 2, 4, tipWidth);

        // 2. Yüksük / Bilezik (Ferrule)
        ctx.fillStyle = cue.ferruleColor;
        ctx.fillRect(startX + 4, -tipWidth / 2, 10, tipWidth);

        // 3. Şaft (Shaft - İnceden kalına doğru konik yapı)
        const shaftLength = cueLength * 0.65;
        const shaftMidWidth = tipWidth + (buttWidth - tipWidth) * 0.55;

        const shaftGrad = ctx.createLinearGradient(startX + 14, 0, startX + 14 + shaftLength, 0);
        shaftGrad.addColorStop(0, cue.shaftGrad[0]);
        shaftGrad.addColorStop(0.5, cue.shaftGrad[1]);
        shaftGrad.addColorStop(1, cue.shaftGrad[2]);

        ctx.beginPath();
        ctx.moveTo(startX + 14, -tipWidth / 2);
        ctx.lineTo(startX + 14 + shaftLength, -shaftMidWidth / 2);
        ctx.lineTo(startX + 14 + shaftLength, shaftMidWidth / 2);
        ctx.lineTo(startX + 14, tipWidth / 2);
        ctx.closePath();
        ctx.fillStyle = shaftGrad;
        ctx.fill();

        // 4. Dekoratif Geçiş Halkaları (Joint Collar)
        ctx.fillStyle = '#fef08a'; // Altın yüzük
        ctx.fillRect(startX + 14 + shaftLength, -shaftMidWidth / 2 - 0.5, 4, shaftMidWidth + 1);

        // 5. Dipçik / Tutma Yeri (Butt)
        const buttStartX = startX + 18 + shaftLength;
        const buttLength = cueLength - (18 + shaftLength);

        const buttGrad = ctx.createLinearGradient(buttStartX, 0, endX, 0);
        buttGrad.addColorStop(0, cue.buttGrad[0]);
        buttGrad.addColorStop(0.5, cue.buttGrad[1]);
        buttGrad.addColorStop(1, cue.buttGrad[2]);

        ctx.beginPath();
        ctx.moveTo(buttStartX, -shaftMidWidth / 2);
        ctx.lineTo(endX, -buttWidth / 2);
        ctx.lineTo(endX, buttWidth / 2);
        ctx.lineTo(buttStartX, shaftMidWidth / 2);
        ctx.closePath();
        ctx.fillStyle = buttGrad;
        ctx.fill();

        // Karbon fiber desen çizgileri
        if (cue.id === 'carbon') {
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
            ctx.lineWidth = 1;
            for (let x = buttStartX + 10; x < endX - 10; x += 14) {
                ctx.beginPath();
                ctx.moveTo(x, -buttWidth / 2);
                ctx.lineTo(x + 8, buttWidth / 2);
                ctx.stroke();
            }
        }

        // Yerçekimi Istakası için kozmik parıltı çizgisi
        if (cue.id === 'gravity') {
            ctx.strokeStyle = '#f472b6';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(startX + 14, 0);
            ctx.lineTo(endX - 8, 0);
            ctx.stroke();
        }

        // 6. Arka Kauçuk Tampon (Bumper)
        ctx.fillStyle = '#09090b';
        ctx.beginPath();
        ctx.roundRect(endX, -buttWidth / 2, 8, buttWidth, [0, 4, 4, 0]);
        ctx.fill();

        ctx.restore();
    }
}

window.CueRenderer = CueRenderer;
