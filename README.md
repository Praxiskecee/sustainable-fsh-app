# Clothing Labeling PWA (v0.2.0)

A Progressive Web App for creating a digital clothing gallery. Upload images of your clothes, label them, and access your gallery from any device. This project uses HTML, CSS, and Vanilla JavaScript, with Firebase for authentication and database services.

![Clothing App Screenshot](https://storage.googleapis.com/project-charm-demo-images/clothing-app-screenshot.png)

---

## Key Features (v0.2)

-   **Authentication**: Sign in with Google or as a Guest.
-   **Real-time Database**: Gallery items sync instantly across devices with Firestore.
-   **Offline Support**: Detects network status and provides clear feedback.
-   **Error Handling**: User-friendly error messages and retry mechanisms for failed operations.
-   **Responsive Design**: Works on both desktop and mobile devices.
-   **PWA**: Installable on your device for a native-app-like experience.

---

## Project Setup

This project is configured to run in Firebase Studio, which provides a consistent and reproducible development environment out of the box.

### 1. Firebase Configuration

To connect the app to your own Firebase project, you need to configure the Firebase SDK.

1.  **Create a Firebase Project**: Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2.  **Add a Web App**: In your project, add a new Web App. Give it a nickname.
3.  **Get Config Keys**: Firebase will provide you with a `firebaseConfig` object containing your API keys. Copy this object.
4.  **Update `.idx/firebase.js`**: Open the `.idx/firebase.js` file in this project and replace the placeholder `firebaseConfig` object with the one you just copied.

    ```javascript
    // .idx/firebase.js

    // Replace this with your own Firebase config
    const firebaseConfig = {
      apiKey: "YOUR_API_KEY",
      authDomain: "YOUR_AUTH_DOMAIN",
      projectId: "YOUR_PROJECT_ID",
      storageBucket: "YOUR_STORAGE_BUCKET",
      messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
      appId: "YOUR_APP_ID"
    };
    ```

5.  **Enable Authentication**: In the Firebase Console, go to **Authentication** -> **Sign-in method** and enable **Google** and **Anonymous** sign-in providers.

6.  **Set Firestore Rules**: Go to **Firestore Database** -> **Rules** and paste the following to ensure only authenticated users can access their own data:

    ```
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        match /wardrobe/{itemId} {
          allow read, delete: if request.auth != null && resource.data.userId == request.auth.uid;
          allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
        }
      }
    }
    ```

### 2. Running the App

The environment is pre-configured to serve the application.

1.  **Reload the Environment**: If you have just updated the Firebase config, reload the workspace to ensure all settings are applied.
2.  **Open the Preview**: The app should be running automatically. Open the "Previews" tab in your IDE and click on the preview URL to open the application in a new browser tab.

---

## How to Use

1.  **Login**: Choose to sign in with your Google account or proceed as a guest.
2.  **Select Image**: Click the "Choose Image" button and select a clothing picture from your device.
3.  **Add Label**: Enter a descriptive label for the clothing item (e.g., "Blue Summer Dress").
4.  **Save Item**: Click the "Save" button. A loading spinner will appear, and the item will be saved to your gallery.
5.  **View Gallery**: Your saved items will appear in the gallery, sorted with the newest items first.
6.  **Delete Item**: Click the "Delete" button on any item to remove it from your gallery.
