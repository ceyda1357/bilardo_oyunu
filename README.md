# 🎱 Royal Billiards 2D - Profesyonel Bilardo Oyunu

HTML5 Canvas, CSS3 ve saf Vanilla JavaScript kullanılarak geliştirilmiş, harici kütüphane gerektirmeyen, özel 2D elastik fizik motoruna ve Web Audio API ses sentezleyicisine sahip profesyonel bilardo oyunu.

Masaüstü ve mobil tarayıcılar ile tam uyumludur.

---

## ✨ Özellikler

### 1. ⚙️ Özel 2D Fizik Motoru (Custom 2D Physics)
- **Momentum Korunumu & Elastik Çarpışmalar:** Kütle ve bağıl hız vektörleri üzerinden hesaplanan gerçekçi momentum transferi ve çakışma giderme (positional overlap resolution).
- **Tünelleme Önleme (Sub-stepping):** Yüksek hızlı topların bant içinden geçmesini önleyen kare başına çoklu alt adım simülasyonu.
- **Bantlar & 6 Cep:** Gerçek bilardo masalarındaki açılı çene kıvrımları (cushion jaws), kauçuk sekme esnekliği ve masa çuhası sürtünmesi.

### 2. 👥 8-Top Kuralları & Yerel 2 Oyuncu Modu (Pass & Play)
- **Sıra Takibi:** Oyuncu 1 ve Oyuncu 2 için sıra yönetimi ve HUD kartları.
- **Grup Ataması (Açık Masa):** Açılış sonrasında yasal sokulan ilk topa göre **Düzler (1-7)** veya **Çizgililer (9-15)** grupları atanır.
- **Top Elde (Ball in Hand):** Beyaz topun cebe girmesi (Scratch) veya hatalı ilk temasta rakibe "Top Elde" hakkı verilir; beyaz top masada serbestçe istenen yere sürüklenip bırakılabilir.
- **8 Numaralı Siyah Top Kuralları:** Kendi grubu bitmeden sokmak yenilgi; grubu bitirdikten sonra yasal sokmak zafer kazandırır!

### 3. 🏋️ Serbest / Antrenman Modu & Vuruşu Geri Al (Undo)
- Kural ve sıra kısıtlaması olmadan sınırsız antrenman.
- Masadaki **tüm topları fare veya dokunmatik ekranla sürükleyip** dilediğiniz pozisyona yerleştirebilme.
- **`↶ Geri Al` (Undo)** butonu ile bir önceki vuruşun tüm masa durumuna anında geri dönebilme.

### 4. 🌀 Vuruş Noktası & Falso (Spin / English) Seçici
- 3D küre arayüzü üzerinden beyaz topun vurulacak noktasını serbestçe belirleme.
- **Geri Spin (Backspin / Draw):** Çarpışma sonrası beyaz topu geriye çeker.
- **İleri Spin (Topspin / Follow):** Çarpışma sonrası hedef topun peşinden ilerler.
- **Yan Falso (Sidespin / English):** Banttan sekme açısını büker ve kesme sapması (cut throw) yaratır.

### 5. 🟦 Tebeşir (Chalk) Mekaniği & Miscue
- Istaka ucunu tebeşirleme butonu ve 3 vuruşluk kapasite göstergesi.
- Tebeşir bittiğinde **Miscue (Istaka Kayması)** devreye girer: Güç kaybı, açı sapması ve kayma sesi!

### 6. 🎨 Görsel Kalite & Temalar
- **Retina DPI Desteği:** `window.devicePixelRatio` ile 4K ve Retina ekranlarda kristal netliğinde çizim.
- **Dinamik Yumuşak Gölgeler:** Işık kaynağına göre yönlenen radyal degrade gölgeler.
- **Hareket İzi (Motion Trail):** Hızlı topların arkasında estetik hareket izi.
- **3 Çuha Rengi Teması:** Klasik Yeşil, Turnuva Mavisi ve Asil Bordo.

### 7. 🔊 Üretimsel Ses Sentezleyici (Web Audio API)
- Harici `.mp3` veya `.wav` dosyası gerektirmeyen, Web Audio API ile sıfır gecikmeli üretilen vuruş, çarpışma, bant sekmesi, cebe düşme, tebeşir sürme ve miscue sesleri.

---

## 🕹️ Kontroller

| Eylem | Masaüstü | Mobil / Dokunmatik |
| :--- | :--- | :--- |
| **Nişan Alma** | Fareyi masada hareket ettirin | Masada parmağınızı sürükleyin |
| **Vuruş (Şarj & Bırak)** | **`[BOŞLUK]`** tuşuna basılı tutun ve bırakın | **`⚡ VUR`** butonuna basılı tutun ve bırakın |
| **Alternatif Vuruş** | Beyaz topu geriye çekip bırakın | Beyaz topu geriye çekip bırakın |
| **Güç Çubuğu** | Sağdaki neon çubuğu aşağı çekin | Sağdaki neon çubuğu aşağı çekin |
| **Falso Seçimi** | Sağ üstteki beyaz topa tıklayın/sürükleyin | Sağ üstteki beyaz topa dokunun/sürükleyin |
| **Top Taşıma** | Topu tıklayıp sürükleyin (Top Elde / Antrenman) | Topa dokunup sürükleyin (Top Elde / Antrenman) |
| **Tebeşir Sürme** | Sol taraftaki **`TEBEŞİR`** butonuna tıklayın | **`TEBEŞİR`** butonuna dokunun |
| **Vuruşu Geri Al** | Üst bardaki **`↶ Geri Al`** butonuna tıklayın | **`↶ Geri Al`** butonuna dokunun |

---

## 🚀 Yerel Olarak Çalıştırma

Herhangi bir sunucu kurulumu gerektirmeden `index.html` dosyasını tarayıcınızda çift tıklayarak doğrudan açabilirsiniz.

Dilerseniz yerel bir HTTP sunucusu ile çalıştırmak için:

```bash
# Python 3 ile:
python3 -m http.server 8080

# veya Node.js ile:
npx serve .
```

Ardından tarayıcınızda `http://localhost:8080` adresine gidin.

---

## 🌐 GitHub Pages ile Ücretsiz Yayınlama

Bu projeyi GitHub Pages ile internette herkese açık oynanabilir hale getirmek için:

1. Deponuzun **Settings** (Ayarlar) sekmesine gidin.
2. Sol menüden **Pages** seçeneğine tıklayın.
3. **Branch** kısmında `main` (veya `master`) dalını ve `/ (root)` klasörünü seçip **Save** butonuna tıklayın.
4. Birkaç dakika içinde oyununuz `https://kullanici-adiniz.github.io/depo-adiniz/` adresinde canlıya geçecektir!

---

## 📄 Lisans

Bu proje MIT lisansı ile lisanslanmıştır. Dilediğiniz gibi geliştirebilir ve kullanabilirsiniz.
