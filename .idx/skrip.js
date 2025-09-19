/**
 * @file Main script for the Clothing Labeling PWA.
 * @description Handles authentication, image uploading, data storage in Firestore,
 * and dynamic gallery display. Includes features like offline detection,
 * loading indicators, and robust error handling with retry mechanisms.
 * @version 0.2.0
 */

// ===== Import Firebase Functions =====
import {
  db,
  auth,
  onAuthStateChanged,
  signInAnonymously,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from './firebase.js';
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ===== DOM Element References =====
const spinner = document.getElementById("spinner");
const offlineIndicator = document.getElementById("offlineIndicator");
const authContainer = document.getElementById("authContainer");
const loginGoogleBtn = document.getElementById("loginGoogleBtn");
const loginAnonBtn = document.getElementById("loginAnonBtn");
const userStatus = document.getElementById("userStatus");
const logoutBtn = document.getElementById("logoutBtn");
const appContainer = document.getElementById("appContainer");
const imageInput = document.getElementById("imageInput");
const preview = document.getElementById("preview");
const fileInfo = document.getElementById("fileInfo");
const labelInput = document.getElementById("labelInput");
const saveBtn = document.getElementById("saveBtn");
const gallery = document.getElementById("gallery");
const emptyState = document.getElementById("emptyState");
const statusMessage = document.getElementById("statusMessage");

// ===== App State =====
/** @type {File | null} */
let currentFile = null;
/** @type {string | null} */
let currentBase64 = null;
/** @type {Function | null} */
let unsubscribeFromGallery = null;
/** @type {Function | null} */
let lastFailedOperation = null;

// ===== UI & Status Management =====

/**
 * Shows the main loading spinner.
 */
const showSpinner = () => spinner.style.display = 'block';

/**
 * Hides the main loading spinner.
 */
const hideSpinner = () => spinner.style.display = 'none';

/**
 * Checks the browser's online status and updates the UI accordingly.
 * Shows/hides the offline indicator and enables/disables the save button.
 */
const updateOnlineStatus = () => {
  const isOnline = navigator.onLine;
  offlineIndicator.style.display = isOnline ? 'none' : 'block';
  saveBtn.disabled = !isOnline;
  if (!isOnline) {
    showStatus("You are offline. Connection is required.", "error");
  } else {
    // Hide status only if it was an offline message
    if (statusMessage.textContent.includes("offline")) {
        statusMessage.style.display = 'none';
    }
  }
};

/**
 * Displays a status message to the user.
 * @param {string} message - The message to display.
 * @param {'success'|'error'|'info'} type - The type of message, for styling.
 * @param {Function | null} [retryOperation=null] - An optional function to be executed when the user clicks a "Retry" button.
 */
function showStatus(message, type, retryOperation = null) {
  statusMessage.innerHTML = ''; // Clear previous content
  const messageNode = document.createTextNode(message + " ");
  statusMessage.appendChild(messageNode);
  
  statusMessage.className = "status-message " + type;
  statusMessage.style.display = "block";

  if (retryOperation) {
    lastFailedOperation = retryOperation;
    const retryBtn = document.createElement('button');
    retryBtn.textContent = 'Retry';
    retryBtn.className = 'retry-btn';
    retryBtn.onclick = () => {
      showStatus("Retrying...", "info");
      lastFailedOperation();
    };
    statusMessage.appendChild(retryBtn);
  }

  // Do not auto-hide info messages or messages with a retry button
  if (type !== 'info' && !retryOperation) {
    setTimeout(() => {
      if (statusMessage.textContent.startsWith(message)) {
        statusMessage.style.display = "none";
      }
    }, 5000);
  }
}

/**
 * A centralized handler for processing and displaying errors.
 * @param {Error} error - The error object.
 * @param {Function} operation - The operation that failed, to be used for a retry mechanism.
 */
function handleError(error, operation) {
  console.error(`${operation.name} failed:`, error);
  let userMessage;

  switch (error.code) {
    case 'auth/popup-closed-by-user':
      userMessage = 'Login process was cancelled.';
      break;
    case 'unavailable':
      userMessage = 'Connection to the server failed. Check your internet connection.';
      break;
    case 'permission-denied':
      userMessage = 'Access denied. Ensure you have the correct permissions in Firestore Rules.';
      break;
    default:
      userMessage = `An unexpected error occurred (${error.code || 'unknown'}).`;
  }
  
  showStatus(userMessage, "error", operation);
}


// ===== Authentication =====

/**
 * Sets up an observer on the authentication state.
 * Manages UI and data fetching based on whether a user is logged in or out.
 */
onAuthStateChanged(auth, (user) => {
  hideSpinner();
  if (user) {
    // User is logged in
    authContainer.style.display = 'none';
    appContainer.style.display = 'block';
    if (user.isAnonymous) {
      userStatus.innerHTML = `<p>Logged in as Guest</p>`;
    } else {
      userStatus.innerHTML = `
        <div class="user-info">
          <img src="${user.photoURL}" alt="User Photo">
          <span>${user.displayName}</span>
        </div>`;
    }
    setupGalleryListener(user.uid);
  } else {
    // User is logged out
    authContainer.style.display = 'block';
    appContainer.style.display = 'none';
    userStatus.innerHTML = '';
    if (unsubscribeFromGallery) {
      unsubscribeFromGallery();
    }
    gallery.innerHTML = '';
    emptyState.style.display = 'block';
  }
});

/**
 * Initiates the Google Sign-In popup flow.
 */
async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  try {
    showSpinner();
    await signInWithPopup(auth, provider);
    // onAuthStateChanged will handle the rest.
  } catch (error) {
    handleError(error, loginWithGoogle);
  } finally {
    hideSpinner();
  }
}

