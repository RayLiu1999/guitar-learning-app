import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Fretboard } from '../components/fretboard/Fretboard';
import {
  fetchArticle,
  fetchProgress,
  fetchCatalog,
  toggleCheckItem,
  getUserId,
  type ProgressItem,
  type Catalog,
  type ArticleInfo,
} from '../api';

/** 分類名稱轉換 */
const CATEGORY_PREFIX: Record<string, string> = {
  technique: 'tech',
  theory: 'theory',
  ghost: 'ghost',
  dinner: 'dinner',
};

const CATEGORY_LABELS: Record<string, string> = {
  technique: '🎸 技巧訓練',
  theory: '🎵 樂理',
  ghost: '👻 GHOST 教學',
  dinner: '🍽️ 晚餐歌教學',
};

export default function ArticlePage() {
  const { category, filename } = useParams<{ category: string; filename: string }>();
  const [content, setContent] = useState('');
  const [checkItems, setCheckItems] = useState<string[]>([]);
  const [completedItems, setCompletedItems] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [catalog, setCatalog] = useState<Catalog>({});
  const [backlinks, setBacklinks] = useState<ArticleInfo[]>([]);

  /** 從檔名提取 articleId */
  const getArticleId = useCallback((): string => {
    if (!category || !filename) return '';
    const prefix = CATEGORY_PREFIX[category] || category;
    const match = filename.match(/^(\d+)/);
    const num = match ? match[1] : '00';
    return `${prefix}_${num}`;
  }, [category, filename]);

  /** 從 Markdown 內容中提取檢查清單項目 */
  const extractCheckItems = (md: string): string[] => {
    const regex = /^- \[[ x]\] (.+)$/gm;
    const items: string[] = [];
    let match;
    while ((match = regex.exec(md)) !== null) {
      items.push(match[1]!);
    }
    return items;
  };

  useEffect(() => {
    const load = async () => {
      if (!category || !filename) return;
      try {
        const userId = getUserId();
        const articleId = getArticleId();

        const [articleContent, progressList, catalogData] = await Promise.all([
          fetchArticle(category, filename),
          fetchProgress(userId),
          fetchCatalog()
        ]);

        setContent(articleContent);
        setCheckItems(extractCheckItems(articleContent));
        setCatalog(catalogData);

        // 整理 current article 的 backlinks
        const bl: ArticleInfo[] = [];
        for (const cat of Object.values(catalogData)) {
          for (const item of cat) {
            if (item.id === articleId) {
              // 找到自己，從 catalog 其他地方找出哪些文章連了自己
              // 為了簡化，給定 ID，我們去查哪些文章的 ID 存在於 item.backlinks 中
              const linkSet = new Set(item.backlinks || []);
              for (const searchCat of Object.values(catalogData)) {
                for (const searchItem of searchCat) {
                  if (linkSet.has(searchItem.id)) {
                    bl.push(searchItem);
                  }
                }
              }
            }
          }
        }
        setBacklinks(bl);

        // 找到此篇的進度
        const articleProgress = progressList.find(
          (p: ProgressItem) => p.articleId === articleId
        );
        setCompletedItems(articleProgress?.completedItems || []);
      } catch (err) {
        console.error('載入文章失敗:', err);
        setError('無法載入文章，請確認後端服務是否啟動');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [category, filename, getArticleId]);

  /** 處理勾選事件 */
  const handleToggle = async (index: number) => {
    try {
      const userId = getUserId();
      const articleId = getArticleId();
      const result = await toggleCheckItem(userId, articleId, index);
      setCompletedItems(result.progress.completedItems);
    } catch (err) {
      console.error('更新失敗:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-5xl mb-4">⚠️</p>
        <p className="text-gray-400">{error}</p>
      </div>
    );
  }

  // 將 Markdown 中的 [[article_id]] 或 [[article_id|自訂文字]] 轉為標準 md 連結
  const resolveWikiLinks = (md: string, catData: Catalog) => {
    return md.replace(/\[\[(.*?)(?:\|(.*?))?\]\]/g, (match, idStr, aliasStr) => {
      const id = idStr.trim();
      let target: { filename: string; category: string; title: string } | null = null;
      for (const [cat, items] of Object.entries(catData)) {
        const found = items.find(i => i.id === id);
        if (found) {
          target = { filename: found.filename, category: cat, title: found.title };
          break;
        }
      }
      if (target) {
        const displayText = aliasStr ? aliasStr.trim() : target.title;
        return `[${displayText}](/${target.category}/${target.filename})`;
      }
      return match; // 找不到對應，保持原樣
    });
  };

  // 移除原始 Markdown 中的 checklist，並解析維基標記
  const contentWithoutChecklist = resolveWikiLinks(
    content.replace(/## ✅ 本篇檢查清單[\s\S]*?(?=\n---|\n##|$)/, ''),
    catalog
  );

  return (
    <div className="animate-fade-in">
      {/* 麵包屑 */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-primary-400 transition-colors">首頁</Link>
        <span>/</span>
        <Link to={`/${category}`} className="hover:text-primary-400 transition-colors">
          {CATEGORY_LABELS[category || ''] || category}
        </Link>
        <span>/</span>
        <span className="text-gray-300 truncate max-w-[200px]">
          {filename?.replace('.md', '').replace(/^\d+_/, '')}
        </span>
      </div>

      {/* 文章內容 */}
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            code({ className, children, ...props }) {
              const inline = !className;
              const match = /language-(\w+)/.exec(className || '');
              const isFretboard = match && match[1] === 'fretboard';
              
              if (!inline && isFretboard) {
                try {
                  // 嘗試解析 JSON 內容
                  const fretboardProps = JSON.parse(String(children).trim());
                  return (
                    <div className="not-prose my-6 w-full overflow-x-auto pb-4 custom-scrollbar">
                      <div className="min-w-[800px] flex justify-center">
                        <Fretboard {...fretboardProps} />
                      </div>
                    </div>
                  );
                } catch {
                  return (
                    <div className="text-red-500 border border-red-500 p-4 rounded">
                      Fretboard 解析錯誤：區塊內容必須是有效的 JSON (例如: {`{"chord": "Am"}`})
                    </div>
                  );
                }
              }

              return !inline && match ? (
                <div className="w-full overflow-x-auto pb-2 custom-scrollbar my-4 rounded-lg bg-[#282c34]">
                  <code className={className} {...props} style={{ display: 'block', padding: '1rem', minWidth: 'max-content' }}>
                    {children}
                  </code>
                </div>
              ) : (
                <code className="bg-surface-200 dark:bg-surface-700 text-primary-600 dark:text-primary-300 px-1.5 py-0.5 rounded text-sm break-all" {...props}>
                  {children}
                </code>
              );
            }
          }}
        >
          {contentWithoutChecklist}
        </ReactMarkdown>

      {/* 互動式檢查清單 */}
      {checkItems.length > 0 && (
        <div className="glass-card p-6 mt-10">
          <h2 className="text-xl font-semibold text-primary-400 mb-4 flex items-center gap-2">
            ✅ 本篇檢查清單
            <span className="text-sm font-normal text-gray-500">
              ({completedItems.length}/{checkItems.length})
            </span>
          </h2>

          {/* 進度條 */}
          <div className="w-full h-2 bg-surface-700 rounded-full overflow-hidden mb-5">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${checkItems.length > 0 ? (completedItems.length / checkItems.length) * 100 : 0}%` }}
            />
          </div>

          <div className="space-y-2">
            {checkItems.map((item, index) => {
              const isCompleted = completedItems.includes(index);
              return (
                <button
                  key={index}
                  onClick={() => handleToggle(index)}
                  className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isCompleted
                      ? 'bg-green-500/10 border border-green-500/20 text-green-300'
                      : 'bg-surface-800/50 border border-surface-700/50 text-gray-300 hover:bg-surface-700/50 hover:border-surface-600'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                    isCompleted
                      ? 'bg-green-500 border-green-500'
                      : 'border-gray-600 hover:border-primary-500'
                  }`}>
                    {isCompleted && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className={isCompleted ? 'line-through opacity-70' : ''}>
                    {item}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 全部完成提示 */}
          {completedItems.length === checkItems.length && checkItems.length > 0 && (
            <div className="mt-5 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl text-center">
              <p className="text-lg font-semibold text-green-400">🎉 恭喜完成本篇所有項目！</p>
              <p className="text-sm text-green-500/70 mt-1">你的進度已自動儲存</p>
            </div>
          )}
        </div>
      )}

      {/* 反向連結區塊 */}
      {backlinks.length > 0 && (
        <div className="mt-8 pt-6 border-t border-surface-200">
          <h3 className="text-lg font-bold text-neutral-700 mb-3 flex items-center gap-2">
            🔗 連結到此篇的文章
          </h3>
          <ul className="flex flex-wrap gap-2">
            {backlinks.map(bl => {
              const blCategory = bl.id.split('_')[0] === 'tech' ? 'technique' : 
                                 bl.id.split('_')[0] === 'theory' ? 'theory' : 
                                 bl.id.split('_')[0];
              return (
                <li key={bl.id}>
                  <Link
                    to={`/${blCategory}/${bl.filename}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-100 hover:bg-primary-50 text-surface-700 hover:text-primary-600 rounded-lg transition-colors text-sm border border-surface-200 hover:border-primary-200"
                  >
                    <span className="opacity-50 text-xs text-mono">{bl.id}</span>
                    <span>{bl.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
