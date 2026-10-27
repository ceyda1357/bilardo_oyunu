// 2D Vektör Sınıfı
class Vector2D {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    set(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }

    copy() {
        return new Vector2D(this.x, this.y);
    }

    add(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }

    sub(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }

    mult(n) {
        this.x *= n;
        this.y *= n;
        return this;
    }

    div(n) {
        if (n !== 0) {
            this.x /= n;
            this.y /= n;
        }
        return this;
    }

    magSq() {
        return this.x * this.x + this.y * this.y;
    }

    mag() {
        return Math.sqrt(this.magSq());
    }

    normalize() {
        const m = this.mag();
        if (m !== 0) {
            this.div(m);
        }
        return this;
    }

    dot(v) {
        return this.x * v.x + this.y * v.y;
    }

    dist(v) {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    heading() {
        return Math.atan2(this.y, this.x);
    }
}

// Bilardo Topu Renk ve Detay Verileri
const BALL_CONFIG = [
    { number: 0, color: '#f8fafc', stripe: false, name: 'Beyaz Top' }, // Cue ball
    { number: 1, color: '#facc15', stripe: false, name: 'Sarı' },
    { number: 2, color: '#2563eb', stripe: false, name: 'Mavi' },
    { number: 3, color: '#dc2626', stripe: false, name: 'Kırmızı' },
    { number: 4, color: '#9333ea', stripe: false, name: 'Mor' },
    { number: 5, color: '#ea580c', stripe: false, name: 'Turuncu' },
    { number: 6, color: '#16a34a', stripe: false, name: 'Yeşil' },
    { number: 7, color: '#7f1d1d', stripe: false, name: 'Bordo' },
    { number: 8, color: '#09090b', stripe: false, name: 'Siyah' }, // 8 Ball
    { number: 9, color: '#facc15', stripe: true, name: 'Çizgili Sarı' },
    { number: 10, color: '#2563eb', stripe: true, name: 'Çizgili Mavi' },
    { number: 11, color: '#dc2626', stripe: true, name: 'Çizgili Kırmızı' },
    { number: 12, color: '#9333ea', stripe: true, name: 'Çizgili Mor' },
    { number: 13, color: '#ea580c', stripe: true, name: 'Çizgili Turuncu' },
    { number: 14, color: '#16a34a', stripe: true, name: 'Çizgili Yeşil' },
    { number: 15, color: '#7f1d1d', stripe: true, name: 'Çizgili Bordo' }
];

// Top Sınıfı
class Ball {
    constructor(number, x, y, radius = 13.5) {
        this.number = number;
        this.pos = new Vector2D(x, y);
        this.vel = new Vector2D(0, 0);
        this.radius = radius;
        this.baseRadius = radius;
        this.mass = 1.0;

        const cfg = BALL_CONFIG[number] || { color: '#ffffff', stripe: false };
        this.color = cfg.color;
        this.stripe = cfg.stripe;
        this.isCueBall = (number === 0);

        this.inPocket = false;
        this.sinking = false;
        this.sinkProgress = 0;
        this.targetPocket = null;
        this.rotationAngle = Math.random() * Math.PI * 2;

        // Falso (Spin) Değişkenleri (x: Yan falso [-1: Sol, +1: Sağ], y: Dikey falso [-1: Geri spin, +1: İleri spin])
        this.spin = new Vector2D(0, 0);
        this.shotDir = new Vector2D(1, 0);
        this.hasHitBall = false;
    }

    update(friction = 0.987, dt = 1) {
        if (this.inPocket) return;

        if (this.sinking) {
            // Cebe düşme animasyonu (içe çekilme ve küçülme)
            this.sinkProgress += 0.06 * dt;
            if (this.targetPocket) {
                this.pos.x += (this.targetPocket.x - this.pos.x) * 0.15;
                this.pos.y += (this.targetPocket.y - this.pos.y) * 0.15;
            }
            this.radius = Math.max(0.1, this.baseRadius * (1 - this.sinkProgress));
            this.vel.mult(0.6);

            if (this.sinkProgress >= 1.0) {
                this.inPocket = true;
                this.sinking = false;
                this.radius = 0;
                this.vel.set(0, 0);
                this.spin.set(0, 0);
            }
            return;
        }

        // Hız güncellemesi
        this.pos.x += this.vel.x * dt;
        this.pos.y += this.vel.y * dt;

        // Sürtünme (Friction)
        this.vel.mult(Math.pow(friction, dt));

        // Spin sönümlenmesi (Çuha sürtünmesi ile spin yavaşça azalır)
        if (this.spin.magSq() > 0.0001) {
            this.spin.mult(Math.pow(0.982, dt));
        } else {
            this.spin.set(0, 0);
        }

        // Dönme efekti simülasyonu
        const speed = this.vel.mag();
        this.rotationAngle += (speed * 0.05) % (Math.PI * 2);

        // Hız çok düştüğünde tam durdurma
        if (speed < 0.035) {
            this.vel.set(0, 0);
            this.spin.set(0, 0);
            this.hasHitBall = false;
        }
    }

