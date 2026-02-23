import { Router, type IRouter, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { buildCatalogAndLinks } from '../services/catalogService';

const router: IRouter = Router();

/** 教材分類與對應的資料夾路徑 */
const CONTENT_DIRS: Record<string, string> = {
  technique: path.resolve(__dirname, '../content/technique'),
  theory: path.resolve(__dirname, '../content/theory'),
  ghost: path.resolve(__dirname, '../content/ghost'),
  dinner: path.resolve(__dirname, '../content/dinner'),
};

/**
 * 取得所有教材的目錄索引與雙向連結
 * GET /api/content/catalog
 */
router.get('/catalog', (_req: Request, res: Response) => {
  try {
    const catalog = buildCatalogAndLinks();
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
