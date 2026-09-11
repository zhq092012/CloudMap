/**
 * REST API 客户端 —— 对应 agentbuilder 后端的 /api/data 接口。
 * 替代原有的 redroom-trpc 调用，直接通过 fetch 请求后端 REST API。
 *
 * 接口：
 * - GET /api/data/articles        → 对应 redroomTrpc.articles.list.query()
 * - GET /api/data/cms             → 对应 redroomTrpc.cms.getSiteContent.query()
 * - GET /api/data/aviation        → 对应 redroomTrpc.sigint.getAviationData.query()
 */

const BASE_URL = "/api/data";

export interface ArticleListItem {
  id: number;
  title: string | null;
  summary: string | null;
  content: string | null;
  url: string | null;
  source: string | null;
  author: string | null;
  region: string | null;
  country: string | null;
  city: string | null;
  topics: string[] | null;
  sentiment: "positive" | "negative" | "neutral" | null;
  publishedAt: string;
  collectedAt: string | null;
  agencyId: number | null;
  agencyName: string | null;
  agencyLogo: string | null;
  importance: number | null;
  isBreaking: boolean | null;
  language: string | null;
  entitiesJson: unknown | null;
  keywords: string[] | null;
  [key: string]: unknown;
}

export interface ArticleListInput {
  region?: string;
  topics?: string[];
  agencyIds?: number[];
  isBreaking?: boolean;
  limit?: number;
  offset?: number;
  search?: string;
  since?: Date;
}

export interface SiteContentRow {
  id: number;
  key: string;
  value: string;
  type: "text" | "url" | "boolean" | "json";
  section: string;
  label: string | null;
  description: string | null;
}

export interface AircraftData {
  icao24?: string;
  callsign?: string;
  lat: number;
  lon: number;
  heading?: number;
  speed?: number;
  altitude?: number;
  onGround?: boolean;
  isMilitary?: boolean;
  category?: number | string;
  airline?: string;
  country?: string;
  verticalRate?: number;
  origin?: { lat: number; lon: number; code?: string };
  destination?: { lat: number; lon: number; code?: string };
  trail?: Array<{ lat: number; lon: number; alt: number; ts: number }>;
}

export interface AviationData {
  aircraft: AircraftData[];
  total?: number;
  source?: string;
  timestamp?: number;
}

async function get<T>(path: string, params: Record<string, unknown> = {}): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`, window.location.origin);

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (value instanceof Date) {
      url.searchParams.append(key, String(value.getTime()));
    } else if (Array.isArray(value)) {
      value.forEach((v) => url.searchParams.append(key, String(v)));
    } else {
      url.searchParams.append(key, String(value));
    }
  });

  const headers: Record<string, string> = {};
  const token = localStorage.getItem("claw_token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url.toString(), {
    credentials: "include",
    headers,
  });

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export const dataApi = {
  /** 获取文章列表（对应 articles.list） */
  listArticles(input: ArticleListInput): Promise<ArticleListItem[]> {
    return get<ArticleListItem[]>("/articles", {
      region: input.region,
      topics: input.topics,
      agencyIds: input.agencyIds,
      isBreaking: input.isBreaking,
      limit: input.limit,
      offset: input.offset,
      search: input.search
    });
  },

  /** 获取 CMS 内容（对应 cms.getSiteContent） */
  getCmsContent(section?: string): Promise<SiteContentRow[]> {
    return get<SiteContentRow[]>("/cms", { section });
  },

  /** 获取航空数据（对应 sigint.getAviationData） */
  getAviationData(): Promise<AviationData> {
    return get<AviationData>("/aviation");
  },
};
