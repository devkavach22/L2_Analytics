// /auth-backend/search/indexingPipeline.js
import OCRRecord from "../models/OcrRecords.js";
import PDFRecord from "../models/File.js";
import Folder from "../models/Folder.js";
import elasticClient from "../services/elasticsearchClient.js";

function flattenObject(obj, prefix = "") {
  let result = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        Object.assign(result, flattenObject(value, newKey));
      } else {
        result[newKey] = value !== null && value !== undefined ? String(value) : "";
      }
    }
  }
  return result;
}

const INDEX_NAME = "universal_index";

async function initializeIndex() {
  const indexExists = await elasticClient.indices.exists({ index: INDEX_NAME });
  
  if (indexExists) {
    console.log("Resetting Index to apply new schema...");
    await elasticClient.indices.delete({ index: INDEX_NAME });
  }

  await elasticClient.indices.create({
    index: INDEX_NAME,
    body: {
      mappings: {
        properties: {
          userId: { type: "keyword" },
          docType: { type: "keyword" },
          folderName: { type: "keyword" },
          // Added .keyword sub-field for exact matching
          name: { 
            type: "text", 
            analyzer: "standard",
            fields: { keyword: { type: "keyword", ignore_above: 256 } } 
          },
          
          file_pages: {
            type: "nested", 
            properties: {
              pageNumber: { type: "integer" },
              // Added .keyword sub-field for exact content matching
              text: { 
                type: "text", 
                analyzer: "standard",
                fields: { keyword: { type: "keyword", ignore_above: 1024 } }
              } 
            }
          },
          
          flatData: { type: "object" }, 
          flatMeta: { type: "object" },
          text: { type: "text" } 
        }
      }
    }
  });
}

export const runIndexingPipeline = async () => {
  try {
    console.log("Starting Indexing Pipeline...");
    await initializeIndex();

    const ocrDocs = await OCRRecord.find({});
    const pdfDocs = await PDFRecord.find({});
    const folderDocs = await Folder.find({});
    
    const folderMap = new Map();
    folderDocs.forEach(f => folderMap.set(f._id.toString(), f.name));

    const allDocs = [...ocrDocs, ...pdfDocs, ...folderDocs];

    for (const doc of allDocs) {
      const obj = doc.toObject();
      const { _id, __v, ...cleanDoc } = obj;
      const userId = cleanDoc.userId?.toString() || "";

      let folderName = "Root";
      if (cleanDoc.folderId) {
        folderName = folderMap.get(cleanDoc.folderId.toString()) || "Unknown Folder";
      }

      const contentText = cleanDoc.extractedText || cleanDoc.text || "";
      const flatData = cleanDoc.data ? flattenObject(cleanDoc.data) : {};
      const flatMeta = cleanDoc.metadata ? flattenObject(cleanDoc.metadata) : {};

      let filePages = [];
      if (Array.isArray(cleanDoc.pages) && cleanDoc.pages.length > 0) {
        filePages = cleanDoc.pages.map(p => ({
          pageNumber: p.pageNumber || 1,
          text: p.text || ""
        }));
      } else if (contentText.trim().length > 0) {
        filePages = [{ pageNumber: 1, text: contentText }];
      }

      const fullSearchText = [
        cleanDoc.name,
        contentText,
        ...Object.values(flatData),
        ...Object.values(flatMeta)
      ].filter(Boolean).join(" ");

      await elasticClient.index({
        index: INDEX_NAME,
        id: _id.toString(),
        document: {
          userId,
          docId: _id.toString(),
          docType: doc.constructor.modelName,
          folderId: cleanDoc.folderId ? cleanDoc.folderId.toString() : null,
          folderName,
          name: cleanDoc.fileName || cleanDoc.name || "Untitled",
          flatData,
          flatMeta,
          file_pages: filePages,
          text: fullSearchText,
          createdAt: cleanDoc.createdAt || new Date()
        }
      });
    }

    await elasticClient.indices.refresh({ index: INDEX_NAME });
    console.log(`Indexing completed! Processed ${allDocs.length} documents.`);
  } catch (err) {
    console.error("Indexing Error:", err);
  }
};


// // /auth-backend/search/indexingPipeline.js
// import OCRRecord from "../models/OcrRecords.js";
// import PDFRecord from "../models/File.js";
// import Folder from "../models/Folder.js";
// import elasticClient from "../services/elasticsearchClient.js";

