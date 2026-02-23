import Progress, { IProgress } from '../models/Progress';

export interface DailyMenuItem {
  articleId: string;
  reason: 'new' | 'review' | 'continue';
  title?: string; // 稍後可以從 catalog 補充標題
}

/**
 * 產生每日練習選單 (推薦 3 篇文章)
 * 邏輯：
 * 1. 繼續學習 (continue)：有進度（打勾 > 0）但未完成（< 5）的文章。
 * 2. 複習 (review)：很久以前（超過 7 天）完成（= 5 勾）的文章。
 * 3. 新內容 (new)：目前進度中完全沒有記錄（或是 0 勾）的基礎內容（例如 tech_01, theory_01 等系列開頭）。
 */
export async function generateDailyMenu(userId: string): Promise<DailyMenuItem[]> {
  const menu: DailyMenuItem[] = [];
  const maxItems = 3;

  // 取得使用者所有進度
  const allProgress = await Progress.find({ userId });
  const map = new Map<string, IProgress>(allProgress.map((p: IProgress) => [p.articleId, p]));

  // 1. 優先推薦「繼續學習」
  const continueItems = allProgress.filter(
    (p: IProgress) => p.completedItems.length > 0 && p.completedItems.length < 5
  );
  // 按最後更新時間排序，最近練習的優先推薦繼續
  continueItems.sort((a: IProgress, b: IProgress) => b.lastUpdated.getTime() - a.lastUpdated.getTime());

  for (const item of continueItems) {
    if (menu.length >= maxItems) break;
    menu.push({ articleId: item.articleId, reason: 'continue' });
  }

  // 如果滿了就回傳
  if (menu.length >= maxItems) return menu;

  // 2. 推薦「複習」
  // 定義：完成（5 勾）且最後更新時間距今 > 7 天
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const reviewItems = allProgress.filter(
    (p: IProgress) => p.completedItems.length >= 5 && p.lastUpdated < sevenDaysAgo
  );
  // 最久沒練的優先
  reviewItems.sort((a: IProgress, b: IProgress) => a.lastUpdated.getTime() - b.lastUpdated.getTime());

  for (const item of reviewItems) {
    if (menu.length >= maxItems) break;
    menu.push({ articleId: item.articleId, reason: 'review' });
  }

  if (menu.length >= maxItems) return menu;

  // 3. 推薦「新內容」
  // 基礎啟動項目清單（如果使用者還沒練過這些，優先推薦）
  const starterIds = [
    'tech_01', 'tech_02', 'tech_03',
    'theory_01', 'theory_02',
    'ghost_01', 'dinner_01'
  ];

  for (const articleId of starterIds) {
    if (menu.length >= maxItems) break;
    // 如果沒有進度記錄，或是 0 勾
    const p = map.get(articleId);
    if (!p || p.completedItems.length === 0) {
      menu.push({ articleId, reason: 'new' });
    }
  }

  // 萬一連 starter 都不夠填滿 3 個，那就從現有未推薦的完成項目隨機挑選做複習（確保菜單不為空）
  if (menu.length < maxItems && allProgress.length > 0) {
    const extraReviews = allProgress.filter(
      (p: IProgress) => p.completedItems.length >= 5 && !menu.find((m) => m.articleId === p.articleId)
    );
    for (const item of extraReviews) {
      if (menu.length >= maxItems) break;
      menu.push({ articleId: item.articleId, reason: 'review' });
    }
  }

  return menu;
}
