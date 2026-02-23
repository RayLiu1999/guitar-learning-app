import fs from 'fs';
import path from 'path';

/** 全站目錄與關聯快取 */
export interface CatalogItem {
  id: string; // 例如: 'tech_01'
  filename: string;
  title: string;
  category: string;
  forwardLinks: string[]; // 這篇文章連了哪些 id
  backlinks: string[];    // 哪些 id 連了這篇文章
}

const CONTENT_DIRS: Record<string, string> = {
  technique: path.resolve(__dirname, '../../src/content/technique'),
  theory: path.resolve(__dirname, '../../src/content/theory'),
  ghost: path.resolve(__dirname, '../../src/content/ghost'),
  dinner: path.resolve(__dirname, '../../src/content/dinner'),
};

// 增加對編譯後路徑的支援
if (!fs.existsSync(CONTENT_DIRS.technique)) {
  CONTENT_DIRS.technique = path.resolve(__dirname, '../content/technique');
  CONTENT_DIRS.theory = path.resolve(__dirname, '../content/theory');
  CONTENT_DIRS.ghost = path.resolve(__dirname, '../content/ghost');
  CONTENT_DIRS.dinner = path.resolve(__dirname, '../content/dinner');
}

const CATEGORY_PREFIX: Record<string, string> = {
  technique: 'tech',
  theory: 'theory',
  ghost: 'ghost',
  dinner: 'dinner',
};

function getAllMdFiles(dir: string, baseDir: string = dir): string[] {
  let results: string[] = [];
  try {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat && stat.isDirectory()) {
        results = results.concat(getAllMdFiles(filePath, baseDir));
      } else if (file.endsWith('.md')) {
        results.push(path.relative(baseDir, filePath));
      }
    });
  } catch (err) {
    // 忽略找不到目錄錯誤
  }
  return results;
}

/** 
 * 從 Markdown 文本中提取所有 [[articleId]] 或 [text](path.md) 連結
 */
function extractLinks(content: string, pathMap: Map<string, string>, currentDir: string): string[] {
  const links = new Set<string>();

  // 1. 匹配 WikiLinks: [[articleId]] 
  const wikiRegex = /\[\[(.*?)(?:\|.*?)?\]\]/g;
  let match;
  while ((match = wikiRegex.exec(content)) !== null) {
    const id = match[1]!.trim();
    links.add(id);
  }

  // 2. 匹配標準 Markdown 連結: [text](path.md)
  const mdRegex = /\[.*?\]\((.*?\.(?:md|MD))\)/g;
  while ((match = mdRegex.exec(content)) !== null) {
    let linkPath = match[1]!;
    try {
      if (linkPath.includes('%')) {
        linkPath = decodeURIComponent(linkPath);
      }
    } catch (e) { }

    // 使用 NFC 正規化後進行比對，確保在 macOS 等系統下能正確匹配中文檔名
    const absolutePath = path.resolve(currentDir, linkPath).normalize('NFC');
    const targetId = pathMap.get(absolutePath);

    if (targetId) {
      links.add(targetId);
    }
  }
  return Array.from(links);
}

/** 掃描全站建立目錄與雙向連結快取 */
export function buildCatalogAndLinks(): Record<string, CatalogItem[]> {
  const catalog: Record<string, CatalogItem[]> = {};
  const itemMap = new Map<string, CatalogItem>();
  const pathMap = new Map<string, string>();

  // 1. 第一輪：建立 Path -> ID 映射
  for (const [category, dir] of Object.entries(CONTENT_DIRS)) {
    if (!fs.existsSync(dir)) continue;
    const files = getAllMdFiles(dir);
    for (const relPath of files) {
      const parts = relPath.split(path.sep);
      const filename = parts[parts.length - 1]!;
      const match = filename.match(/^(\d+)/);
      const num = match ? match[1]! : '00';
      const prefix = CATEGORY_PREFIX[category] || category;
      const id = `${prefix}_${num}`;
      pathMap.set(path.resolve(dir, relPath).normalize('NFC'), id);
    }
  }

  // 2. 第二輪：正式建立目錄並提取連結
  for (const [category, dir] of Object.entries(CONTENT_DIRS)) {
    catalog[category] = [];
    if (!fs.existsSync(dir)) continue;

    const files = getAllMdFiles(dir).sort();

    for (const relPath of files) {
      const parts = relPath.split(path.sep);
      const filename = parts[parts.length - 1]!;
      const match = filename.match(/^(\d+)/);
      const num = match ? match[1]! : '00';
      const prefix = CATEGORY_PREFIX[category] || category;
      const id = `${prefix}_${num}`;

      const title = filename.replace(/\.md$/, '').replace(/^\d+_?/, '');
      const filePath = path.join(dir, relPath);
      let forwardLinks: string[] = [];

      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        forwardLinks = extractLinks(content, pathMap, path.dirname(filePath));
      } catch (e) {
        console.error(`Read error: ${filePath}`);
      }

      const item: CatalogItem = {
        id,
        filename: encodeURIComponent(relPath),
        title,
        category,
        forwardLinks,
        backlinks: []
      };

      catalog[category]!.push(item);
      itemMap.set(id, item);
    }
  }

  // 3. 第三輪：建立反向連結 (Backlinks)
  for (const item of itemMap.values()) {
    for (const targetId of item.forwardLinks) {
      const targetItem = itemMap.get(targetId);
      if (targetItem) {
        if (!targetItem.backlinks.includes(item.id)) {
          targetItem.backlinks.push(item.id);
        }
      }
    }
  }

  return catalog;
}
