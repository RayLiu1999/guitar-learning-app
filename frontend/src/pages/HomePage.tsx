import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCatalog, fetchProgress, fetchPracticeLogs, fetchAchievements, getUserId, type Catalog, type ProgressItem, type PracticeLogItem, type BadgeItem } from '../api';
import { HeatmapChart } from '../components/HeatmapChart';
import { AchievementPanel } from '../components/AchievementPanel';

/** 分類元資料 */
const CATEGORY_META: Record<string, { label: string; emoji: string; description: string; gradient: string }> = {
  technique: {
    label: '技巧訓練',
    emoji: '🎸',
    description: '從撥弦到速彈，系統化的電吉他技巧訓練',
    gradient: 'from-indigo-500 to-purple-600',
  },
  theory: {
    label: '樂理',
    emoji: '🎵',
    description: '以指板為視角的樂理概念與和聲分析',
    gradient: 'from-emerald-500 to-teal-600',
  },
  ghost: {
    label: 'GHOST 教學',
    emoji: '👻',
    description: '歌曲分段教學與效果器設定',
    gradient: 'from-orange-500 to-red-600',
  },
  dinner: {
    label: '晚餐歌教學',
    emoji: '🍽️',
    description: '和弦全攻略與完整練習計畫',
    gradient: 'from-pink-500 to-rose-600',
  },
};

/** 計算各分類已知的檢查清單項目總數（預設每篇 5 項） */
const ITEMS_PER_ARTICLE = 5;

export default function HomePage() {
  const [catalog, setCatalog] = useState<Catalog>({});
  const [progress, setProgress] = useState<ProgressItem[]>([]);
  const [practiceLogs, setPracticeLogs] = useState<PracticeLogItem[]>([]);
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const userId = getUserId();
        const [cat, prog, logs, bdgs] = await Promise.all([
          fetchCatalog(),
          fetchProgress(userId),
          fetchPracticeLogs(userId),
          fetchAchievements(userId),
        ]);
        setCatalog(cat);
        setProgress(prog);
        setPracticeLogs(logs);
        setBadges(bdgs);
      } catch (err) {
        console.error('載入失敗:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  /** 計算某分類的完成百分比 */
  const getCategoryProgress = (category: string): number => {
    const articles = catalog[category];
    if (!articles || articles.length === 0) return 0;

    const totalItems = articles.length * ITEMS_PER_ARTICLE;
    const completedItems = progress
      .filter((p) => p.articleId.startsWith(category === 'technique' ? 'tech_' : `${category}_`))
      .reduce((sum, p) => sum + p.completedItems.length, 0);

    return Math.min(100, Math.round((completedItems / totalItems) * 100));
  };

  /** 計算整體進度 */
  const getOverallProgress = (): number => {
    const categories = Object.keys(catalog);
    if (categories.length === 0) return 0;
    const total = categories.reduce((sum, cat) => sum + getCategoryProgress(cat), 0);
    return Math.round(total / categories.length);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-gray-400 animate-pulse">載入中...</p>
        </div>
      </div>
    );
  }

  const overallProgress = getOverallProgress();

  return (
    <div className="animate-fade-in">
      {/* 歡迎標頭 */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-3">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-accent-400 to-primary-400">
            Guitar Lab
          </span>
        </h1>
        <p className="text-gray-400 text-lg">你的電吉他學習儀表板 🎶</p>
      </div>

      {/* 整體進度 */}
      <div className="glass-card p-6 mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-200">📊 整體學習進度</h2>
          <span className="text-2xl font-bold text-primary-400">{overallProgress}%</span>
        </div>
        <div className="w-full h-3 bg-surface-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">
          已完成 {progress.reduce((s, p) => s + p.completedItems.length, 0)} 個檢查項目
        </p>
      </div>

      {/* 打卡熱力圖 */}
      <div className="mb-8">
        <HeatmapChart logs={practiceLogs} />
      </div>

      {/* 成就徽章面板 */}
      <div className="mb-8">
        <AchievementPanel badges={badges} />
      </div>

      {/* 分類卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {Object.entries(CATEGORY_META).map(([key, meta]) => {
          const articles = catalog[key] || [];
          const categoryProgress = getCategoryProgress(key);

          return (
            <Link
              key={key}
              to={`/${key}`}
              className="glass-card p-6 group hover:border-primary-500/30 hover:shadow-lg hover:shadow-primary-500/5 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{meta.emoji}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-100 group-hover:text-primary-300 transition-colors">
                      {meta.label}
                    </h3>
                    <p className="text-xs text-gray-500">{articles.length} 篇教材</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-primary-400">{categoryProgress}%</span>
              </div>

              <p className="text-sm text-gray-400 mb-4">{meta.description}</p>

              {/* 進度條 */}
              <div className="w-full h-2 bg-surface-700 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${meta.gradient} rounded-full transition-all duration-700`}
                  style={{ width: `${categoryProgress}%` }}
                />
              </div>

              {/* 動態箭頭 */}
              <div className="flex justify-end mt-3">
                <svg
                  className="w-5 h-5 text-gray-600 group-hover:text-primary-400 group-hover:translate-x-1 transition-all"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
