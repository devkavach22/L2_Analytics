const esClient = require('../services/elasticsearchClient');

async function createSearchIndex() {
  const indexName = "universal_search";

  const exists = await esClient.indices.exists({ index: indexName });
  if (exists) {
    console.log("Index already exists");
    return;
  }

  await esClient.indices.create({
    index: indexName,
    body: {
      mappings: {
        properties: {
          type: { type: "keyword" },     // file | folder | ocr | user
          name: { type: "text" },
          content: { type: "text" },     // OCR text or file content
          metadata: { type: "object" },
          folderId: { type: "keyword" },
          fileId: { type: "keyword" },
          lineNumber: { type: "integer" }
        }
      }
    }
  });

  console.log("Search index created");
}

createSearchIndex().catch(console.error);
