import fs from "fs";
import path from "path";
import JavaScriptObfuscator from "javascript-obfuscator";

const distDir = "./dist";

// Clean dist folder
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

function copyAndObfuscate(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyAndObfuscate(srcPath, destPath);
    } else if (entry.name.endsWith(".js")) {
      const code = fs.readFileSync(srcPath, "utf8");
      try {
        const obfuscated = JavaScriptObfuscator.obfuscate(code, {
          compact: true,
          controlFlowFlattening: true,
          controlFlowFlatteningThreshold: 0.75,
          deadCodeInjection: false,
          stringArray: true,
          stringArrayThreshold: 0.75,
          rotateStringArray: true,
          shuffleStringArray: true,
          splitStrings: true,
          target: "browser"
        }).getObfuscatedCode();

        fs.writeFileSync(destPath, obfuscated, "utf8");
      } catch (err) {
        console.error(`Failed to obfuscate ${srcPath}:`, err.message);
        fs.copyFileSync(srcPath, destPath);
      }
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy and process services folder
copyAndObfuscate("./services", "./dist/services");

// Copy root files if any (index.html, assets, redirects)
for (const file of fs.readdirSync(".")) {
  if (["index.html", "_redirects", "_headers", "favicon.ico"].includes(file)) {
    fs.copyFileSync(file, path.join(distDir, file));
  }
}

console.log("Build complete: Output in dist/");