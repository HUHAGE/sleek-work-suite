const fs = require('fs');
const path = require('path');

exports.default = async function(context) {
  const { appOutDir, packager } = context;
  
  // 要删除的文件和目录列表
  const unnecessaryFiles = [
    'LICENSE',
    'LICENSES.chromium.html',
    'version',
    'resources/default_app.asar'
  ];

  // 删除不必要的文件
  for (const file of unnecessaryFiles) {
    const filePath = path.join(appOutDir, file);
    try {
      if (fs.existsSync(filePath)) {
        if (fs.lstatSync(filePath).isDirectory()) {
          fs.rmdirSync(filePath, { recursive: true });
        } else {
          fs.unlinkSync(filePath);
        }
        console.log(`Removed: ${filePath}`);
      }
    } catch (error) {
      console.warn(`Failed to remove ${filePath}:`, error);
    }
  }

  // 删除 node_modules 中的开发依赖
  const nodeModulesPath = path.join(appOutDir, 'node_modules');
  if (fs.existsSync(nodeModulesPath)) {
    const devDependencies = Object.keys(packager.packageJSON.devDependencies || {});
    for (const devDep of devDependencies) {
      const devDepPath = path.join(nodeModulesPath, devDep);
      if (fs.existsSync(devDepPath)) {
        fs.rmdirSync(devDepPath, { recursive: true });
        console.log(`Removed dev dependency: ${devDep}`);
      }
    }
  }

  // 删除源码映射文件
  const removeSourceMaps = (dir) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.lstatSync(fullPath).isDirectory()) {
        removeSourceMaps(fullPath);
      } else if (file.endsWith('.map')) {
        fs.unlinkSync(fullPath);
        console.log(`Removed source map: ${fullPath}`);
      }
    }
  };

  removeSourceMaps(appOutDir);
}; 