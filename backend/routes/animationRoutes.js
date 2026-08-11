import express from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// routes/ -> ../animation
const ANIM_DIR = path.join(__dirname, "..", "results/animation");

router.get("/", async (req, res) => {
  try {
    const files = await fs.readdir(ANIM_DIR);

    const animations = files
      .filter((file) => file.endsWith(".json"))
      .map((file) => file.replace(".json", ""));

    res.json({ animations });
  } catch (err) {
    console.error("Failed to list animations:", err);
    res.status(500).json({ error: "Failed to list animations" });
  }
});

router.get("/:name", async (req, res) => {
  try {
      const name = req.params.name;
  
      // basic validation
      if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
        return res.status(400).json({ error: "Invalid animation name" });
      }
  
      const animationPath = path.join(ANIM_DIR, `${name}.json`);
      const data = await fs.readFile(animationPath, "utf8");
  
      res.json(JSON.parse(data));
    } catch (err) {
      console.error("Failed to load animation:", err);
      res.status(404).json({ error: "Animation not found" });
    }
});

export default router;