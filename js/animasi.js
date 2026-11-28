// Mengatur animasi hero, scroll, filter, kursor, tombol, pratinjau, dan perpindahan halaman.
"use strict";

(() => {
  const akar = document.documentElement;
  const gerakanMinimal = window.matchMedia("(prefers-reduced-motion: reduce)");
  const pointerHalus = window.matchMedia("(hover: hover) and (pointer: fine)");
  const kunciTransisi = "portofolio-tujuan-transisi";

  // Bagi nama menjadi dua baris agar setiap kata bisa muncul secara berurutan.
  function siapkanHero() {
    const hero = document.querySelector("header.hero");
    const judul = hero?.querySelector("h1");
    if (!judul || gerakanMinimal.matches) return;

    const kata = judul.textContent.trim().split(/\s+/);
    const isi = document.createDocumentFragment();

    kata.forEach((teks, indeks) => {
      const masker = document.createElement("span");
      masker.className = "masker-judul";

      const baris = document.createElement("span");
      baris.className = "baris-judul";
      baris.style.setProperty("--urutan-kata", indeks);
      baris.textContent = teks;

      if (indeks > 0) isi.append(" ");
      masker.append(baris);
      isi.append(masker);
    });

    judul.replaceChildren(isi);
    judul.classList.add("judul-berbaris");
    hero.classList.add("hero-siap");
  }

  // Ketik dan hapus kalimat di hero. Jeda saat tab disembunyikan.
  function siapkanEfekKetik() {
    const tempat = document.getElementById("teks-ketik");
    if (!tempat) return;

    const kalimat = [
      "mahasiswa Sistem Informasi.",
      "yang sedang belajar membuat web.",
      "yang pernah membuat aplikasi mobile dengan Flutter."
    ];

    const visual = document.createElement("span");
    visual.setAttribute("aria-hidden", "true");

    const bacaan = document.createElement("span");
    bacaan.className = "visually-hidden";
    bacaan.textContent = kalimat[0];
    tempat.replaceChildren(visual, bacaan);

    let indeks = 0;
    let panjang = 0;
    let menghapus = false;
    let timer = 0;
    let sisaJeda = 560;
    let batasWaktu = 0;

    // Simpan waktu langkah berikutnya agar pengetikan bisa dilanjutkan.
    function jadwalkan(jeda) {
      sisaJeda = jeda;
      if (document.hidden || gerakanMinimal.matches) return;

      batasWaktu = performance.now() + jeda;
      timer = window.setTimeout(langkah, jeda);
    }

    // Tambah atau hapus satu huruf, lalu tentukan jeda berikutnya.
    function langkah() {
      timer = 0;
      const teks = kalimat[indeks];
      panjang += menghapus ? -1 : 1;
      visual.textContent = teks.slice(0, panjang);

      if (panjang === teks.length) {
        menghapus = true;
        jadwalkan(1600);
      } else if (panjang === 0) {
        menghapus = false;
        indeks = (indeks + 1) % kalimat.length;
        jadwalkan(300);
      } else {
        jadwalkan(menghapus ? 32 : 45 + Math.floor(Math.random() * 46));
      }
    }

    // Tampilkan kalimat lengkap saat pengguna mengurangi gerakan.
    function aturGerakan() {
      window.clearTimeout(timer);
      timer = 0;
      indeks = 0;
      panjang = 0;
      menghapus = false;

      tempat.classList.toggle("sedang-mengetik", !gerakanMinimal.matches);
      visual.textContent = gerakanMinimal.matches ? kalimat[0] : "";
      if (!gerakanMinimal.matches) jadwalkan(560);
    }

    document.addEventListener("visibilitychange", () => {
      if (gerakanMinimal.matches) return;

      if (document.hidden && timer) {
        sisaJeda = Math.max(0, batasWaktu - performance.now());
        window.clearTimeout(timer);
        timer = 0;
      } else if (!document.hidden && !timer) {
        jadwalkan(sisaJeda);
      }
    });

    gerakanMinimal.addEventListener("change", aturGerakan);
    aturGerakan();
  }

  // Tentukan jenis animasi dan jeda untuk isi halaman serta footer.
  function kumpulkanReveal() {
    const hasil = [];
    const urutanInduk = new Map();

    const sasaran = [
      "[data-reveal]", "h1", "h2", "h3", "p", "li", "a[href]", "button",
      "figure", "img", "hr", ".baris-proyek", ".baris-kontak",
      ".panel-form", ".kolom-form"
    ].join(", ");

    const pengecualian = [
      ".hero", ".navbar", ".modal", ".toast", ".carousel", ".collapse",
      "#penanda-bagian", "#progress-scroll", "#kembali-ke-atas",
      ".kursor-kecil", ".timeline", "#teks-ketik", ".visually-hidden",
      ".invalid-feedback", ".alert", "[aria-live]", "[role='status']", "[hidden]"
    ].join(", ");

    for (const area of document.querySelectorAll("main, body > footer")) {
      for (const item of area.querySelectorAll(sasaran)) {
        // Animasikan baris proyek sebagai satu kesatuan agar tombol tetap mencakup baris.
        if (item.closest(".baris-proyek") && !item.matches(".baris-proyek")) continue;
        if (item.closest(pengecualian)) continue;
        if (item.matches("figure img") && !item.hasAttribute("data-reveal")) continue;

        if (!item.hasAttribute("data-reveal")) {
          let jenis = "naik";

          if (item.matches("h1, h2, h3")) {
            jenis = "masker";
          } else if (item.matches("figure, img")) {
            jenis = "skala";
          } else if (item.matches("li, .baris-proyek, .baris-kontak")) {
            jenis = "geser";
          } else if (item.matches("hr")) {
            jenis = "garis";
          }

          item.dataset.reveal = jenis;
        }

        const induk = item.parentElement;
        const urutan = urutanInduk.get(induk) || 0;
        urutanInduk.set(induk, urutan + 1);

        const jeda = item.hasAttribute("data-delay")
          ? Number(item.dataset.delay)
          : urutan * 70;
        const jedaAman = Number.isFinite(jeda) ? Math.max(0, Math.min(400, jeda)) : 0;
        item.style.setProperty("--delay", `${jedaAman}ms`);

        if (item.matches("h1, h2, h3")) {
          const masker = document.createElement("span");
          const baris = document.createElement("span");
          masker.className = "masker-bagian";
          baris.className = "isi-masker-bagian";

          while (item.firstChild) baris.append(item.firstChild);
          masker.append(baris);
          item.append(masker);
        }

        hasil.push(item);
      }
    }

    return hasil;
  }

  // Mulai animasi ketika elemen masuk layar. Siapkan ulang setelah keluar sepenuhnya.
  function siapkanReveal() {
    if (!("IntersectionObserver" in window)) return;

    const daftar = kumpulkanReveal();
    if (!daftar.length) return;

    let posisiLama = Math.max(0, window.scrollY);
    let arah = "bawah";
    let frame = 0;

    // Bandingkan posisi scroll sekarang dengan posisi sebelumnya.
    function bacaArah() {
      const posisi = Math.max(0, window.scrollY);
      if (posisi !== posisiLama) arah = posisi < posisiLama ? "atas" : "bawah";
      posisiLama = posisi;

      akar.classList.toggle("arah-atas", arah === "atas");
      akar.classList.toggle("arah-bawah", arah === "bawah");
    }

    // Baca arah scroll paling banyak sekali per frame.
    function jadwalkanArah() {
      if (frame) return;

      frame = window.requestAnimationFrame(() => {
        frame = 0;
        bacaArah();
      });
    }

    // Simpan arah saat elemen mulai muncul.
    function tampilkan(item) {
      if (item.classList.contains("is-visible")) return;

      item.style.setProperty("--arah-masuk", arah === "atas" ? "-1" : "1");
      item.classList.add("is-visible");
    }

    const pengamatMasuk = new IntersectionObserver((entri) => {
      if (gerakanMinimal.matches) return;
      bacaArah();

      for (const data of entri) {
        if (data.isIntersecting && data.intersectionRatio >= 0.15) {
          tampilkan(data.target);
        }
      }
    }, {
      threshold: [0.15],
      rootMargin: "0px 0px -8% 0px"
    });

    const pengamatKeluar = new IntersectionObserver((entri) => {
      if (gerakanMinimal.matches) return;

      for (const data of entri) {
        if (!data.isIntersecting) data.target.classList.remove("is-visible");
      }
    }, { threshold: 0 });

    // Pasang atau lepas pengamat ketika preferensi gerakan berubah.
    function aturReveal() {
      pengamatMasuk.disconnect();
      pengamatKeluar.disconnect();
      window.removeEventListener("scroll", jadwalkanArah);
      window.cancelAnimationFrame(frame);
      frame = 0;
      akar.classList.remove("reveal-aktif");

      if (gerakanMinimal.matches) {
        for (const item of daftar) item.classList.add("is-visible");
        return;
      }

      posisiLama = Math.max(0, window.scrollY);
      bacaArah();

      for (const item of daftar) {
        item.classList.remove("is-visible");
        pengamatMasuk.observe(item);
        pengamatKeluar.observe(item);
      }

      akar.classList.add("reveal-aktif");
      window.addEventListener("scroll", jadwalkanArah, { passive: true });
    }

    document.addEventListener("focusin", (event) => {
      if (!akar.classList.contains("reveal-aktif")) return;
      if (!(event.target instanceof Element)) return;

      let item = event.target.closest("[data-reveal]");
      while (item) {
        tampilkan(item);
        item = item.parentElement?.closest("[data-reveal]");
      }
    });

    gerakanMinimal.addEventListener("change", aturReveal);
    aturReveal();
  }

  // Gambar garis timeline sesuai posisi scroll.
  function siapkanTimeline() {
    const daftar = document.querySelector("#perjalanan .timeline");
    if (!daftar || !("IntersectionObserver" in window)) return;

    const item = Array.from(daftar.children);
    if (!item.length) return;

    let frame = 0;
    let pusat = 0;
    let panjang = 0;
    let posisi = [];

    // Perbarui panjang garis dan titik yang sudah tercapai.
    function gambar() {
      frame = 0;
      if (gerakanMinimal.matches || !posisi.length) return;

      const atas = daftar.getBoundingClientRect().top;
      const batas = window.innerHeight * 0.78 - atas - pusat;
      const bagian = panjang > 0 ? batas / panjang : Number(batas >= 0);

      daftar.style.setProperty("--progres", Math.max(0, Math.min(1, bagian)));

      item.forEach((baris, indeks) => {
        baris.classList.toggle("is-aktif", batas >= posisi[indeks]);
      });
    }

    // Gabungkan permintaan gambar yang datang dalam frame yang sama.
    function jadwalkan() {
      if (!frame) frame = window.requestAnimationFrame(gambar);
    }

    // Ukur lagi titik timeline saat ukuran halaman atau font berubah.
    function ukur() {
      if (gerakanMinimal.matches) return;

      const atas = daftar.getBoundingClientRect().top;
      posisi = item.map((baris) => baris.getBoundingClientRect().top - atas);
      const titik = getComputedStyle(item[0], "::before");

      pusat = (parseFloat(titik.top) || 0) + (parseFloat(titik.width) || 0) / 2;
      panjang = posisi[posisi.length - 1];

      daftar.style.setProperty("--awal-garis", `${pusat}px`);
      daftar.style.setProperty("--panjang-garis", `${panjang}px`);
      jadwalkan();
    }

    const pengamat = new IntersectionObserver(([data]) => {
      if (gerakanMinimal.matches || !data) return;

      if (data.isIntersecting) {
        window.addEventListener("scroll", jadwalkan, { passive: true });
      } else {
        window.removeEventListener("scroll", jadwalkan);
      }

      jadwalkan();
    }, { rootMargin: "100px 0px" });

    // Aktifkan timeline bergerak jika pengguna mengizinkan animasi.
    function aturTimeline() {
      pengamat.disconnect();
      window.removeEventListener("scroll", jadwalkan);
      window.cancelAnimationFrame(frame);
      frame = 0;
      daftar.classList.toggle("timeline-siap", !gerakanMinimal.matches);

      if (!gerakanMinimal.matches) {
        ukur();
        pengamat.observe(daftar);
      }
    }

    if ("ResizeObserver" in window) {
      const ukuran = new ResizeObserver(ukur);
      ukuran.observe(daftar);
    }

    window.addEventListener("resize", ukur);
    window.addEventListener("pageshow", ukur);
    if (document.fonts) document.fonts.ready.then(ukur);
    gerakanMinimal.addEventListener("change", aturTimeline);
    aturTimeline();
  }

  // Animasikan proyek yang kembali terlihat setelah pengguna mengganti filter.
  function siapkanAnimasiFilter() {
    const daftar = document.getElementById("daftar-proyek");
    const filter = document.querySelector(".filter-proyek");
    if (!daftar || !filter) return;

    const proyek = Array.from(daftar.querySelectorAll("article[data-kategori]"));
    let tersembunyi = new Set();
    let frame = 0;

    // Lepas penanda agar animasi bisa dipakai lagi pada filter berikutnya.
    function bersihkan(item) {
      item.classList.remove("filter-masuk");
      item.style.removeProperty("--jeda-filter");
    }

    // Catat proyek tersembunyi sebelum main.js menjalankan filter.
    filter.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) return;
      if (!event.target.closest("button[data-filter]")) return;

      window.cancelAnimationFrame(frame);
      proyek.forEach(bersihkan);
      tersembunyi = new Set(proyek.filter((item) => item.classList.contains("d-none")));
    }, true);

    filter.addEventListener("click", (event) => {
      if (gerakanMinimal.matches || !(event.target instanceof Element)) return;
      if (!event.target.closest("button[data-filter]")) return;

      frame = window.requestAnimationFrame(() => {
        const muncul = proyek.filter((item) => {
          return tersembunyi.has(item) && !item.classList.contains("d-none");
        });

        muncul.forEach((item, indeks) => {
          item.style.setProperty("--jeda-filter", `${indeks * 60}ms`);
          item.classList.add("filter-masuk");
        });
      });
    });

    // Bersihkan kelas ketika animasi filter selesai atau dibatalkan.
    function selesai(event) {
      if (event.animationName === "masuk-filter") bersihkan(event.target);
    }

    daftar.addEventListener("animationend", selesai);
    daftar.addEventListener("animationcancel", selesai);

    gerakanMinimal.addEventListener("change", () => {
      window.cancelAnimationFrame(frame);
      proyek.forEach(bersihkan);
    });
  }

  // Kursor, magnet, dan pratinjau memakai posisi mouse dan jadwal gambar yang sama.
  const pelukis = [];
  let framePenunjuk = 0;
  let mouse = null;

  // Jalankan frame berikutnya hanya selama ada efek yang masih bergerak.
  function jadwalkanPenunjuk() {
    if (framePenunjuk) return;

    framePenunjuk = window.requestAnimationFrame(() => {
      framePenunjuk = 0;
      let bergerak = false;

      for (const gambar of pelukis) {
        if (gambar(mouse)) bergerak = true;
      }

      if (bergerak) jadwalkanPenunjuk();
    });
  }

  // Simpan posisi mouse terakhir untuk semua efek yang mengikutinya.
  function siapkanPenunjuk() {
    document.addEventListener("pointermove", (event) => {
      const bolehBergerak = event.pointerType === "mouse" &&
        pointerHalus.matches && !gerakanMinimal.matches;

      if (bolehBergerak && event.target instanceof Element) {
        mouse = { x: event.clientX, y: event.clientY, target: event.target };
      } else {
        mouse = null;
      }

      jadwalkanPenunjuk();
    }, { passive: true });

    // Kembalikan efek ke posisi awal saat mouse atau halaman kehilangan fokus.
    function reset() {
      mouse = null;
      jadwalkanPenunjuk();
    }

    akar.addEventListener("pointerleave", reset);
    window.addEventListener("blur", reset);
    window.addEventListener("pagehide", reset);
    document.addEventListener("show.bs.modal", reset);
    pointerHalus.addEventListener("change", reset);
    gerakanMinimal.addEventListener("change", reset);
  }

  // Tampilkan lingkaran kecil setelah mouse pertama kali bergerak.
  function siapkanKursor() {
    let kursor = null;
    let x = 0;
    let y = 0;

    pelukis.push((pos) => {
      if (!pos) {
        kursor?.classList.remove("terlihat");
        return false;
      }

      if (!kursor) {
        kursor = document.createElement("span");
        kursor.className = "kursor-kecil";
        kursor.setAttribute("aria-hidden", "true");
        document.body.append(kursor);
      }

      if (!kursor.classList.contains("terlihat")) {
        x = pos.x;
        y = pos.y;
      }

      x += (pos.x - x) * 0.24;
      y += (pos.y - y) * 0.24;

      kursor.style.translate = `${x}px ${y}px`;
      kursor.classList.add("terlihat");

      const kontrol = pos.target.closest("a[href], button:enabled, .galeri-unggulan figure");
      kursor.classList.toggle("di-atas-kontrol", Boolean(kontrol));

      return Math.hypot(pos.x - x, pos.y - y) > 0.4;
    });
  }

  // Geser tombol Hubungi saya dan Kirim pesan maksimal delapan piksel ke arah mouse.
  function siapkanMagnet() {
    const tombolUtama = document.querySelectorAll(
      ".hero .btn-outline-primary, #form-kontak button[type=submit]"
    );

    for (const tombol of tombolUtama) {
      let x = 0;
      let y = 0;

      pelukis.push((pos) => {
        let tujuanX = 0;
        let tujuanY = 0;

        if (pos && !tombol.disabled) {
          const kotak = tombol.getBoundingClientRect();

          // Kurangi pergeseran lama agar pusat tombol tidak ikut mengejar mouse.
          const dx = pos.x - (kotak.left + kotak.width / 2 - x);
          const dy = pos.y - (kotak.top + kotak.height / 2 - y);
          const jarak = Math.hypot(dx, dy);
          const faktor = Math.max(0, 1 - jarak / 80) * 8 / Math.max(1, jarak);

          tujuanX = dx * faktor;
          tujuanY = dy * faktor;
        }

        x += (tujuanX - x) * 0.25;
        y += (tujuanY - y) * 0.25;

        if (gerakanMinimal.matches || Math.hypot(tujuanX - x, tujuanY - y) < 0.1) {
          x = tujuanX;
          y = tujuanY;
        }

        tombol.style.translate = x || y ? `${x}px ${y}px` : "";
        return x !== tujuanX || y !== tujuanY;
      });
    }
  }

  // Bungkus teks tautan dan tombol agar label bisa berguling tanpa menggandakan bacaannya.
  function siapkanGuling() {
    const sasaran = document.querySelectorAll(
      ".navbar .nav-link, [data-tema-toggle], .tautan-kontak, .btn-outline-primary, button[data-filter]"
    );

    for (const tombol of sasaran) {
      if (tombol.closest(".modal, .toast, .carousel, #penanda-bagian, #progress-scroll")) {
        continue;
      }

      if (tombol.matches(".btn-outline-primary")) tombol.classList.add("sapuan");

      const label = tombol.querySelector("[data-label-salin], .nilai-kontak") || tombol;

      // Bungkus simpul teks saja agar ikon dan angka pada filter tetap tersedia.
      function bungkus() {
        if (label.closest('[aria-busy="true"]') || label.querySelector(".guling")) return;

        const teks = Array.from(label.childNodes).find((simpul) => {
          return simpul.nodeType === Node.TEXT_NODE && simpul.textContent.trim();
        });
        if (!teks) return;

        const masker = document.createElement("span");
        masker.className = "guling";

        const asli = document.createElement("span");
        asli.className = "guling__asli";
        asli.textContent = teks.textContent.trim();

        const salinan = asli.cloneNode(true);
        salinan.className = "guling__salinan";
        salinan.setAttribute("aria-hidden", "true");

        masker.append(asli, salinan);

        // Pertahankan spasi di samping angka filter atau ikon tombol.
        const isiAwal = teks.textContent;
        const awal = isiAwal.match(/^\s*/)[0];
        const akhir = isiAwal.match(/\s*$/)[0];
        teks.replaceWith(awal, masker, akhir);
      }

      bungkus();

      // main.js bisa mengganti label menjadi Mode gelap, Tersalin, atau Mengirim...
      const pengamat = new MutationObserver(bungkus);
      pengamat.observe(label, { childList: true });
    }
  }

  // Gunakan satu gambar mengambang untuk semua baris pada indeks proyek.
  function siapkanPratinjau() {
    const daftar = document.getElementById("indeks-proyek");
    if (!daftar) return;

    const desktop = window.matchMedia(
      "(min-width: 992px) and (hover: hover) and (pointer: fine)"
    );

    const panel = document.createElement("figure");
    panel.className = "pratinjau-proyek";
    panel.setAttribute("aria-hidden", "true");

    const gambar = document.createElement("img");
    gambar.alt = "";
    panel.append(gambar);
    document.body.append(panel);

    const cache = new Map();
    let aktif = null;
    let keyboard = false;
    let baru = false;
    let x = 0;
    let y = 0;
    let kemiringan = 0;

    // Muat gambar pertama setiap proyek ketika pratinjau desktop bisa dipakai.
    function muatAwal() {
      if (!desktop.matches || gerakanMinimal.matches) return;

      for (const baris of daftar.querySelectorAll(".baris-proyek")) {
        const path = baris.dataset.gambar?.split(",")[0]?.trim();

        if (path && !cache.has(path)) {
          const foto = new Image();
          foto.src = path;
          cache.set(path, foto);
        }
      }
    }

    // Tandai baris aktif dan muat gambarnya ke dalam panel.
    function pilih(baris) {
      if (!desktop.matches || gerakanMinimal.matches || baris?.closest(".d-none, [hidden]")) {
        baris = null;
      }

      if (aktif === baris) return;

      aktif?.classList.remove("is-aktif");
      aktif = baris;
      daftar.classList.toggle("ada-aktif", Boolean(aktif));
      panel.classList.remove("terlihat");

      if (aktif) {
        aktif.classList.add("is-aktif");
        const path = aktif.dataset.gambar?.split(",")[0]?.trim();
        if (path) gambar.src = path;
        baru = true;
      }

      jadwalkanPenunjuk();
    }

    gambar.onload = () => {
      if (aktif && desktop.matches && !gerakanMinimal.matches) {
        // Mulai lagi efek tersingkap saat pengguna pindah ke proyek lain.
        void panel.offsetWidth;
        panel.classList.add("terlihat");
      }
    };

    gambar.onerror = () => panel.classList.remove("terlihat");

    daftar.addEventListener("pointermove", (event) => {
      if (!(event.target instanceof Element)) return;

      keyboard = false;
      pilih(event.pointerType === "mouse" ? event.target.closest(".baris-proyek") : null);
    }, { passive: true });

    daftar.addEventListener("pointerleave", () => {
      if (!keyboard) pilih(null);
    });

    daftar.addEventListener("focusin", (event) => {
      if (!(event.target instanceof Element)) return;

      if (event.target.matches(":focus-visible")) {
        keyboard = true;
        pilih(event.target.closest(".baris-proyek"));
      }
    });

    daftar.addEventListener("focusout", (event) => {
      if (!daftar.contains(event.relatedTarget)) pilih(null);
    });

    // Tutup pratinjau saat daftar berpindah, disaring, atau tertutup modal.
    function tutup() {
      pilih(null);
    }

    document.addEventListener("show.bs.modal", tutup);
    document.querySelector(".filter-proyek")?.addEventListener("click", tutup);
    window.addEventListener("scroll", tutup, { passive: true });
    window.addEventListener("blur", tutup);

    // Periksa kembali ukuran layar dan preferensi gerakan yang baru.
    function aturPerangkat() {
      tutup();
      muatAwal();
    }

    desktop.addEventListener("change", aturPerangkat);
    gerakanMinimal.addEventListener("change", aturPerangkat);
    muatAwal();

    pelukis.push((pos) => {
      if (!aktif) return false;

      if (!pos && !keyboard) {
        tutup();
        return false;
      }

      const kotak = aktif.getBoundingClientRect();
      const px = keyboard ? kotak.right - panel.offsetWidth : pos.x;
      const py = keyboard ? kotak.top : pos.y;

      // Jaga gambar tetap di dalam layar, termasuk saat mouse mendekati tepi.
      const tujuanX = Math.max(8, Math.min(window.innerWidth - panel.offsetWidth - 8, px + 24));
      const tujuanY = Math.max(8, Math.min(window.innerHeight - panel.offsetHeight - 8, py + 18));

      if (baru) {
        x = tujuanX;
        y = tujuanY;
        baru = false;
      }

      const dx = (tujuanX - x) * 0.18;
      x += dx;
      y += (tujuanY - y) * 0.18;

      const sudut = Math.min(6, Math.max(-6, dx * 0.35));
      kemiringan += (sudut - kemiringan) * 0.25;

      panel.style.translate = `${x}px ${y}px`;
      panel.style.rotate = `${kemiringan}deg`;

      return Math.hypot(tujuanX - x, tujuanY - y) > 0.3 || Math.abs(kemiringan) > 0.1;
    });
  }

  // Jalankan sapuan layar untuk tautan ke halaman HTML di dalam situs.
  function siapkanTransisiHalaman() {
    const panel = document.createElement("div");
    panel.className = "panel-halaman";
    panel.setAttribute("aria-hidden", "true");
    document.body.append(panel);

    let tujuan = null;
    let timer = 0;
    let frame = 0;

    // Hapus alamat tujuan yang disimpan untuk animasi masuk.
    function hapusPenanda() {
      try {
        sessionStorage.removeItem(kunciTransisi);
      } catch {
        // Navigasi tetap berjalan jika penyimpanan sesi tidak tersedia.
      }
    }

    // Lepas panel ketika navigasi selesai, dibatalkan, atau dipulihkan lewat Back.
    function pulihkan() {
      window.clearTimeout(timer);
      window.cancelAnimationFrame(frame);
      tujuan = null;
      akar.classList.remove("masuk-transisi");
      panel.classList.remove("panel-menutup", "panel-membuka");
    }

    // Buka halaman tujuan setelah sapuan penutup selesai.
    function pindah() {
      if (!tujuan) return;

      window.clearTimeout(timer);
      const alamat = tujuan;
      tujuan = null;

      try {
        sessionStorage.setItem(kunciTransisi, alamat.href);
      } catch {
        // Halaman tujuan tetap dapat dibuka tanpa penanda.
      }

      window.location.assign(alamat.href);
      timer = window.setTimeout(pulihkan, 1200);
    }

    hapusPenanda();

    if (akar.classList.contains("masuk-transisi") && !gerakanMinimal.matches) {
      frame = window.requestAnimationFrame(() => {
        panel.classList.add("panel-membuka");
        akar.classList.remove("masuk-transisi");
      });

      timer = window.setTimeout(pulihkan, 1200);
    } else {
      pulihkan();
    }

    panel.addEventListener("animationend", (event) => {
      if (event.animationName === "tutup-halaman") pindah();

      if (event.animationName === "buka-halaman") {
        panel.classList.remove("panel-membuka");
      }
    });

    document.addEventListener("click", (event) => {
      if (gerakanMinimal.matches || event.defaultPrevented || event.button !== 0) return;
      if (event.ctrlKey || event.shiftKey || event.metaKey || event.altKey) return;
      if (!(event.target instanceof Element)) return;

      const tautan = event.target.closest("a[href]");
      if (!tautan || tautan.closest("[data-bs-toggle]") || tautan.hasAttribute("download")) return;
      if (tautan.target && tautan.target.toLowerCase() !== "_self") return;

      const alamat = new URL(tautan.href, window.location.href);
      if (!["http:", "https:", "file:"].includes(alamat.protocol)) return;
      if (alamat.origin !== window.location.origin || alamat.href.includes("#")) return;
      if (!alamat.pathname.toLowerCase().endsWith(".html")) return;

      event.preventDefault();
      if (tujuan) return;

      window.clearTimeout(timer);
      window.cancelAnimationFrame(frame);
      tujuan = alamat;
      akar.classList.remove("masuk-transisi");
      panel.classList.remove("panel-membuka");
      panel.classList.add("panel-menutup");
      timer = window.setTimeout(pindah, 400);
    });

    gerakanMinimal.addEventListener("change", () => {
      if (!gerakanMinimal.matches) return;
      if (tujuan) pindah();
      else pulihkan();
    });

    window.addEventListener("pagehide", pulihkan);
    window.addEventListener("pageshow", (event) => {
      if (event.persisted) {
        hapusPenanda();
        pulihkan();
      }
    });
  }

  // Mulai setiap fitur secara terpisah agar fitur lain tetap berjalan jika satu gagal.
  function inisialisasi() {
    for (const fitur of [
      siapkanHero,
      siapkanEfekKetik,
      siapkanReveal,
      siapkanTimeline,
      siapkanAnimasiFilter,
      siapkanPenunjuk,
      siapkanKursor,
      siapkanMagnet,
      siapkanGuling,
      siapkanPratinjau,
      siapkanTransisiHalaman
    ]) {
      try {
        fitur();
      } catch (galat) {
        console.error(`Gagal memulai ${fitur.name}.`, galat);
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inisialisasi, { once: true });
  } else {
    inisialisasi();
  }
})();