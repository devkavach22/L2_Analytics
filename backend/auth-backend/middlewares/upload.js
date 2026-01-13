import multer from "multer";
import fs from "fs";
import path from "path";

// Utility to safely extract folderId from ANY place
function getFolderId(req) {
  // 1️⃣ Try body (multipart/form-data)
  if (req.body?.folderId) return req.body.folderId;

  // 2️⃣ Try query (?folderId=123)
  if (req.query?.folderId) return req.query.folderId;

  // 3️⃣ Try params (/api/workspace/upload/:folderId)
  if (req.params?.folderId) return req.params.folderId;

  // 4️⃣ Extract folderId from URL if present
  const match = req.originalUrl.match(/folderId=([^&]+)/);
  if (match) return match[1];

  return null;
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const userId = req.user?.id;

    if (!userId) {
      return cb(new Error("User ID is missing"));
    }

    const url = req.originalUrl;

    // 1️⃣ TOOL ROUTES — DO NOT REQUIRE folderId
    if (
      url.startsWith("/api/pdf") ||          // existing tool route
      url.startsWith("/api/auth/report")     // report/analyze route
    ) {
      const toolPath = path.join("uploads", userId.toString(), "tools");
      fs.mkdirSync(toolPath, { recursive: true });
      return cb(null, toolPath);
    }

    // 2️⃣ WORKSPACE ROUTES — folderId is optional now
    let folderId = getFolderId(req);
    if (!folderId) folderId = "default"; // default folder to avoid error

    const workspacePath = path.join(
      "uploads",
      "workspace",
      userId.toString(),
      folderId.toString()
    );

    fs.mkdirSync(workspacePath, { recursive: true });
    return cb(null, workspacePath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  fileFilter(req, file, cb) {
    cb(null, true);
  },
});

export default upload;


// import multer from "multer";
// import fs from "fs";
// import path from "path";

// // Utility to safely extract folderId from ANY place
// function getFolderId(req) {
//   // 1️⃣ Try body (multipart/form-data)
//   if (req.body?.folderId) return req.body.folderId;

//   // 2️⃣ Try query (?folderId=123)
//   if (req.query?.folderId) return req.query.folderId;

//   // 3️⃣ Try params (/api/workspace/upload/:folderId)
//   if (req.params?.folderId) return req.params.folderId;

//   // 4️⃣ Extract folderId from URL if present
//   const match = req.originalUrl.match(/folderId=([^&]+)/);
//   if (match) return match[1];

//   return null;
// }

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     const userId = req.user?.id;

//     if (!userId) {
//       return cb(new Error("User ID is missing"));
//     }

//     const url = req.originalUrl;

//     // 1️⃣ TOOL ROUTES — DO NOT REQUIRE folderId
//     if (url.startsWith("/api/pdf")) {
//       const toolPath = path.join("uploads", userId.toString(), "tools");

//       fs.mkdirSync(toolPath, { recursive: true });
//       return cb(null, toolPath);
//     }

//     // 2️⃣ WORKSPACE ROUTES — REQUIRE folderId
//     const folderId = getFolderId(req);

//     if (!folderId) {
//       return cb(new Error("Folder ID is missing"));
//     }

//     const workspacePath = path.join(
//       "uploads",
//       "workspace",
//       userId.toString(),
//       folderId.toString()
//     );

//     fs.mkdirSync(workspacePath, { recursive: true });

//     return cb(null, workspacePath);
//   }
// });

// const upload = multer({
//   storage: storage,
//   fileFilter(req, file, cb) {
//     cb(null, true);
//   }
// });

// export default upload;
