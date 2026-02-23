import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchDailyMenu, type DailyMenuItem, getUserId } from '../api';

const REASON_LABELS: Record<string, { text: string; color: string; icon: string }> = {
  continue: { text: '接續練習', color: 'text-amber-500 bg-amber-500/10', icon: '▶️' },
  review: { text: '溫故知新', color: 'text-emerald-500 bg-emerald-500/10', icon: '♻️' },
  new: { text: '新挑戰', color: 'text-blue-500 bg-blue-500/10', icon: '✨' },
};

// 簡單的從 articleId 到路徑的轉換 (MVP)
function getLinkFromId(articleId: string) {
  const [category] = articleId.split('_');
  const catParam = category === 'tech' ? 'technique' : category === 'theory' ? 'theory' : category;
  // 前端路由為 /category/01_filename.md ，這裡用查詢字串或簡化的路徑導航
  // 假設已經有目錄索引，或是在 ArticlePage 做 prefix 分析。我們先用簡易 mapping。
  return `/${catParam}/${articleId}`;
}

// 根據 ID 抓一個友善的標題 (理想上從 Catalog 取，此處為 fallback)
function getFallbackTitle(articleId: string) {
  const parts = articleId.split('_');
  const cat = parts[0] === 'tech' ? '技巧訓練' : parts[0] === 'theory' ? '樂理' : '吉他教學';
  return `${cat} 第 ${parts[1]} 篇`;
}

export function DailyPracticeCard() {
  const [menu, setMenu] = useState<DailyMenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = getUserId();
    fetchDailyMenu(userId)
      .then(setMenu)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="glass-card p-6 animate-pulse">
        <div className="h-6 bg-slate-700/50 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-12 bg-slate-700/30 rounded"></div>
          <div className="h-12 bg-slate-700/30 rounded"></div>
        </div>
      </div>
    );
  }

  if (menu.length === 0) return null;

  return (
    <div className="glass-card p-6 space-y-4 relative overflow-hidden group">
      {/* 裝飾背景光 */}
      <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-primary-500/20 rounded-full blur-3xl group-hover:bg-primary-500/30 transition-colors duration-500"></div>

      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl" id="daily-menu-icon" aria-label="today practice">📅</span>
        <h2 className="text-xl font-bold font-heading text-neutral-800 dark:text-neutral-100 tracking-wide" id="daily-menu-title">
          今日推薦菜單
        </h2>
      </div>

      <div className="grid gap-3" data-testid="daily-menu-list">
        {menu.map((item) => {
          const config = REASON_LABELS[item.reason] || REASON_LABELS.new;
          const link = getLinkFromId(item.articleId);
          return (
            <Link
              to={link}
              key={item.articleId}
              className="flex items-center justify-between p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700 hover:border-primary-400 dark:hover:border-primary-500 transition-all hover:-translate-y-0.5"
            >
              <div className="flex flex-col gap-1">
                <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full w-fit ${config.color}`}>
                  {config.icon} {config.text}
                </span>
                <span className="font-medium text-neutral-700 dark:text-neutral-200" data-testid={`menu-item-${item.articleId}`}>
                  {item.title || getFallbackTitle(item.articleId)}
                </span>
              </div>
              <div className="text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity">
                →
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
