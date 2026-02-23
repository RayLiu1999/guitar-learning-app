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
  technique: '#F59E0B', // Amber (primary)
  theory: '#0EA5E9',    // Sky (accent)
  ghost: '#ef4444',     // Red
  dinner: '#22c55e',    // Green
};

export function KnowledgeGraph() {
  const fgRef = useRef<any>(null);
  const navigate = useNavigate();
  const [data, setData] = useState<{ nodes: GraphNode[]; links: GraphLink[] }>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };

    // 使用 ResizeObserver 監聽容器實際大小變化 (比 window resize 更精準)
    const observer = new ResizeObserver(() => {
      updateDimensions();
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    // 初始偵測 (稍微延遲確保樣式套用)
    updateDimensions();
    const timer = setTimeout(updateDimensions, 200);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    fetchCatalog().then((catData: Catalog) => {
      console.log('KnowledgeGraph: Loaded Catalog', catData);
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

      console.log(`KnowledgeGraph: Generated ${nodes.length} nodes and ${links.length} links`);
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
        <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
          <span>🌌</span> 知識圖譜
        </h2>
        <div className="flex gap-3 text-xs font-medium">
          <span className="text-gray-500">
            {data.nodes.length} 節點 / {data.links.length} 連線
          </span>
          {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
            <div key={cat} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></span>
              <span className="capitalize text-gray-500">{cat}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-surface-900/50 rounded-xl overflow-hidden shadow-inner border border-surface-700">
        {dimensions.width > 0 && dimensions.height > 100 && (
          <ForceGraph2D
            key={`${dimensions.width}-${dimensions.height}`}
            ref={fgRef}
            width={dimensions.width - 48} // 扣除 padding
            height={dimensions.height - 80} // 扣除 padding 與 header
            graphData={data}
            backgroundColor="transparent"
            nodeLabel="name"
            nodeColor="color"
            nodeRelSize={6} // 稍微加粗一點
            linkColor={() => '#9C9489'} // 使用 Explicit color (surface-400)
            linkWidth={1.5}
            linkDirectionalArrowLength={4}
            linkDirectionalArrowRelPos={1}
            onNodeClick={(node: GraphNode) => {
              navigate(`/${node.category === 'tech' ? 'technique' : 
                          node.category === 'theory' ? 'theory' : 
                          node.category}/${node.filename}`);
            }}
            cooldownTicks={100} 
            d3AlphaDecay={0.02} // 讓動力學早點穩定
          />
        )}
      </div>
    </div>
  );
}