/**
 * Initiates the Anonymous Sign-In flow.
 */
async function loginAnonymously() {
  try {
    showSpinner();
    await signInAnonymously(auth);
    // onAuthStateChanged will handle the rest.
  } catch (error) {
    handleError(error, loginAnonymously);
  } finally {
    hideSpinner();
  }
}

/**
 * Signs the current user out.
 */
async function logout() {
  try {
    showSpinner();
    await signOut(auth);
    // onAuthStateChanged will handle UI changes.
  } catch (error) {
    handleError(error, logout);
  } finally {
    hideSpinner();
  }
}


// ===== File Handling =====

/**
 * Handles the file input change event. Validates the file and generates a preview.
 * @param {Event} event - The change event from the file input.
 */
function handleFileInput(event) {
  const file = event.target.files[0];
  if (!file) {
    resetInput();
    return;
  }
  if (!file.type.startsWith("image/")) {
    showStatus("Invalid file. Please select an image.", "error");
    resetInput();
    return;
  }

  currentFile = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    currentBase64 = e.target.result;
    preview.src = currentBase64;
    preview.style.display = 'block';
  };
  reader.onerror = () => {
    showStatus("Failed to read the file.", "error");
    resetInput();
  };
  reader.readAsDataURL(file);
  fileInfo.textContent = `${file.name}`;
}

/**
 * Resets the file input and associated state variables and UI elements.
 */
function resetInput() {
  currentFile = null;
  currentBase64 = null;
  imageInput.value = "";
  preview.src = "";
  preview.style.display = 'none';
  fileInfo.textContent = "";
  labelInput.value = "";
}


// ===== Firestore Data Operations =====

/**
 * Saves a new item (image and label) to the Firestore "wardrobe" collection.
 */
