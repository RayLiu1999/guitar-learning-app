const API_BASE = '/api';

export interface ArticleInfo {
  id: string;
  filename: string;
  title: string;
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

export interface ToggleResult {
  progress: ProgressItem;
  newlyUnlocked: BadgeItem[];
}

/** 取得使用者 ID（MVP 階段用 localStorage 產生的 UUID） */
export function getUserId(): string {
  let userId = localStorage.getItem('guitar-user-id');
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem('guitar-user-id', userId);
  }
  return userId;
}

/** 取得教材目錄 */
export async function fetchCatalog(): Promise<Catalog> {
  const res = await fetch(`${API_BASE}/content/catalog`);
  if (!res.ok) throw new Error('無法載入目錄');
  return res.json();
}

/** 取得指定文章內容 */
export async function fetchArticle(category: string, filename: string): Promise<string> {
  const res = await fetch(`${API_BASE}/content/${category}/${filename}`);
  if (!res.ok) throw new Error('無法載入文章');
  const data = await res.json();
  return data.content;
}

/** 取得使用者全部進度 */
export async function fetchProgress(userId: string): Promise<ProgressItem[]> {
  const res = await fetch(`${API_BASE}/progress?userId=${userId}`);
  if (!res.ok) throw new Error('無法載入進度');
  return res.json();
}

/** 切換某個檢查項目 */
export async function toggleCheckItem(
  userId: string,
  articleId: string,
  itemIndex: number
): Promise<ToggleResult> {
  const res = await fetch(`${API_BASE}/progress/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, articleId, itemIndex }),
  });
  if (!res.ok) throw new Error('無法更新進度');
  return res.json();
}

/** 取得打卡紀錄 */
export async function fetchPracticeLogs(userId: string): Promise<PracticeLogItem[]> {
  const res = await fetch(`${API_BASE}/progress/practice-log?userId=${userId}`);
  if (!res.ok) throw new Error('無法載入打卡紀錄');
  return res.json();
}

/** 取得使用者的徽章清單 */
export async function fetchAchievements(userId: string): Promise<BadgeItem[]> {
  const res = await fetch(`${API_BASE}/achievements?userId=${userId}`);
  if (!res.ok) throw new Error('無法載入成就徽章');
  return res.json();
}
