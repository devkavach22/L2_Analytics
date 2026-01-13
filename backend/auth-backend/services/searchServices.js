import unifiedSearchPipeline from "../search/unifiedSearchPipeline.js";

export const unifiedSearch = async (query, userId) => {
  return await unifiedSearchPipeline(query, userId);
};
