import { BADGES, BADGE_MAP } from './badges';

export interface ArticleInfo {
  id: string;
  filename: string;
  title: string;
  forwardLinks?: string[];
  backlinks?: string[];
}

export type Catalog = Record<string, ArticleInfo[]>;

export interface ProgressItem {
  _id: string;
  userId: string;
  articleId: string;
  completedItems: number[];
  lastUpdated: string;
}

export interface PracticeLogItem {
  userId: string;
  date: string;
  articles: string[];
}

export interface BadgeItem {
  id: string;
  emoji: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedAt: string | null;
}

export interface DailyMenuItem {
  articleId: string;
  reason: 'new' | 'review' | 'continue';
  title?: string;
}

export interface ToggleResult {
  progress: ProgressItem;
  newlyUnlocked: BadgeItem[];
}

// ─── 成就解鎖判定常數與邏輯 ──────────────────────────────
const CATEGORY_TOTALS: Record<string, number> = {
  tech: 19, // 技巧訓練 00-18
  theory: 19, // 樂理 00-18
  ghost: 9,  // GHOST 00-08
  dinner: 9,  // 晚餐歌 00-08
};

function countCompletedArticles(progressList: ProgressItem[], prefix: string): number {
  return progressList.filter(
    (p) => p.articleId.startsWith(`${prefix}_`) && p.completedItems.length >= 5
  ).length;
}

function calcStreak(logs: PracticeLogItem[]): number {
  if (logs.length === 0) return 0;
  
  // 按日期降序排序 (最新在最前)
  const sortedLogs = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  
  const today = new Date().toLocaleDateString('en-CA');
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleDateString('en-CA');
  
  // 如果今天跟昨天都沒有打卡，則連續打卡中斷為 0
  if (sortedLogs[0]!.date !== today && sortedLogs[0]!.date !== yesterday) {
    return 0;
  }
  
  let streak = 0;
  let expected = sortedLogs[0]!.date;
  
  for (const log of sortedLogs) {
    if (log.date === expected) {
      streak++;
      const d = new Date(expected);
      d.setDate(d.getDate() - 1);
      expected = d.toLocaleDateString('en-CA');
    } else {
      break;
    }
  }
  return streak;
}

/** 本地評估並解鎖徽章 */
async function localEvaluateAndUnlockBadges(
  userId: string,
  progressList: ProgressItem[],
  logs: PracticeLogItem[]
): Promise<string[]> {
  const achievementKey = `guitar-achievements-${userId}`;
  const unlockedList: { badgeId: string; unlockedAt: string }[] = JSON.parse(
    localStorage.getItem(achievementKey) || '[]'
  );
  const unlockedIds = new Set(unlockedList.map((a) => a.badgeId));
  
  const techDone = countCompletedArticles(progressList, 'tech');
  const theoryDone = countCompletedArticles(progressList, 'theory');
  const ghostDone = countCompletedArticles(progressList, 'ghost');
  const dinnerDone = countCompletedArticles(progressList, 'dinner');
  const streak = calcStreak(logs);
  
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
  
  const toUnlock: string[] = [];
  const nowStr = new Date().toISOString();
  
  for (const [badgeId, condition] of conditions) {
    if (condition && !unlockedIds.has(badgeId)) {
      unlockedList.push({ badgeId, unlockedAt: nowStr });
      toUnlock.push(badgeId);
    }
  }
  
  if (toUnlock.length > 0) {
    localStorage.setItem(achievementKey, JSON.stringify(unlockedList));
  }
  
  return toUnlock;
}

// ─── API 接口本地化實作 ───────────────────────────────────

/** 取得使用者 ID（MVP 階段用 localStorage 產生的 UUID） */
export function getUserId(): string {
  let userId = localStorage.getItem('guitar-user-id');
  if (!userId) {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      userId = crypto.randomUUID();
    } else {
      userId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
    localStorage.setItem('guitar-user-id', userId);
  }
  return userId;
}

/** 取得教材目錄 (讀取 public/content/catalog.json) */
export async function fetchCatalog(): Promise<Catalog> {
  const res = await fetch('/content/catalog.json');
  if (!res.ok) throw new Error('無法載入目錄');
  return res.json();
}

/** 取得指定文章內容 (直接 fetch 靜態 Markdown 檔案) */
export async function fetchArticle(category: string, filename: string): Promise<string> {
  const decodedFilename = decodeURIComponent(filename);
  const res = await fetch(`/content/${category}/${decodedFilename}`);
  if (!res.ok) throw new Error('無法載入文章');
  return res.text();
}

/** 取得使用者全部進度 */
export async function fetchProgress(userId: string): Promise<ProgressItem[]> {
  const progressKey = `guitar-progress-${userId}`;
  return JSON.parse(localStorage.getItem(progressKey) || '[]');
}

