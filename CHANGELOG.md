# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0] - 2025-09-19 (v0.2.0)

Version 0.2.0 marks a major enhancement in user experience and application stability. The focus of this release was to make the application more robust, user-friendly, and reliable, especially under imperfect network conditions.

### Added

-   **User Authentication**: Implemented user sign-in with options for Google (OAuth) or Anonymous (Guest) access. This provides a personalized gallery for each user.
-   **Loading Indicators**: Added spinners for all asynchronous operations (login, save, delete) to provide clear feedback to the user that a process is running.
-   **User-Friendly Error Messages**: Created a centralized error handling system that translates technical Firebase errors (e.g., `auth/popup-closed-by-user`, `permission-denied`) into clear, actionable messages for the user.
-   **Retry Mechanism**: For network-related or other transient failures, a "Retry" button now appears, allowing users to attempt the failed operation again without losing context.
-   **Network Status Detection**: The application now actively detects the browser's online/offline status.
-   **Offline Indicator**: A prominent UI indicator appears when the user is offline, and functionality requiring a connection (like saving or deleting) is temporarily disabled.
-   **JSDoc Comments**: Added comprehensive JSDoc blocks to all major functions in `.idx/skrip.js` to improve code clarity and maintainability.

### Changed

-   **Refactored JavaScript Code**: The entire `.idx/skrip.js` file was refactored for better readability and maintainability. Logic was broken down into smaller, more specific functions (e.g., `handleError`, `renderGallery`, `handleFileInput`).
-   **Firestore Security Rules**: Updated Firestore rules to be more secure, ensuring that users can only read and write their own data (`resource.data.userId == request.auth.uid`).
-   **UI/UX Improvements**: Status messages are now more robust and can include a retry button. The overall user feedback loop is significantly improved.

### Removed

-   Removed the old, basic `loadGallery` functionality that fetched all items on page load. It has been replaced with a real-time `onSnapshot` listener that is tied to the authenticated user's UID.

---

## [0.1.0] - (Initial Release)

-   Initial basic functionality for uploading an image, adding a label, and saving it to a public Firestore database.
-   No user authentication.
-   No error handling or offline support.
-   Basic gallery display that loaded all items on page refresh.