    isMoving() {
        return !this.inPocket && this.vel.magSq() > 0.001;
    }

    reset(x, y) {
        this.pos.set(x, y);
        this.vel.set(0, 0);
        this.spin.set(0, 0);
        this.shotDir.set(1, 0);
        this.hasHitBall = false;
        this.radius = this.baseRadius;
        this.inPocket = false;
        this.sinking = false;
        this.sinkProgress = 0;
        this.targetPocket = null;
    }
}

// Masa Kenar Parçası (Bant) Sınıfı - Segment çarpışması için
class CushionSegment {
    constructor(p1, p2, normal) {
        this.p1 = p1; // Vector2D
        this.p2 = p2; // Vector2D
        this.normal = normal; // Vector2D (içeri bakan birim normal)
    }
}

// Fizik Motoru
class PhysicsEngine {
    constructor(tableWidth = 920, tableHeight = 460) {
        this.width = tableWidth;
        this.height = tableHeight;
        this.balls = [];
        this.pockets = [];
        this.cushions = [];
        this.pocketRadius = 24;
        this.pocketMouthRadius = 26;
        this.restitution = 0.96; // Top-top esneklik katsayısı
        this.cushionRestitution = 0.82; // Bant esneklik katsayısı
        this.friction = 0.988; // Masa sürtünmesi

        // 8-Top Kuralları için vuruş takibi
        this.firstContactBall = null; // Beyaz topun ilk çarptığı top

        this.initTableGeometry();
    }

    // Top bulma (Sürükleme ve Antrenman modu için)
    findBallAt(x, y, radiusBoost = 8) {
        const testPos = new Vector2D(x, y);
        for (let b of this.balls) {
            if (b.inPocket || b.sinking) continue;
            if (b.pos.dist(testPos) <= b.radius + radiusBoost) {
                return b;
            }
        }
        return null;
    }

    // Topu masada güvenli şekilde taşıma
    moveBall(ball, targetX, targetY) {
        if (!ball) return;
        const r = ball.baseRadius || 13.5;
        const margin = 16;
        ball.pos.x = Math.max(r + margin, Math.min(this.width - r - margin, targetX));
        ball.pos.y = Math.max(r + margin, Math.min(this.height - r - margin, targetY));
        ball.vel.set(0, 0);
    }

    // Vuruşu Geri Al (Undo) için tam masa durumunun anlık görüntüsü
    getSnapshot() {
        return {
            balls: this.balls.map(b => ({
                number: b.number,
                x: b.pos.x,
                y: b.pos.y,
                vx: b.vel.x,
                vy: b.vel.y,
                radius: b.radius,
                inPocket: b.inPocket,
                sinking: b.sinking,
                sinkProgress: b.sinkProgress
            }))
        };
    }

    // Geri Al ile önceki anlık görüntüyü geri yükle
    restoreSnapshot(snapshot) {
        if (!snapshot || !snapshot.balls) return;
        for (let snap of snapshot.balls) {
            const ball = this.balls.find(b => b.number === snap.number);
            if (ball) {
                ball.pos.set(snap.x, snap.y);
                ball.vel.set(snap.vx, snap.vy);
                ball.radius = snap.radius;
                ball.inPocket = snap.inPocket;
                ball.sinking = snap.sinking;
                ball.sinkProgress = snap.sinkProgress;
                ball.spin.set(0, 0);
            }
        }
    }

