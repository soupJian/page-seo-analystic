const fs = require("fs");
const path = require("path");

// 移动HTML文件到dist根目录
const distDir = path.join(__dirname, "dist");
const srcDir = path.join(distDir, "src");

if (fs.existsSync(srcDir)) {
  // 查找所有HTML文件
  function findHtmlFiles(dir) {
    const files = [];
    const items = fs.readdirSync(dir);

    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        files.push(...findHtmlFiles(fullPath));
      } else if (item.endsWith(".html")) {
        files.push(fullPath);
      }
    });

    return files;
  }

  const htmlFiles = findHtmlFiles(srcDir);

  // 移动HTML文件到dist根目录
  htmlFiles.forEach(file => {
    const fileName = path.basename(file);
    const destPath = path.join(distDir, fileName);
    fs.copyFileSync(file, destPath);
    console.log(`Moved ${fileName} to dist root`);
  });

  // 删除src目录
  fs.rmSync(srcDir, { recursive: true, force: true });
  console.log("Removed src directory from dist");
}

console.log("Build post-processing completed");
