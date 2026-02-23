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
  technique: path.resolve(__dirname, '../../content/technique'),
  theory: path.resolve(__dirname, '../../content/theory'),
  ghost: path.resolve(__dirname, '../../content/ghost'),
  dinner: path.resolve(__dirname, '../../content/dinner'),
};

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
 * 從 Markdown 文本中提取所有 [[articleId]] 連結 
 * (支援 [[tech_01]] 或是 [[tech_01|自訂名稱]])
 */
function extractLinks(content: string): string[] {
  const links = new Set<string>();
  const regex = /\[\[(.*?)(?:\|.*?)?\]\]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    links.add(match[1]!.trim()); // 加上 ! 防止 TS 報錯
  }
  return Array.from(links);
}

/** 掃描全站建立目錄與雙向連結快取 */
export function buildCatalogAndLinks(): Record<string, CatalogItem[]> {
  const catalog: Record<string, CatalogItem[]> = {};
  const itemMap = new Map<string, CatalogItem>();

  // 1. 初始化目錄與正向連結
  for (const [category, dir] of Object.entries(CONTENT_DIRS)) {
    catalog[category] = [];
    if (!fs.existsSync(dir)) continue;

    const files = getAllMdFiles(dir).sort();

    for (const relPath of files) {
      const basename = path.basename(relPath);
      const match = basename.match(/^(\d+)/);
      const num = match ? match[1]! : '00';
      const prefix = CATEGORY_PREFIX[category] || category;
      const id = `${prefix}_${num}`;

      const title = basename.replace(/\.md$/, '').replace(/^\d+_?/, '');
      const filePath = path.join(dir, relPath);
      let forwardLinks: string[] = [];

      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        forwardLinks = extractLinks(content);
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

  // 2. 建立反向連結 (Backlinks)
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
