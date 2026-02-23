import type { ProgressItem } from '../api';

interface SkillNode {
  id: string;        // articleId（如 tech_01）
  label: string;     // 顯示名稱
  x: number;         // SVG 座標 X
  y: number;         // SVG 座標 Y
  requires?: string[]; // 前置技能的 articleId
}

interface SkillGroup {
  label: string;
  color: string;        // 群組顏色（Tailwind CSS var or hex）
  nodes: SkillNode[];
}

/**
 * 技能樹節點定義（僅涵蓋技巧訓練系列的 19 個節點）
 *
 * 座標系：SVG viewBox 0 0 900 500
 * 共四個「難度層」：初級 / 中級 / 高級 / 專題
 */
const SKILL_GROUPS: SkillGroup[] = [
  {
    label: '初級',
    color: '#22c55e', // green-500
    nodes: [
      { id: 'tech_01', label: '撥弦基礎',      x: 90,  y: 250 },
      { id: 'tech_02', label: '左手與爬格子',   x: 250, y: 150 },
      { id: 'tech_03', label: 'Power Chord',    x: 250, y: 250, requires: ['tech_01'] },
      { id: 'tech_04', label: 'Palm Mute',      x: 250, y: 350, requires: ['tech_01'] },
      { id: 'tech_05', label: '基礎和弦',       x: 250, y: 450, requires: ['tech_02'] },
    ],
  },
  {
    label: '中級',
    color: '#eab308', // yellow-500
    nodes: [
      { id: 'tech_06', label: '搥弦與勾弦',    x: 450, y: 150, requires: ['tech_02'] },
      { id: 'tech_07', label: '推弦與揉弦',    x: 450, y: 250, requires: ['tech_03'] },
      { id: 'tech_08', label: '滑音',          x: 450, y: 350, requires: ['tech_04'] },
      { id: 'tech_09', label: '音階系統',      x: 450, y: 450, requires: ['tech_05'] },
      { id: 'tech_10', label: '節奏進階',      x: 620, y: 300, requires: ['tech_07', 'tech_08'] },
    ],
  },
  {
    label: '高級',
    color: '#ef4444', // red-500
    nodes: [
      { id: 'tech_11', label: '速彈入門',      x: 700, y: 150, requires: ['tech_06', 'tech_10'] },
      { id: 'tech_12', label: 'Tapping',       x: 700, y: 300, requires: ['tech_10'] },
      { id: 'tech_13', label: 'Sweep Picking', x: 700, y: 450, requires: ['tech_09', 'tech_10'] },
    ],
  },
  {
    label: '專題',
    color: '#a855f7', // purple-500
    nodes: [
      { id: 'tech_14', label: '泛音技巧',     x: 820, y: 150, requires: ['tech_11'] },
      { id: 'tech_15', label: '搖桿技巧',     x: 820, y: 250, requires: ['tech_12'] },
      { id: 'tech_16', label: '音色控制',     x: 820, y: 350, requires: ['tech_12'] },
      { id: 'tech_17', label: '效果器入門',   x: 820, y: 450, requires: ['tech_13'] },
      { id: 'tech_18', label: '即興入門',     x: 880, y: 300, requires: ['tech_14', 'tech_15'] },
    ],
  },
];

interface Props {
  progress: ProgressItem[];
}

/** 判斷文章是否已完成（completedItems >= 5 表示全打勾） */
function isCompleted(progress: ProgressItem[], articleId: string): boolean {
  const p = progress.find((item) => item.articleId === articleId);
  return (p?.completedItems.length ?? 0) >= 5;
}

/** 判斷文章是否可解鎖（所有前置技能完成） */
function isUnlocked(progress: ProgressItem[], node: SkillNode): boolean {
  if (!node.requires || node.requires.length === 0) return true;
  return node.requires.every((req) => isCompleted(progress, req));
}

export function SkillTree({ progress }: Props) {
  const allNodes = SKILL_GROUPS.flatMap((g) => g.nodes);

  return (
    <div className="glass-card p-6 overflow-x-auto custom-scrollbar">
      <h2 className="text-lg font-semibold text-gray-200 mb-4">🌳 技巧技能樹</h2>

      <svg
        viewBox="0 0 920 520"
        className="min-w-[700px] w-full"
        aria-label="技巧技能樹"
      >
        {/* ─── 連接線 ─────────────────────────────────────── */}
        {allNodes.map((node) =>
          node.requires?.map((req) => {
            const from = allNodes.find((n) => n.id === req);
            if (!from) return null;
            const reqDone = isCompleted(progress, req);
            return (
              <line
                key={`${req}->${node.id}`}
                x1={from.x}
                y1={from.y}
                x2={node.x}
                y2={node.y}
                stroke={reqDone ? '#4ade80' : '#374151'}
                strokeWidth={2}
                strokeDasharray={reqDone ? undefined : '4 4'}
                opacity={0.6}
              />
            );
          })
        )}

        {/* ─── 節點 ────────────────────────────────────────── */}
        {SKILL_GROUPS.map((group) =>
          group.nodes.map((node) => {
            const done = isCompleted(progress, node.id);
            const unlocked = isUnlocked(progress, node);
            const circleFill = done ? group.color : unlocked ? '#1e293b' : '#111827';
            const circleStroke = done ? group.color : unlocked ? group.color : '#374151';
            const textFill = done ? '#fff' : unlocked ? '#e5e7eb' : '#4b5563';

            return (
              <g key={node.id} role="img" aria-label={`${node.label}：${done ? '已完成' : unlocked ? '可學習' : '尚未解鎖'}`}>
                {/* 光暈（完成時） */}
                {done && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={26}
                    fill={group.color}
                    opacity={0.2}
                  />
                )}

                {/* 主節點圓形 */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={22}
                  fill={circleFill}
                  stroke={circleStroke}
                  strokeWidth={2}
                />

                {/* 完成勾勾 */}
                {done && (
                  <text x={node.x} y={node.y + 5} textAnchor="middle" fontSize={14} fill="#fff">
                    ✓
                  </text>
                )}

                {/* 鎖定圖示 */}
                {!done && !unlocked && (
                  <text x={node.x} y={node.y + 5} textAnchor="middle" fontSize={12} fill="#4b5563">
                    🔒
                  </text>
                )}

                {/* 標籤 */}
                <text
                  x={node.x}
                  y={node.y + 36}
                  textAnchor="middle"
                  fontSize={9}
                  fill={textFill}
                  fontFamily="system-ui, sans-serif"
                >
                  {node.label}
                </text>
              </g>
            );
          })
        )}

        {/* ─── 難度圖例 ─────────────────────────────────────── */}
        {SKILL_GROUPS.map((group, i) => (
          <g key={group.label} transform={`translate(${50 + i * 120}, 10)`}>
            <circle r={6} fill={group.color} />
            <text x={12} y={5} fontSize={10} fill="#9ca3af" fontFamily="system-ui, sans-serif">
              {group.label}
            </text>
          </g>
        ))}
      </svg>

      {/* 文字統計 */}
      <p className="text-sm text-gray-500 mt-3" data-testid="skill-stat">
        技巧訓練：已完成 {allNodes.filter((n) => isCompleted(progress, n.id)).length} / {allNodes.length} 個節點
      </p>
    </div>
  );
}