    initTableGeometry() {
        const w = this.width;
        const h = this.height;
        const cornerCut = 46;
        const sideCut = 24;

        // 6 Adet Cep Tanımlaması (Corner + Middle Pockets)
        this.pockets = [
            { id: 'top-left', x: 0, y: 0, r: 30 },
            { id: 'top-mid', x: w / 2, y: -4, r: 26 },
            { id: 'top-right', x: w, y: 0, r: 30 },
            { id: 'bot-left', x: 0, y: h, r: 30 },
            { id: 'bot-mid', x: w / 2, y: h + 4, r: 26 },
            { id: 'bot-right', x: w, y: h, r: 30 }
        ];

        // 6 Ana Bant Parçası ve Çene Eğrileri (Cushion segments with inward normals)
        this.cushions = [];

        // 1. Üst Sol Bant
        this.addCushion(new Vector2D(cornerCut, 0), new Vector2D(w / 2 - sideCut, 0), new Vector2D(0, 1));
        // 2. Üst Sağ Bant
        this.addCushion(new Vector2D(w / 2 + sideCut, 0), new Vector2D(w - cornerCut, 0), new Vector2D(0, 1));
        // 3. Alt Sol Bant
        this.addCushion(new Vector2D(cornerCut, h), new Vector2D(w / 2 - sideCut, h), new Vector2D(0, -1));
        // 4. Alt Sağ Bant
        this.addCushion(new Vector2D(w / 2 + sideCut, h), new Vector2D(w - cornerCut, h), new Vector2D(0, -1));
        // 5. Sol Bant
        this.addCushion(new Vector2D(0, cornerCut), new Vector2D(0, h - cornerCut), new Vector2D(1, 0));
        // 6. Sağ Bant
        this.addCushion(new Vector2D(w, cornerCut), new Vector2D(w, h - cornerCut), new Vector2D(-1, 0));

        // Ceplerin açılı çeneleri (Pocket jaws/facings)
        // Üst sol çeneler
        this.addCushion(new Vector2D(0, cornerCut), new Vector2D(cornerCut * 0.4, cornerCut * 0.4), new Vector2D(0.707, 0.707));
        this.addCushion(new Vector2D(cornerCut * 0.4, cornerCut * 0.4), new Vector2D(cornerCut, 0), new Vector2D(0.707, 0.707));

        // Üst sağ çeneler
        this.addCushion(new Vector2D(w - cornerCut, 0), new Vector2D(w - cornerCut * 0.4, cornerCut * 0.4), new Vector2D(-0.707, 0.707));
        this.addCushion(new Vector2D(w - cornerCut * 0.4, cornerCut * 0.4), new Vector2D(w, cornerCut), new Vector2D(-0.707, 0.707));

        // Alt sol çeneler
        this.addCushion(new Vector2D(0, h - cornerCut), new Vector2D(cornerCut * 0.4, h - cornerCut * 0.4), new Vector2D(0.707, -0.707));
        this.addCushion(new Vector2D(cornerCut * 0.4, h - cornerCut * 0.4), new Vector2D(cornerCut, h), new Vector2D(0.707, -0.707));

        // Alt sağ çeneler
        this.addCushion(new Vector2D(w - cornerCut, h), new Vector2D(w - cornerCut * 0.4, h - cornerCut * 0.4), new Vector2D(-0.707, -0.707));
        this.addCushion(new Vector2D(w - cornerCut * 0.4, h - cornerCut * 0.4), new Vector2D(w, h - cornerCut), new Vector2D(-0.707, -0.707));

        // Orta cep çeneleri
        this.addCushion(new Vector2D(w / 2 - sideCut, 0), new Vector2D(w / 2 - sideCut * 0.4, -6), new Vector2D(-0.5, 0.866));
        this.addCushion(new Vector2D(w / 2 + sideCut * 0.4, -6), new Vector2D(w / 2 + sideCut, 0), new Vector2D(0.5, 0.866));
        this.addCushion(new Vector2D(w / 2 - sideCut, h), new Vector2D(w / 2 - sideCut * 0.4, h + 6), new Vector2D(-0.5, -0.866));
        this.addCushion(new Vector2D(w / 2 + sideCut * 0.4, h + 6), new Vector2D(w / 2 + sideCut, h), new Vector2D(0.5, -0.866));
    }

    addCushion(p1, p2, normal) {
        this.cushions.push(new CushionSegment(p1, p2, normal.normalize()));
    }

