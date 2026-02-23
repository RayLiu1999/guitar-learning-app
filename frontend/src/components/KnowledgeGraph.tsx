import { useEffect, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useNavigate } from 'react-router-dom';
import { fetchCatalog, type Catalog, type ArticleInfo } from '../api';

interface GraphNode {
  id: string;
  name: string;
  category: string;
  val: number;
  filename: string;
  color?: string;
}

interface GraphLink {
  source: string;
  target: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  technique: '#6366f1', // Indigo
  theory: '#0ea5e9',    // Sky
  ghost: '#a855f7',     // Purple
  dinner: '#f43f5e',    // Rose
};

export function KnowledgeGraph() {
  const fgRef = useRef<any>(null);
  const navigate = useNavigate();
  const [data, setData] = useState<{ nodes: GraphNode[]; links: GraphLink[] }>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 響應式調整圖表大小
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    window.addEventListener('resize', updateDimensions);
    updateDimensions();

    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    fetchCatalog().then((catData: Catalog) => {
      const nodes: GraphNode[] = [];
      const links: GraphLink[] = [];

      Object.entries(catData).forEach(([category, articles]) => {
        articles.forEach((art: ArticleInfo) => {
          // 加入節點
          nodes.push({
            id: art.id,
            name: art.title,
            category,
            val: 1.5 + (art.backlinks?.length || 0) * 0.5, // 被連結越多，節點越大
            filename: art.filename,
            color: CATEGORY_COLORS[category] || '#94a3b8'
          });

          // 加入連線 (前向連結)
          if (art.forwardLinks) {
            art.forwardLinks.forEach(targetId => {
              links.push({ source: art.id, target: targetId });
            });
          }
        });
      });

      setData({ nodes, links });
      setLoading(false);
      
      // 動畫：縮放整張圖以適應螢幕
      setTimeout(() => {
        if (fgRef.current) {
          fgRef.current.zoomToFit(400, 20);
        }
      }, 500);
    }).catch(console.error);
  }, []);

  if (loading) {
    return (
      <div className="glass-card p-6 h-[400px] flex items-center justify-center">
        <div className="animate-spin text-primary-500 text-4xl">🎸</div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 relative flex flex-col h-[500px]" ref={containerRef}>
      <div className="mb-4 flex items-center justify-between z-10">
        <h2 className="text-xl font-bold font-heading text-neutral-800 flex items-center gap-2">
          <span>🌌</span> 知識圖譜
        </h2>
        <div className="flex gap-3 text-xs font-medium">
          {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
            <div key={cat} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></span>
              <span className="capitalize text-neutral-600">{cat}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-surface-50 rounded-xl overflow-hidden shadow-inner border border-surface-200">
        {dimensions.width > 0 && (
          <ForceGraph2D
            ref={fgRef}
            width={dimensions.width - 48} // 扣除 padding
            height={dimensions.height - 80} // 扣除 padding 與 header
            graphData={data}
            nodeLabel="name"
            nodeColor="color"
            nodeRelSize={4}
            linkColor={() => 'var(--color-surface-300)'}
            linkWidth={1}
            linkDirectionalArrowLength={3.5}
            linkDirectionalArrowRelPos={1}
            onNodeClick={(node: GraphNode) => {
              navigate(`/${node.category === 'tech' ? 'technique' : 
                          node.category === 'theory' ? 'theory' : 
                          node.category}/${node.filename}`);
            }}
            cooldownTicks={100} // 計算很快就停下來，節省效能
          />
        )}
      </div>
    </div>
  );
}
