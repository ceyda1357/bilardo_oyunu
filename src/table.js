// Masa Çizimi, Top Renderı ve Görsel Efektler
class TableRenderer {
    constructor(canvas, physics) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.physics = physics;

        // Masa Boyutları (İç Keçe: 920x460)
        this.feltWidth = physics.width;
        this.feltHeight = physics.height;
        this.frameWidth = 44; // Ahşap çerçeve kalınlığı
        this.cushionWidth = 14; // Kauçuk bant payı

        // Toplam masa koordinat boyutu
        this.totalWidth = this.feltWidth + (this.frameWidth + this.cushionWidth) * 2;
        this.totalHeight = this.feltHeight + (this.frameWidth + this.cushionWidth) * 2;

        // Keçenin masanın neresinden başladığı (offset)
        this.offsetX = this.frameWidth + this.cushionWidth;
        this.offsetY = this.frameWidth + this.cushionWidth;

        // Çuha Renk Temaları (Klasik Yeşil, Turnuva Mavisi, Asil Bordo)
        this.clothThemes = {
            green: {
                id: 'green',
                name: 'Klasik Yeşil',
                center: '#198754',
                mid: '#13653f',
                edge: '#0b4228',
                cushion: '#105a36',
                cushionStroke: '#0a3d24'
            },
            blue: {
                id: 'blue',
                name: 'Turnuva Mavisi',
                center: '#0284c7',
                mid: '#0369a1',
                edge: '#0c4a6e',
                cushion: '#075985',
                cushionStroke: '#082f49'
            },
            burgundy: {
                id: 'burgundy',
                name: 'Asil Bordo',
                center: '#b91c1c',
                mid: '#881337',
                edge: '#4c0519',
                cushion: '#701a28',
                cushionStroke: '#3f0412'
            }
        };
        this.currentTheme = this.clothThemes.green;

        // Hareket izleri (Motion Trails) havuzu
        this.motionTrails = new Map(); // ball -> [{x, y, alpha, radius}]