    // Topları standart 8-Ball Piramidine dizer
    setupBalls() {
        this.balls = [];
        const r = 13.5;
        const cueX = this.width * 0.25;
        const cueY = this.height * 0.5;

        // Beyaz Top (Index 0)
        this.cueBall = new Ball(0, cueX, cueY, r);
        this.balls.push(this.cueBall);

        // Piramit başlangıç noktası (Rack spot)
        const rackX = this.width * 0.72;
        const rackY = this.height * 0.5;

        // 15 adet topun piramit yerleşim dizilimi (Standart 8 top merkezde, köşelerde biri çizgili biri düz)
        const rackOrder = [
            1,
            9, 2,
            3, 8, 10,
            11, 4, 12, 5,
            6, 13, 7, 14, 15
        ];

        let index = 0;
        const colSpacing = r * Math.sqrt(3) + 0.4;
        const rowSpacing = r * 2 + 0.4;

        for (let col = 0; col < 5; col++) {
            const x = rackX + col * colSpacing;
            const startY = rackY - (col * rowSpacing) / 2;

            for (let row = 0; row <= col; row++) {
                const y = startY + row * rowSpacing;
                const ballNum = rackOrder[index++];
                // Çok hafif rastgele kayma ekleyerek gerçekçilik kazandır
                const jitterX = (Math.random() - 0.5) * 0.2;
                const jitterY = (Math.random() - 0.5) * 0.2;
                this.balls.push(new Ball(ballNum, x + jitterX, y + jitterY, r));
            }
        }
    }

    update(dt = 1, onPocketCallback = null) {
        // Alt adımlar (Sub-stepping) ile yüksek hızlı topların iç içe geçmesini (tunneling) engelle
        const steps = 4;
        const subDt = dt / steps;

        for (let s = 0; s < steps; s++) {
            // 1. Topları güncelle
            for (let i = 0; i < this.balls.length; i++) {
                const b = this.balls[i];
                b.update(this.friction, subDt);

                // Cebe düşme kontrolü
                if (!b.inPocket && !b.sinking) {
                    for (let p of this.pockets) {
                        const dist = b.pos.dist(p);
                        if (dist < p.r) {
                            b.sinking = true;
                            b.targetPocket = p;
                            if (window.soundManager) {
                                window.soundManager.playPocketSound();
                            }
                            if (onPocketCallback) {
                                onPocketCallback(b);
                            }
                            break;
                        }
                    }
                }
            }

            // 2. Bant çarpışmaları
            for (let i = 0; i < this.balls.length; i++) {
                const b = this.balls[i];
                if (b.inPocket || b.sinking) continue;
                this.checkCushionCollisions(b);
            }

            // 3. Top-Top çarpışmaları
            this.checkBallCollisions();
        }
    }

    checkCushionCollisions(ball) {
        for (let seg of this.cushions) {
            const v1 = seg.p1;
            const v2 = seg.p2;

            // Noktanın doğru parçasına en yakın izdüşümü
            const l2 = v1.dist(v2) ** 2;
            if (l2 === 0) continue;

            const t = Math.max(0, Math.min(1, ((ball.pos.x - v1.x) * (v2.x - v1.x) + (ball.pos.y - v1.y) * (v2.y - v1.y)) / l2));
            const proj = new Vector2D(v1.x + t * (v2.x - v1.x), v1.y + t * (v2.y - v1.y));

            const dist = ball.pos.dist(proj);
            if (dist < ball.radius) {
                // Çarpışma var!
                let normal = new Vector2D(ball.pos.x - proj.x, ball.pos.y - proj.y);
                if (normal.magSq() === 0) {
                    normal = seg.normal.copy();
                } else {
                    normal.normalize();
                }

                // Positional correction
                const overlap = ball.radius - dist;
                ball.pos.x += normal.x * overlap;
                ball.pos.y += normal.y * overlap;

                // Hız yansıması
                const velDot = ball.vel.dot(normal);
                if (velDot < 0) {
                    const speed = ball.vel.mag();
                    ball.vel.x -= (1 + this.cushionRestitution) * velDot * normal.x;
                    ball.vel.y -= (1 + this.cushionRestitution) * velDot * normal.y;

                    // Sidespin (Yan Falso / English) Bant Sekmesi Etkisi
                    if (ball.isCueBall && Math.abs(ball.spin.x) > 0.04) {
                        // Bant teğet vektörü
                        const tangent = new Vector2D(-normal.y, normal.x);
                        const englishPower = ball.spin.x * 5.2 * Math.min(1.2, speed / 8);
                        ball.vel.x += tangent.x * englishPower;
                        ball.vel.y += tangent.y * englishPower;
                        ball.spin.x *= 0.5; // Bant spini kısmen emer
                    }

                    if (window.soundManager && speed > 0.4) {
                        window.soundManager.playCushionHit(speed);
                    }
                }
            }
        }
    }

