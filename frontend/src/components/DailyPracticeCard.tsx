import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchDailyMenu,
  fetchCatalog,
  type DailyMenuItem,
  type Catalog,
  getUserId,
} from "../api";

const REASON_LABELS: Record<
  string,
  { text: string; color: string; icon: string }
> = {
  continue: {
    text: "接續練習",
    color: "text-amber-500 bg-amber-500/10",
    icon: "▶️",
  },
  review: {
    text: "溫故知新",
    color: "text-emerald-500 bg-emerald-500/10",
    icon: "♻️",
  },
  new: { text: "新挑戰", color: "text-blue-500 bg-blue-500/10", icon: "✨" },
};

// 根據 ID 從 Catalog 中獲取連結與標題
function getInfoFromId(articleId: string, catalog: Catalog) {
  for (const [category, articles] of Object.entries(catalog)) {
    const found = articles.find((a) => a.id === articleId);
    if (found) {
      const catParam =
        category === "tech"
          ? "technique"
          : category === "theory"
            ? "theory"
            : category;
      return {
        link: `/${catParam}/${found.filename}`,
        title: found.title,
      };
    }
  }
  return null;
}

export function DailyPracticeCard() {
  const [menu, setMenu] = useState<DailyMenuItem[]>([]);
  const [catalog, setCatalog] = useState<Catalog>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const userId = getUserId();
        const [menuData, catalogData] = await Promise.all([
          fetchDailyMenu(userId),
          fetchCatalog(),
        ]);
        setMenu(menuData);
        setCatalog(catalogData);
      } catch (err) {
        console.error("載入練習清單失敗:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="glass-card p-6 animate-pulse">
        <div className="h-6 bg-surface-700/50 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-12 bg-surface-700/30 rounded"></div>
          <div className="h-12 bg-surface-700/30 rounded"></div>
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
        <span
          className="text-2xl"
          id="daily-menu-icon"
          aria-label="today practice"
        >
          📅
        </span>
        <h2
          className="text-xl font-bold text-gray-100 tracking-wide"
          id="daily-menu-title"
        >
          今日推薦菜單
        </h2>
      </div>

      <div className="grid gap-3" data-testid="daily-menu-list">
        {menu.map((item) => {
          const config = REASON_LABELS[item.reason] || REASON_LABELS.new;
          const info = getInfoFromId(item.articleId, catalog);

          if (!info) return null;

          return (
            <Link
              to={info.link}
              key={item.articleId}
              className="flex items-center justify-between p-4 rounded-xl bg-surface-800/50 border border-surface-700 hover:border-primary-500 transition-all hover:-translate-y-0.5"
            >
              <div className="flex flex-col gap-1">
                <span
                  className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full w-fit ${config.color}`}
                >
                  {config.icon} {config.text}
                </span>
                <span
                  className="font-medium text-gray-200"
                  data-testid={`menu-item-${item.articleId}`}
                >
                  {info.title}
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