        this.diamonds = this.calculateDiamonds();
    }

    setClothColor(themeKey) {
        if (this.clothThemes[themeKey]) {
            this.currentTheme = this.clothThemes[themeKey];
        }
    }

    calculateDiamonds() {
        const list = [];
        const w = this.feltWidth;
        const h = this.feltHeight;
        const ox = this.offsetX;
        const oy = this.offsetY;

        // Üst ve Alt kenarlara 6'şar nişan noktası (diamonds)
        for (let i = 1; i <= 7; i++) {
            if (i === 4) continue; // Orta cep hizası
            const x = ox + (w / 8) * i;
            list.push({ x, y: oy - 26 });
            list.push({ x, y: oy + h + 26 });
        }

        // Sol ve Sağ kenarlara 3'er nişan noktası
        for (let i = 1; i <= 3; i++) {
            const y = oy + (h / 4) * i;
            list.push({ x: ox - 26, y });
            list.push({ x: ox + w + 26, y });
        }

        return list;
    }

    // Ekran DPI'sına göre canvas'ı yeniden boyutlandır
    resize(containerWidth, containerHeight) {
        const dpr = window.devicePixelRatio || 1;
        const aspect = this.totalWidth / this.totalHeight;

        let displayW = containerWidth;
        let displayH = containerWidth / aspect;

        if (displayH > containerHeight) {
            displayH = containerHeight;
            displayW = containerHeight * aspect;
        }

        this.canvas.width = displayW * dpr;
        this.canvas.height = displayH * dpr;

        this.canvas.style.width = `${displayW}px`;
        this.canvas.style.height = `${displayH}px`;

        this.scale = displayW / this.totalWidth;
        this.dpr = dpr;

        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(dpr * this.scale, dpr * this.scale);
    }

    // Ekran / Fare koordinatını masa fizik koordinatlarına çevirir
    screenToWorld(screenX, screenY) {
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = (screenX - rect.left);
        const canvasY = (screenY - rect.top);

        const totalX = canvasX / this.scale;
        const totalY = canvasY / this.scale;

        return {
            x: totalX - this.offsetX,
            y: totalY - this.offsetY
        };
    }

    draw() {
        const ctx = this.ctx;
        ctx.save();

        // 1. Dış Ahşap Kasa ve Kenarlıklar (Lüks Ceviz Ağacı Kaplama)
        this.drawTableFrame(ctx);

        // 2. İç Keçe ve Masa Tabanı (Felt Baize)
        this.drawFelt(ctx);

        // 3. Bantlar (Cushions)
        this.drawCushions(ctx);

        // 4. Cepler (Pockets)
        this.drawPockets(ctx);

        // 5. Köşe ve Orta Metal Koruyucuları (Metallic Pocket Plates)
        this.drawPocketPlates(ctx);

        // 6. Bant üzerindeki sedef nişan işaretleri (Diamonds)
        this.drawDiamonds(ctx);

        // Fizik dünyası orijinine ötele (0,0 noktası keçenin sol-üstüdür)
        ctx.translate(this.offsetX, this.offsetY);

        // 8. Hareket İzleri (Motion Trails)
        this.drawMotionTrails(ctx);

        // 9. Dinamik Yumuşak Gölgeler
        this.drawBallShadows(ctx);

        // 10. Topların Kendileri (Numaralar, 3D parıltılar, çizgiler)
        this.drawBalls(ctx);

        ctx.restore();
    }

    drawTableFrame(ctx) {
        const tw = this.totalWidth;
        const th = this.totalHeight;
        const cornerR = 24;

        // Dış gölge
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 24;
        ctx.shadowOffsetY = 12;

        // Koyu ahşap dış kasa
        const woodGrad = ctx.createLinearGradient(0, 0, 0, th);
        woodGrad.addColorStop(0, '#2a1b12');
        woodGrad.addColorStop(0.5, '#160d09');
        woodGrad.addColorStop(1, '#2a1b12');

        this.roundRect(ctx, 0, 0, tw, th, cornerR);
        ctx.fillStyle = woodGrad;
        ctx.fill();
        ctx.restore();

        // İnce altın/pirinç iç vurgu çizgisi
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
        ctx.lineWidth = 1.5;
        this.roundRect(ctx, 3, 3, tw - 6, th - 6, cornerR - 2);
        ctx.stroke();

        // Ahşap içi gölgeleme / derinlik
        ctx.strokeStyle = '#0e0805';
        ctx.lineWidth = 3;
        this.roundRect(ctx, this.frameWidth - 2, this.frameWidth - 2, tw - (this.frameWidth - 2) * 2, th - (this.frameWidth - 2) * 2, 8);
        ctx.stroke();
    }

    drawFelt(ctx) {
        const ox = this.offsetX;
        const oy = this.offsetY;
        const fw = this.feltWidth;
        const fh = this.feltHeight;

        // Keçe zemin gradyanı (Seçilen Çuha Temasına Göre)
        const feltGrad = ctx.createRadialGradient(
            ox + fw / 2, oy + fh / 2, 80,
            ox + fw / 2, oy + fh / 2, fw * 0.65
        );
        feltGrad.addColorStop(0, this.currentTheme.center);
        feltGrad.addColorStop(0.5, this.currentTheme.mid);
        feltGrad.addColorStop(1, this.currentTheme.edge);

        ctx.fillStyle = feltGrad;
        ctx.fillRect(ox, oy, fw, fh);

        // İç bant gölgesi (Keçeye düşen derinlik)
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.lineWidth = 8;
        ctx.strokeRect(ox, oy, fw, fh);
        ctx.restore();
    }

    drawCushions(ctx) {
        const ox = this.offsetX;
        const oy = this.offsetY;
        const fw = this.feltWidth;
        const fh = this.feltHeight;
        const cw = this.cushionWidth;
        const cornerCut = 46;
        const sideCut = 24;

        ctx.fillStyle = this.currentTheme.cushion;
        ctx.strokeStyle = this.currentTheme.cushionStroke;
        ctx.lineWidth = 1.5;

        // 1. Üst Sol Bant
        ctx.beginPath();
        ctx.moveTo(ox + cornerCut, oy);
        ctx.lineTo(ox + fw / 2 - sideCut, oy);
        ctx.lineTo(ox + fw / 2 - sideCut * 0.4, oy - cw);
        ctx.lineTo(ox + cornerCut * 0.4, oy - cw);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 2. Üst Sağ Bant
        ctx.beginPath();
        ctx.moveTo(ox + fw / 2 + sideCut, oy);
        ctx.lineTo(ox + fw - cornerCut, oy);
        ctx.lineTo(ox + fw - cornerCut * 0.4, oy - cw);
        ctx.lineTo(ox + fw / 2 + sideCut * 0.4, oy - cw);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 3. Alt Sol Bant
        ctx.beginPath();
        ctx.moveTo(ox + cornerCut, oy + fh);
        ctx.lineTo(ox + fw / 2 - sideCut, oy + fh);
        ctx.lineTo(ox + fw / 2 - sideCut * 0.4, oy + fh + cw);
        ctx.lineTo(ox + cornerCut * 0.4, oy + fh + cw);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 4. Alt Sağ Bant
        ctx.beginPath();
        ctx.moveTo(ox + fw / 2 + sideCut, oy + fh);
        ctx.lineTo(ox + fw - cornerCut, oy + fh);
        ctx.lineTo(ox + fw - cornerCut * 0.4, oy + fh + cw);
        ctx.lineTo(ox + fw / 2 + sideCut * 0.4, oy + fh + cw);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 5. Sol Bant
        ctx.beginPath();
        ctx.moveTo(ox, oy + cornerCut);
        ctx.lineTo(ox, oy + fh - cornerCut);
        ctx.lineTo(ox - cw, oy + fh - cornerCut * 0.4);
        ctx.lineTo(ox - cw, oy + cornerCut * 0.4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 6. Sağ Bant
        ctx.beginPath();
        ctx.moveTo(ox + fw, oy + cornerCut);
        ctx.lineTo(ox + fw, oy + fh - cornerCut);
        ctx.lineTo(ox + fw + cw, oy + fh - cornerCut * 0.4);
        ctx.lineTo(ox + fw + cw, oy + cornerCut * 0.4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    drawPockets(ctx) {
        const ox = this.offsetX;
        const oy = this.offsetY;

        for (let p of this.physics.pockets) {
            const px = ox + p.x;
            const py = oy + p.y;
            const r = p.r;

            // Cep derinlik efekti (karanlık dipsiz kuyu)
            const pocketGrad = ctx.createRadialGradient(px, py, 2, px, py, r);
            pocketGrad.addColorStop(0, '#020202');
            pocketGrad.addColorStop(0.7, '#0a0a0a');
            pocketGrad.addColorStop(1, '#18181b');

            ctx.beginPath();
            ctx.arc(px, py, r, 0, Math.PI * 2);
            ctx.fillStyle = pocketGrad;
            ctx.fill();

            // Cep içi kenar derisi çizgisi
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
            ctx.lineWidth = 2.5;
            ctx.stroke();
        }
    }

    drawPocketPlates(ctx) {
        const ox = this.offsetX;
        const oy = this.offsetY;
        const fw = this.feltWidth;
        const fh = this.feltHeight;

        // Köşe metal dökümleri (Pirinç/Altın parlaklığında köşe kaplamaları)
        const plateColor = '#b8860b';
        const plateHighlight = '#fef08a';

        const cornerPositions = [
            { x: ox - 14, y: oy - 14 },
            { x: ox + fw + 14, y: oy - 14 },
            { x: ox - 14, y: oy + fh + 14 },
            { x: ox + fw + 14, y: oy + fh + 14 }
        ];

        for (let pos of cornerPositions) {
            ctx.save();
            const grad = ctx.createRadialGradient(pos.x, pos.y, 4, pos.x, pos.y, 24);
            grad.addColorStop(0, plateHighlight);
            grad.addColorStop(0.4, plateColor);
            grad.addColorStop(1, '#523d06');

            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 22, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();

            ctx.strokeStyle = '#2d2204';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.restore();
        }

        // Orta cep metal koruyucuları
        const midPositions = [
            { x: ox + fw / 2, y: oy - 14 },
            { x: ox + fw / 2, y: oy + fh + 14 }
        ];

        for (let pos of midPositions) {
            ctx.save();
            const grad = ctx.createLinearGradient(pos.x - 20, pos.y, pos.x + 20, pos.y);
            grad.addColorStop(0, '#523d06');
            grad.addColorStop(0.5, plateHighlight);
            grad.addColorStop(1, '#523d06');

            ctx.beginPath();
            ctx.roundRect(pos.x - 18, pos.y - 10, 36, 20, 6);
            ctx.fillStyle = grad;
            ctx.fill();
            ctx.strokeStyle = '#2d2204';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.restore();
        }
    }

    drawDiamonds(ctx) {
        ctx.save();
        for (let d of this.diamonds) {
            ctx.beginPath();
            ctx.arc(d.x, d.y, 3.2, 0, Math.PI * 2);
            ctx.fillStyle = '#fef08a';
            ctx.shadowColor = 'rgba(254, 240, 138, 0.4)';
            ctx.shadowBlur = 4;
            ctx.fill();

            ctx.strokeStyle = '#854d0e';
            ctx.lineWidth = 0.8;
            ctx.stroke();
        }
        ctx.restore();
    }

    drawTableMarkings(ctx) {
        const headX = this.feltWidth * 0.25;

        // Başlangıç çizgisi (Head string / Baulk line)
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 4]);

        ctx.beginPath();
        ctx.moveTo(headX, 0);
        ctx.lineTo(headX, this.feltHeight);
        ctx.stroke();

        ctx.setLineDash([]); // Reset line dash

        // Başlangıç noktası (Head spot)
        ctx.beginPath();
        ctx.arc(headX, this.feltHeight / 2, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.fill();

        // Piramit açılış noktası (Foot spot)
        const footX = this.feltWidth * 0.72;
        ctx.beginPath();
        ctx.arc(footX, this.feltHeight / 2, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.fill();

        ctx.restore();
    }

    drawMotionTrails(ctx) {
        ctx.save();
        for (let b of this.physics.balls) {
            if (b.inPocket || b.radius <= 0) continue;

            const speed = b.vel.mag();
            if (!this.motionTrails.has(b)) {
                this.motionTrails.set(b, []);
            }
            const trail = this.motionTrails.get(b);

            // Eğer top yeterince hızlıysa iz kuyruğuna ekle
            if (speed > 1.8) {
                trail.push({ x: b.pos.x, y: b.pos.y, radius: b.radius, color: b.color || '#ffffff' });
                if (trail.length > 5) trail.shift();
            } else if (trail.length > 0) {
                trail.shift(); // Yavaşlayınca iz sönümlenir
            }

            // İzi çiz (Eskiden yeniye doğru azalan opaklık)
            for (let i = 0; i < trail.length; i++) {
                const pt = trail[i];
                const alpha = ((i + 1) / trail.length) * 0.28;
                const scale = 0.6 + 0.4 * ((i + 1) / trail.length);

                ctx.beginPath();
                ctx.arc(pt.x, pt.y, pt.radius * scale, 0, Math.PI * 2);
                ctx.fillStyle = pt.color;
                ctx.globalAlpha = alpha;
                ctx.shadowColor = pt.color;
                ctx.shadowBlur = 6;
                ctx.fill();
            }
            ctx.globalAlpha = 1.0;
            ctx.shadowBlur = 0;
        }
        ctx.restore();
    }

    drawBallShadows(ctx) {
        ctx.save();
        // Işık kaynağı masanın tavan lambası (hafif yukarı-sol)
        const lightX = this.feltWidth * 0.45;
        const lightY = -140;

        for (let b of this.physics.balls) {
            if (b.inPocket || b.radius <= 0) continue;

            const r = b.radius;
            // Işıktan uzaklaşma doğrultusunda dinamik gölge ofseti
            const ldx = b.pos.x - lightX;
            const ldy = b.pos.y - lightY;
            const ldist = Math.sqrt(ldx * ldx + ldy * ldy) || 1;

            const shadowOffsetX = (ldx / ldist) * 4.8;
            const shadowOffsetY = (ldy / ldist) * 5.8;

            const sx = b.pos.x + shadowOffsetX;
            const sy = b.pos.y + shadowOffsetY;

            // Katmanlı ve yumuşak radyal gölge (Derinlik hissi)
            const shadowGrad = ctx.createRadialGradient(
                sx, sy, r * 0.15,
                sx, sy, r * 1.3
            );
            const alpha = 0.45 * (1 - (b.sinkProgress || 0));
            shadowGrad.addColorStop(0, `rgba(0, 0, 0, ${alpha * 1.25})`);
            shadowGrad.addColorStop(0.5, `rgba(0, 0, 0, ${alpha * 0.55})`);
            shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.beginPath();
            ctx.arc(sx, sy, r * 1.3, 0, Math.PI * 2);
            ctx.fillStyle = shadowGrad;
            ctx.fill();
        }
        ctx.restore();
    }

    drawBalls(ctx) {
        for (let b of this.physics.balls) {
            if (b.inPocket || b.radius <= 0.1) continue;
            this.drawSingleBall(ctx, b);
        }
    }

    drawSingleBall(ctx, ball) {
        const x = ball.pos.x;
        const y = ball.pos.y;
        const r = ball.radius;

        ctx.save();

        if (ball.isCueBall) {
            // --- BEYAZ TOP (CUE BALL) ---
            const cueGrad = ctx.createRadialGradient(
                x - r * 0.35, y - r * 0.35, r * 0.1,
                x, y, r
            );
            cueGrad.addColorStop(0, '#ffffff');
            cueGrad.addColorStop(0.65, '#f1f5f9');
            cueGrad.addColorStop(1, '#94a3b8');

            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = cueGrad;
            ctx.fill();

            // Beyaz top üzeri minik kırmızı nişan noktası (Seçilen Spin / Falso Konumu)
            const dotOffsetX = (ball.spin ? ball.spin.x : 0) * (r * 0.62);
            const dotOffsetY = -(ball.spin ? ball.spin.y : 0) * (r * 0.62); // Topspin yukarı, backspin aşağı
            ctx.beginPath();
            ctx.arc(x + dotOffsetX, y + dotOffsetY, 2.2, 0, Math.PI * 2);
            ctx.fillStyle = '#ef4444';
            ctx.shadowColor = 'rgba(239, 68, 68, 0.8)';
            ctx.shadowBlur = 3;
            ctx.fill();
            ctx.shadowBlur = 0;

        } else if (ball.stripe) {
            // --- ÇİZGİLİ TOP (STRIPED BALL - 9 ila 15) ---
            // 1. Önce beyaz taban
            const baseGrad = ctx.createRadialGradient(
                x - r * 0.3, y - r * 0.3, r * 0.1,
                x, y, r
            );
            baseGrad.addColorStop(0, '#ffffff');
            baseGrad.addColorStop(0.7, '#f8fafc');
            baseGrad.addColorStop(1, '#cbd5e1');

            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = baseGrad;
            ctx.fill();

            // 2. Renkli Orta Şerit (Açıya göre döndürülmüş)
            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.clip(); // Topun dışına taşmasın

            ctx.translate(x, y);
            ctx.rotate(ball.rotationAngle || 0);

            // Kalın renkli şerit
            ctx.fillStyle = ball.color;
            ctx.fillRect(-r, -r * 0.52, r * 2, r * 1.04);

            // Şerit üzerine beyaz numara çemberi
            ctx.beginPath();
            ctx.arc(0, 0, r * 0.44, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();

            // Numara metni
            ctx.fillStyle = '#0f172a';
            ctx.font = `bold ${Math.round(r * 0.56)}px Outfit, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(ball.number, 0, 0.5);

            ctx.restore();

        } else {
            // --- DÜZ RENKLİ TOP (SOLID BALL - 1 ila 8) ---
            const ballGrad = ctx.createRadialGradient(
                x - r * 0.35, y - r * 0.35, r * 0.1,
                x, y, r
            );
            ballGrad.addColorStop(0, this.lightenColor(ball.color, 40));
            ballGrad.addColorStop(0.5, ball.color);
            ballGrad.addColorStop(1, this.darkenColor(ball.color, 40));

            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = ballGrad;
            ctx.fill();

            // Ortadaki beyaz numara çemberi
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(ball.rotationAngle || 0);

            ctx.beginPath();
            ctx.arc(0, 0, r * 0.44, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();

            // Numara metni
            ctx.fillStyle = '#0f172a';
            ctx.font = `bold ${Math.round(r * 0.56)}px Outfit, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(ball.number, 0, 0.5);
            ctx.restore();
        }

        // 3D Küresel Işık Yansıması (Specular Highlight)
        const shineGrad = ctx.createRadialGradient(
            x - r * 0.38, y - r * 0.38, 1,
            x - r * 0.38, y - r * 0.38, r * 0.5
        );
        shineGrad.addColorStop(0, 'rgba(255, 255, 255, 0.65)');
        shineGrad.addColorStop(0.4, 'rgba(255, 255, 255, 0.15)');
        shineGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = shineGrad;
        ctx.fill();

        ctx.restore();
    }

    // Renk açma/koyulaştırma yardımcı fonksiyonları
    lightenColor(hex, percent) {
        return this.adjustColor(hex, percent);
    }

    darkenColor(hex, percent) {
        return this.adjustColor(hex, -percent);
    }

    adjustColor(hex, percent) {
        let num = parseInt(hex.replace('#', ''), 16);
        let amt = Math.round(2.55 * percent);
        let R = (num >> 16) + amt;
        let G = (num >> 8 & 0x00FF) + amt;
        let B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
}

window.TableRenderer = TableRenderer;