    checkBallCollisions() {
        const count = this.balls.length;
        for (let i = 0; i < count; i++) {
            const b1 = this.balls[i];
            if (b1.inPocket || b1.sinking) continue;

            for (let j = i + 1; j < count; j++) {
                const b2 = this.balls[j];
                if (b2.inPocket || b2.sinking) continue;

                const dx = b2.pos.x - b1.pos.x;
                const dy = b2.pos.y - b1.pos.y;
                const distSq = dx * dx + dy * dy;
                const minDist = b1.radius + b2.radius;

                if (distSq < minDist * minDist && distSq > 0) {
                    const dist = Math.sqrt(distSq);
                    const nx = dx / dist;
                    const ny = dy / dist;

                    // Positional correction (Çakışmayı yar yarıya it)
                    const overlap = (minDist - dist) * 0.5;
                    b1.pos.x -= nx * overlap;
                    b1.pos.y -= ny * overlap;
                    b2.pos.x += nx * overlap;
                    b2.pos.y += ny * overlap;

                    // Bağıl hız
                    const kx = b1.vel.x - b2.vel.x;
                    const ky = b1.vel.y - b2.vel.y;
                    const p = 2 * (nx * kx + ny * ky) / (b1.mass + b2.mass);

                    if (p > 0) { // Sadece birbirine doğru hareket ediyorlarsa
                        b1.vel.x -= p * b2.mass * nx * this.restitution;
                        b1.vel.y -= p * b2.mass * ny * this.restitution;
                        b2.vel.x += p * b1.mass * nx * this.restitution;
                        b2.vel.y += p * b1.mass * ny * this.restitution;

                        // --- BEYAZ TOP FALSO (SPIN) ÇARPIŞMA FİZİĞİ ---
                        const cueBall = b1.isCueBall ? b1 : (b2.isCueBall ? b2 : null);
                        const otherBall = b1.isCueBall ? b2 : b1;

                        if (cueBall && !this.firstContactBall) {
                            this.firstContactBall = otherBall;
                        }

                        if (cueBall && !cueBall.hasHitBall) {
                            cueBall.hasHitBall = true;
                            const impactPower = Math.abs(p);

                            // 1. Backspin (Geri Spin / Draw shot): Çarpışmadan sonra beyaz top geriye doğru çekilir!
                            if (cueBall.spin.y < -0.05) {
                                const drawForce = Math.abs(cueBall.spin.y) * 12.0 * Math.min(1.3, impactPower / 10);
                                cueBall.vel.x -= cueBall.shotDir.x * drawForce;
                                cueBall.vel.y -= cueBall.shotDir.y * drawForce;
                                cueBall.spin.y *= 0.15; // Çoğu spin çekme kuvvetine dönüştü
                            }
                            // 2. Topspin (İleri Spin / Follow shot): Çarpışmadan sonra hedef topun peşinden ilerler!
                            else if (cueBall.spin.y > 0.05) {
                                const followForce = cueBall.spin.y * 9.0 * Math.min(1.3, impactPower / 10);
                                cueBall.vel.x += cueBall.shotDir.x * followForce;
                                cueBall.vel.y += cueBall.shotDir.y * followForce;
                                cueBall.spin.y *= 0.2;
                            }

                            // 3. Sidespin (Yan Falso / Cut Throw etkisi)
                            if (Math.abs(cueBall.spin.x) > 0.05) {
                                const tangent = new Vector2D(-ny, nx);
                                const throwForce = cueBall.spin.x * 1.6;
                                otherBall.vel.x += tangent.x * throwForce;
                                otherBall.vel.y += tangent.y * throwForce;
                                cueBall.spin.x *= 0.4;
                            }
                        }

                        if (window.soundManager) {
                            const impactSpeed = Math.abs(p);
                            if (impactSpeed > 0.3) {
                                window.soundManager.playBallHit(impactSpeed);
                            }
                        }
                    }
                }
            }
        }
    }

    // Masadaki tüm topların durup durmadığını kontrol eder
    areAllBallsStopped() {
        for (let b of this.balls) {
            if (b.isMoving() || b.sinking) return false;
        }
        return true;
    }

    // Beyaz topu masada güvenli bir konuma yerleştir (Scratch/Faul durumunda)
    respawnCueBall() {
        const defaultX = this.width * 0.25;
        const defaultY = this.height * 0.5;
        let testX = defaultX;
        let testY = defaultY;
        let valid = false;
        let attempts = 0;

        while (!valid && attempts < 20) {
            valid = true;
            for (let b of this.balls) {
                if (b === this.cueBall || b.inPocket) continue;
                if (b.pos.dist(new Vector2D(testX, testY)) < b.radius * 2.2) {
                    valid = false;
                    testX -= 18;
                    break;
                }
            }
            attempts++;
        }

        this.cueBall.reset(testX, testY);
    }

