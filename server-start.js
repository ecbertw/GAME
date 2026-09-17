// EIXO test/deploy bootstrap. Applies the temporary customization rules before starting server.js.
const fs = require('fs');
const Module = require('module');
const path = require('path');

const serverPath = path.join(__dirname, 'server.js');
let source = fs.readFileSync(serverPath, 'utf8');

// TOP 1 keeps the full palette, including rainbow. TOP 2 can also save an effect.
source = source.replace(
  "const ALL_COLORS=['#ffffff','#ff4d4d','#ff7a2f','#ffd43b','#7bdc5a','#39d98a','#00d4ff','#3b82f6','#6f5cff','#b66cff','#ff4fd8','#ff6b9d','#a8e063','#00f0ff','#f97316','#facc15','#94a3b8','#e2e8f0','#22c55e','#ef4444'];",
  "const ALL_COLORS=['#ffffff','#ff4d4d','#ff7a2f','#ffd43b','#7bdc5a','#39d98a','#00d4ff','#3b82f6','#6f5cff','#b66cff','#ff4fd8','#ff6b9d','#a8e063','#00f0ff','#f97316','#facc15','#94a3b8','#e2e8f0','#22c55e','#ef4444','rainbow'];"
);
source = source.replace("if(worldRank!==1)effect='none';", "if(worldRank>2&&countryRank>2)effect='none';");

const mod = new Module(serverPath, module);
mod.filename = serverPath;
mod.paths = Module._nodeModulePaths(__dirname);
mod._compile(source, serverPath);
