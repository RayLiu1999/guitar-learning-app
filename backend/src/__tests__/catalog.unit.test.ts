import { describe, it, expect } from 'vitest';
import { buildCatalogAndLinks } from '../services/catalogService';

describe('Catalog Service - 雙向連結解析', () => {
  it('1. 應能取得包含 forwardLinks 與 backlinks 的目錄結構', () => {
    // buildCatalogAndLinks 會從真實目錄讀取，我們這裡直接確保格式正確
    // 未來若要隔離測試，可以把目錄 path 寫成可注入的
    const catalog = buildCatalogAndLinks();

    // 確保留有內容（如果本地環境有放 md 檔案）
    expect(typeof catalog).toBe('object');

    for (const cat in catalog) {
      if (catalog[cat].length > 0) {
        const item = catalog[cat][0];
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('forwardLinks');
        expect(Array.isArray(item.forwardLinks)).toBe(true);
        expect(item).toHaveProperty('backlinks');
        expect(Array.isArray(item.backlinks)).toBe(true);
      }
    }
  });
});
