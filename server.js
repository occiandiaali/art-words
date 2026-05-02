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

function generateArt(
  text,
  width = 300,
  height = 300,
  rFactor = 4,
  gFactor = 9,
  bFactor = 1,
) {
  const seed = textToSeed(text);
  const noise = new Noise(seed);

  // const width = w //|| 300,
  //  height = h //|| 300;
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
  res.render("index", {
    faqs: [
      {
        question: "What is it?",
        answer:
          "It is a web tool that allows you to enter a WORD, SENTENCE, WORDS, or even entire PARAGRAPHS to generate unique, artistic patterns/designs.",
      },
      {
        question: "How is that made possible?",
        answer:
          "Visit the Blog page. There are some posts that go into (technical) detail about how it's achieved.",
      },
      {
        question: "How do I use it?",
        answer:
          "Simply type, or paste text, into the text area to immediately see the generated pattern/design. The more words you provide, the more interesting the end-result would be. Use the Red, Green, and Blue sliders to adjust the end-result to your liking.",
      },
      {
        question: "Can I save the generated image?",
        answer:
          "Yes. When you're satisfied with the generated image, click the Download link below the image to save it to your device. The full Share feature is COMING SOON.",
      },
    ],
  });
});

const PRESETS = {
  A4: { width: 2480, height: 3508 }, // 300 DPI
  // "1080p": { width: 1920, height: 1080 },
  "1080p": { width: 1080, height: 1920 },
  "4K": { width: 3840, height: 2160 },
  Square: { width: 1000, height: 1000 },
};

app.post("/generate-art", (req, res) => {
  const { text, preset, artWidth, artHeight, rFactor, gFactor, bFactor } =
    req.body;

  // // Convert slider values from strings to numbers
  // // Convert to numbers (default if missing)
  // const width = Number(artWidth) || 300;
  // const height = Number(artHeight) || 300;

  // If preset is chosen, override width/height
  let width,
    height,
    presetLabel = "";
  if (preset && PRESETS[preset]) {
    width = PRESETS[preset].width;
    height = PRESETS[preset].height;
    presetLabel = `${preset} (${width}×${height})`;
  } else {
    width = Number(artWidth) || 300;
    height = Number(artHeight) || 300;
    presetLabel = `Custom (${width}×${height})`;
  }

  const r = Number(rFactor) || 4;
  const g = Number(gFactor) || 9;
  const b = Number(bFactor) || 1;

  // Validation: prevent absurdly large sizes
  const MAX_DIMENSION = 4000; // adjustable value as needed
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    return res.send(`
      <div style="color:red;">
        Dimensions too large. Please use max ${MAX_DIMENSION}x${MAX_DIMENSION}.
      </div>
    `);
  }

  const image = generateArt(text, width, height, r, g, b);

  res.send(`
    <div>
        <div style="
      display:inline-block;
      background-color:#f0f0f0;
      color:#333;
      font-size:14px;
      font-weight:600;
      padding:4px 10px;
      border-radius:12px;
      margin-bottom:10px;
      border:1px solid #ccc;
    ">
      ${presetLabel}
    </div>
      <img src="${image}" alt="Generated Art" style="max-width:100%;border:1px solid #ccc;" />
      <div style="margin-top:10px;">
        <a href="${image}" style="color:green;" download="art.png">Download</a>
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

/* --- GIF PAGE --- */
app.get("/convert", (req, res) => {
  res.render("convert");
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
