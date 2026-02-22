import { Router, type IRouter, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const router: IRouter = Router();

/** 教材分類與對應的資料夾路徑 */
const CONTENT_DIRS: Record<string, string> = {
  technique: path.resolve(__dirname, '../../../電吉他技巧訓練'),
  theory: path.resolve(__dirname, '../../../電吉他樂理'),
  ghost: path.resolve(__dirname, '../../../GHOST_電吉他教學系列'),
  dinner: path.resolve(__dirname, '../../../晚餐歌_吉他教學系列'),
};

/** 前綴對照表，用於產生 articleId */
const CATEGORY_PREFIX: Record<string, string> = {
  technique: 'tech',
  theory: 'theory',
  ghost: 'ghost',
  dinner: 'dinner',
};

/**
 * 取得所有教材的目錄索引
 * GET /api/content/catalog
 */
router.get('/catalog', (_req: Request, res: Response) => {
  try {
    const catalog: Record<string, Array<{ id: string; filename: string; title: string }>> = {};

    for (const [category, dir] of Object.entries(CONTENT_DIRS)) {
      if (!fs.existsSync(dir)) {
        catalog[category] = [];
        continue;
      }

      const files = fs.readdirSync(dir)
        .filter((f) => f.endsWith('.md'))
        .sort();

      catalog[category] = files.map((filename) => {
        // 從檔名提取編號，例如 '01_撥弦基礎.md' → '01'
        const match = filename.match(/^(\d+)/);
        const num = match ? match[1]! : '00';
        const prefix = CATEGORY_PREFIX[category] || category;
        const id = `${prefix}_${num}`;

        // 從檔名提取標題
        const title = filename
          .replace(/\.md$/, '')
          .replace(/^\d+_/, '');

        return { id, filename, title };
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
router.get('/:category/:filename', (req: Request, res: Response) => {
  try {
    const category = req.params['category'] as string | undefined;
    const filename = req.params['filename'] as string | undefined;

    if (!category || !filename) {
      res.status(400).json({ error: '缺少必要參數' });
      return;
    }

    const dir = CONTENT_DIRS[category];
    if (!dir) {
      res.status(404).json({ error: '找不到該分類' });
      return;
    }

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
