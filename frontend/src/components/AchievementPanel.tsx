import { useEffect, useState, useRef } from 'react';
import type { BadgeItem } from '../api';

interface Props {
  badges: BadgeItem[];
  /** 最新解鎖的 badge ids（在文章頁打卡後傳入） */
  newlyUnlockedIds?: string[];
}

export function AchievementPanel({ badges, newlyUnlockedIds = [] }: Props) {
  const [showNewBadge, setShowNewBadge] = useState<BadgeItem | null>(null);
  const prevNewlyUnlocked = useRef<string[]>([]);

  // 監聽新解鎖的徽章並顯示動畫彈出提示
  useEffect(() => {
    const actual = newlyUnlockedIds.filter(
      (id) => !prevNewlyUnlocked.current.includes(id)
    );
    if (actual.length > 0) {
      const badge = badges.find((b) => b.id === actual[0]);
      if (badge) {
        setShowNewBadge(badge);
        setTimeout(() => setShowNewBadge(null), 3500);
      }
    }
    prevNewlyUnlocked.current = newlyUnlockedIds;
  }, [newlyUnlockedIds, badges]);

  const unlockedBadges = badges.filter((b) => b.unlocked);
  const lockedBadges = badges.filter((b) => !b.unlocked);

  return (
    <div className="glass-card p-6 relative">
      {/* 新徽章解鎖的浮動提示 */}
      {showNewBadge && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full shadow-lg shadow-yellow-500/40 text-white font-semibold text-sm whitespace-nowrap">
            <span className="text-xl">{showNewBadge.emoji}</span>
            <span>新徽章解鎖！{showNewBadge.name}</span>
            <span className="text-yellow-200">🎉</span>
          </div>
        </div>
      )}

      {/* 標頭 */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-gray-200">🏅 成就徽章</h2>
        <span className="text-sm text-gray-500">
          {unlockedBadges.length} / {badges.length}
        </span>
      </div>

      {/* 已解鎖的徽章 */}
      {unlockedBadges.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">已解鎖</p>
          <div className="flex flex-wrap gap-2">
            {unlockedBadges.map((badge) => (
              <div
                key={badge.id}
                title={`${badge.name}：${badge.description}`}
                className="flex flex-col items-center gap-1 p-2 rounded-lg bg-surface-700/50 border border-primary-500/20 hover:border-primary-400/50 transition-all cursor-default min-w-[64px]"
              >
                <span className="text-2xl">{badge.emoji}</span>
                <span className="text-xs text-gray-300 text-center leading-tight max-w-[60px]">
                  {badge.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 未解鎖的徽章（呈現灰色加鎖形態） */}
      {lockedBadges.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">尚未解鎖</p>
          <div className="flex flex-wrap gap-2">
            {lockedBadges.map((badge) => (
              <div
                key={badge.id}
                title={badge.description}
                className="flex flex-col items-center gap-1 p-2 rounded-lg bg-surface-800/50 border border-white/5 cursor-default min-w-[64px] opacity-40 hover:opacity-60 transition-opacity"
              >
                <span className="text-2xl grayscale">{badge.emoji}</span>
                <span className="text-xs text-gray-500 text-center leading-tight max-w-[60px]">
                  {badge.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 全部已解鎖的特殊顯示 */}
      {badges.length > 0 && unlockedBadges.length === badges.length && (
        <p className="text-center text-yellow-400 font-semibold mt-4">🎊 已解鎖全部徽章！成就滿貫！</p>
      )}
    </div>
  );
}
