
// Import Firestore and Auth functions
import { 
  db, 
  auth, 
  onAuthStateChanged, 
  signInAnonymously, 
  GoogleAuthProvider, 
  signInWithPopup,
  signOut
} from './firebase.js';
import { collection, addDoc, onSnapshot, deleteDoc, doc, query, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ===== Element References =====
// Auth UI
const authContainer = document.getElementById("authContainer");
const loginGoogleBtn = document.getElementById("loginGoogleBtn");
const loginAnonBtn = document.getElementById("loginAnonBtn"); // Renamed for clarity
const userStatus = document.getElementById("userStatus");
const logoutBtn = document.getElementById("logoutBtn");

// Main App UI
const appContainer = document.getElementById("appContainer");
const imageInput = document.getElementById("imageInput");
const preview = document.getElementById("preview");
const fileInfo = document.getElementById("fileInfo");
const labelInput = document.getElementById("labelInput");
const saveBtn = document.getElementById("saveBtn");
const gallery = document.getElementById("gallery");
const emptyState = document.getElementById("emptyState");
const statusMessage = document.getElementById("statusMessage");

// ===== Validation & State =====
const MAX_FILE_SIZE_KB = 750;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_KB * 1024;

let currentFile = null;
let currentBase64 = null;
let unsubscribeFromGallery = null;

// ===== Auth State Management (The Core of the App) =====
onAuthStateChanged(auth, (user) => {
  if (user) {
    // --- USER IS LOGGED IN ---
    console.log("User is logged in:", user);
    // 1. Update UI
    authContainer.style.display = 'none';
    appContainer.style.display = 'block';

    // 2. Display user info
    if (user.isAnonymous) {
      userStatus.innerHTML = `<p>Logged in as Guest: <strong>${user.uid}</strong></p>`;
    } else {
      userStatus.innerHTML = `
        <div class="user-info">
          <img src="${user.photoURL}" alt="User Photo" width="30" height="30">
          <span>Welcome, ${user.displayName} (${user.email})</span>
        </div>`;
    }

    // 3. Fetch user-specific data
    setupGalleryListener(user.uid);

  } else {
    // --- USER IS LOGGED OUT ---
    console.log("User is logged out.");
    // 1. Update UI
    authContainer.style.display = 'block';
    appContainer.style.display = 'none';
    userStatus.innerHTML = '';

    // 2. Stop listening to data and clear gallery
    if (unsubscribeFromGallery) {
      unsubscribeFromGallery();
    }
    gallery.innerHTML = '';
  }
});

// ===== Login Buttons =====
loginGoogleBtn.addEventListener("click", async () => {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
    // The onAuthStateChanged observer will handle the rest.
  } catch (error) {
    console.error("Google sign-in failed:", error);
    alert(`Google login failed: ${error.message}`);
  }
});

loginAnonBtn.addEventListener("click", async () => {
  try {
    await signInAnonymously(auth);
    // The onAuthStateChanged observer will handle the rest.
  } catch (error) {
    console.error("Anonymous sign-in failed:", error);
    alert("Guest login failed. Please try again.");
  }
});

// ===== Logout Button =====
logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
    // The onAuthStateChanged observer will handle the UI changes.
  } catch (error) {
    console.error("Sign out failed:", error);
    alert("Logout failed. Please try again.");
  }
});


// ===== File Input Logic (No changes) =====
imageInput.addEventListener("change", function () {
  const file = this.files[0];
  if (!file) { resetInput(); return; }
  if (!file.type.startsWith("image/")) { showStatus("File tidak valid. Pilih gambar.", "error"); resetInput(); return; }
  if (file.size > MAX_FILE_SIZE_BYTES) { const sizeInKB = (file.size / 1024).toFixed(2); showStatus(`Ukuran file (${sizeInKB} KB) > ${MAX_FILE_SIZE_KB} KB.`, "error"); resetInput(); return; }
  currentFile = file;
  const reader = new FileReader();
  reader.onload = (e) => { currentBase64 = e.target.result; preview.src = currentBase64; };
  reader.readAsDataURL(file);
  fileInfo.textContent = `${file.name} | ${(file.size / 1024).toFixed(2)} KB`;
});

// ===== Save Data (No changes) =====
saveBtn.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) { showStatus("Anda harus login untuk menyimpan.", "error"); return; }
  if (!currentBase64 || !labelInput.value.trim()) { showStatus("Pilih gambar dan isi label.", "error"); return; }
  showStatus("Menyimpan...", "info");
  try {
    await addDoc(collection(db, "wardrobe"), {
      userId: user.uid,
      imageBase64: currentBase64,
      label: labelInput.value.trim(),
      timestamp: new Date().toISOString()
    });
    showStatus("Item berhasil disimpan!", "success");
    resetInput();
    labelInput.value = "";
  } catch (e) {
    console.error("Error adding document: ", e);
    showStatus(`Gagal menyimpan: ${e.message}`, "error");
  } finally {
    saveBtn.disabled = false;
    if (statusMessage.classList.contains("info")) statusMessage.style.display = "none";
  }
});

// ===== Gallery Listener (No changes) =====
function setupGalleryListener(userId) {
  if (unsubscribeFromGallery) unsubscribeFromGallery();
  const q = query(collection(db, "wardrobe"), where("userId", "==", userId));
  unsubscribeFromGallery = onSnapshot(q, (snapshot) => {
    gallery.innerHTML = "";
    const items = [];
    snapshot.forEach(docSnap => items.push({ id: docSnap.id, ...docSnap.data() }));
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
}

// ===== Utility Functions (No changes) =====
function resetInput() {
    currentFile = null;
    currentBase64 = null;
    imageInput.value = "";
    preview.src = "";
    fileInfo.textContent = "";
}

function showStatus(message, type, duration = 4000) {
  statusMessage.textContent = message;
  statusMessage.className = "status-message " + type;
  statusMessage.style.display = "block";
  saveBtn.disabled = (type === 'info');
  if (type !== 'info') {
    setTimeout(() => { statusMessage.style.display = "none"; }, duration);
  }
}

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
