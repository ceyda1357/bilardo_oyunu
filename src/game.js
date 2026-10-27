// Ana Oyun Mantığı, Durum Yönetimi ve Giriş Kontrolleri
class BilliardsGame {
    constructor() {
        this.canvas = document.getElementById('billiardsCanvas');
        this.container = document.getElementById('canvasContainer');

        // Oyun Ayarları
        this.difficulty = 'beginner'; // 'beginner' | 'master'
        this.cueType = 'classic'; // 'classic' | 'carbon' | 'gravity'

        // Durum Değişkenleri
        this.state = 'MENU'; // 'MENU' | 'AIMING' | 'CHARGING' | 'STRIKING' | 'BALLS_ROLLING'
        this.aimAngle = 0; // Radyan cinsinden nişan açısı
        this.power = 0; // 0.0 - 1.0 arası güç
        this.maxPower = 28.0; // Maksimum atış hız büyüklüğü
        this.shotCount = 0;
        this.pottedBalls = [];
        this.isDraggingPowerBar = false;
        this.isPullingCue = false;
        this.strikeAnimation = 0; // Vuruş animasyon ofseti

        // Falso (Spin) Seçimi: x: [-1 (sol), +1 (sağ)], y: [-1 (geri), +1 (ileri)]
        this.selectedSpin = { x: 0, y: 0 };
        this.isDraggingSpin = false;

        // Oyun Modu ve Çuha Renk Ayarları
        this.gameMode = '8ball'; // '8ball' | 'practice'
        this.clothTheme = 'green';

        // 8-Top Yerel 2 Oyuncu Modu (Pass & Play)
        this.currentPlayer = 1; // 1 | 2
        this.playerGroups = { 1: null, 2: null }; // null: Açık masa, 'solids' (1-7), 'stripes' (9-15)
        this.ballInHand = false; // Beyaz top serbestçe taşınabilir mi (Faul sonrası)
        this.ballsPocketedThisTurn = [];

        // Serbest Antrenman ve Sürükleme Durumu
        this.isDraggingBall = false;
        this.draggedBall = null;
        this.historyStack = []; // Undo geçmişi

        // Tebeşir (Chalk) Mekaniği (3 vuruş hakkı, sonra miscue)
        this.chalkCount = 3;

        // Bileşenleri başlat
        this.physics = new PhysicsEngine(920, 460);
        this.table = new TableRenderer(this.canvas, this.physics);
        this.cueRenderer = new CueRenderer(this.table.ctx);

        // Ekran ve UI Olaylarını Bağla
        this.initEventListeners();
        this.initUI();
        this.initSpinSelector();

        // Boyutlandırma
        this.handleResize();
        window.addEventListener('resize', () => this.handleResize());

        // Başlangıç animasyon döngüsü
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    initUI() {
        // Menü Butonları
        const startBtn = document.getElementById('startBtn');
        const resetBtn = document.getElementById('resetBtn');
        const menuBtn = document.getElementById('menuBtn');
        const soundBtn = document.getElementById('soundBtn');

        // Zorluk Seçim Butonları
        const diffBtns = document.querySelectorAll('.diff-card');
        diffBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                diffBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.difficulty = btn.dataset.diff;
                this.updateHUD();
            });
        });

        // Istaka Seçim Butonları
        const cueCards = document.querySelectorAll('.cue-card');
        cueCards.forEach(card => {
            card.addEventListener('click', () => {
                cueCards.forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                this.cueType = card.dataset.cue;
                this.cueRenderer.setCueType(this.cueType);
                this.updateHUD();
            });
        });

        // Oyun Modu Seçim Butonları (8-Top vs Antrenman)
        const modeCards = document.querySelectorAll('.mode-card');
        modeCards.forEach(card => {
            card.addEventListener('click', () => {
                modeCards.forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                this.gameMode = card.dataset.mode;
                this.updateHUD();
            });
        });

        // Çuha Rengi Seçiciler (Menü ve HUD)
        const clothChoices = document.querySelectorAll('.cloth-choice');
        clothChoices.forEach(choice => {
            choice.addEventListener('click', () => {
                clothChoices.forEach(c => c.classList.remove('active'));
                choice.classList.add('active');
                this.setClothColor(choice.dataset.cloth);
            });
        });

        const clothDots = document.querySelectorAll('.cloth-dot');
        clothDots.forEach(dot => {
            dot.addEventListener('click', () => {
                this.setClothColor(dot.dataset.color);
            });
        });

        // Tebeşir Butonu
        const chalkBtn = document.getElementById('chalkBtn');
        if (chalkBtn) {
            chalkBtn.addEventListener('click', () => {
                this.applyChalk();
            });
        }

        // Vuruşu Geri Al (Undo) Butonu
        const undoBtn = document.getElementById('undoBtn');
        if (undoBtn) {
            undoBtn.addEventListener('click', () => {
                this.undoLastShot();
            });
        }

        startBtn.addEventListener('click', () => {
            if (window.soundManager) window.soundManager.init();
            this.startGame();
        });

        resetBtn.addEventListener('click', () => {
            this.resetTable();
        });

        menuBtn.addEventListener('click', () => {
            this.showMenu();
        });

        soundBtn.addEventListener('click', () => {
            if (window.soundManager) {
                const isMuted = window.soundManager.toggleMute();
                soundBtn.innerHTML = isMuted ? '🔇 Ses: Kapalı' : '🔊 Ses: Açık';
                soundBtn.classList.toggle('muted', isMuted);
            }
        });

        // Modal Kapatma
        const modalBtn = document.getElementById('modalBtn');
        if (modalBtn) {
            modalBtn.addEventListener('click', () => {
                document.getElementById('endGameModal').classList.add('hidden');
                this.resetTable();
            });
        }
    }

    setClothColor(colorKey) {
        this.clothTheme = colorKey;
        this.table.setClothColor(colorKey);

        // UI eşitleme
        document.querySelectorAll('.cloth-dot').forEach(d => {
            d.classList.toggle('active', d.dataset.color === colorKey);
        });
        document.querySelectorAll('.cloth-choice').forEach(c => {
            c.classList.toggle('active', c.dataset.cloth === colorKey);
        });
    }

    applyChalk() {
        this.chalkCount = 3;
        this.updateChalkUI();
        if (window.soundManager) window.soundManager.playChalkSound();
        this.showToast('🟦 Istaka tebeşirlendi! Vuruş hassasiyeti %100.', 'info');
    }

    updateChalkUI() {
        const p1 = document.getElementById('chalkPip1');
        const p2 = document.getElementById('chalkPip2');
        const p3 = document.getElementById('chalkPip3');

        if (!p1 || !p2 || !p3) return;

        p1.className = 'chalk-pip';
        p2.className = 'chalk-pip';
        p3.className = 'chalk-pip';

        if (this.chalkCount >= 1) p1.classList.add('active');
        if (this.chalkCount >= 2) p2.classList.add('active');
        if (this.chalkCount >= 3) p3.classList.add('active');

        if (this.chalkCount === 0) {
            p1.classList.add('danger');
            p2.classList.add('danger');
            p3.classList.add('danger');
        }
    }

    saveHistorySnapshot() {
        const snap = {
            physics: this.physics.getSnapshot(),
            currentPlayer: this.currentPlayer,
            playerGroups: { ...this.playerGroups },
            shotCount: this.shotCount,
            pottedBalls: [...this.pottedBalls],
            chalkCount: this.chalkCount,
            ballInHand: this.ballInHand
        };
        this.historyStack.push(snap);
        if (this.historyStack.length > 15) this.historyStack.shift();
    }

    undoLastShot() {
        if (this.state === 'BALLS_ROLLING') {
            this.showToast('⚠️ Toplar hareket halindeyken geri alınamaz.', 'foul');
            return;
        }
        if (this.historyStack.length === 0) {
            this.showToast('ℹ️ Geri alınacak önceki vuruş bulunamadı.', 'info');
            return;
        }

        const last = this.historyStack.pop();
        this.physics.restoreSnapshot(last.physics);
        this.currentPlayer = last.currentPlayer;
        this.playerGroups = { ...last.playerGroups };
        this.shotCount = last.shotCount;
        this.pottedBalls = [...last.pottedBalls];
        this.chalkCount = last.chalkCount;
        this.ballInHand = last.ballInHand;

        this.updateChalkUI();
        this.updateHUD();
        this.state = 'AIMING';
        this.showToast('↶ Vuruş geri alındı!', 'info');
    }

    initSpinSelector() {
        const spinTarget = document.getElementById('spinBallTarget');
        const spinMarker = document.getElementById('spinMarker');
        const spinText = document.getElementById('spinTypeText');
        const resetBtn = document.getElementById('spinResetBtn');

        if (!spinTarget || !spinMarker) return;

        const updateSpinFromPointer = (clientX, clientY) => {
            const rect = spinTarget.getBoundingClientRect();
            const radius = rect.width / 2;
            const cx = rect.left + radius;
            const cy = rect.top + radius;

            let dx = (clientX - cx) / radius;
            let dy = (clientY - cy) / radius;

            const dist = Math.sqrt(dx * dx + dy * dy);
            const maxRadius = 0.82; // Topun dışına taşmasın
            if (dist > maxRadius) {
                dx = (dx / dist) * maxRadius;
                dy = (dy / dist) * maxRadius;
            }

            // x: [-1 (sol), +1 (sağ)], y: [-1 (geri spin/aşağı), +1 (ileri spin/yukarı)]
            this.selectedSpin.x = dx;
            this.selectedSpin.y = -dy; // Ekranda yukarı topspin (+y), aşağı backspin (-y)

            // UI pozisyonu
            spinMarker.style.left = `${50 + (dx * 50)}%`;
            spinMarker.style.top = `${50 + (dy * 50)}%`;

            // Beyaz topun üzerindeki spin noktasını da anında güncelle
            if (this.physics.cueBall) {
                this.physics.cueBall.spin.x = this.selectedSpin.x;
                this.physics.cueBall.spin.y = this.selectedSpin.y;
            }

            // Metin açıklaması
            this.updateSpinText(spinText);
        };

        const onStart = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.isDraggingSpin = true;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            updateSpinFromPointer(clientX, clientY);
        };

        const onMove = (e) => {
            if (!this.isDraggingSpin) return;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            updateSpinFromPointer(clientX, clientY);
        };

        const onEnd = () => {
            this.isDraggingSpin = false;
        };

        spinTarget.addEventListener('mousedown', onStart);
        spinTarget.addEventListener('touchstart', onStart, { passive: false });

        window.addEventListener('mousemove', onMove);
        window.addEventListener('touchmove', onMove, { passive: false });

        window.addEventListener('mouseup', onEnd);
        window.addEventListener('touchend', onEnd);

        if (resetBtn) {
            resetBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.resetSpin();
            });
        }
    }

    resetSpin() {
        this.selectedSpin = { x: 0, y: 0 };
        const spinMarker = document.getElementById('spinMarker');
        const spinText = document.getElementById('spinTypeText');
        if (spinMarker) {
            spinMarker.style.left = '50%';
            spinMarker.style.top = '50%';
        }
        if (spinText) spinText.innerText = 'Merkez';
        if (this.physics.cueBall) {
            this.physics.cueBall.spin.set(0, 0);
        }
    }

    updateSpinText(textEl) {
        if (!textEl) return;
        const sx = this.selectedSpin.x;
        const sy = this.selectedSpin.y;

        if (Math.abs(sx) < 0.18 && Math.abs(sy) < 0.18) {
            textEl.innerText = 'Merkez (Düz)';
            return;
        }

        let vertical = '';
        if (sy > 0.18) vertical = 'İleri Spin';
        else if (sy < -0.18) vertical = 'Geri Spin';

        let horizontal = '';
        if (sx > 0.18) horizontal = 'Sağ Falso';
        else if (sx < -0.18) horizontal = 'Sol Falso';

        if (vertical && horizontal) {
            textEl.innerText = `${vertical} + ${horizontal}`;
        } else {
            textEl.innerText = vertical || horizontal;
        }
    }

    initEventListeners() {
        // --- FARE VE DOKUNMATİK ETKİLEŞİMLERİ ---
        const onPointerDown = (clientX, clientY, isTouch = false) => {
            if (this.state !== 'AIMING' && this.state !== 'CHARGING') return;
            if (window.soundManager) window.soundManager.init();

            const worldPos = this.table.screenToWorld(clientX, clientY);
            const cueBall = this.physics.cueBall;
            if (!cueBall) return;

            // 1. Top Elde (Ball-in-Hand) veya Antrenman Modunda Topu Serbest Sürükleme Kontrolü
            if (this.state === 'AIMING') {
                if (this.ballInHand) {
                    this.draggedBall = cueBall;
                    this.isDraggingBall = true;
                    this.physics.moveBall(this.draggedBall, worldPos.x, worldPos.y);
                    return;
                } else if (this.gameMode === 'practice') {
                    const clickedBall = this.physics.findBallAt(worldPos.x, worldPos.y, 10);
                    if (clickedBall) {
                        this.draggedBall = clickedBall;
                        this.isDraggingBall = true;
                        return;
                    }
                }
            }

            // Normal Nişan Alma / Istaka Çekme
            this.isPullingCue = true;
            this.dragStartPos = worldPos;
            this.updateAimAngle(worldPos);
        };

        const onPointerMove = (clientX, clientY) => {
            const worldPos = this.table.screenToWorld(clientX, clientY);

            // Eğer top sürükleniyorsa konumunu güncelle
            if (this.isDraggingBall && this.draggedBall) {
                this.physics.moveBall(this.draggedBall, worldPos.x, worldPos.y);
                return;
            }

            if (this.state === 'AIMING') {
                this.updateAimAngle(worldPos);
            } else if (this.state === 'CHARGING' || this.isPullingCue) {
                this.updatePullPower(worldPos);
            }
        };

        const onPointerUp = () => {
            // Top sürükleme bitti
            if (this.isDraggingBall) {
                if (this.ballInHand && this.draggedBall === this.physics.cueBall) {
                    this.ballInHand = false;
                    const alertEl = document.getElementById('ballInHandAlert');
                    if (alertEl) alertEl.classList.add('hidden');
                    this.showToast('✅ Beyaz top yerleştirildi. Atış yapabilirsiniz!', 'info');
                }
                this.isDraggingBall = false;
                this.draggedBall = null;
                return;
            }

            if (this.isPullingCue || this.state === 'CHARGING') {
                if (this.power > 0.05) {
                    this.executeShot();
                } else {
                    this.power = 0;
                    this.state = 'AIMING';
                    this.updatePowerUI();
                }
                this.isPullingCue = false;
            }
        };

        // Canvas Olayları (Fare)
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) onPointerDown(e.clientX, e.clientY);
        });

        window.addEventListener('mousemove', (e) => {
            onPointerMove(e.clientX, e.clientY);
        });

        window.addEventListener('mouseup', () => {
            onPointerUp();
        });

        // Dokunmatik Olaylar (Mobil)
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (e.touches.length > 0) {
                onPointerDown(e.touches[0].clientX, e.touches[0].clientY, true);
            }
        }, { passive: false });

        window.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: false });

        window.addEventListener('touchend', (e) => {
            onPointerUp();
        });

        // --- YAN DİKEY GÜÇ ÇUBUĞU (POWER BAR) KONTROLÜ ---
        const powerBarTrack = document.getElementById('powerBarTrack');
        const powerBarFill = document.getElementById('powerBarFill');
        const powerKnob = document.getElementById('powerKnob');

        const handlePowerBarDrag = (clientY) => {
            if (this.state !== 'AIMING' && this.state !== 'CHARGING') return;
            const rect = powerBarTrack.getBoundingClientRect();
            const relativeY = clientY - rect.top;
            const ratio = Math.max(0, Math.min(1, relativeY / rect.height));

            if (this.cueRenderer.currentCue.smoothControl) {
                this.power = Math.pow(ratio, 1.3);
            } else {
                this.power = ratio;
            }

            this.state = this.power > 0 ? 'CHARGING' : 'AIMING';
            this.updatePowerUI();
        };

        const onPowerStart = (e) => {
            e.preventDefault();
            this.isDraggingPowerBar = true;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            handlePowerBarDrag(clientY);
        };

        powerBarTrack.addEventListener('mousedown', onPowerStart);
        powerBarTrack.addEventListener('touchstart', onPowerStart, { passive: false });

        window.addEventListener('mousemove', (e) => {
            if (this.isDraggingPowerBar) {
                handlePowerBarDrag(e.clientY);
            }
        });

        window.addEventListener('touchmove', (e) => {
            if (this.isDraggingPowerBar && e.touches.length > 0) {
                handlePowerBarDrag(e.touches[0].clientY);
            }
        }, { passive: false });

        window.addEventListener('mouseup', () => {
            if (this.isDraggingPowerBar) {
                this.isDraggingPowerBar = false;
                if (this.power > 0.05) {
                    this.executeShot();
                } else {
                    this.power = 0;
                    this.state = 'AIMING';
                    this.updatePowerUI();
                }
            }
        });

        window.addEventListener('touchend', () => {
            if (this.isDraggingPowerBar) {
                this.isDraggingPowerBar = false;
                if (this.power > 0.05) {
                    this.executeShot();
                } else {
                    this.power = 0;
                    this.state = 'AIMING';
                    this.updatePowerUI();
                }
            }
        });

        // --- YENİ MEKANİK: BOŞLUK TUŞU & EKRANDAKİ "VUR / GÜÇ" BUTONU İLE BASILI TUTUP BIRAKMA ---
        this.isKeyCharging = false;
        this.isBtnCharging = false;
        this.chargeDirection = 1; // Güç 1'e ulaşınca geri dönme veya dolma

        const strikeBtn = document.getElementById('strikeBtn');

        const startCharging = () => {
            if (this.state !== 'AIMING' && this.state !== 'CHARGING') return;
            if (window.soundManager) window.soundManager.init();
            this.state = 'CHARGING';
            if (strikeBtn) strikeBtn.classList.add('charging');
        };

        const stopChargingAndShoot = () => {
            if (this.state !== 'CHARGING') return;
            if (strikeBtn) strikeBtn.classList.remove('charging');

            if (this.power > 0.05) {
                this.executeShot();
            } else {
                this.power = 0;
                this.state = 'AIMING';
                this.updatePowerUI();
            }
        };

        // 1. Masaüstünde Boşluk (Spacebar) Tuşu
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !e.repeat) {
                if (this.state === 'AIMING' || this.state === 'CHARGING') {
                    e.preventDefault();
                    this.isKeyCharging = true;
                    startCharging();
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                if (this.isKeyCharging) {
                    e.preventDefault();
                    this.isKeyCharging = false;
                    stopChargingAndShoot();
                }
            }
        });

        // 2. Mobilde ve Ekranda "VUR / GÜÇ" Butonu
        if (strikeBtn) {
            const onBtnDown = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.isBtnCharging = true;
                startCharging();
            };

            const onBtnUp = (e) => {
                if (this.isBtnCharging) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.isBtnCharging = false;
                    stopChargingAndShoot();
                }
            };

            strikeBtn.addEventListener('mousedown', onBtnDown);
            strikeBtn.addEventListener('touchstart', onBtnDown, { passive: false });

            window.addEventListener('mouseup', onBtnUp);
            window.addEventListener('touchend', onBtnUp);
            window.addEventListener('touchcancel', onBtnUp);
        }
    }

    updateAimAngle(targetPos) {
        const cueBall = this.physics.cueBall;
        if (!cueBall) return;

        // Beyaz toptan hedef konuma olan vektörün açısı
        const dx = targetPos.x - cueBall.pos.x;
        const dy = targetPos.y - cueBall.pos.y;
        this.aimAngle = Math.atan2(dy, dx);
    }

    updatePullPower(currentPos) {
        const cueBall = this.physics.cueBall;
        if (!cueBall) return;

        // Vurma doğrultusunun tersine doğru olan çekme mesafesi
        const cueDirX = Math.cos(this.aimAngle);
        const cueDirY = Math.sin(this.aimAngle);

        const dx = currentPos.x - cueBall.pos.x;
        const dy = currentPos.y - cueBall.pos.y;

        // Projeksiyon: Istaka doğrultusunun tersine çekilme miktarı
        const pullDist = -(dx * cueDirX + dy * cueDirY);

        if (pullDist > 5) {
            this.state = 'CHARGING';
            let ratio = Math.min(1.0, (pullDist - 5) / 160);

            if (this.cueRenderer.currentCue.smoothControl) {
                this.power = Math.pow(ratio, 1.25);
            } else {
                this.power = ratio;
            }
        } else {
            this.power = 0;
            this.state = 'AIMING';
        }

        this.updatePowerUI();
    }

    updatePowerUI() {
        const fill = document.getElementById('powerBarFill');
        const knob = document.getElementById('powerKnob');
        const strikePct = document.getElementById('strikePowerPct');

        const pct = Math.round(this.power * 100);
        if (fill) fill.style.height = `${pct}%`;
        if (knob) knob.style.top = `${pct}%`;
        if (strikePct) strikePct.innerText = `${pct}%`;
    }

    executeShot() {
        if (this.power <= 0.01) return;

        const cueBall = this.physics.cueBall;
        if (!cueBall || cueBall.inPocket) return;

        // Önceki durumu geçmişe kaydet (Undo / Geri Al için)
        this.saveHistorySnapshot();

        // Tebeşir (Chalk) ve Miscue Kontrolü
        let effectivePower = this.power;
        let effectiveAngle = this.aimAngle;

        if (this.chalkCount <= 0) {
            // Tebeşir bitmiş: Miscue tetiklenir!
            if (window.soundManager) window.soundManager.playMiscueSound();
            this.showToast('💨 MISCUE! Istaka kaydı, tebeşir sürmeyi unuttunuz!', 'foul');
            effectivePower *= 0.28; // Ciddi güç kaybı
            effectiveAngle += (Math.random() - 0.5) * 0.45; // Rastgele açı sapması
            this.chalkCount = 1; // Bir defalık kısmi toparlanma
        } else {
            this.chalkCount--;
        }
        this.updateChalkUI();

        this.state = 'STRIKING';
        const cue = this.cueRenderer.currentCue;
        this.physics.firstContactBall = null;
        this.ballsPocketedThisTurn = [];

        // Vuruş animasyonu: ıstaka topa hızlıca çarpar
        this.strikeAnimation = 0;
        const strikeInterval = setInterval(() => {
            this.strikeAnimation += 18;
            if (this.strikeAnimation >= 75) {
                clearInterval(strikeInterval);
                this.strikeAnimation = 0;

                // Vuruş gücünü hesapla
                const speed = effectivePower * this.maxPower * cue.powerMultiplier;
                cueBall.vel.x = Math.cos(effectiveAngle) * speed;
                cueBall.vel.y = Math.sin(effectiveAngle) * speed;

                // Falso (Spin) ve Vuruş Yönünü Beyaz Topa Aktar
                cueBall.shotDir.set(Math.cos(effectiveAngle), Math.sin(effectiveAngle));
                cueBall.spin.set(this.selectedSpin.x, this.selectedSpin.y);
                cueBall.hasHitBall = false;

                // Ses ve parçacıklar
                if (window.soundManager) {
                    window.soundManager.playCueHit(effectivePower, cue.id);
                }
                this.cueRenderer.spawnStrikeParticles(cueBall.pos.x, cueBall.pos.y, effectiveAngle, effectivePower);

                // Durum geçişi
                this.shotCount++;
                this.power = 0;
                this.chargeDirection = 1;
                this.updatePowerUI();
                this.state = 'BALLS_ROLLING';
                this.updateHUD();
            }
        }, 16);
    }

    onBallPocketed(ball) {
        this.ballsPocketedThisTurn.push(ball);

        if (ball.isCueBall) {
            this.showToast('⚠️ Beyaz top cebe girdi!', 'foul');
            if (window.soundManager) window.soundManager.playFoulSound();
        } else if (ball.number === 8) {
            this.showToast('🎱 8 Numaralı siyah top girdi!', 'pot');
        } else {
            this.pottedBalls.push(ball.number);
            const typeStr = ball.number < 8 ? 'Düz' : 'Çizgili';
            this.showToast(`✨ #${ball.number} (${typeStr}) girdi!`, 'pot');
        }
        this.updateHUD();
    }

    handleTurnEnd() {
        this.state = 'AIMING';

        // --- ANTRENMAN MODU ---
        if (this.gameMode === 'practice') {
            if (this.physics.cueBall.inPocket) {
                this.physics.respawnCueBall();
            }
            this.ballsPocketedThisTurn = [];
            this.updateHUD();
            return;
        }

        // --- 8-TOP YEREL 2 OYUNCU KURALLARI ---
        const activeP = this.currentPlayer;
        const otherP = activeP === 1 ? 2 : 1;
        const activeGroup = this.playerGroups[activeP]; // null, 'solids', 'stripes'

        const cuePocketed = this.ballsPocketedThisTurn.some(b => b.isCueBall);
        const eightPocketed = this.ballsPocketedThisTurn.some(b => b.number === 8);
        const normalPocketed = this.ballsPocketedThisTurn.filter(b => !b.isCueBall && b.number !== 8);

        let isFoul = false;
        let foulReason = '';

        // 1. Beyaz top cebe girdi mi (Scratch)?
        if (cuePocketed) {
            isFoul = true;
            foulReason = 'Beyaz top cebe düştü (Scratch).';
        }

        // 2. Beyaz top hiçbir topa temas etmedi mi?
        if (!cuePocketed && !this.physics.firstContactBall) {
            isFoul = true;
            foulReason = 'Beyaz top hiçbir hedef topa temas etmedi.';
        }

        // 3. İlk temas yasal mı?
        if (!isFoul && this.physics.firstContactBall) {
            const firstNum = this.physics.firstContactBall.number;
            if (activeGroup === null) {
                // Açık masa: 8 topa İLK temas fauldür
                if (firstNum === 8) {
                    isFoul = true;
                    foulReason = 'Açık masada ilk temas 8 numaralı topa yapılamaz.';
                }
            } else {
                // Kendi grubundaki kalan toplar
                const myRemaining = this.physics.balls.filter(b => !b.isCueBall && b.number !== 8 && !b.inPocket &&
                    ((activeGroup === 'solids' && b.number < 8) || (activeGroup === 'stripes' && b.number > 8))
                ).length;

                if (myRemaining > 0) {
                    const hitSolids = firstNum < 8;
                    const isMyBall = (activeGroup === 'solids' && hitSolids) || (activeGroup === 'stripes' && !hitSolids);
                    if (!isMyBall) {
                        isFoul = true;
                        foulReason = `Hatalı ilk temas! Kendi grubunuza (${activeGroup === 'solids' ? 'Düzler' : 'Çizgililer'}) vurmalısınız.`;
                    }
                } else {
                    if (firstNum !== 8) {
                        isFoul = true;
                        foulReason = 'Kendi toplarınız bitti, ilk temas 8 numaralı topa olmalıdır.';
                    }
                }
            }
        }

        // 4. 8 NUMARALI SİYAH TOP KONTROLÜ (KAZANMA / KAYBETME)
        if (eightPocketed) {
            const myRemaining = activeGroup ? this.physics.balls.filter(b => !b.isCueBall && b.number !== 8 && !b.inPocket &&
                ((activeGroup === 'solids' && b.number < 8) || (activeGroup === 'stripes' && b.number > 8))
            ).length : 7;

            if (myRemaining > 0) {
                this.endGame(false, `Oyuncu ${activeP} kendi toplarını bitirmeden 8 numarayı soktu! Oyuncu ${otherP} KAZANDI! 🏆`);
                return;
            } else if (cuePocketed) {
                this.endGame(false, `Oyuncu ${activeP} 8 numarayı sokarken beyaz top da cebe girdi! Oyuncu ${otherP} KAZANDI! 🏆`);
                return;
            } else if (isFoul) {
                this.endGame(false, `Oyuncu ${activeP} faullü bir atışla 8 numarayı soktu! Oyuncu ${otherP} KAZANDI! 🏆`);
                return;
            } else {
                this.endGame(true, `Tebrikler! Oyuncu ${activeP} 8 numaralı siyah topu yasal olarak sokarak KAZANDI! 🏆`);
                return;
            }
        }

        // 5. GRUP ATAMASI (Açık Masa / Open Table)
        if (activeGroup === null && !isFoul && normalPocketed.length > 0) {
            const firstPot = normalPocketed[0];
            if (firstPot.number < 8) {
                this.playerGroups[activeP] = 'solids';
                this.playerGroups[otherP] = 'stripes';
            } else {
                this.playerGroups[activeP] = 'stripes';
                this.playerGroups[otherP] = 'solids';
            }
            const groupName = this.playerGroups[activeP] === 'solids' ? 'Düzler (1-7)' : 'Çizgililer (9-15)';
            this.showToast(`🎯 Oyuncu ${activeP}: ${groupName} grubunu aldı!`, 'info');
        }

        // 6. FAUL VEYA SIRA GEÇİŞİ
        const alertEl = document.getElementById('ballInHandAlert');
        if (isFoul) {
            this.ballInHand = true;
            if (cuePocketed) this.physics.respawnCueBall();

            if (alertEl) alertEl.classList.remove('hidden');

            this.currentPlayer = otherP;
            this.showToast(`⚠️ FAUL! ${foulReason} Sıra Oyuncu ${this.currentPlayer}'de (Top Elde).`, 'foul');
        } else {
            if (alertEl) alertEl.classList.add('hidden');

            // Faul yoksa: Aktif oyuncu kendi grubundan top soktu mu?
            const currentGroup = this.playerGroups[activeP];
            let scoredOwn = false;

            if (currentGroup === null) {
                scoredOwn = normalPocketed.length > 0;
            } else {
                scoredOwn = normalPocketed.some(b =>
                    (currentGroup === 'solids' && b.number < 8) || (currentGroup === 'stripes' && b.number > 8)
                );
            }

            if (scoredOwn) {
                this.showToast(`✨ Başarılı atış! Oyuncu ${activeP} sırasını koruyor.`, 'pot');
            } else {
                this.currentPlayer = otherP;
                this.showToast(`Sıra Oyuncu ${this.currentPlayer}'e geçti.`, 'info');
            }
        }

        this.ballsPocketedThisTurn = [];
        this.updateHUD();
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = message;

        container.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('show');
        }, 20);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 2600);
    }

    endGame(isWin, message) {
        if (window.soundManager && isWin) {
            window.soundManager.playVictorySound();
        }
        const modal = document.getElementById('endGameModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalDesc = document.getElementById('modalDesc');
        const modalScore = document.getElementById('modalScore');

        modalTitle.innerText = isWin ? '🏆 ZAFER!' : '💔 OYUN BİTTİ';
        modalTitle.style.color = isWin ? '#4ade80' : '#f87171';
        modalDesc.innerText = message;
        modalScore.innerText = `Toplam Vuruş: ${this.shotCount}`;

        modal.classList.remove('hidden');
    }

    startGame() {
        document.getElementById('startMenu').classList.add('hidden');
        document.getElementById('gameHUD').classList.remove('hidden');
        document.getElementById('powerBarContainer').classList.remove('hidden');
        const strikeBtn = document.getElementById('strikeBtn');
        if (strikeBtn) strikeBtn.classList.remove('hidden');
        const spinContainer = document.getElementById('spinSelectorContainer');
        if (spinContainer) spinContainer.classList.remove('hidden');
        const chalkWidget = document.getElementById('chalkWidget');
        if (chalkWidget) chalkWidget.classList.remove('hidden');

        this.cueRenderer.setCueType(this.cueType);
        this.setClothColor(this.clothTheme);
        this.resetTable();
    }

    showMenu() {
        document.getElementById('startMenu').classList.remove('hidden');
        document.getElementById('gameHUD').classList.add('hidden');
        document.getElementById('powerBarContainer').classList.add('hidden');
        const strikeBtn = document.getElementById('strikeBtn');
        if (strikeBtn) strikeBtn.classList.add('hidden');
        const spinContainer = document.getElementById('spinSelectorContainer');
        if (spinContainer) spinContainer.classList.add('hidden');
        const chalkWidget = document.getElementById('chalkWidget');
        if (chalkWidget) chalkWidget.classList.add('hidden');
        const alertEl = document.getElementById('ballInHandAlert');
        if (alertEl) alertEl.classList.add('hidden');
        this.state = 'MENU';
    }

    resetTable() {
        this.physics.setupBalls();
        this.shotCount = 0;
        this.pottedBalls = [];
        this.ballsPocketedThisTurn = [];
        this.historyStack = [];
        this.power = 0;
        this.aimAngle = 0;
        this.currentPlayer = 1;
        this.playerGroups = { 1: null, 2: null };
        this.ballInHand = false;
        this.chalkCount = 3;

        const alertEl = document.getElementById('ballInHandAlert');
        if (alertEl) alertEl.classList.add('hidden');

        this.resetSpin();
        this.updateChalkUI();
        this.updatePowerUI();
        this.state = 'AIMING';
        this.updateHUD();
        this.showToast('🎱 Yeni oyun başladı. Başarılar!', 'info');
    }

    updateHUD() {
        // Vuruş Sayısı
        const shotEl = document.getElementById('hudShotCount');
        if (shotEl) shotEl.innerText = this.shotCount;

        // Mod Rozeti
        const modeBadge = document.getElementById('hudModeBadge');
        if (modeBadge) {
            modeBadge.innerText = this.gameMode === '8ball' ? '8-Top (2P)' : 'Antrenman';
        }

        // 2 Oyuncu Kartları (Sıra ve Gruplar)
        const p1Card = document.getElementById('player1Card');
        const p2Card = document.getElementById('player2Card');
        const p1Badge = document.getElementById('p1GroupBadge');
        const p2Badge = document.getElementById('p2GroupBadge');
        const turnBanner = document.getElementById('playerTurnBanner');

        if (turnBanner) {
            turnBanner.style.display = this.gameMode === '8ball' ? 'flex' : 'none';
        }

        const formatGroup = (g) => {
            if (g === 'solids') return 'Düzler (1-7)';
            if (g === 'stripes') return 'Çizgililer (9-15)';
            return 'Açık Masa';
        };

        if (p1Card && p2Card && p1Badge && p2Badge) {
            p1Card.classList.toggle('active-turn', this.currentPlayer === 1);
            p2Card.classList.toggle('active-turn', this.currentPlayer === 2);
            p1Badge.innerText = formatGroup(this.playerGroups[1]);
            p2Badge.innerText = formatGroup(this.playerGroups[2]);
        }

        // Rozetler
        const diffBadge = document.getElementById('hudDiffBadge');
        if (diffBadge) {
            diffBadge.innerText = this.difficulty === 'beginner' ? 'Acemi' : 'Usta';
            diffBadge.className = `hud-badge badge-${this.difficulty}`;
        }

        const cueBadge = document.getElementById('hudCueBadge');
        if (cueBadge) {
            const cue = this.cueRenderer.currentCue;
            cueBadge.innerText = cue.name;
        }

        // Cebe giren toplar rafı
        const rack = document.getElementById('pottedRack');
        if (rack) {
            rack.innerHTML = '';
            this.pottedBalls.forEach(num => {
                const bSpan = document.createElement('span');
                bSpan.className = 'mini-ball';
                bSpan.innerText = num;
                const cfg = BALL_CONFIG[num] || { color: '#ffffff' };
                bSpan.style.backgroundColor = cfg.color;
                if (num === 8) bSpan.style.color = '#ffffff';
                rack.appendChild(bSpan);
            });
        }
    }

    handleResize() {
        const containerRect = this.container.getBoundingClientRect();
        this.table.resize(containerRect.width, containerRect.height);
    }

    gameLoop(timestamp) {
        const dt = Math.min(2.0, (timestamp - this.lastTime) / 16.666);
        this.lastTime = timestamp;

        // Sürekli Şarj Güncellemesi (Boşluk tuşuna veya Güç butonuna basılı tutulurken)
        if ((this.isKeyCharging || this.isBtnCharging) && this.state === 'CHARGING') {
            const chargeSpeed = 0.018 * dt; // Yaklaşık 1 saniyede tam dolum
            this.power += chargeSpeed * this.chargeDirection;

            if (this.power >= 1.0) {
                this.power = 1.0;
                this.chargeDirection = -1; // %100 olunca aşağı salınım
            } else if (this.power <= 0.15 && this.chargeDirection === -1) {
                this.chargeDirection = 1; // %15'e inince tekrar yukarı salınım
            }

            this.updatePowerUI();
        }

        // 1. Fizik Güncellemesi
        this.physics.update(dt, (pocketedBall) => {
            this.onBallPocketed(pocketedBall);
        });

        // 2. Parçacıklar
        this.cueRenderer.updateParticles();

        // 3. Topların durma kontrolü
        if (this.state === 'BALLS_ROLLING') {
            if (this.physics.areAllBallsStopped()) {
                this.handleTurnEnd();
            }
        }

        // 4. Çizim
        this.render();

        requestAnimationFrame((t) => this.gameLoop(t));
    }

    render() {
        // Masayı ve topları çiz
        this.table.draw();

        const ctx = this.table.ctx;
        ctx.save();
        ctx.translate(this.table.offsetX, this.table.offsetY);

        // Parçacıkları çiz
        this.cueRenderer.drawParticles(ctx);

        // Eğer nişan alma veya güç toplama durumundaysak kılavuzları ve ıstakayı çiz
        if ((this.state === 'AIMING' || this.state === 'CHARGING' || this.state === 'STRIKING') &&
            this.physics.cueBall && !this.physics.cueBall.inPocket) {

            // Acemi modunda kılavuz yörüngesi hesapla ve çiz
            if (this.difficulty === 'beginner') {
                const trajectory = this.physics.calculateAimTrajectory(this.aimAngle);
                this.cueRenderer.drawAimGuide(ctx, trajectory, this.difficulty);
            }

            // Istakayı çiz
            this.cueRenderer.drawCueStick(
                ctx,
                this.physics.cueBall.pos,
                this.aimAngle,
                this.power,
                this.strikeAnimation
            );
        }

        ctx.restore();
    }
}

// Sayfa yüklendiğinde oyunu başlat
window.addEventListener('DOMContentLoaded', () => {
    window.game = new BilliardsGame();
});
