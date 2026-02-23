import { Router, type IRouter, Request, Response } from 'express';
import Achievement from '../models/Achievement';
import { BADGES, BADGE_MAP } from '../badges';

const router: IRouter = Router();

/**
 * 取得使用者的徽章清單（已解鎖 + 未解鎖）
 * GET /api/achievements?userId=xxx
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    if (!userId || typeof userId !== 'string') {
      res.status(400).json({ error: '缺少 userId 參數' });
      return;
    }

    // 取得已解鎖的徽章
    const unlocked = await Achievement.find({ userId }).lean();
    const unlockedMap = new Map(unlocked.map((a) => [a.badgeId, a.unlockedAt]));

    // 組合所有徽章的狀態
    const result = BADGES.map((badge) => ({
      ...badge,
      unlocked: unlockedMap.has(badge.id),
      unlockedAt: unlockedMap.get(badge.id) ?? null,
    }));

    res.json(result);
  } catch (err) {
    console.error('取得成就失敗:', err);
    res.status(500).json({ error: '伺服器內部錯誤' });
  }
});

/**
 * 手動觸發成就評估（開發除錯用）
 * POST /api/achievements/evaluate
 * Body: { userId }
 */
router.post('/evaluate', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      res.status(400).json({ error: '缺少 userId 參數' });
      return;
    }

    const { evaluateAndUnlockBadges } = await import('../services/achievementService');
    const newBadges = await evaluateAndUnlockBadges(userId);
    const badges = newBadges.map((id) => BADGE_MAP.get(id)).filter(Boolean);

    res.json({ newlyUnlocked: badges });
  } catch (err) {
    console.error('評估成就失敗:', err);
    res.status(500).json({ error: '伺服器內部錯誤' });
  }
});

export default router;