async function saveItem() {
  const user = auth.currentUser;
  if (!navigator.onLine) {
    showStatus("No internet connection. Please try again later.", "error", saveItem);
    return;
  }
  if (!user || !currentBase64 || !labelInput.value.trim()) {
    showStatus("Please select an image and enter a label.", "error");
    return;
  }

  showSpinner();
  saveBtn.disabled = true;

  try {
    await addDoc(collection(db, "wardrobe"), {
      userId: user.uid,
      imageBase64: currentBase64,
      label: labelInput.value.trim(),
      timestamp: new Date().toISOString()
    });
    showStatus("Item saved successfully!", "success");
    resetInput();
  } catch (error) {
    handleError(error, saveItem);
  } finally {
    hideSpinner();
    saveBtn.disabled = !navigator.onLine;
  }
}

/**
 * Deletes a specific item from the Firestore "wardrobe" collection.
 * @param {string} docId - The ID of the document to delete.
 */
async function deleteItem(docId) {
  if (!confirm("Are you sure you want to delete this item?")) return;
  if (!navigator.onLine) {
    showStatus("No internet connection. Please try again later.", "error", () => deleteItem(docId));
    return;
  }

  showSpinner();
  try {
    await deleteDoc(doc(db, "wardrobe", docId));
    showStatus("Item deleted successfully.", "success");
  } catch (error) {
    handleError(error, () => deleteItem(docId));
  } finally {
    hideSpinner();
  }
}

/**
 * Sets up a real-time listener for the user's wardrobe items in Firestore.
 * @param {string} userId - The UID of the currently logged-in user.
 */
function setupGalleryListener(userId) {
  // Unsubscribe from any previous listener
  if (unsubscribeFromGallery) {
    unsubscribeFromGallery();
  }

  const q = query(collection(db, "wardrobe"), where("userId", "==", userId));

  unsubscribeFromGallery = onSnapshot(q, (snapshot) => {
    const items = [];
    snapshot.forEach(docSnap => items.push({ id: docSnap.id, ...docSnap.data() }));
    
    // Sort items by timestamp, newest first
    items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    renderGallery(items);

  }, (error) => {
    // This function is called when the listener fails
    handleError(error, () => setupGalleryListener(userId));
  });
}

/**
 * Renders the gallery items in the DOM.
 * @param {Array<object>} items - An array of item objects from Firestore.
 */
function renderGallery(items) {
    gallery.innerHTML = ""; // Clear current gallery
    emptyState.style.display = items.length === 0 ? "block" : "none";

    items.forEach(item => {
      const div = document.createElement("div");
      div.className = "item";
      div.innerHTML = `
        <img src="${item.imageBase64}" alt="${item.label}">
        <p>${item.label}</p>
        <div class="actions">
          <button class="delete-btn" data-id="${item.id}">Delete</button>
        </div>
      `;
      gallery.appendChild(div);
      
      // Add event listener directly to the new delete button
      div.querySelector('.delete-btn').addEventListener('click', () => deleteItem(item.id));
    });
}


// ===== Event Listeners =====
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
loginGoogleBtn.addEventListener("click", loginWithGoogle);
loginAnonBtn.addEventListener("click", loginAnonymously);
logoutBtn.addEventListener("click", logout);
imageInput.addEventListener("change", handleFileInput);
saveBtn.addEventListener("click", saveItem);

// ===== Initial Load =====
updateOnlineStatus(); // Initial check on page load

/*
--- How to Test Error Scenarios ---

1. Network Issues:
   - In your browser's developer tools (F12), go to the "Network" tab.
   - Find the "Throttling" dropdown and select "Offline".
   - Try to save or delete an item. The offline indicator and error messages should appear with a retry button.
   - Switch back to "No throttling" to restore the connection and test the retry mechanism.

2. Server Errors (Simulated):
   - Go to your Firebase project console.
   - Under "Firestore Database" -> "Rules", change the rules to temporarily deny writes/deletes.
     For example: `allow write: if false;`
   - Try to save or delete an item in the app. You should see a "Permission Denied" error with a retry button.
   - Remember to change the rules back to `allow write: if request.auth != null;` after testing.

3. Invalid Data:
   - The current code already validates file types.
   - Test this by trying to upload a non-image file (e.g., a .txt file). The app should show an error message.
*/
