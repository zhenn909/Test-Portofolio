"use strict";

(() => {
  const gerakanMinimal = window.matchMedia("(prefers-reduced-motion: reduce)");
  const mouseHalus = window.matchMedia("(hover: hover) and (pointer: fine)");

  // Membagi nama menjadi dua baris untuk animasi pertama di Beranda.
  function siapkanJudulHero() {
    const judul = document.querySelector(".hero h1");
    if (!judul || gerakanMinimal.matches) return;

    const kata = judul.textContent.trim().split(/\s+/);
    if (kata.length !== 2) return;

    const isi = document.createDocumentFragment();

    kata.forEach((teks, urutan) => {
      const masker = document.createElement("span");
      masker.className = "masker-judul";

      const baris = document.createElement("span");
      baris.className = "baris-judul";
      baris.style.setProperty("--jeda-judul", `${urutan * 120}ms`);
      baris.textContent = teks;

      masker.append(baris);
      if (urutan > 0) isi.append(" ");
      isi.append(masker);
    });

    judul.replaceChildren(isi);
    judul.classList.add("judul-berbaris");
  }

  // Menampilkan satu kalimat penuh saat pengguna memilih gerakan minimal.
  function siapkanEfekKetik() {
    const tempat = document.getElementById("teks-ketik");
    if (!tempat) return;

    const kalimat = [
      "mahasiswa Sistem Informasi.",
      "yang sedang belajar membuat web.",
      "yang pernah membuat aplikasi stok."
    ];

    const visual = document.createElement("span");
    visual.setAttribute("aria-hidden", "true");

    const bacaan = document.createElement("span");
    bacaan.className = "khusus-pembaca-layar";
    bacaan.textContent = kalimat[0];

    tempat.replaceChildren(visual, bacaan);

    let indeks = 0;
    let panjang = 0;
    let menghapus = false;
    let timer;

    function langkah() {
      const teks = kalimat[indeks];
      panjang += menghapus ? -1 : 1;
      visual.textContent = teks.slice(0, panjang);

      let jeda = menghapus ? 32 : 45 + Math.floor(Math.random() * 46);

      if (panjang === teks.length) {
        menghapus = true;
        jeda = 1700;
      } else if (panjang === 0) {
        menghapus = false;
        indeks = (indeks + 1) % kalimat.length;
        jeda = 300;
      }

      timer = window.setTimeout(langkah, jeda);
    }

    function aturPemutaran() {
      window.clearTimeout(timer);
      tempat.classList.remove("sedang-mengetik");

      if (gerakanMinimal.matches) {
        visual.textContent = kalimat[0];
        return;
      }

      if (document.hidden) return;

      indeks = 0;
      panjang = 0;
      menghapus = false;
      tempat.classList.add("sedang-mengetik");
      langkah();
    }

    gerakanMinimal.addEventListener("change", aturPemutaran);
    document.addEventListener("visibilitychange", aturPemutaran);
    aturPemutaran();
  }

  // Memilih elemen isi dan menentukan gerakan sesuai jenisnya.
  function kumpulkanElemenReveal() {
    const daftar = [];
    const urutanInduk = new Map();

    const kandidat = [
      "[data-reveal]",
      "h1", "h2", "h3", "p", "li", "a[href]",
      "figure", "img", "hr",
      "#form-kontak > div"
    ].join(", ");

    const dikecualikan = [
      "header",
      "dialog",
      '[role="dialog"]',
      "#teks-ketik",
      '[aria-labelledby="judul-perjalanan"] ol',
      '[id^="error-"]',
      '[role="status"]',
      "[aria-live]",
      "[hidden]",
      "script"
    ].join(", ");

    for (const area of document.querySelectorAll("main, body > footer")) {
      for (const elemen of area.querySelectorAll(kandidat)) {
        if (elemen.closest(dikecualikan)) continue;
        if (elemen.matches("p") && !elemen.textContent.trim()) continue;

        // Foto dan keterangannya bergerak bersama dalam satu figure.
        if (elemen.matches("figure img") && !elemen.hasAttribute("data-reveal")) {
          continue;
        }

        if (!elemen.hasAttribute("data-reveal")) {
          let jenis = "naik";

          if (elemen.matches("h1, h2, h3")) {
            jenis = "masker";
          } else if (elemen.matches("li, a")) {
            jenis = "geser";
          } else if (elemen.matches("figure, img")) {
            jenis = "skala";
          } else if (elemen.matches("hr")) {
            jenis = "garis";
          }

          elemen.dataset.reveal = jenis;
        }

        const induk = elemen.parentElement;
        const urutan = urutanInduk.get(induk) || 0;
        urutanInduk.set(induk, urutan + 1);

        const jedaHTML = Number(elemen.dataset.delay);
        const punyaJeda = elemen.hasAttribute("data-delay") && Number.isFinite(jedaHTML);
        const jeda = punyaJeda ? jedaHTML : urutan * 70;
        elemen.style.setProperty("--jeda-reveal", `${Math.min(400, Math.max(0, jeda))}ms`);

        // Isi judul bergerak di dalam masker. Nomor dan ID judul tetap tersedia.
        if (elemen.matches("h1, h2, h3")) {
          const masker = document.createElement("span");
          masker.className = "masker-bagian";

          const baris = document.createElement("span");
          baris.className = "isi-masker-bagian";

          while (elemen.firstChild) baris.append(elemen.firstChild);
          masker.append(baris);
          elemen.append(masker);
        }

        daftar.push(elemen);
      }
    }

    return daftar;
  }

  // Mengulang animasi ketika elemen masuk kembali dari atas atau bawah.
  function siapkanReveal() {
    if (!("IntersectionObserver" in window)) return;

    const elemen = kumpulkanElemenReveal();
    if (!elemen.length) return;

    const akar = document.documentElement;
    let posisiTerakhir = Math.max(0, window.scrollY);
    let arah = "dari-bawah";

    // Listener ini hanya membandingkan posisi scroll, tanpa mengukur elemen.
    function bacaArah() {
      const sekarang = Math.max(0, window.scrollY);
      if (sekarang === posisiTerakhir) return;

      arah = sekarang < posisiTerakhir ? "dari-atas" : "dari-bawah";
      posisiTerakhir = sekarang;
    }

    function pasangArah(item) {
      item.classList.toggle("dari-atas", arah === "dari-atas");
      item.classList.toggle("dari-bawah", arah === "dari-bawah");
    }

    function tampilkan(item) {
      if (item.classList.contains("is-visible")) return;
      bacaArah();
      pasangArah(item);
      item.classList.add("is-visible");
    }

    // Elemen yang lebih tinggi dari layar tetap dapat mulai dianimasikan.
    const pengamatMasuk = new IntersectionObserver((entri) => {
      if (gerakanMinimal.matches) return;

      for (const data of entri) {
        if (!data.isIntersecting) continue;

        const tinggiArea = data.rootBounds?.height || window.innerHeight;
        const tinggiTarget = data.boundingClientRect.height;
        const cukupTerlihat = data.intersectionRatio >= 0.15;
        const terlaluTinggi = tinggiTarget * 0.15 > tinggiArea;

        if (cukupTerlihat || terlaluTinggi) tampilkan(data.target);
      }
    }, {
      threshold: [0, 0.15],
      rootMargin: "0px 0px -10% 0px"
    });

    // Area reset memakai seluruh layar, termasuk 10% terbawah.
    const pengamatKeluar = new IntersectionObserver((entri) => {
      if (gerakanMinimal.matches) return;

      for (const data of entri) {
        if (data.isIntersecting) continue;

        const item = data.target;
        if (item.contains(document.activeElement)) continue;

        item.classList.remove("is-visible");
        // Siapkan sisi masuk berikutnya berdasarkan letak elemen di luar layar.
        const diAtas = data.boundingClientRect.bottom <= 0;
        item.classList.toggle("dari-atas", diAtas);
        item.classList.toggle("dari-bawah", !diAtas);
      }
    }, { threshold: 0 });

    function aturReveal() {
      pengamatMasuk.disconnect();
      pengamatKeluar.disconnect();
      window.removeEventListener("scroll", bacaArah);
      akar.classList.remove("reveal-aktif");

      if (gerakanMinimal.matches) {
        for (const item of elemen) item.classList.add("is-visible");
        return;
      }

      posisiTerakhir = Math.max(0, window.scrollY);
      arah = "dari-bawah";

      // Baca posisi sebelum memasang keadaan awal animasi.
      const posisi = elemen.map((item) => item.getBoundingClientRect());
      const tinggiLayar = document.documentElement.clientHeight;

      elemen.forEach((item, indeks) => {
        item.classList.remove("is-visible");
        pasangArah(item);
        pengamatMasuk.observe(item);
        pengamatKeluar.observe(item);

        const kotak = posisi[indeks];
        if (kotak.bottom > 0 && kotak.top < tinggiLayar) {
          item.classList.add("is-visible");
        }
      });

      // CSS baru mengaktifkan keadaan tersembunyi setelah kedua pengamat siap.
      akar.classList.add("reveal-aktif");
      window.addEventListener("scroll", bacaArah, { passive: true });
    }

    // Tautan atau kolom yang mendapat fokus keyboard langsung dapat dilihat.
    document.addEventListener("focusin", (event) => {
      let item = event.target.closest("[data-reveal]");
      while (item) {
        tampilkan(item);
        item = item.parentElement?.closest("[data-reveal]");
      }
    });

    gerakanMinimal.addEventListener("change", aturReveal);
    aturReveal();
  }

  // Menggambar dan memendekkan garis sesuai posisi scroll pada timeline.
  function siapkanTimeline() {
    const daftar = document.querySelector('[aria-labelledby="judul-perjalanan"] ol');
    if (!daftar || !("IntersectionObserver" in window)) return;

    const item = Array.from(daftar.children);
    if (!item.length) return;

    let frame = 0;
    let aktif = false;
    let posisiTitik = [];
    let pusatTitik = 0;
    let panjangGaris = 0;

    // Jarak antartitik diukur ulang saat tata letak berubah.
    function ukur() {
      if (gerakanMinimal.matches) return;

      const atas = daftar.getBoundingClientRect().top;
      posisiTitik = item.map((baris) => baris.getBoundingClientRect().top - atas);

      const ukuranHuruf = parseFloat(getComputedStyle(item[0]).fontSize);
      const diameter = parseFloat(getComputedStyle(item[0], "::before").width) || 0;

      pusatTitik = ukuranHuruf * 0.55 + diameter / 2;
      panjangGaris = posisiTitik[posisiTitik.length - 1];

      daftar.style.setProperty("--awal-garis", `${pusatTitik}px`);
      daftar.style.setProperty("--panjang-garis", `${panjangGaris}px`);
      gambar();
    }

    function gambar() {
      frame = 0;
      if (gerakanMinimal.matches) return;

      const atas = daftar.getBoundingClientRect().top;
      const batas = window.innerHeight * 0.78 - atas - pusatTitik;
      const bagian = panjangGaris > 0 ? batas / panjangGaris : Number(batas >= 0);
      const progres = Math.min(1, Math.max(0, bagian));

      daftar.style.setProperty("--progres-timeline", progres);

      item.forEach((baris, indeks) => {
        baris.classList.toggle("titik-tercapai", batas >= posisiTitik[indeks]);
      });
    }

    function jadwalkan() {
      if (aktif && !frame) frame = window.requestAnimationFrame(gambar);
    }

    function hentikan() {
      aktif = false;
      window.removeEventListener("scroll", jadwalkan);
      window.cancelAnimationFrame(frame);
      frame = 0;
    }

    const pengamat = new IntersectionObserver(([data]) => {
      if (gerakanMinimal.matches) return;

      if (data.isIntersecting) {
        aktif = true;
        window.addEventListener("scroll", jadwalkan, { passive: true });
        jadwalkan();
      } else {
        hentikan();
        gambar();
      }
    }, { rootMargin: "80px 0px" });

    function aturTimeline() {
      pengamat.disconnect();
      hentikan();
      daftar.classList.toggle("timeline-siap", !gerakanMinimal.matches);

      if (gerakanMinimal.matches) return;

      ukur();
      pengamat.observe(daftar);
    }

    if ("ResizeObserver" in window) {
      const pengamatUkuran = new ResizeObserver(ukur);
      pengamatUkuran.observe(daftar);
    }

    window.addEventListener("resize", ukur);
    window.addEventListener("pageshow", ukur);
    if (document.fonts) document.fonts.ready.then(ukur);

    gerakanMinimal.addEventListener("change", aturTimeline);
    aturTimeline();
  }

  // Membuat penanda mouse hanya setelah gerakan mouse pertama.
  function siapkanKursor() {
    let kursor;
    let frame = 0;
    let terlihat = false;
    let x = 0;
    let y = 0;
    let tujuanX = 0;
    let tujuanY = 0;

    function sembunyikan() {
      terlihat = false;
      window.cancelAnimationFrame(frame);
      frame = 0;
      if (kursor) kursor.classList.remove("terlihat");
    }

    function ikuti() {
      x += (tujuanX - x) * 0.24;
      y += (tujuanY - y) * 0.24;

      const dekat = Math.hypot(tujuanX - x, tujuanY - y) < 0.4;
      if (dekat) {
        x = tujuanX;
        y = tujuanY;
      }

      kursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      frame = dekat ? 0 : window.requestAnimationFrame(ikuti);
    }

    function gerakkan(event) {
      if (event.pointerType !== "mouse") {
        sembunyikan();
        return;
      }

      if (!kursor) {
        kursor = document.createElement("span");
        kursor.className = "kursor-kecil";
        kursor.setAttribute("aria-hidden", "true");
        document.body.append(kursor);
      }

      tujuanX = event.clientX;
      tujuanY = event.clientY;

      if (!terlihat) {
        x = tujuanX;
        y = tujuanY;
        kursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        terlihat = true;
        kursor.classList.add("terlihat");
      }

      const kontrol = event.target.closest("a[href], button:enabled");
      kursor.classList.toggle("di-atas-kontrol", Boolean(kontrol));
      if (!frame) ikuti();
    }

    function aturKursor() {
      if (mouseHalus.matches && !gerakanMinimal.matches) {
        document.addEventListener("pointermove", gerakkan, { passive: true });
      } else {
        document.removeEventListener("pointermove", gerakkan);
        sembunyikan();
      }
    }

    document.documentElement.addEventListener("pointerleave", sembunyikan);
    window.addEventListener("blur", sembunyikan);
    window.addEventListener("pagehide", sembunyikan);
    mouseHalus.addEventListener("change", aturKursor);
    gerakanMinimal.addEventListener("change", aturKursor);
    aturKursor();
  }

  // Menjalankan sapuan hanya untuk navigasi internal antardokumen HTML.
  function siapkanTransisiHalaman() {
    const panel = document.createElement("div");
    panel.className = "panel-halaman";
    panel.setAttribute("aria-hidden", "true");
    document.body.append(panel);

    let tujuan = null;
    let timer;

    function pindah() {
      if (!tujuan) return;

      window.clearTimeout(timer);
      const alamat = tujuan;
      tujuan = null;
      window.location.assign(alamat);
    }

    function pulihkan() {
      window.clearTimeout(timer);
      tujuan = null;
      panel.classList.remove("panel-menutup", "panel-membuka");
    }

    if (!gerakanMinimal.matches) panel.classList.add("panel-membuka");

    panel.addEventListener("animationend", (event) => {
      if (event.animationName === "tutup-halaman") pindah();
      if (event.animationName === "buka-halaman") panel.classList.remove("panel-membuka");
    });

    document.addEventListener("click", (event) => {
      if (gerakanMinimal.matches || event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const tautan = event.target.closest("a[href]");
      if (!tautan || tautan.hasAttribute("download")) return;
      if (tautan.target && tautan.target.toLowerCase() !== "_self") return;

      const alamat = new URL(tautan.href, window.location.href);
      const protokolLokal = ["http:", "https:", "file:"].includes(alamat.protocol);
      if (!protokolLokal || alamat.origin !== window.location.origin) return;
      if (!alamat.pathname.toLowerCase().endsWith(".html") || tautan.href.includes("#")) return;

      event.preventDefault();
      if (tujuan) return;

      tujuan = alamat.href;
      panel.classList.remove("panel-membuka");
      panel.classList.add("panel-menutup");

      // Navigasi tetap berjalan jika animasi CSS tidak selesai.
      timer = window.setTimeout(pindah, 420);
    });

    gerakanMinimal.addEventListener("change", () => {
      if (!gerakanMinimal.matches) return;
      if (tujuan) pindah();
      else pulihkan();
    });

    window.addEventListener("pagehide", pulihkan);
    window.addEventListener("pageshow", (event) => {
      if (event.persisted) pulihkan();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    siapkanJudulHero();
    siapkanEfekKetik();
    siapkanReveal();
    siapkanTimeline();
    siapkanKursor();
    siapkanTransisiHalaman();
  });
})();