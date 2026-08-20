const fs = require('fs');
const path = require('path');

// 許可されたホワイトリストドメイン・プレースホルダー
const ALLOWED_DOMAINS = [
  'http://localhost',
  'https://localhost',
  'http://127.0.0.1',
  'https://127.0.0.1',
  'https://[ドメイン]',
  'https://huvzitefmfuhwzkfturc.supabase.co',
  'https://your-supabase-project-url.supabase.co',
  'https://api.dicebear.com',
  'https://mail.google.com/mail/u/0/',
  'https://w3.org',
  'http://w3.org',
  'https://schema.org',
  'http://schema.org',
  'http://www.w3.org',
  'https://www.w3.org'
];

// 禁止サードパーティ通信ライブラリ
const FORBIDDEN_PACKAGES = ['axios', 'node-fetch', 'got', 'request', 'superagent'];

// 対象拡張子
const TARGET_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json', '.html', '.css'];

// スキャンから除外するディレクトリおよびファイル
const IGNORE_DIRS = ['node_modules', '.next', '.git', 'dist', 'build', 'out', 'scratch', 'ai_pipeline', 'test-fixtures'];
const IGNORE_FILES = ['package-lock.json', 'tsconfig.tsbuildinfo'];

function scanFile(filePath) {
  const fileName = path.basename(filePath);
  if (IGNORE_FILES.includes(fileName) || fileName.startsWith('workbox-')) {
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const warnings = [];

  // 1. 禁止ライブラリインポートチェック
  if (fileName !== 'package.json') {
    FORBIDDEN_PACKAGES.forEach(pkg => {
      const importRegex = new RegExp(`import\\s+.*?from\\s+['"]${pkg}['"]|require\\(['"]${pkg}['"]\\)`, 'g');
      if (importRegex.test(content)) {
        warnings.push(`Forbidden package import: ${pkg}`);
      }
    });
  }

  // 2. 非許可絶対URLチェック
  const urlRegex = /(https?:\/\/[^\s"'`<>]+)/g;
  let matches;
  while ((matches = urlRegex.exec(content)) !== null) {
    const url = matches[1];
    const isAllowed = ALLOWED_DOMAINS.some(allowed => url.startsWith(allowed));
    if (!isAllowed) {
      warnings.push(url);
    }
  }
  return warnings;
}

function scanPackageJson(pkgPath) {
  if (!fs.existsSync(pkgPath)) return [];
  try {
    const content = fs.readFileSync(pkgPath, 'utf8');
    const pkg = JSON.parse(content);
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    const warnings = [];
    FORBIDDEN_PACKAGES.forEach(p => {
      if (deps[p]) {
        warnings.push(`Forbidden dependency in package.json: ${p}`);
      }
    });
    return warnings;
  } catch {
    return [];
  }
}

function scanDir(dirPath) {
  let totalWarnings = 0;
  if (!fs.existsSync(dirPath)) return 0;
  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!IGNORE_DIRS.includes(file)) {
        totalWarnings += scanDir(fullPath);
      }
    } else if (stat.isFile()) {
      const ext = path.extname(file).toLowerCase();
      if (TARGET_EXTENSIONS.includes(ext)) {
        const warnings = scanFile(fullPath);
        if (warnings.length > 0) {
          totalWarnings += warnings.length;
        }
      }
    }
  }
  return totalWarnings;
}

function runScan(options = path.join(__dirname, 'src')) {
  let targetDirs = [];
  let projectRoot = __dirname;
  let logEnabled = true;

  if (typeof options === 'string') {
    targetDirs = [options];
  } else if (typeof options === 'object' && options !== null) {
    if (Array.isArray(options.scanDirs)) {
      targetDirs = options.scanDirs;
    } else if (options.targetDir) {
      targetDirs = [options.targetDir];
    } else {
      targetDirs = [path.join(__dirname, 'src')];
    }
    if (options.projectRoot) projectRoot = options.projectRoot;
    if (typeof options.logEnabled === 'boolean') logEnabled = options.logEnabled;
  } else {
    targetDirs = [path.join(__dirname, 'src')];
  }

  let totalWarnings = 0;

  // package.json チェック
  const pkgWarnings = scanPackageJson(path.join(projectRoot, 'package.json'));
  totalWarnings += pkgWarnings.length;

  for (const targetDir of targetDirs) {
    if (logEnabled) {
      console.log(`[Security Scan] Scanning for unauthorized external URLs in ${targetDir}...`);
    }
    totalWarnings += scanDir(targetDir);
  }

  if (totalWarnings === 0) {
    if (logEnabled) {
      console.log('✅ [Security Scan] No unauthorized external network connections detected.');
    }
    return { success: true, warningsCount: 0, violations: 0 };
  } else {
    if (logEnabled) {
      console.warn(`⚠️ [Security Scan] Found ${totalWarnings} unauthorized URL / package warnings.`);
    }
    return { success: false, warningsCount: totalWarnings, violations: totalWarnings };
  }
}

if (require.main === module) {
  const result = runScan();
  if (!result.success) {
    process.exit(1);
  }
}

module.exports = { runScan, scanDir, scanFile, ALLOWED_DOMAINS };
