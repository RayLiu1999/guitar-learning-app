import { Router, type IRouter, Request, Response } from 'express';
import Progress from '../models/Progress';
import PracticeLog from '../models/PracticeLog';
import { evaluateAndUnlockBadges } from '../services/achievementService';
import { BADGE_MAP } from '../badges';

const router: IRouter = Router();

/**
 * 取得指定使用者的全部進度
 * GET /api/progress?userId=xxx
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    if (!userId || typeof userId !== 'string') {
      res.status(400).json({ error: '缺少 userId 參數' });
      return;
    }

    const progress = await Progress.find({ userId });
    res.json(progress);
  } catch (err) {
    console.error('取得進度失敗:', err);
    res.status(500).json({ error: '伺服器內部錯誤' });
  }
});

/**
 * 切換指定文章的某個檢查項目狀態
 * POST /api/progress/toggle
 * Body: { userId, articleId, itemIndex }
 */
router.post('/toggle', async (req: Request, res: Response) => {
  try {
    const { userId, articleId, itemIndex } = req.body;

    if (!userId || !articleId || itemIndex === undefined) {
      res.status(400).json({ error: '缺少必要參數 (userId, articleId, itemIndex)' });
      return;
    }

    let progress = await Progress.findOne({ userId, articleId });

    if (!progress) {
      progress = new Progress({
        userId,
        articleId,
        completedItems: [itemIndex],
        lastUpdated: new Date(),
      });
      await progress.save();
    } else {
      // 確保陣列內元素的型別匹配 (轉成數字比對)
      const numericItemIndex = Number(itemIndex);
      const isCompleted = progress.completedItems.includes(numericItemIndex);

      if (isCompleted) {
        progress.completedItems = progress.completedItems.filter(i => i !== numericItemIndex);
      } else {
        progress.completedItems.push(numericItemIndex);
      }

      progress.lastUpdated = new Date();
      // 標記陣列已修改，強制 Mongoose 儲存
      progress.markModified('completedItems');
      await progress.save();
    }

    // 同步更新當日打卡紀錄
    const today = new Date().toISOString().split('T')[0]!;
    await PracticeLog.findOneAndUpdate(
      { userId, date: today },
      { $addToSet: { articles: articleId } },
      { upsert: true }
    );

    // 解鎖成就徽章
    const newBadgeIds = await evaluateAndUnlockBadges(userId);
    const newlyUnlocked = newBadgeIds.map((id) => BADGE_MAP.get(id)).filter(Boolean);

    res.json({ progress, newlyUnlocked });
  } catch (err) {
    console.error('更新進度失敗:', err);
    res.status(500).json({ error: '伺服器內部錯誤' });
  }
});

/**
 * 取得打卡紀錄（用於熱力圖）
 * GET /api/progress/practice-log?userId=xxx
 */
router.get('/practice-log', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    if (!userId || typeof userId !== 'string') {
      res.status(400).json({ error: '缺少 userId 參數' });
      return;
    }

    const logs = await PracticeLog.find({ userId }).sort({ date: -1 }).limit(365);
    res.json(logs);
  } catch (err) {
    console.error('取得打卡紀錄失敗:', err);
    res.status(500).json({ error: '伺服器內部錯誤' });
  }
});

export default router;
