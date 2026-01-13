// /auth-backend/search/unifiedSearchPipeline.js
import elasticClient from "../services/elasticsearchClient.js";

export default async function unifiedSearchPipeline(query, userId) {
  try {
    const q = query.trim();
    if (!q) return { success: true, query, total: 0, results: [] };

    const response = await elasticClient.search({
      index: "universal_index",
      body: {
        query: {
          bool: {
            filter: [{ term: { userId: userId.toString() } }],
            should: [
              /* 1. STRICT EXACT MATCH (Highest Boost)
                 Using match_phrase with slop 0 ensures words must be exact 
                 and in order, preventing 'Criminal' from matching 'Critical'. */
              {
                multi_match: {
                  query: q,
                  fields: [
                    "name^15", 
                    "flatData.*^10", 
                    "flatMeta.*^10"
                  ],
                  type: "phrase",
                  slop: 0
                }
              },

              /* 2. NESTED CONTENT SEARCH (Inside Pages) */
              {
                nested: {
                  path: "file_pages",
                  query: {
                    bool: {
                      should: [
                        // Strict exact phrase in content
                        {
                          match_phrase: {
                            "file_pages.text": {
                              query: q,
                              slop: 0,
                              boost: 10
                            }
                          }
                        },
                        // Controlled fallback (fuzziness disabled here to keep it strict)
                        {
                          match: {
                            "file_pages.text": {
                              query: q,
                              operator: "and",
                              boost: 2
                            }
                          }
                        }
                      ],
                      minimum_should_match: 1
                    }
                  },
                  inner_hits: {
                    size: 5, // Increased to see more matches per document
                    highlight: {
                      fields: { "file_pages.text": {} },
                      pre_tags: ["<strong>"],
                      post_tags: ["</strong>"],
                      fragment_size: 150,
                      number_of_fragments: 3 // Show more than one snippet if found
                    }
                  }
                }
              },

              /* 3. FUZZY FALLBACK (Lower Boost)
                 Only used if the exact matches don't satisfy results. */
              {
                multi_match: {
                  query: q,
                  fields: ["name", "flatData.*", "flatMeta.*"],
                  fuzziness: "AUTO", 
                  prefix_length: 2, // Helps prevent 'Cri...' from matching too early
                  boost: 1
                }
              }
            ],
            minimum_should_match: 1
          }
        },
        highlight: {
          fields: {
            name: {},
            "flatData.*": {},
            "flatMeta.*": {}
          }
        },
        _source: ["name", "folderName", "docType", "flatData", "flatMeta", "createdAt"]
      }
    });

    const processedResults = response.hits.hits.map((hit) => {
      const source = hit._source;

      let pageMatches = [];
      if (hit.inner_hits?.file_pages) {
        pageMatches = hit.inner_hits.file_pages.hits.hits.flatMap(inner => {
          // Get all highlight fragments
          const highlights = inner.highlight?.["file_pages.text"] || [];
          
          if (highlights.length > 0) {
            return highlights.map(snippet => ({
              pageNumber: inner._source.pageNumber,
              snippet: snippet.trim()
            }));
          } else {
            return [{
              pageNumber: inner._source.pageNumber,
              snippet: (inner._source.text || "").substring(0, 100) + "..."
            }];
          }
        });
      }

      let metaMatches = [];
      if (hit.highlight) {
        for (const [key, val] of Object.entries(hit.highlight)) {
          if (key !== "file_pages.text") {
            metaMatches.push({
              field: key,
              value: val[0]
            });
          }
        }
      }

      return {
        id: hit._id,
        fileName: source.name,
        folderName: source.folderName || "Root",
        docType: source.docType,
        createdAt: source.createdAt,
        locations: [
          ...pageMatches.map(p => ({
            type: "content",
            description: `Found on Page ${p.pageNumber}`,
            snippet: p.snippet
          })),
          ...metaMatches.map(m => ({
            type: "metadata",
            description: `Found in ${m.field}`,
            snippet: m.value
          }))
        ]
      };
    });

    return {
      success: true,
      query,
      total: processedResults.length,
      results: processedResults
    };

  } catch (err) {
    console.error("Search Error:", err);
    return {
      success: false,
      query,
      total: 0,
      results: [],
      error: err.message
    };
  }
}


