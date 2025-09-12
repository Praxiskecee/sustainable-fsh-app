
import { db } from './firebase.js';
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

// ===== Validation Constants =====
// Firestore document limit is 1 MiB (1,048,576 bytes).
// Base64 encoding adds ~33% overhead. So, a safe original file limit is ~750 KB.
const MAX_FILE_SIZE_KB = 750;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_KB * 1024;

let currentFile = null;
let currentBase64 = null;

// ===== Handle File Selection =====
imageInput.addEventListener("change", function () {
  const file = this.files[0];
  if (!file) {
    resetInput();
    return;
  }

  // Frontend Validation
  if (!file.type.startsWith("image/")) {
    showStatus("File tidak valid. Silakan pilih file gambar.", "error");
    resetInput();
    return;
  }
  
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeInKB = (file.size / 1024).toFixed(2);
    showStatus(`Ukuran file (${sizeInKB} KB) melebihi batas ${MAX_FILE_SIZE_KB} KB.`, "error");
    resetInput();
    return;
  }

  // If valid, proceed to read the file
  currentFile = file;
  const reader = new FileReader();
  reader.onload = function (e) {
    currentBase64 = e.target.result;
    preview.src = currentBase64;
  };
  reader.readAsDataURL(file);
  fileInfo.textContent = `Nama: ${file.name} | ${(file.size / 1024).toFixed(2)} KB | ${file.type}`;
});

function resetInput() {
    currentFile = null;
    currentBase64 = null;
    imageInput.value = ""; // Clear the file input
    preview.src = "";
    fileInfo.textContent = "";
}

function showStatus(message, type, duration = 4000) {
  statusMessage.textContent = message;
  statusMessage.className = "status-message " + type;
  statusMessage.style.display = "block";
  
  // Disable button during loading/info state
  saveBtn.disabled = (type === 'info'); 
  
  if (type !== 'info') { // Auto-hide for success/error messages
    setTimeout(() => {
      statusMessage.style.display = "none";
    }, duration);
  }
}

// ===== Save Data (with validation and UI feedback) =====
saveBtn.addEventListener("click", async () => {
  if (!currentBase64 || !labelInput.value.trim()) {
    showStatus("Mohon pilih gambar dan isi label terlebih dahulu!", "error");
    return;
  }

  // 1. Show loading state and disable button
  showStatus("Menyimpan...", "info");

  try {
    // 2. Save to Firestore (this is the "successful code" we are keeping)
    const docRef = await addDoc(collection(db, "wardrobe"), {
      imageBase64: currentBase64,
      label: labelInput.value.trim(),
      timestamp: new Date().toISOString()
    });

    // 3. Show success message
    showStatus("Item berhasil disimpan!", "success");

    // 4. Reset form
    resetInput();
    labelInput.value = "";

  } catch (e) {
    // 5. Show error message if `addDoc` fails
    console.error("Error adding document: ", e);
    showStatus(`Gagal menyimpan ke database: ${e.message}`, "error", 6000);
  } finally {
    // 6. Re-enable button and hide loading message
    saveBtn.disabled = false;
    if (statusMessage.classList.contains("info")) {
      statusMessage.style.display = "none";
    }
  }
});


// ===== Realtime Gallery Update (No changes needed here) =====
const wardrobeCollection = collection(db, "wardrobe");
onSnapshot(wardrobeCollection, snapshot => {
  gallery.innerHTML = "";
  const items = [];
  snapshot.forEach(docSnap => {
    items.push({ id: docSnap.id, ...docSnap.data() });
  });
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

// ===== Delete Item (No changes needed here) =====
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
