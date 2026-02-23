import Achievement from '../models/Achievement';
import Progress from '../models/Progress';
import PracticeLog from '../models/PracticeLog';
import { BADGES } from '../badges';

/**
 * 分類文章總數（用於判斷是否完整完成一個系列）
 * 根據實際教材數量設定
 */
const CATEGORY_TOTALS: Record<string, number> = {
  tech: 19, // 技巧訓練 00-18
  theory: 19, // 樂理     00-18
  ghost: 9,  // GHOST    00-08
  dinner: 9,  // 晚餐歌   00-08
};

/**
 * 計算某使用者在某分類已完整完成的文章數量
 * 一篇文章完整完成的定義：completedItems.length >= 5
 */
async function countCompletedArticles(userId: string, prefix: string): Promise<number> {
  const progress = await Progress.find({
    userId,
    articleId: { $regex: `^${prefix}_` },
  });
  // 每篇 5 個 checkbox，全打勾才算完成
  return progress.filter((p) => p.completedItems.length >= 5).length;
}

/**
 * 計算連續打卡天數（截至今天）
 */
async function calcStreak(userId: string): Promise<number> {
  const logs = await PracticeLog.find({ userId }).sort({ date: -1 }).lean();
  if (logs.length === 0) return 0;

  const today = new Date().toISOString().split('T')[0]!;
  let streak = 0;
  let expected = today;

  for (const log of logs) {
    if (log.date === expected) {
      streak++;
      // 往前推一天
      const d = new Date(expected);
      d.setDate(d.getDate() - 1);
      expected = d.toISOString().split('T')[0]!;
    } else {
      break;
    }
  }
  return streak;
}

/**
 * 將所有已解鎖但尚未存入 DB 的徽章寫入，並回傳新解鎖的 badgeId 清單
 */
export async function evaluateAndUnlockBadges(userId: string): Promise<string[]> {
  // ─── 取得目前已解鎖的徽章 id ────────────────────────────
  const existing = await Achievement.find({ userId }).lean();
  const unlockedIds = new Set(existing.map((a) => a.badgeId));

  const toUnlock: string[] = [];

  // ─── 計算各分類完成狀況 ─────────────────────────────────
  const [techDone, theoryDone, ghostDone, dinnerDone, streak] = await Promise.all([
    countCompletedArticles(userId, 'tech'),
    countCompletedArticles(userId, 'theory'),
    countCompletedArticles(userId, 'ghost'),
    countCompletedArticles(userId, 'dinner'),
    calcStreak(userId),
  ]);

  // ─── 定義解鎖條件 ──────────────────────────────────────
  const conditions: Array<[string, boolean]> = [
    ['technique_starter', techDone >= 1],
    ['technique_graduate', techDone >= 5],
    ['technique_master', techDone >= CATEGORY_TOTALS['tech']!],
    ['theory_starter', theoryDone >= 1],
    ['theory_graduate', theoryDone >= 5],
    ['theory_master', theoryDone >= CATEGORY_TOTALS['theory']!],
    ['ghost_complete', ghostDone >= CATEGORY_TOTALS['ghost']!],
    ['dinner_complete', dinnerDone >= CATEGORY_TOTALS['dinner']!],
    ['streak_3', streak >= 3],
    ['streak_7', streak >= 7],
    ['streak_30', streak >= 30],
    ['all_series',
      techDone >= CATEGORY_TOTALS['tech']! &&
      theoryDone >= CATEGORY_TOTALS['theory']! &&
      ghostDone >= CATEGORY_TOTALS['ghost']! &&
      dinnerDone >= CATEGORY_TOTALS['dinner']!],
  ];

  // ─── 寫入新解鎖的徽章 ──────────────────────────────────
  for (const [badgeId, condition] of conditions) {
    if (condition && !unlockedIds.has(badgeId)) {
      try {
        await Achievement.create({ userId, badgeId, unlockedAt: new Date() });
        toUnlock.push(badgeId);
      } catch {
        // 唯一索引衝突時靜默處理（concurrent request 下可能發生）
      }
    }
  }

  return toUnlock;
}