// // Helper to flatten objects
// function flattenObject(obj, prefix = "") {
//   let result = {};
//   for (const key in obj) {
//     if (Object.prototype.hasOwnProperty.call(obj, key)) {
//       const value = obj[key];
//       const newKey = prefix ? `${prefix}.${key}` : key;
//       if (typeof value === "object" && value !== null && !Array.isArray(value)) {
//         Object.assign(result, flattenObject(value, newKey));
//       } else {
//         result[newKey] = value !== null && value !== undefined ? String(value) : "";
//       }
//     }
//   }
//   return result;
// }

// const INDEX_NAME = "universal_index";

// // 1. Initialize Index with correct Nested Mapping
// async function initializeIndex() {
//   const indexExists = await elasticClient.indices.exists({ index: INDEX_NAME });
  
//   if (indexExists) {
//     // Delete to ensure we fix any old broken mappings
//     console.log("Resetting Index to apply new schema...");
//     await elasticClient.indices.delete({ index: INDEX_NAME });
//   }

//   await elasticClient.indices.create({
//     index: INDEX_NAME,
//     body: {
//       mappings: {
//         properties: {
//           userId: { type: "keyword" },
//           docType: { type: "keyword" },
//           folderName: { type: "keyword" },
//           name: { type: "text", analyzer: "standard" },
          
//           // Nested Field for Page-Level Search
//           file_pages: {
//             type: "nested", 
//             properties: {
//               pageNumber: { type: "integer" },
//               text: { type: "text", analyzer: "standard" } 
//             }
//           },
          
//           // Metadata fields
//           flatData: { type: "object" }, 
//           flatMeta: { type: "object" },
          
//           // Global text (fallback)
//           text: { type: "text" } 
//         }
//       }
//     }
//   });
// }

// export const runIndexingPipeline = async () => {
//   try {
//     console.log("Starting Indexing Pipeline...");

//     // Ensure index is ready
//     await initializeIndex();

//     // Fetch Data
//     const ocrDocs = await OCRRecord.find({});
//     const pdfDocs = await PDFRecord.find({});
//     const folderDocs = await Folder.find({});
    
//     // Folder Lookup Map
//     const folderMap = new Map();
//     folderDocs.forEach(f => folderMap.set(f._id.toString(), f.name));

//     const allDocs = [...ocrDocs, ...pdfDocs, ...folderDocs];

//     for (const doc of allDocs) {
//       const obj = doc.toObject();
//       const { _id, __v, ...cleanDoc } = obj;
//       const userId = cleanDoc.userId?.toString() || "";

//       // Resolve Folder Name
//       let folderName = "Root";
//       if (cleanDoc.folderId) {
//         folderName = folderMap.get(cleanDoc.folderId.toString()) || "Unknown Folder";
//       }

//       // Handle Content Text (Support 'extractedText' OR 'text')
//       const contentText = cleanDoc.extractedText || cleanDoc.text || "";

//       // Flatten Metadata
//       const flatData = cleanDoc.data ? flattenObject(cleanDoc.data) : {};
//       const flatMeta = cleanDoc.metadata ? flattenObject(cleanDoc.metadata) : {};

//       // Prepare Nested Pages
//       let filePages = [];

//       if (Array.isArray(cleanDoc.pages) && cleanDoc.pages.length > 0) {
//         // CASE A: Document already has page structure
//         filePages = cleanDoc.pages.map(p => ({
//           pageNumber: p.pageNumber || 1,
//           text: p.text || ""
//         }));
//       } else {
//         // CASE B: Flat document (like your sample)
//         // We create a single "Page 1" containing the extracted text
//         if (contentText.trim().length > 0) {
//           filePages = [{
//             pageNumber: 1,
//             text: contentText
//           }];
//         }
//       }

//       // Aggregate global text for fallback searching
//       const fullSearchText = [
//         cleanDoc.name,
//         contentText,
//         ...Object.values(flatData),
//         ...Object.values(flatMeta)
//       ].filter(Boolean).join(" ");

//       // Index Document
//       await elasticClient.index({
//         index: INDEX_NAME,
//         id: _id.toString(),
//         document: {
//           userId,
//           docId: _id.toString(),
//           docType: doc.constructor.modelName,
//           folderId: cleanDoc.folderId ? cleanDoc.folderId.toString() : null,
//           folderName,
//           name: cleanDoc.fileName || cleanDoc.name || "Untitled", // Handle fileName
//           flatData,
//           flatMeta,
//           file_pages: filePages, // Populate nested pages
//           text: fullSearchText,
//           createdAt: cleanDoc.createdAt || new Date()
//         }
//       });
//     }

//     await elasticClient.indices.refresh({ index: INDEX_NAME });
//     console.log(`Indexing completed! Processed ${allDocs.length} documents.`);

//   } catch (err) {
//     console.error("Indexing Error:", err);
//   }
// };