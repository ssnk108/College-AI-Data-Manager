import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve("dist");
const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT || 4173);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon"
};

function sendFile(res, filePath) {
  const type = mimeTypes[extname(filePath).toLowerCase()] || "application/octet-stream";
  res.writeHead(200, { "Content-Type": type });
  const stream = createReadStream(filePath);
  stream.on("error", () => {
    if (!res.headersSent) res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Unable to read file");
  });
  stream.pipe(res);
}

createServer((req, res) => {
  try {
    const rawPath = decodeURIComponent(req.url.split("?")[0] || "/");
    const requestedPath = normalize(rawPath).replace(/^([/\\])+/, "");
    const candidate = resolve(join(root, requestedPath));
    const safePath = candidate.startsWith(root) ? candidate : join(root, "index.html");
    const filePath = existsSync(safePath) && statSync(safePath).isFile() ? safePath : join(root, "index.html");
    sendFile(res, filePath);
  } catch (error) {
    res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ message: error.message }));
  }
}).on("error", (error) => {
  console.error(error.message);
}).listen(port, host, () => {
  console.log(`Static frontend running at http://127.0.0.1:${port}/`);
});
