/**
 * useArticlesList —— Vue 3 版本的 `trpc.articles.list.useQuery`
 * ------------------------------------------------------------------
 * 对标 redroom 前端中的：
 *
 *   const { data: articles, isLoading, refetch } = trpc.articles.list.useQuery(
 *     { region, topics, search, limit: 1000, since },
 *     { refetchInterval: 30000 }
 *   );
 *
 * 返回与 react-query 等价的响应式状态，并实现了：
 *  - 挂载即请求（immediate）
 *  - refetchInterval 定时轮询（默认 30s）
 *  - 入参（响应式）变化时自动重新拉取
 *
 * @example
 *   const { articles, isLoading, refetch } = useArticlesList(
 *     () => ({
 *       region: region.value,
 *       topics: selectedTopics.value.length ? selectedTopics.value : undefined,
 *       search: searchQuery.value || undefined,
 *       limit: 1000,
 *       since: since.value,
 *     }),
 *     { refetchInterval: 30000 },
 *   );
 */
import { ref, shallowRef, onMounted, onUnmounted, watch, type Ref } from "vue";
import { dataApi } from "@/api/data-api";
import type { ArticleListItem, ArticleListInput } from "@/api/data-api";

export interface UseArticlesListOptions {
  /** 轮询间隔（毫秒），对应 react-query 的 refetchInterval，默认 30000 */
  refetchInterval?: number;
  /** 是否在挂载时立即请求，默认 true */
  immediate?: boolean;
  /** 轮询门控：返回 false 时跳过自动轮询/依赖触发的请求（如战场图谱模式下暂停 30s 自动刷新）。
   *  手动调用 refetch(true) 可强制请求，不受此门控限制。 */
  enabled?: () => boolean;
}

export interface UseArticlesListReturn {
  articles: Ref<ArticleListItem[]>;
  isLoading: Ref<boolean>;
  error: Ref<unknown>;
  /** force=true 时忽略 enabled 门控强制请求（供手动刷新按钮使用） */
  refetch: (force?: boolean) => Promise<void>;
}

export function useArticlesList(
  getInput: () => ArticleListInput,
  options: UseArticlesListOptions = {},
): UseArticlesListReturn {
  const { refetchInterval = 30000, immediate = true, enabled } = options;

  const articles = shallowRef<ArticleListItem[]>([]);
  const isLoading = ref(false);
  const error = ref<unknown>(null);

  let timer: ReturnType<typeof setInterval> | null = null;
  let disposed = false;
  let inflight = false;

  async function refetch(force = false): Promise<void> {
    if (inflight || disposed) return;
    // 自动轮询/依赖变化触发时受 enabled 门控；手动刷新（force=true）始终放行
    if (!force && enabled && !enabled()) return;
    inflight = true;
    isLoading.value = true;
    error.value = null;
    try {
      const data = (await dataApi.listArticles(getInput())) as ArticleListItem[] | undefined;
      if (!disposed) {
        articles.value = data ?? [];
      }
    } catch (e) {
      if (!disposed) error.value = e;
    } finally {
      if (!disposed) isLoading.value = false;
      inflight = false;
    }
  }

  onMounted(() => {
    if (immediate) void refetch();
    if (refetchInterval > 0) {
      timer = setInterval(() => void refetch(), refetchInterval);
    }
  });

  // 入参变化时重新拉取（对标 react-query 依赖变化自动 refetch）
  watch(getInput, () => void refetch(), { deep: true });

  onUnmounted(() => {
    disposed = true;
    if (timer) clearInterval(timer);
  });

  return { articles, isLoading, error, refetch };
}
