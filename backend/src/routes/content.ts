import { Router, type IRouter, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const router: IRouter = Router();

/** 教材分類與對應的資料夾路徑 */
const CONTENT_DIRS: Record<string, string> = {
  technique: path.resolve(__dirname, '../content/technique'),
  theory: path.resolve(__dirname, '../content/theory'),
  ghost: path.resolve(__dirname, '../content/ghost'),
  dinner: path.resolve(__dirname, '../content/dinner'),
};

/** 前綴對照表，用於產生 articleId */
const CATEGORY_PREFIX: Record<string, string> = {
  technique: 'tech',
  theory: 'theory',
  ghost: 'ghost',
  dinner: 'dinner',
};

/** Helper: 遞迴取得目錄下所有 .md 檔案的相對路徑 */
function getAllMdFiles(dir: string, baseDir: string = dir): string[] {
  let results: string[] = [];
  try {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat && stat.isDirectory()) {
        // 遞迴進入子資料夾
        results = results.concat(getAllMdFiles(filePath, baseDir));
      } else if (file.endsWith('.md')) {
        // 取得相對於 baseDir 的路徑 (例如: "01_基礎/01_撥弦.md")
        results.push(path.relative(baseDir, filePath));
      }
    });
  } catch (err) {
    console.warn(`讀取目錄失敗: ${dir}`, err);
  }

  return results;
}

/**
 * 取得所有教材的目錄索引
 * GET /api/content/catalog
 */
router.get('/catalog', (_req: Request, res: Response) => {
  try {
    const catalog: Record<string, Array<{ id: string; filename: string; title: string }>> = {};

    for (const [category, dir] of Object.entries(CONTENT_DIRS)) {
      if (!fs.existsSync(dir)) {
        console.warn(`[API /catalog] 找不到目錄: ${dir}`);
        catalog[category] = [];
        continue;
      }

      console.log(`[API /catalog] 成功找到目錄: ${dir}`);
      const files = getAllMdFiles(dir).sort();
      console.log(`[API /catalog] 目錄 ${category} 中的檔案數量:`, files.length);

      catalog[category] = files.map((relPath) => {
        // 從檔名提取編號
        const basename = path.basename(relPath);
        const match = basename.match(/^(\d+)/);
        const num = match ? match[1]! : '00';
        const prefix = CATEGORY_PREFIX[category] || category;
        const id = `${prefix}_${num}_${Buffer.from(relPath).toString('base64').substring(0, 5)}`; // 避免重複 id

        // 從檔名提取標題，移除副檔名與前面的數字
        const title = basename
          .replace(/\.md$/, '')
          .replace(/^\d+_?/, '');

        return { id, filename: encodeURIComponent(relPath), title };
      });
    }

    res.json(catalog);
  } catch (err) {
    console.error('取得目錄失敗:', err);
    res.status(500).json({ error: '伺服器內部錯誤' });
  }
});

/**
 * 取得指定文章內容
 * GET /api/content/:category/:filename
 */
// 使用 wildcard 取代原本的 :filename, 以支援帶有路徑分界線的 URI (雖然前端可送 encode 過的，但加上 wildcard 更保險，這裡我們用 param)
router.get('/:category/:filename', (req: Request, res: Response) => {
  try {
    const category = req.params['category'] as string | undefined;
    const encodedFilename = req.params['filename'] as string | undefined;

    if (!category || !encodedFilename) {
      res.status(400).json({ error: '缺少必要參數' });
      return;
    }

    const dir = CONTENT_DIRS[category];
    if (!dir) {
      res.status(404).json({ error: '找不到該分類' });
      return;
    }

    const filename = decodeURIComponent(encodedFilename);
    const filePath = path.join(dir, filename);

    // 安全性檢查：防止路徑穿越
    if (!filePath.startsWith(dir)) {
      res.status(403).json({ error: '非法路徑' });
      return;
    }

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: '找不到該文章' });
      return;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    res.json({ content });
  } catch (err) {
    console.error('讀取文章失敗:', err);
    res.status(500).json({ error: '伺服器內部錯誤' });
  }
});

export default router;
