"use strict";

// Mengganti tema Bootstrap dan menyimpan pilihan pengguna.
function siapkanTema() {
  const halaman = document.documentElement;
  const tombol = document.getElementById("tombol-tema");
  if (!tombol) return;

  // Status tombol mengikuti tema yang sudah diterapkan oleh skrip di head.
  function perbaruiTombol() {
    const gelap = halaman.getAttribute("data-bs-theme") === "dark";
    tombol.textContent = gelap ? "Mode terang" : "Mode gelap";
    tombol.setAttribute("aria-pressed", String(gelap));
  }

  perbaruiTombol();

  tombol.addEventListener("click", () => {
    const gelap = halaman.getAttribute("data-bs-theme") === "dark";
    const temaBaru = gelap ? "light" : "dark";

    halaman.setAttribute("data-bs-theme", temaBaru);
    perbaruiTombol();

    try {
      localStorage.setItem("tema", temaBaru);
    } catch {
      // Tema tetap berlaku di halaman ini jika penyimpanan diblokir.
    }
  });
}

// Menampilkan proyek sesuai kategori tombol yang dipilih.
function siapkanFilterProyek() {
  const daftar = document.getElementById("daftar-proyek");
  const tombolFilter = document.querySelectorAll("button[data-filter]");
  if (!daftar || tombolFilter.length === 0) return;

  const proyek = daftar.querySelectorAll("article[data-kategori]");

  // Class active dan aria-pressed menandai kategori yang sedang dipakai.
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
  }

  for (const tombol of tombolFilter) {
    tombol.addEventListener("click", () => pilihKategori(tombol));
  }
}

// Menyiapkan satu carousel yang isinya dapat diganti setiap kali proyek dibuka.
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

  // Nomor indikator selalu dihitung dari gambar yang masih tersedia.
  function perbaruiNavigasi() {
    const slide = Array.from(wadah.children);
    const banyakGambar = slide.length > 1;
    const kosong = slide.length === 0;
    const tombolBaru = document.createDocumentFragment();

    slide.forEach((item, indeks) => {
      const aktif = item.classList.contains("active");
      const tombol = document.createElement("button");

      tombol.type = "button";
      tombol.setAttribute("data-bs-target", "#carousel-proyek");
      tombol.setAttribute("data-bs-slide-to", String(indeks));
      tombol.setAttribute("aria-label", `Tampilkan gambar ${indeks + 1} dari ${slide.length}`);

      if (aktif) {
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

  // Hapus slide yang gambarnya gagal dimuat setelah transisi Bootstrap selesai.
  function bersihkanGambarGagal() {
    if (sedangBergeser) return;

    const gagal = wadah.querySelectorAll('[data-gagal="true"]');
    if (!gagal.length) return;

    for (const item of gagal) {
      item.remove();
    }

    // Jika gambar aktif gagal, tampilkan gambar pertama yang tersisa.
    if (!wadah.querySelector(".active") && wadah.firstElementChild) {
      wadah.firstElementChild.classList.add("active");
    }

    perbaruiNavigasi();
  }

  // Buat gambar dan pasang penanganan kesalahan sebelum memberi alamat src.
  function buatSlide(path, teksAlt, pertama) {
    const item = document.createElement("div");
    item.className = "carousel-item text-center";
    if (pertama) item.classList.add("active");

    const gambar = document.createElement("img");
    gambar.className = "img-fluid d-block mx-auto";
    gambar.alt = teksAlt;
    gambar.loading = "lazy";

    gambar.onerror = () => {
      // Abaikan hasil pemuatan lama jika pengguna sudah membuka proyek lain.
      if (item.parentElement !== wadah) return;

      gambar.classList.add("d-none");
      item.dataset.gagal = "true";
      bersihkanGambarGagal();
    };

    item.append(gambar);
    gambar.src = path;
    return item;
  }

  // Mulai kembali dari gambar pertama, termasuk saat proyek yang sama dibuka ulang.
  function isiGaleri(data) {
    if (sedangBergeser) {
      dataMenunggu = data;
      return;
    }

    // Buang posisi aktif yang disimpan Bootstrap untuk proyek sebelumnya.
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
      // Pengunjung dapat memakai panah, indikator, keyboard, atau usapan jari.
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

// Mengisi modal Bootstrap dari artikel yang tombol Lihat detail-nya diklik.
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

  // Kosongkan alamat lama agar tautan selalu sesuai dengan proyek yang terbuka.
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

    // Figma adalah alat desain app-food. NusaEco belum memiliki data teknologi.
    labelTeknologi.textContent = data.kategori === "Desain" ? "Alat" : "Teknologi";
    teknologi.textContent = data.teknologi || "";
    labelTeknologi.classList.toggle("d-none", !data.teknologi);
    teknologi.classList.toggle("d-none", !data.teknologi);

    aturTautan(repo, data.repo);
    aturTautan(prototipe, data.prototipe);
    isiGaleri(data);
  });
}

// Memeriksa form Kontak dan menampilkan hasil dengan gaya validasi Bootstrap.
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

  // Spasi di awal dan akhir tidak dihitung sebagai isi nama atau pesan.
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

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    status.classList.add("d-none");

    for (const kolom of semuaKolom) {
      periksaKolom(kolom);
    }

    form.classList.add("was-validated");

    if (!form.checkValidity()) {
      form.querySelector(":invalid")?.focus();
      return;
    }

    // Ini simulasi. Pengiriman sungguhan membutuhkan backend atau layanan form.
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

// Mengisi garis di atas halaman sesuai bagian dokumen yang sudah digulir.
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

// Menampilkan tombol kembali ke atas setelah pengguna menggulir lebih dari 400 piksel.
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

  // Tombol yang tersembunyi juga dilewati saat pengguna menekan Tab.
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

document.addEventListener("DOMContentLoaded", () => {
  siapkanTema();
  siapkanFilterProyek();
  siapkanModalProyek();
  siapkanFormKontak();
  siapkanProgresScroll();
  siapkanKembaliKeAtas();
});