/** 切換某個檢查項目 */
export async function toggleCheckItem(
  userId: string,
  articleId: string,
  itemIndex: number
): Promise<ToggleResult> {
  // 1. 更新學習進度
  const progressKey = `guitar-progress-${userId}`;
  const progressList: ProgressItem[] = JSON.parse(localStorage.getItem(progressKey) || '[]');
  
  let progress = progressList.find((p) => p.articleId === articleId);
  const numericItemIndex = Number(itemIndex);
  
  if (!progress) {
    progress = {
      _id: `prog_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      userId,
      articleId,
      completedItems: [numericItemIndex],
      lastUpdated: new Date().toISOString(),
    };
    progressList.push(progress);
  } else {
    const isCompleted = progress.completedItems.includes(numericItemIndex);
    if (isCompleted) {
      progress.completedItems = progress.completedItems.filter((i) => i !== numericItemIndex);
    } else {
      progress.completedItems.push(numericItemIndex);
    }
    progress.lastUpdated = new Date().toISOString();
  }
  
  localStorage.setItem(progressKey, JSON.stringify(progressList));
  
  // 2. 更新當日打卡紀錄 (用於熱力圖)
  const logKey = `guitar-practice-logs-${userId}`;
  const logs: PracticeLogItem[] = JSON.parse(localStorage.getItem(logKey) || '[]');
  const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
  
  let log = logs.find((l) => l.date === today);
  if (!log) {
    log = { userId, date: today, articles: [articleId] };
    logs.push(log);
  } else if (!log.articles.includes(articleId)) {
    log.articles.push(articleId);
  }
  localStorage.setItem(logKey, JSON.stringify(logs));
  
  // 3. 解鎖成就徽章判定
  const newBadgeIds = await localEvaluateAndUnlockBadges(userId, progressList, logs);
  const newlyUnlocked: BadgeItem[] = [];
  for (const id of newBadgeIds) {
    const badgeDef = BADGE_MAP.get(id);
    if (badgeDef) {
      newlyUnlocked.push({
        ...badgeDef,
        unlocked: true,
        unlockedAt: new Date().toISOString(),
      });
    }
  }
  
  return { progress, newlyUnlocked };
}

/** 取得打卡紀錄 */
export async function fetchPracticeLogs(userId: string): Promise<PracticeLogItem[]> {
  const logKey = `guitar-practice-logs-${userId}`;
  return JSON.parse(localStorage.getItem(logKey) || '[]');
}

/** 取得使用者的徽章清單 */
export async function fetchAchievements(userId: string): Promise<BadgeItem[]> {
  const achievementKey = `guitar-achievements-${userId}`;
  const unlockedList: { badgeId: string; unlockedAt: string | null }[] = JSON.parse(
    localStorage.getItem(achievementKey) || '[]'
  );
  const unlockedMap = new Map(unlockedList.map((a) => [a.badgeId, a.unlockedAt]));
  
  return BADGES.map((badge) => ({
    ...badge,
    unlocked: unlockedMap.has(badge.id),
    unlockedAt: unlockedMap.get(badge.id) ?? null,
  }));
}

/** 取得使用者每日推薦練習選單 */
export async function fetchDailyMenu(userId: string): Promise<DailyMenuItem[]> {
  const menu: DailyMenuItem[] = [];
  const maxItems = 3;
  
  const progressKey = `guitar-progress-${userId}`;
  const allProgress: ProgressItem[] = JSON.parse(localStorage.getItem(progressKey) || '[]');
  const map = new Map<string, ProgressItem>(allProgress.map((p) => [p.articleId, p]));
  
  // 1. 優先推薦「繼續學習」（有勾選但小於 5 勾）
  const continueItems = allProgress.filter(
    (p) => p.completedItems.length > 0 && p.completedItems.length < 5
  );
  continueItems.sort(
    (a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
  );
  
  for (const item of continueItems) {
    if (menu.length >= maxItems) break;
    menu.push({ articleId: item.articleId, reason: 'continue' });
  }
  
  if (menu.length >= maxItems) return fillMenuTitles(menu);
  
  // 2. 推薦「複習」（完成大於 7 天）
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const reviewItems = allProgress.filter(
    (p) => p.completedItems.length >= 5 && new Date(p.lastUpdated).getTime() < sevenDaysAgo
  );
  reviewItems.sort(
    (a, b) => new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime()
  );
  
  for (const item of reviewItems) {
    if (menu.length >= maxItems) break;
    menu.push({ articleId: item.articleId, reason: 'review' });
  }
  
  if (menu.length >= maxItems) return fillMenuTitles(menu);
  
  // 3. 推薦「新內容」啟動項目
  const starterIds = [
    'tech_01', 'tech_02', 'tech_03',
    'theory_01', 'theory_02',
    'ghost_01', 'dinner_01',
  ];
  
  for (const articleId of starterIds) {
    if (menu.length >= maxItems) break;
    const p = map.get(articleId);
    if (!p || p.completedItems.length === 0) {
      menu.push({ articleId, reason: 'new' });
    }
  }
  
  // 萬一不夠，補充其他已完成項目隨機複習
  if (menu.length < maxItems && allProgress.length > 0) {
    const extraReviews = allProgress.filter(
      (p) => p.completedItems.length >= 5 && !menu.find((m) => m.articleId === p.articleId)
    );
    for (const item of extraReviews) {
      if (menu.length >= maxItems) break;
      menu.push({ articleId: item.articleId, reason: 'review' });
    }
  }
  
  return fillMenuTitles(menu);
}

// 輔助函式：從 Catalog 補充文章標題
async function fillMenuTitles(menu: DailyMenuItem[]): Promise<DailyMenuItem[]> {
  try {
    const catalog = await fetchCatalog();
    return menu.map((item) => {
      let title = item.articleId;
      for (const category of Object.values(catalog)) {
        const found = category.find((i) => i.id === item.articleId);
        if (found) {
          title = found.title;
          break;
        }
      }
      return { ...item, title };
    });
  } catch (e) {
    return menu;
  }
}

