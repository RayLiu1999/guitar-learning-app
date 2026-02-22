import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

/** 分類對照表 */
const CATEGORIES = [
  { key: 'technique', label: '🎸 技巧訓練', emoji: '🎸' },
  { key: 'theory', label: '🎵 樂理', emoji: '🎵' },
  { key: 'ghost', label: '👻 GHOST 教學', emoji: '👻' },
  { key: 'dinner', label: '🍽️ 晚餐歌教學', emoji: '🍽️' },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen flex">
      {/* 行動裝置漢堡選單按鈕 */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-surface-800 border border-surface-700 rounded-xl p-2.5 text-gray-300 hover:text-primary-400 hover:border-primary-500/50 transition-all"
        aria-label="切換選單"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {sidebarOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* 側邊導覽列 */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-surface-900/95 backdrop-blur-xl border-r border-surface-700/50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:shrink-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo 區域 */}
          <Link
            to="/"
            className="flex items-center gap-3 px-6 py-5 border-b border-surface-700/50 hover:bg-surface-800/50 transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <span className="text-3xl">🎸</span>
            <div>
              <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent-400">
                Guitar Lab
              </h1>
              <p className="text-xs text-gray-500">電吉他學習平台</p>
            </div>
          </Link>

          {/* 導覽項目 */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <div className="mb-2 px-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">教材系列</span>
            </div>
            {CATEGORIES.map((cat) => {
              const isActive = location.pathname.startsWith(`/${cat.key}`);
              return (
                <Link
                  key={cat.key}
                  to={`/${cat.key}`}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-all duration-200 group ${
                    isActive
                      ? 'bg-primary-500/15 text-primary-300 border border-primary-500/20'
                      : 'text-gray-400 hover:bg-surface-800 hover:text-gray-200 border border-transparent'
                  }`}
                >
                  <span className="text-lg">{cat.emoji}</span>
                  <span className="text-sm font-medium">{cat.label.replace(/^.+\s/, '')}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-400 animate-glow" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* 底部資訊 */}
          <div className="p-4 border-t border-surface-700/50">
            <div className="text-xs text-gray-600 text-center">
              🎶 每天練一點，進步看得見
            </div>
          </div>
        </div>
      </aside>

      {/* 行動裝置背景遮罩 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 主內容區域 */}
      <main className="flex-1 min-h-screen lg:pl-0">
        <div className="max-w-4xl mx-auto px-6 py-8 lg:px-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
