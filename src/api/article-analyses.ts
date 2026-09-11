/**
 * API client for article analysis endpoints
 * Base: /api/v1/article-analyses
 * 后台：agentbuilder ArticleAnalysisController
 */
import { requestAPI } from '@/utils/http/request'

export interface ArticleAnalysis {
  articleId: number
  content: string
  analyzedBy?: string | null
  sessionKey?: string | null
  createdAt?: string
  updatedAt?: string
}

export async function getArticleAnalysis(articleId: number): Promise<ArticleAnalysis> {
  // 404 = 尚无分析结果（正常路径，触发实时分析），不走全局错误提示
  const res = await requestAPI.get<ArticleAnalysis | undefined>(
    `/api/v1/article-analyses/${articleId}`,
    undefined,
    {},
    { validateStatus: (s) => s === 200 || s === 404 },
  );
  if (!res || !res.content) throw new Error("NOT_FOUND");
  return res;
}

export async function saveArticleAnalysis(
  articleId: number,
  body: { content: string; analyzedBy?: string; sessionKey?: string }
): Promise<ArticleAnalysis> {
  return requestAPI.put(`/api/v1/article-analyses/${articleId}`, body)
}
