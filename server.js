import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createCanvas } from "canvas";

import pkg from "noisejs";
const { Noise } = pkg;
import fs from "fs";
import matter from "gray-matter";
import { marked } from "marked";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.urlencoded({ extended: true }));
//app.use(express.static(path.join(__dirname, "public")));
app.use(express.static("public"));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

/* --- ART GENERATOR --- */
function textToSeed(text) {
  return text.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

function generateArt(text, rFactor = 4, gFactor = 9, bFactor = 1) {
  const seed = textToSeed(text);
  const noise = new Noise(seed);

  const width = 300,
    height = 300;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const intensity = Math.min(text.length, 50);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const value = noise.perlin2(x / 100, y / 100);
      const r = Math.floor((value + 1) * 128 + intensity * rFactor);
      const g = Math.floor((value + 1) * 64 + intensity * gFactor);
      const b = Math.floor(255 - (value + 1) * 128 + intensity * bFactor);
      ctx.fillStyle = `rgb(${r % 256}, ${g % 256}, ${b % 256})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  return canvas.toDataURL();
}

/* --- ROUTES --- */
app.get("/", (req, res) => {
  res.render("index");
});

app.post("/convert", (req, res) => {
  const { text, rFactor, gFactor, bFactor } = req.body;

  // Convert slider values from strings to numbers
  // Convert to numbers (default if missing)
  const r = Number(rFactor) || 4;
  const g = Number(gFactor) || 9;
  const b = Number(bFactor) || 1;

  const image = generateArt(text, r, g, b);

  res.send(`
    <div>
      <img src="${image}" alt="Generated Art" style="max-width:100%;border:1px solid #ccc;" />
      <div style="margin-top:10px;">
        <a href="${image}" download="art.png">Download</a>
        <button style="background-color:green;color:white;border:none;cursor:pointer;padding:8px;" onclick="navigator.share({title:'My Art', url:'${image}'})">Share</button>
      </div>
    </div>
  `);
});

app.post("/clear-generated-art", (req, res) => {
  // Return empty HTML to wipe the target container
  res.send("");
});

/* --- BLOG ROUTES --- */
app.get("/blog", (req, res) => {
  const files = fs.readdirSync(path.join(__dirname, "posts"));
  const posts = files.map((file) => {
    const content = fs.readFileSync(
      path.join(__dirname, "posts", file),
      "utf-8",
    );
    const { data } = matter(content);
    return { slug: file.replace(".md", ""), title: data.title || file };
  });
  res.render("blog", { posts });
});

app.get("/blog/:slug", (req, res) => {
  const filePath = path.join(__dirname, "posts", `${req.params.slug}.md`);
  if (!fs.existsSync(filePath)) return res.status(404).send("Post not found");

  const content = fs.readFileSync(filePath, "utf-8");
  const { data, content: body } = matter(content);
  const html = marked(body);
  res.render("post", { title: data.title || req.params.slug, html });
});

/* --- PRIVACY POLICY --- */
app.get("/privacy", (req, res) => {
  res.render("privacy");
});

/* --- CONTACT PAGE --- */
app.get("/contact", (req, res) => {
  res.render("contact");
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
