// File ini disiapkan untuk tahap JavaScript.
"use strict";

// Mengikuti tema sistem sampai pengguna memilih tema sendiri.
function siapkanTema() {
  const tombol = document.getElementById("tombol-tema");
  if (!tombol) return;

  const halaman = document.documentElement;
  const sistemGelap = window.matchMedia("(prefers-color-scheme: dark)");
  let pilihan = null;

  try {
    const tersimpan = localStorage.getItem("tema");
    if (tersimpan === "light" || tersimpan === "dark") {
      pilihan = tersimpan;
    }
  } catch {
    // Tema tetap bisa diganti saat penyimpanan browser diblokir.
  }

  // Menyamakan tema halaman, teks tombol, dan status tombol.
  function tampilkanTema() {
    const tema = pilihan || (sistemGelap.matches ? "dark" : "light");
    const gelap = tema === "dark";

    halaman.dataset.theme = tema;
    tombol.textContent = gelap ? "Mode terang" : "Mode gelap";
    tombol.setAttribute("aria-pressed", String(gelap));
  }

  tampilkanTema();
  sistemGelap.addEventListener("change", tampilkanTema);

  tombol.addEventListener("click", () => {
    pilihan = halaman.dataset.theme === "dark" ? "light" : "dark";
    tampilkanTema();

    try {
      localStorage.setItem("tema", pilihan);
    } catch {
      // Pilihan masih berlaku selama halaman ini terbuka.
    }
  });
}

// Membuka dan menutup panel navigasi pada layar kecil.
function siapkanMenu() {
  const tombol = document.getElementById("tombol-menu");
  const panel = document.getElementById("menu");
  if (!tombol || !panel) return;

  const desktop = window.matchMedia("(min-width: 768px)");

  // Satu fungsi menjaga class panel dan status tombol tetap sesuai.
  function aturMenu(terbuka) {
    panel.classList.toggle("is-open", terbuka);
    tombol.setAttribute("aria-expanded", String(terbuka));
  }

  aturMenu(false);

  tombol.addEventListener("click", () => {
    aturMenu(!panel.classList.contains("is-open"));
  });

  panel.addEventListener("click", (event) => {
    if (event.target.closest("a")) aturMenu(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && panel.classList.contains("is-open")) {
      aturMenu(false);
      tombol.focus();
    }
  });

  desktop.addEventListener("change", () => {
    aturMenu(false);
  });
}

// Memeriksa isian form dan menampilkan hasilnya di halaman Kontak.
function siapkanFormKontak() {
  const form = document.getElementById("form-kontak");
  if (!form) return;

  const tombol = form.querySelector('button[type="submit"]');
  if (!tombol) return;

  const aturan = [
    {
      id: "nama",
      valid: (nilai) => nilai.length >= 3,
      pesan: "Tulis nama dengan minimal 3 karakter."
    },
    {
      id: "email",
      valid: (nilai) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nilai),
      pesan: "Tulis alamat email yang lengkap, misalnya nama@contoh.com."
    },
    {
      id: "pesan",
      valid: (nilai) => nilai.length >= 10,
      pesan: "Tulis pesan dengan minimal 10 karakter."
    }
  ];

  const kolom = aturan.map((item) => ({
    ...item,
    input: form.elements.namedItem(item.id),
    error: document.getElementById(`error-${item.id}`)
  }));

  if (kolom.some((item) => !item.input || !item.error)) return;

  const status = document.createElement("p");
  status.setAttribute("role", "status");
  form.after(status);

  // Elemen pesan dibuat saat dibutuhkan agar form kosong tetap ringkas.
  status.hidden = true;
  form.noValidate = true;
  tombol.disabled = false;

  // Menampilkan hasil pemeriksaan di bawah kolom yang bersangkutan.
  function periksa(item) {
    const benar = item.valid(item.input.value.trim());
    item.input.setAttribute("aria-invalid", String(!benar));
    item.error.textContent = benar ? "" : item.pesan;
    return benar;
  }

  for (const item of kolom) {
    item.input.addEventListener("blur", () => {
      periksa(item);
    });

    item.input.addEventListener("input", () => {
      status.textContent = "";
      status.hidden = true;

      if (item.input.getAttribute("aria-invalid") === "true") {
        periksa(item);
      }
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    status.textContent = "";
    status.hidden = true;

    const salah = kolom.filter((item) => !periksa(item));
    if (salah.length > 0) {
      salah[0].input.focus();
      return;
    }

    // Ini simulasi. Pengiriman sungguhan membutuhkan backend atau layanan form.
    form.reset();
    for (const item of kolom) {
      item.input.removeAttribute("aria-invalid");
      item.error.textContent = "";
    }

    status.hidden = false;
    status.textContent = "Terima kasih, pesanmu sudah tercatat.";
  });
}