    // --- ACEMİ MODU İÇİN GELİŞMİŞ YÖRÜNGE TAHMİNİ (RAYCAST TRAJECTORY PREDICTION) ---
    calculateAimTrajectory(aimAngle) {
        if (!this.cueBall || this.cueBall.inPocket) return null;

        const dir = new Vector2D(Math.cos(aimAngle), Math.sin(aimAngle));
        const startPos = this.cueBall.pos.copy();
        const r = this.cueBall.radius;

        let closestHit = null;
        let minT = Infinity;
        let hitTargetBall = null;

        // 1. Masadaki diğer toplarla kesişim kontrolü (Ray - Circle with radius 2R)
        for (let b of this.balls) {
            if (b === this.cueBall || b.inPocket || b.sinking) continue;

            // Beyaz topun merkezi hedef topun merkezine 2R yaklaştığı an temas gerçekleşir
            const m = startPos.copy().sub(b.pos);
            const bDot = m.dot(dir);
            const c = m.magSq() - (2 * r) * (2 * r);

            // Eğer beyaz top zaten temas noktasından uzaklaşıyorsa
            if (c > 0 && bDot > 0) continue;

            const discr = bDot * bDot - c;
            if (discr < 0) continue;

            let t = -bDot - Math.sqrt(discr);
            if (t < 0) t = 0;

            if (t > 0 && t < minT) {
                minT = t;
                hitTargetBall = b;
                closestHit = startPos.copy().add(dir.copy().mult(t));
            }
        }

        // 2. Eğer bir topa çarpacaksa:
        if (hitTargetBall && closestHit) {
            // Hedef topun merkezine doğru olan normal vektör
            const targetNormal = hitTargetBall.pos.copy().sub(closestHit).normalize();
            
            // Beyaz topun kalan teğet hareketi (90 derece sapan yön)
            // Gelen hız doğrultusu dir, normal bileşeni (dir . n) * n
            const normalComp = targetNormal.copy().mult(dir.dot(targetNormal));
            const cueDeflection = dir.copy().sub(normalComp).normalize();

            return {
                type: 'ball_hit',
                cuePath: { start: startPos, end: closestHit },
                ghostBall: closestHit,
                targetBall: hitTargetBall,
                targetPath: {
                    start: hitTargetBall.pos.copy(),
                    end: hitTargetBall.pos.copy().add(targetNormal.copy().mult(120))
                },
                cueDeflectPath: {
                    start: closestHit.copy(),
                    end: closestHit.copy().add(cueDeflection.copy().mult(70))
                }
            };
        }

        // 3. Hiçbir topa çarpmıyorsa: Masa bandına kadar olan ışını bul
        let wallHit = null;
        let wallMinT = Infinity;
        let wallNormal = null;

        for (let seg of this.cushions) {
            // Doğru parçası ile ışın kesişimi
            const p = startPos;
            const d = dir;
            const a = seg.p1;
            const b = seg.p2;

            const v1 = p.copy().sub(a);
            const v2 = b.copy().sub(a);
            const v3 = new Vector2D(-d.y, d.x);

            const dot = v2.dot(v3);
            if (Math.abs(dot) < 0.000001) continue;

            const t1 = (v2.x * v1.y - v2.y * v1.x) / dot;
            const t2 = v1.dot(v3) / dot;

            if (t1 > 0 && t2 >= 0 && t2 <= 1 && t1 < wallMinT) {
                wallMinT = t1;
                wallHit = startPos.copy().add(dir.copy().mult(t1 - r));
                wallNormal = seg.normal.copy();
            }
        }

        if (wallHit && wallNormal) {
            // Banttan yansıyan yön
            const dot = dir.dot(wallNormal);
            const reflectDir = dir.copy().sub(wallNormal.copy().mult(2 * dot)).normalize();

            return {
                type: 'cushion_hit',
                cuePath: { start: startPos, end: wallHit },
                ghostBall: wallHit,
                reflectPath: {
                    start: wallHit.copy(),
                    end: wallHit.copy().add(reflectDir.copy().mult(75))
                }
            };
        }

        return {
            type: 'straight',
            cuePath: { start: startPos, end: startPos.copy().add(dir.copy().mult(300)) }
        };
    }
}

window.PhysicsEngine = PhysicsEngine;
window.Vector2D = Vector2D;
window.Ball = Ball;
