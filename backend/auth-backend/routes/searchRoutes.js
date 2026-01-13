import express from "express";
import { searchData } from "../controllers/searchController.js";
import { auth } from "../middlewares/auth.js";

const router = express.Router();

router.get("/", auth, searchData);

export default router;