// Mengelola dialog StokKu, termasuk fokus, latar, dan scroll halaman.
function siapkanModalProyek() {
  const pembuka = document.getElementById("tombol-detail");
  const dialog = document.getElementById("detail-stokku");
  if (!pembuka || !dialog) return;

  const penutup = dialog.querySelector('form[method="dialog"] button');
  if (!penutup) return;

  let overflowSebelumnya = "";
  let mulaiDiLatar = false;
  dialog.setAttribute("aria-hidden", "true");

  // Klik pada padding dialog tetap dihitung sebagai klik di dalam kotak.
  function diLuarKotak(event) {
    const kotak = dialog.getBoundingClientRect();
    return event.clientX < kotak.left || event.clientX > kotak.right ||
      event.clientY < kotak.top || event.clientY > kotak.bottom;
  }

  pembuka.addEventListener("click", () => {
    if (dialog.open) return;

    overflowSebelumnya = document.body.style.overflow;
    dialog.setAttribute("aria-hidden", "false");
    dialog.showModal();
    dialog.classList.add("is-open");
    document.body.style.overflow = "hidden";
    penutup.focus();
  });

  dialog.addEventListener("pointerdown", (event) => {
    mulaiDiLatar = event.target === dialog && diLuarKotak(event);
  });

  dialog.addEventListener("click", (event) => {
    if (mulaiDiLatar && event.target === dialog && diLuarKotak(event)) {
      dialog.close();
    }
    mulaiDiLatar = false;
  });

  dialog.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;

    const bisaDifokuskan = dialog.querySelectorAll("a[href], button:enabled");
    const pertama = bisaDifokuskan[0];
    const terakhir = bisaDifokuskan[bisaDifokuskan.length - 1];

    if (event.shiftKey && document.activeElement === pertama) {
      event.preventDefault();
      terakhir.focus();
    } else if (!event.shiftKey && document.activeElement === terakhir) {
      event.preventDefault();
      pertama.focus();
    }
  });

  // Escape dan tombol dalam form method="dialog" menutup dialog secara bawaan.
  dialog.addEventListener("close", () => {
    dialog.classList.remove("is-open");
    document.body.style.overflow = overflowSebelumnya;
    pembuka.focus();
    dialog.setAttribute("aria-hidden", "true");
    mulaiDiLatar = false;
  });
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

  // Font, gambar, dan pesan validasi dapat mengubah tinggi dokumen.
  if ("ResizeObserver" in window) {
    const pengamat = new ResizeObserver(perbaruiProgres);
    pengamat.observe(document.body);
  }
}

// Menampilkan tombol kembali ke atas setelah pengguna menggulir 400 piksel.
function siapkanKembaliKeAtas() {
  let tombol = document.getElementById("kembali-ke-atas");

  if (!tombol) {
    tombol = document.createElement("button");
    tombol.type = "button";
    tombol.id = "kembali-ke-atas";
    tombol.textContent = "Kembali ke atas";
    document.body.append(tombol);
  }

  const kurangiGerakan = window.matchMedia("(prefers-reduced-motion: reduce)");

  // Style awal tombol memakai inline-grid, jadi display diatur saat disembunyikan.
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
  siapkanMenu();
  siapkanFormKontak();
  siapkanModalProyek();
  siapkanProgresScroll();
  siapkanKembaliKeAtas();
});