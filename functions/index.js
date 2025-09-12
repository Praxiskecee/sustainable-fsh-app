const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

admin.initializeApp();

// Constants for validation
const SUPPORTED_FORMATS = ["image/jpeg", "image/png", "image/svg+xml", "image/webp", "image/avif"];
const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

/**
 * An HTTP-triggered Cloud Function to receive and validate a Base64 encoded image.
 * The function expects a JSON payload in the format: { "image": "data:image/jpeg;base64,..." }
 */
exports.uploadImage = functions.https.onRequest((req, res) => {
  // 1. Use CORS to allow requests from your web app
  cors(req, res, () => {
    // 2. Ensure the request method is POST
    if (req.method !== "POST") {
      return res.status(405).json({ success: false, error: "Method Not Allowed. Please use POST." });
    }

    // 3. Get the Base64 string from the JSON body
    const { image: base64Image } = req.body;
    if (!base64Image || typeof base64Image !== "string") {
      return res.status(400).json({ success: false, error: "Bad Request. The 'image' field with a Base64 string is required in the JSON body." });
    }

    // 4. Manually parse the data URI and validate the image
    const match = base64Image.match(/^data:(image\/[a-z]+);base64,(.+)$/);
    if (!match) {
      return res.status(400).json({ success: false, error: "Invalid format. The 'image' string must be a valid data URI (e.g., 'data:image/jpeg;base64,...')." });
    }

    const mimeType = match[1];
    const base64Data = match[2];

    // 4a. Add image format validation
    if (!SUPPORTED_FORMATS.includes(mimeType)) {
      return res.status(400).json({ success: false, error: `Unsupported image format. Only JPEG and PNG are allowed. Found: ${mimeType}` });
    }

    // 4b. Add image size validation
    // The length of a Base64 string is approximately 4/3 of the original data size.
    const approxSizeInBytes = Math.ceil(base64Data.length * 3 / 4);
    if (approxSizeInBytes > MAX_SIZE_BYTES) {
      return res.status(400).json({ success: false, error: `Image size exceeds the ${MAX_SIZE_MB}MB limit.` });
    }

    // 5. If all validations pass, return a success response
    // In a real application, you might save the base64Data to a database (like Firestore) here.
    return res.status(200).json({ 
      success: true, 
      message: "Image received and validated successfully.",
      metadata: {
        mimeType: mimeType,
        sizeInBytes: approxSizeInBytes
      }
    });
  });
});