// // /auth-backend/search/unifiedSearchPipeline.js
// import elasticClient from "../services/elasticsearchClient.js";

// export default async function unifiedSearchPipeline(query, userId) {
//   try {
//     const q = query.trim();
//     if (!q) return { success: true, query, total: 0, results: [] };

//     const response = await elasticClient.search({
//       index: "universal_index",
//       body: {
//         query: {
//           bool: {
//             filter: [{ term: { userId: userId.toString() } }],
//             should: [
//               // 1. Search File Names & Metadata
//               {
//                 multi_match: {
//                   query: q,
//                   fields: ["name^3", "flatData.*", "flatMeta.*"],
//                   fuzziness: "AUTO",
//                   operator: "or"
//                 }
//               },
//               // 2. Search Inside Pages (Nested)
//               {
//                 nested: {
//                   path: "file_pages",
//                   query: {
//                     multi_match: {
//                       query: q,
//                       fields: ["file_pages.text"],
//                       fuzziness: "AUTO"
//                     }
//                   },
//                   inner_hits: {
//                     size: 3, 
//                     highlight: {
//                       fields: { "file_pages.text": {} },
//                       pre_tags: ["<strong>"],
//                       post_tags: ["</strong>"],
//                       fragment_size: 150, // Length of the snippet (the "line")
//                       number_of_fragments: 1
//                     }
//                   }
//                 }
//               }
//             ],
//             minimum_should_match: 1
//           }
//         },
//         highlight: {
//           fields: { "name": {}, "flatData.*": {}, "flatMeta.*": {} }
//         },
//         _source: ["name", "folderName", "docType", "flatData", "flatMeta", "createdAt"]
//       }
//     });

//     const processedResults = response.hits.hits.map((hit) => {
//       const source = hit._source;
      
//       // Process Page Matches
//       let pageMatches = [];
//       if (hit.inner_hits && hit.inner_hits.file_pages) {
//         pageMatches = hit.inner_hits.file_pages.hits.hits.map(inner => {
//           // If highlight exists, use it. If not (rare), take a substring.
//           const snippet = inner.highlight && inner.highlight["file_pages.text"] 
//             ? inner.highlight["file_pages.text"][0] 
//             : (inner._source.text || "").substring(0, 100) + "...";

//           return {
//             pageNumber: inner._source.pageNumber,
//             snippet: snippet.trim() // This acts as the "Line" context
//           };
//         });
//       }

//       // Process Metadata Matches
//       let metaMatches = [];
//       if (hit.highlight) {
//         for (const [key, val] of Object.entries(hit.highlight)) {
//           if (key !== "file_pages.text") {
//             metaMatches.push({ field: key, value: val[0] });
//           }
//         }
//       }

//       return {
//         id: hit._id,
//         fileName: source.name,
//         folderName: source.folderName || "Root",
//         docType: source.docType,
//         createdAt: source.createdAt,
//         locations: [
//           ...pageMatches.map(p => ({
//             type: "content",
//             description: `Found on Page ${p.pageNumber}`,
//             snippet: p.snippet
//           })),
//           ...metaMatches.map(m => ({
//             type: "metadata",
//             description: `Found in ${m.field}`,
//             snippet: m.value
//           }))
//         ]
//       };
//     });

//     return {
//       success: true,
//       query,
//       total: processedResults.length,
//       results: processedResults
//     };

//   } catch (err) {
//     console.error("Search Error:", err);
//     return { success: false, query, total: 0, results: [], error: err.message };
//   }
// }