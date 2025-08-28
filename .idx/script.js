const fileInput = document.getElementById("fileInput");
const saveBtn = document.getElementById("saveBtn");
const gallery = document.getElementById("gallery");

saveBtn.addEventListener("click", () => {
  const file = fileInput.files[0];
  if (!file) {
    alert("Pilih gambar dulu!");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    // buat element img
    const img = document.createElement("img");
    img.src = e.target.result;

    // masukkan ke gallery
    gallery.appendChild(img);

    // opsional: simpan ke localStorage
    let savedImages = JSON.parse(localStorage.getItem("gallery")) || [];
    savedImages.push(e.target.result);
    localStorage.setItem("gallery", JSON.stringify(savedImages));
  };
  reader.readAsDataURL(file);
});

// saat halaman dibuka ulang, load dari localStorage
window.addEventListener("load", () => {
  let savedImages = JSON.parse(localStorage.getItem("gallery")) || [];
  savedImages.forEach(src => {
    const img = document.createElement("img");
    img.src = src;
    gallery.appendChild(img);
  });
});
