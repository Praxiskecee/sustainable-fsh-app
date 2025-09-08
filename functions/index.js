const functions = require("firebase-functions");
const admin = require("firebase-admin");
const path = require("path");
const os = require("os");
const fs = require("fs");
const Busboy = require("busboy");
const cors = require("cors")({ origin: true });

admin.initializeApp();

exports.uploadImage = functions.https.onRequest((req, res) => {
  // 1. Use CORS to allow requests from your web app
  cors(req, res, () => {
    if (req.method !== "POST") {
      return res.status(405).json({ message: "Method Not Allowed" });
    }

    // 2. Use Busboy to parse multipart/form-data
    const busboy = Busboy({ headers: req.headers });
    const tmpdir = os.tmpdir();
    const uploads = {};

    busboy.on("file", (fieldname, file, info) => {
      const { filename, encoding, mimeType } = info;
      console.log(
        `File [${fieldname}]: filename: ${filename}, encoding: ${encoding}, mimeType: ${mimeType}`
      );

      // 3. Validate file type
      if (mimeType !== "image/jpeg" && mimeType !== "image/png") {
        return res.status(400).json({ message: "Unsupported file type. Please upload a JPEG or PNG image." });
      }

      const filepath = path.join(tmpdir, filename);
      const writeStream = fs.createWriteStream(filepath);
      file.pipe(writeStream);

      uploads[fieldname] = { filepath, mimeType };
    });

    busboy.on("finish", async () => {
      try {
        const imageField = Object.keys(uploads)[0]; // Assuming one file upload
        if (!imageField) {
          return res.status(400).json({ message: "No file uploaded." });
        }
        
        const { filepath, mimeType } = uploads[imageField];
        const filename = path.basename(filepath);
        const bucket = admin.storage().bucket();

        // 4. Upload the file to Firebase Storage
        const [uploadedFile] = await bucket.upload(filepath, {
          destination: `uploads/${Date.now()}-${filename}`,
          metadata: {
            contentType: mimeType,
          },
        });

        // Make the file public
        await uploadedFile.makePublic();

        // Get the public URL
        const publicUrl = uploadedFile.publicUrl();

        // Cleanup the temporary file
        fs.unlinkSync(filepath);

        // 5. Return a success response with the URL
        res.status(200).json({
          message: "Image uploaded successfully!",
          imageUrl: publicUrl,
        });
      } catch (error) {
        console.error("Error uploading file:", error);
        res.status(500).json({ message: "Something went wrong.", error });
      }
    });

    busboy.end(req.rawBody);
  });
});
