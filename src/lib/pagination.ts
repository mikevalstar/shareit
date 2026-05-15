import type { Context } from "hono";

export const PAGE_SIZE = 50;

export type PageQuery = {
  q: string;
  page: number;
  offset: number;
  limit: number;
};

export function readPageQuery(c: Context): PageQuery {
  const q = (c.req.query("q") ?? "").trim();
  const raw = Number.parseInt(c.req.query("page") ?? "1", 10);
  const page = Number.isFinite(raw) && raw > 0 ? raw : 1;
  return { q, page, offset: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE };
}

export function likePattern(q: string): string {
  return `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
}

export type PageMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  q: string;
  basePath: string;
};

export function buildPageMeta(basePath: string, pq: PageQuery, total: number): PageMeta {
  return {
    page: pq.page,
    pageSize: PAGE_SIZE,
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    q: pq.q,
    basePath,
  };
}
