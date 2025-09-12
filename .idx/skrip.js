
import { db } from './firebase.js'; // Import the configured db instance
import { collection, addDoc, onSnapshot, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ===== Element References =====
const imageInput = document.getElementById("imageInput");
const preview = document.getElementById("preview");
const fileInfo = document.getElementById("fileInfo");
const labelInput = document.getElementById("labelInput");
const saveBtn = document.getElementById("saveBtn");
const gallery = document.getElementById("gallery");
const emptyState = document.getElementById("emptyState");
const statusMessage = document.getElementById("statusMessage");

let currentBase64 = null;

// ===== Handle File Selection =====
imageInput.addEventListener("change", function () {
  const file = this.files[0];
  // Check if it's an image file
  if (file && file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = function (e) {
      currentBase64 = e.target.result; // Base64 result
      preview.src = currentBase64;
    };
    reader.readAsDataURL(file);

    fileInfo.textContent = `Nama: ${file.name} | ${(file.size / 1024).toFixed(2)} KB | ${file.type}`;
  } else {
    currentBase64 = null;
    preview.src = "";
    fileInfo.textContent = "";
    showStatus("File tidak valid. Silakan pilih file gambar.", "error");
  }
});

function showStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = "status-message " + type;
  statusMessage.style.display = "block";
  setTimeout(() => {
    statusMessage.style.display = "none";
  }, 5000); // Increased timeout for error visibility
}

// ===== Save to Firestore with Validation =====
saveBtn.addEventListener("click", async () => {
  if (!currentBase64 || !labelInput.value.trim()) {
    showStatus("Mohon pilih gambar dan isi label terlebih dahulu!", "error");
    return;
  }

  // --- Validation Block (Size check removed) ---
  const match = currentBase64.match(/^data:([a-zA-Z0-9\/\+\-.]+);base64,(.+)$/);
  if (!match) {
    showStatus("Format gambar tidak valid. Harap pilih file lain.", "error");
    return;
  }

  const mimeType = match[1];

  // Keep format validation: Allow any image format, block others
  if (!mimeType.startsWith("image/")) {
    showStatus(`Format file tidak diizinkan. Harap unggah file gambar.`, "error");
    return;
  }
  // --- End Validation Block ---

  showStatus("Menyimpan...", "info");

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
    // Display the actual error from Firebase to the user
    showStatus(`Gagal menyimpan: ${e.message}`, "error");
  }
});

// ===== Realtime Gallery Update =====
const wardrobeCollection = collection(db, "wardrobe");
onSnapshot(wardrobeCollection, snapshot => {
  gallery.innerHTML = "";
  const items = [];

  snapshot.forEach(docSnap => {
    items.push({ id: docSnap.id, ...docSnap.data() });
  });

  // Sort by timestamp descending
  items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

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
