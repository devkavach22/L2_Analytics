import { unifiedSearch } from "../services/searchServices.js";

export const searchData = async (req, res) => {
  try {
    const query = req.query.q;

    if (!query)
      return res.status(400).json({ error: "Search query (q) is required" });

    const userId = req.user.id; 

    const data = await unifiedSearch(query, userId);

    res.json({
      success: true,
      userId,
      query,
      total: data.length,
      results: data,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
