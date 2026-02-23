import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchCatalog, fetchProgress, getUserId, type ArticleInfo, type ProgressItem } from '../api';

/** 分類名稱對照 */
const CATEGORY_LABELS: Record<string, string> = {
  technique: '🎸 電吉他技巧訓練',
  theory: '🎵 電吉他樂理',
  ghost: '👻 GHOST 教學系列',
  dinner: '🍽️ 晚餐歌教學系列',
};

/** 階段標籤（依號碼判斷） */
function getStageLabel(id: string): { label: string; color: string } {
  const num = parseInt(id.split('_')[1] || '0', 10);
  if (id.startsWith('tech_') || id.startsWith('theory_')) {
    if (num === 0) return { label: '總覽', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
    if (num <= 5) return { label: '🟢 初級', color: 'text-green-400 bg-green-500/10 border-green-500/20' };
    if (num <= 10) return { label: '🟡 中級', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' };
    if (num <= 15) return { label: '🔴 高級', color: 'text-red-400 bg-red-500/10 border-red-500/20' };
    return { label: '🎯 專題', color: 'text-primary-400 bg-primary-500/10 border-primary-500/20' };
  }
  return { label: '', color: '' };
}

export default function CategoryPage() {
  const { category } = useParams<{ category: string }>();
  const [articles, setArticles] = useState<ArticleInfo[]>([]);
  const [progress, setProgress] = useState<ProgressItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!category) return;
      try {
        const userId = getUserId();
        const [catalog, prog] = await Promise.all([
          fetchCatalog(),
          fetchProgress(userId),
        ]);
        setArticles(catalog[category] || []);
        setProgress(prog);
      } catch (err) {
        console.error('載入失敗:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [category]);

  /** 取得某篇文章的已完成項目數 */
  const getArticleCompletedCount = (articleId: string): number => {
    const p = progress.find((item) => item.articleId === articleId);
    return p ? p.completedItems.length : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* 麵包屑 */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-primary-400 transition-colors">首頁</Link>
        <span>/</span>
        <span className="text-gray-300">{CATEGORY_LABELS[category || ''] || category}</span>
      </div>

      <h1 className="text-3xl font-bold text-gray-100 mb-8">
        {CATEGORY_LABELS[category || ''] || category}
      </h1>

      {/* 文章列表 */}
      <div className="space-y-3">
        {articles.map((article) => {
          const completed = getArticleCompletedCount(article.id);
          const stage = getStageLabel(article.id);

          return (
            <Link
              key={article.id}
              to={`/${category}/${article.filename}`}
              className="glass-card p-5 flex items-center justify-between group hover:border-primary-500/30 hover:shadow-lg hover:shadow-primary-500/5 transition-all duration-300 block"
            >
              <div className="flex items-center gap-4">
                {/* 完成狀態指示器 */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                  completed > 0
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                    : 'bg-surface-700/50 text-gray-500 border border-surface-600/50'
                }`}>
                  {article.id.split('_')[1] || '#'}
                </div>

                <div>
                  <h3 className="text-base font-medium text-gray-200 group-hover:text-primary-300 transition-colors">
                    {article.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {stage.label && (
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${stage.color}`}>
                        {stage.label}
                      </span>
                    )}
                    {completed > 0 && (
                      <span className="text-xs text-gray-500">
                        ✅ {completed} 項已完成
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <svg
                className="w-5 h-5 text-gray-600 group-hover:text-primary-400 group-hover:translate-x-1 transition-all shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          );
        })}
      </div>

      {articles.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <p className="text-5xl mb-4">📭</p>
          <p>此分類尚無教材</p>
        </div>
      )}
    </div>
  );
}
