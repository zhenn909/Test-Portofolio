// Mengatur tema, filter proyek, modal, galeri, form kontak, dan kontrol scroll.
"use strict";

// Hubungkan tombol tema di semua halaman lewat satu pendengar klik.
function inisialisasiTema() {
  const akar = document.documentElement;
  const selector = "[data-tema-toggle]";
  const gerakanMinimal = window.matchMedia("(prefers-reduced-motion: reduce)");
  let timer = 0;
  let transisi = null;

  // Sesuaikan teks dan status tombol dengan tema halaman.
  function perbaruiTombol() {
    const gelap = akar.dataset.bsTheme === "dark";

    for (const tombol of document.querySelectorAll(selector)) {
      tombol.textContent = gelap ? "Mode terang" : "Mode gelap";
      tombol.setAttribute("aria-pressed", String(gelap));
    }
  }

  // Terapkan pilihan pengguna dan simpan jika penyimpanan lokal tersedia.
  function terapkan(tema) {
    akar.dataset.bsTheme = tema;
    perbaruiTombol();

    try {
      localStorage.setItem("tema", tema);
    } catch {
      // Tema tetap berlaku selama halaman ini terbuka.
    }
  }

  // Gunakan transisi warna CSS jika efek lingkaran tidak tersedia.
  function gantiDenganWarna(tema) {
    window.clearTimeout(timer);
    akar.classList.toggle("tema-berpindah", !gerakanMinimal.matches);
    terapkan(tema);

    timer = window.setTimeout(() => {
      akar.classList.remove("tema-berpindah");
    }, 500);
  }

  // Buka tema baru dari tengah tombol sampai ke sudut layar terjauh.
  async function gantiTema(tombol) {
    if (transisi) return;

    const tema = akar.dataset.bsTheme === "dark" ? "light" : "dark";

    if (gerakanMinimal.matches || !document.startViewTransition || !akar.animate) {
      gantiDenganWarna(tema);
      return;
    }

    const kotak = tombol.getBoundingClientRect();
    const x = kotak.left + kotak.width / 2;
    const y = kotak.top + kotak.height / 2;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    try {
      transisi = document.startViewTransition(() => terapkan(tema));
      await transisi.ready;

      if (!gerakanMinimal.matches) {
        akar.animate({
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${radius}px at ${x}px ${y}px)`
          ]
        }, {
          duration: 600,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)"
        });
      }
    } catch {
      transisi?.skipTransition();

      if (akar.dataset.bsTheme !== tema) {
        gantiDenganWarna(tema);
      }
    } finally {
      if (transisi) await transisi.finished;
      transisi = null;
    }
  }

  gerakanMinimal.addEventListener("change", () => {
    if (gerakanMinimal.matches) {
      akar.classList.remove("tema-berpindah");
      transisi?.skipTransition();
    }
  });

  perbaruiTombol();

  // Baca kembali pilihan tema saat pengguna kembali lewat tombol Back.
  window.addEventListener("pageshow", () => {
    try {
      const tema = localStorage.getItem("tema");

      if (tema === "light" || tema === "dark") {
        akar.dataset.bsTheme = tema;
      }
    } catch {
      // Gunakan tema yang sudah diterapkan pada halaman.
    }

    perbaruiTombol();
  });

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;

    const tombol = event.target.closest(selector);
    if (tombol) gantiTema(tombol);
  });
}

// Saring kelima proyek dan hitung baris yang terlihat pada bagian Proyek lainnya.
function siapkanFilterProyek() {
  const daftar = document.getElementById("daftar-proyek");
  const tombolFilter = document.querySelectorAll("button[data-filter]");
  if (!daftar || tombolFilter.length === 0) return;

  const indeks = document.getElementById("indeks-proyek");
  const jumlah = document.getElementById("jumlah-lainnya");
  const proyek = daftar.querySelectorAll("article[data-kategori]");

  // Pertahankan nomor asli setiap proyek saat kategori berubah.
  function pilihKategori(tombolPilihan) {
    const kategori = tombolPilihan.dataset.filter;

    for (const tombol of tombolFilter) {
      const aktif = tombol === tombolPilihan;
      tombol.classList.toggle("active", aktif);
      tombol.setAttribute("aria-pressed", String(aktif));
    }

    for (const artikel of proyek) {
      const cocok = kategori === "Semua" || artikel.dataset.kategori === kategori;
      artikel.classList.toggle("d-none", !cocok);
    }

    if (indeks && jumlah) {
      // StokKu berada di luar indeks, jadi tidak masuk hitungan ini.
      const total = indeks.querySelectorAll("article:not(.d-none)").length;
      jumlah.textContent = String(total);
      indeks.hidden = total === 0;
    }
  }

  for (const tombol of tombolFilter) {
    tombol.addEventListener("click", () => pilihKategori(tombol));
  }
}

// Siapkan satu carousel untuk semua proyek yang ditampilkan di modal.
function siapkanGaleriProyek(modal) {
  const carousel = modal.querySelector("#carousel-proyek");
  const wadah = modal.querySelector("#modal-gambar");
  const indikator = modal.querySelector("#indikator-gambar");
  const pesanKosong = modal.querySelector("#galeri-kosong");
  if (!carousel || !wadah || !indikator || !pesanKosong) return null;

  const sebelumnya = carousel.querySelector(".carousel-control-prev");
  const berikutnya = carousel.querySelector(".carousel-control-next");
  if (!sebelumnya || !berikutnya) return null;

  let sedangBergeser = false;
  let dataMenunggu = null;

  // Sesuaikan indikator dan tombol navigasi dengan jumlah gambar yang tersedia.
  function perbaruiNavigasi() {
    const slide = Array.from(wadah.children);
    const banyakGambar = slide.length > 1;
    const kosong = slide.length === 0;
    const tombolBaru = document.createDocumentFragment();

    slide.forEach((item, indeks) => {
      const tombol = document.createElement("button");
      tombol.type = "button";
      tombol.setAttribute("data-bs-target", "#carousel-proyek");
      tombol.setAttribute("data-bs-slide-to", String(indeks));
      tombol.setAttribute("aria-label", `Tampilkan gambar ${indeks + 1} dari ${slide.length}`);

      if (item.classList.contains("active")) {
        tombol.classList.add("active");
        tombol.setAttribute("aria-current", "true");
      }

      tombolBaru.append(tombol);
    });

    indikator.replaceChildren(tombolBaru);
    indikator.classList.toggle("d-none", !banyakGambar);
    sebelumnya.classList.toggle("d-none", !banyakGambar);
    berikutnya.classList.toggle("d-none", !banyakGambar);
    carousel.classList.toggle("d-none", kosong);
    pesanKosong.classList.toggle("d-none", !kosong);
  }

  // Tunggu perpindahan slide selesai sebelum menghapus gambar yang gagal dimuat.
  function bersihkanGambarGagal() {
    if (sedangBergeser) return;

    const gagal = wadah.querySelectorAll('[data-gagal="true"]');
    if (gagal.length === 0) return;

    for (const item of gagal) {
      item.remove();
    }

    if (!wadah.querySelector(".active") && wadah.firstElementChild) {
      wadah.firstElementChild.classList.add("active");
    }

    perbaruiNavigasi();
  }

  // Buat slide dari alamat gambar dan teks alternatif yang tersimpan di HTML.
  function buatSlide(path, teksAlt, pertama) {
    const item = document.createElement("div");
    item.className = "carousel-item text-center";
    if (pertama) item.classList.add("active");

    const gambar = document.createElement("img");
    gambar.className = "img-fluid d-block mx-auto";
    gambar.alt = teksAlt;
    gambar.loading = "lazy";

    gambar.onerror = () => {
      // Abaikan gambar lama jika pengguna sudah membuka proyek lain.
      if (item.parentElement !== wadah) return;

      gambar.classList.add("d-none");
      item.dataset.gagal = "true";
      bersihkanGambarGagal();
    };

    item.append(gambar);
    gambar.src = path;
    return item;
  }

  // Isi ulang galeri dan mulai dari gambar pertama setiap kali modal dibuka.
  function isiGaleri(data) {
    if (sedangBergeser) {
      dataMenunggu = data;
      return;
    }

    const galeriLama = bootstrap.Carousel.getInstance(carousel);
    if (galeriLama) galeriLama.dispose();

    const sumber = (data.gambar || "")
      .split(",")
      .map((path) => path.trim())
      .filter(Boolean);

    const keterangan = (data.alt || "").split("|");
    const isi = document.createDocumentFragment();

    sumber.forEach((path, indeks) => {
      const teksAlt = keterangan[indeks]?.trim() || `Gambar ${indeks + 1} proyek ${data.judul}`;
      isi.append(buatSlide(path, teksAlt, indeks === 0));
    });

    wadah.replaceChildren(isi);
    perbaruiNavigasi();

    if (sumber.length > 1) {
      bootstrap.Carousel.getOrCreateInstance(carousel, {
        interval: false,
        ride: false,
        touch: true
      });
    }
  }

  carousel.addEventListener("slide.bs.carousel", () => {
    sedangBergeser = true;
  });

  carousel.addEventListener("slid.bs.carousel", () => {
    sedangBergeser = false;

    if (dataMenunggu) {
      const data = dataMenunggu;
      dataMenunggu = null;
      isiGaleri(data);
    } else {
      bersihkanGambarGagal();
    }
  });

  return isiGaleri;
}

// Isi modal Bootstrap dari artikel yang dipilih pengguna.
function siapkanModalProyek() {
  const modal = document.getElementById("modal-proyek");
  if (!modal) return;

  const judul = modal.querySelector("#modal-judul");
  const deskripsi = modal.querySelector("#modal-deskripsi");
  const kategori = modal.querySelector("#modal-kategori");
  const labelTeknologi = modal.querySelector("#label-teknologi");
  const teknologi = modal.querySelector("#modal-teknologi");
  const status = modal.querySelector("#modal-status");
  const catatan = modal.querySelector("#modal-catatan");
  const repo = modal.querySelector("#modal-repo");
  const prototipe = modal.querySelector("#modal-prototipe");

  if (!judul || !deskripsi || !kategori || !labelTeknologi || !teknologi ||
      !status || !catatan || !repo || !prototipe) return;

  const isiGaleri = siapkanGaleriProyek(modal);
  if (!isiGaleri) return;

  // Hapus alamat proyek sebelumnya jika proyek berikutnya tidak punya tautan.
  function aturTautan(tautan, alamat) {
    if (alamat) {
      tautan.href = alamat;
      tautan.classList.remove("d-none");
    } else {
      tautan.classList.add("d-none");
      tautan.removeAttribute("href");
    }
  }

  modal.addEventListener("show.bs.modal", (event) => {
    const artikel = event.relatedTarget?.closest("article[data-kategori]");

    if (!artikel) {
      event.preventDefault();
      return;
    }

    const data = artikel.dataset;

    judul.textContent = data.judul;
    deskripsi.textContent = data.deskripsi;
    kategori.textContent = data.kategori;
    status.textContent = data.status;
    catatan.textContent = data.catatan || "";
    catatan.classList.toggle("d-none", !data.catatan);

    labelTeknologi.textContent = data.kategori === "Desain" ? "Alat" : "Teknologi";
    teknologi.textContent = data.teknologi || "";
    labelTeknologi.classList.toggle("d-none", !data.teknologi);
    teknologi.classList.toggle("d-none", !data.teknologi);

    aturTautan(repo, data.repo);
    aturTautan(prototipe, data.prototipe);
    isiGaleri(data);
  });
}

// Coba salin teks lewat kolom sementara jika API clipboard tidak tersedia.
function salinDenganKolomSementara(teks) {
  const fokusAwal = document.activeElement;
  const kolom = document.createElement("textarea");

  kolom.value = teks;
  kolom.readOnly = true;
  kolom.tabIndex = -1;
  kolom.setAttribute("aria-label", "Alamat email untuk disalin");
  kolom.className = "visually-hidden position-fixed";
  document.body.append(kolom);

  try {
    kolom.focus({ preventScroll: true });
    kolom.select();
    kolom.setSelectionRange(0, kolom.value.length);
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    kolom.remove();

    if (fokusAwal instanceof HTMLElement) {
      fokusAwal.focus({ preventScroll: true });
    }
  }
}

// Salin alamat email dan umumkan hasilnya lewat tombol dan toast Bootstrap.
function siapkanSalinEmail() {
  const tombol = document.getElementById("salin-email");
  const tautan = document.getElementById("alamat-email");
  const elemenToast = document.getElementById("toast-salin-email");
  if (!tombol || !tautan || !elemenToast) return;

  const isiToast = elemenToast.querySelector(".toast-body");
  if (!isiToast) return;

  const label = tombol.querySelector("[data-label-salin]");
  let timerLabel = 0;
  const toast = bootstrap.Toast.getOrCreateInstance(elemenToast);
  const tujuan = tautan.getAttribute("href");
  if (!tujuan || !tujuan.startsWith("mailto:")) return;

  // Ambil alamat dari mailto agar teks dekoratif tidak ikut tersalin.
  const alamat = tujuan.slice("mailto:".length).split("?")[0];

  tombol.addEventListener("click", async () => {
    let tersalin = false;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(alamat);
        tersalin = true;
      }
    } catch {
      // Coba cara cadangan jika izin clipboard ditolak.
    }

    if (!tersalin) {
      tersalin = salinDenganKolomSementara(alamat);
    }

    isiToast.textContent = tersalin
      ? "Email disalin."
      : "Email belum tersalin. Pilih alamat email lalu salin secara manual.";

    if (label && tersalin) {
      window.clearTimeout(timerLabel);
      label.textContent = "Tersalin";

      timerLabel = window.setTimeout(() => {
        label.textContent = "Salin email";
      }, 1600);
    }

    toast.show();
  });
}

// Periksa isi form dan tampilkan status pengiriman setelah semua kolom valid.
function siapkanFormKontak() {
  const form = document.getElementById("form-kontak");
  const status = document.getElementById("status-form");
  if (!form || !status) return;

  const nama = form.elements.namedItem("nama");
  const email = form.elements.namedItem("email");
  const pesan = form.elements.namedItem("pesan");
  const tombol = form.querySelector('button[type="submit"]');
  if (!nama || !email || !pesan || !tombol) return;

  const semuaKolom = [nama, email, pesan];
  const polaEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Periksa isi setelah spasi di awal dan akhir disisihkan.
  function periksaKolom(kolom) {
    const nilai = kolom.value.trim();
    let kesalahan = "";

    if (kolom === email) {
      if (!polaEmail.test(nilai)) {
        kesalahan = "Tulis alamat email yang lengkap.";
      }
    } else if (nilai.length < kolom.minLength) {
      kesalahan = `Isi minimal ${kolom.minLength} karakter.`;
    }

    kolom.setCustomValidity(kesalahan);
    const valid = kolom.validity.valid;

    kolom.setAttribute("aria-invalid", String(!valid));
    kolom.classList.toggle("is-invalid", !valid);
    return valid;
  }

  for (const kolom of semuaKolom) {
    kolom.addEventListener("blur", () => periksaKolom(kolom));

    kolom.addEventListener("input", () => {
      status.classList.add("d-none");

      const pernahDiperiksa = kolom.hasAttribute("aria-invalid");
      if (pernahDiperiksa || form.classList.contains("was-validated")) {
        periksaKolom(kolom);
      }
    });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (tombol.disabled) return;

    status.classList.add("d-none");

    for (const kolom of semuaKolom) {
      periksaKolom(kolom);
    }

    form.classList.add("was-validated");

    if (!form.checkValidity()) {
      form.querySelector(":invalid")?.focus();
      return;
    }

    // Ini simulasi lokal. Pengiriman sungguhan memerlukan backend atau layanan form.
    tombol.disabled = true;
    tombol.setAttribute("aria-busy", "true");

    // Simpan elemen label agar efek teks berguling bisa dipakai lagi setelah selesai.
    const isiTombol = Array.from(tombol.childNodes);
    const spinner = document.createElement("span");
    spinner.className = "spinner-border spinner-border-sm me-2";
    spinner.setAttribute("aria-hidden", "true");
    tombol.replaceChildren(spinner, "Mengirim...");

    await new Promise((selesai) => window.setTimeout(selesai, 700));

    tombol.replaceChildren(...isiTombol);
    tombol.removeAttribute("aria-busy");
    tombol.disabled = false;

    form.reset();
    form.classList.remove("was-validated");

    for (const kolom of semuaKolom) {
      kolom.setCustomValidity("");
      kolom.removeAttribute("aria-invalid");
      kolom.classList.remove("is-invalid");
    }

    status.classList.remove("d-none");
  });

  tombol.disabled = false;
}

// Isi garis di atas halaman sesuai bagian dokumen yang sudah digulir.
function siapkanProgresScroll() {
  let bar = document.getElementById("progress-scroll");

  if (!bar) {
    bar = document.createElement("div");
    bar.id = "progress-scroll";
    document.body.append(bar);
  }

  bar.setAttribute("aria-hidden", "true");

  // CSS memakai angka 0 sampai 1 untuk mengatur panjang garis.
  function perbaruiProgres() {
    const halaman = document.documentElement;
    const jarak = halaman.scrollHeight - halaman.clientHeight;
    const bagian = jarak > 0 ? window.scrollY / jarak : 0;
    bar.style.setProperty("--progres", Math.min(1, Math.max(0, bagian)));
  }

  perbaruiProgres();
  window.addEventListener("scroll", perbaruiProgres, { passive: true });
  window.addEventListener("resize", perbaruiProgres);
  window.addEventListener("pageshow", perbaruiProgres);

  if ("ResizeObserver" in window) {
    const pengamat = new ResizeObserver(perbaruiProgres);
    pengamat.observe(document.body);
  }
}

// Tampilkan tombol kembali ke atas setelah halaman digulir lebih dari 400 piksel.
function siapkanKembaliKeAtas() {
  let tombol = document.getElementById("kembali-ke-atas");

  if (!tombol) {
    tombol = document.createElement("button");
    tombol.type = "button";
    tombol.id = "kembali-ke-atas";
    tombol.className = "btn btn-outline-secondary bg-body";
    tombol.textContent = "Kembali ke atas";
    document.body.append(tombol);
  }

  const kurangiGerakan = window.matchMedia("(prefers-reduced-motion: reduce)");

  // Saat tersembunyi, tombol juga dilewati ketika pengguna menekan Tab.
  function perbaruiTombol() {
    tombol.style.display = window.scrollY > 400 ? "" : "none";
  }

  tombol.addEventListener("click", () => {
    const utama = document.getElementById("utama");
    if (utama) utama.focus({ preventScroll: true });

    window.scrollTo({
      top: 0,
      behavior: kurangiGerakan.matches ? "instant" : "smooth"
    });
  });

  perbaruiTombol();
  window.addEventListener("scroll", perbaruiTombol, { passive: true });
  window.addEventListener("pageshow", perbaruiTombol);
}

// Mulai dari tema. Jika satu fitur gagal disiapkan, lanjutkan ke fitur berikutnya.
document.addEventListener("DOMContentLoaded", () => {
  for (const fitur of [
    inisialisasiTema,
    siapkanFilterProyek,
    siapkanModalProyek,
    siapkanFormKontak,
    siapkanSalinEmail,
    siapkanProgresScroll,
    siapkanKembaliKeAtas
  ]) {
    try {
      fitur();
    } catch (galat) {
      console.error(`Gagal memulai ${fitur.name}.`, galat);
    }
  }
});