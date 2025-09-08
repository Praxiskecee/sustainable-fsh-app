
import { db } from './firebase.js'; // Import the configured db instance
import { collection, addDoc, onSnapshot, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const imageInput = document.getElementById("imageInput");
const preview = document.getElementById("preview");
const fileInfo = document.getElementById("fileInfo");
const labelInput = document.getElementById("labelInput");
const saveBtn = document.getElementById("saveBtn");
const gallery = document.getElementById("gallery");
const emptyState = document.getElementById("emptyState");
const statusMessage = document.getElementById("statusMessage");

let currentBase64 = null;

// ===== Handle Pilih File =====
imageInput.addEventListener("change", function () {
  const file = this.files[0];
  if (file && file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = function (e) {
      currentBase64 = e.target.result; // hasil base64
      preview.src = currentBase64;
    };
    reader.readAsDataURL(file);

    fileInfo.textContent = `Nama: ${file.name} | ${(file.size / 1024).toFixed(2)} KB | ${file.type}`;
    emptyState.style.display = "none";
  } else {
    showStatus("Silakan pilih file gambar yang valid.", "error");
  }
});

function showStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = "status-message " + type;
  statusMessage.style.display = "block";
  setTimeout(() => {
    statusMessage.style.display = "none";
  }, 4000);
}

// ===== Simpan ke Firestore =====
saveBtn.addEventListener("click", async () => {
  if (!currentBase64 || !labelInput.value.trim()) {
    showStatus("Mohon pilih gambar dan isi label terlebih dahulu!", "error");
    return;
  }

  try {
    await addDoc(collection(db, "wardrobe"), {
      imageBase64: currentBase64,
      label: labelInput.value.trim(),
      timestamp: new Date().toISOString()
    });

    showStatus("Item berhasil disimpan!", "success");

    // Reset form
    labelInput.value = "";
    imageInput.value = "";
    preview.src = "";
    fileInfo.textContent = "";
    currentBase64 = null;
  } catch (e) {
    console.error("Error adding document:", e);
    showStatus("Gagal menyimpan item. Silakan coba lagi.", "error");
  }
});

// ===== Realtime Gallery =====
const wardrobeCollection = collection(db, "wardrobe");
onSnapshot(wardrobeCollection, snapshot => {
  gallery.innerHTML = "";
  const items = [];

  snapshot.forEach(docSnap => {
    items.push({ id: docSnap.id, ...docSnap.data() });
  });

  emptyState.style.display = items.length === 0 ? "block" : "none";

  items.forEach(item => {
    const div = document.createElement("div");
    div.classList.add("item");
    div.innerHTML = `
      <img src="${item.imageBase64}" alt="${item.label}">
      <p>${item.label}</p>
      <div class="actions">
        <button class="delete-btn" data-id="${item.id}">Hapus</button>
      </div>
    `;
    gallery.appendChild(div);
  });

  document.querySelectorAll(".delete-btn").forEach(button => {
    button.addEventListener("click", () => deleteItem(button.getAttribute("data-id")));
  });
});

// ===== Delete Item =====
async function deleteItem(docId) {
  if (!confirm("Apakah Anda yakin ingin menghapus item ini?")) return;

  try {
    await deleteDoc(doc(db, "wardrobe", docId));
    showStatus("Item berhasil dihapus!", "success");
  } catch (e) {
    console.error("Error removing document:", e);
    showStatus("Gagal menghapus item.", "error");
  }
}
