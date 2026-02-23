import { useMemo, type ReactElement } from 'react';
import { ActivityCalendar, type ThemeInput, type Activity } from 'react-activity-calendar';
import { format, subDays } from 'date-fns';

export interface PracticeLog {
  date: string;
  articles: string[];
}

interface HeatmapChartProps {
  logs: PracticeLog[];
}

const theme: ThemeInput = {
  light: ['#262320', '#92400E', '#B45309', '#D97706', '#F59E0B'],
  dark: ['#262320', '#92400E', '#B45309', '#D97706', '#F59E0B'],
};

export const HeatmapChart = ({ logs }: HeatmapChartProps) => {
  const data = useMemo(() => {
    // 產生過去 365 天的預設資料結構
    const today = new Date();
    const result = [];
    
    // 建立一個 date -> level 的 mapping 以便快速查找
    const logMap = new Map<string, number>();
    logs.forEach(log => {
      // 依據完成的文章數量決定顏色深淺 (1, 2, 3+)
      const count = log.articles.length;
      const level = count >= 3 ? 4 : count >= 2 ? 3 : count === 1 ? 2 : 1;
      logMap.set(log.date, level);
    });

    for (let i = 364; i >= 0; i--) {
      const date = subDays(today, i);
      const dateString = format(date, 'yyyy-MM-dd');
      
      result.push({
        date: dateString,
        count: logMap.get(dateString) || 0,
        level: logMap.has(dateString) ? logMap.get(dateString)! : 0
      });
    }

    return result;
  }, [logs]);

  return (
    <div className="glass-card p-6 overflow-x-auto w-full max-w-full custom-scrollbar">
      <h3 className="text-xl font-bold text-gray-100 mb-4 tracking-wide">
        🎸 練習足跡
      </h3>
      <div className="min-w-[800px]">
        <ActivityCalendar 
          data={data} 
          theme={theme}
          colorScheme="dark"
          labels={{
            months: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
            weekdays: ['日', '一', '二', '三', '四', '五', '六'],
            totalCount: '這一年完成了 {{count}} 個學習單元',
            legend: {
              less: '少',
              more: '多'
            }
          }}
          renderBlock={(block: ReactElement, activity: Activity) => (
            <div title={`${activity.date}: 練習了 ${activity.count ? `${activity.count} 個單元` : '0 個單元'}`}>
              {block}
            </div>
          )}
        />
      </div>
    </div>
  );
};
