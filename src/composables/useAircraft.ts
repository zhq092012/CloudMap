/**
 * useAircraft —— 获取 redroom CMS 内容中的 aircraft 值 + 实时航空数据
 * ------------------------------------------------------------------
 * 1. 通过 redroomTrpc.cms.getSiteContent 查询 CMS 全量内容，
 *    从返回数据中找到 "howto.sigint.signals" 键，解析 JSON 后
 *    提取 label 包含 "Aircraft" 的条目（即 aircraft 的值）。
 * 2. 通过 redroomTrpc.sigint.getAviationData 获取实时飞机位置数据，
 *    包含 lat/lon/heading/speed/callsign/origin/destination/trail 等。
 *
 * 对标 redroom 前端：
 *   const { data: cmsRows } = trpc.cms.getSiteContent.useQuery({ section: undefined });
 *   const aviationQuery = trpc.sigint.getAviationData.useQuery(...)
 */
import { ref, shallowRef, onMounted, onUnmounted } from "vue";
import type { Ref, ShallowRef } from "vue";
import { dataApi } from "@/api/data-api";

/** CMS 内容行 */
export interface SiteContentRow {
  id: number;
  key: string;
  value: string;
  type: "text" | "url" | "boolean" | "json";
  section: string;
  label: string | null;
  description: string | null;
}

/** SIGINT signals 条目（从 CMS 的 howto.sigint.signals JSON 解析） */
export interface SigintSignal {
  label: string;
  count: string;
}

/** 单架飞机数据（对标 redroom sigint.getAviationData 返回） */
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

/** getAviationData 返回结构 */
export interface AviationData {
  aircraft: AircraftData[];
  total?: number;
  source?: string;
  timestamp?: number;
}

export interface UseAircraftReturn {
  /** CMS 中解析出的 aircraft 信号信息 */
  aircraftSignal: Ref<SigintSignal | null>;
  /** 实时飞机列表 */
  aircraft: ShallowRef<AircraftData[]>;
  /** CMS 加载状态 */
  cmsLoading: Ref<boolean>;
  /** 航空数据加载状态 */
  aviationLoading: Ref<boolean>;
  /** 错误信息 */
  error: Ref<unknown>;
  /** 手动刷新 */
  refetch: () => Promise<void>;
}

export function useAircraft(options: {
  refetchInterval?: number;
  immediate?: boolean;
  /** 是否允许发起请求；返回 false 时跳过 CMS / 航空数据请求（如处于战场图谱模式） */
  enabled?: () => boolean;
} = {}): UseAircraftReturn {
  const { refetchInterval = 30000, immediate = true, enabled = () => true } = options;

  const aircraftSignal = ref<SigintSignal | null>(null);
  const aircraft = shallowRef<AircraftData[]>([]);
  const cmsLoading = ref(false);
  const aviationLoading = ref(false);
  const error = ref<unknown>(null);

  let timer: ReturnType<typeof setInterval> | null = null;
  let disposed = false;
  let inflight = false;

  /**
   * 从 CMS 返回数据中找到 aircraft 的值。
   * 查找 key 为 "howto.sigint.signals" 的行，解析 JSON 数组，
   * 返回 label 中包含 "Aircraft"（不区分大小写）的条目。
   */
  function extractAircraftFromCMS(rows: SiteContentRow[]): SigintSignal | null {
    if (!Array.isArray(rows)) return null;
    const signalsRow = rows.find(
      (r) => r.key === "howto.sigint.signals",
    );
    if (!signalsRow) return null;
    try {
      const signals: SigintSignal[] = JSON.parse(signalsRow.value);
      if (!Array.isArray(signals)) return null;
      // 查找包含 "aircraft" 的条目
      const ac = signals.find(
        (s) => s.label && /aircraft/i.test(s.label),
      );
      return ac || null;
    } catch {
      return null;
    }
  }

  async function refetch(): Promise<void> {
    if (inflight || disposed) return;
    // 战场图谱模式下不调用 CMS / 航空接口，避免无意义请求
    if (!enabled()) return;
    inflight = true;
    error.value = null;

    // ── 1. 获取 CMS 内容，找到 aircraft 的值 ──
    cmsLoading.value = true;
    try {
      const cmsRows = (await dataApi.getCmsContent(undefined)) as SiteContentRow[] | undefined;
      if (!disposed && cmsRows) {
        const acSignal = extractAircraftFromCMS(cmsRows);
        if (acSignal) {
          aircraftSignal.value = acSignal;
        }
      }
    } catch (e) {
      if (!disposed) error.value = e;
    } finally {
      if (!disposed) cmsLoading.value = false;
    }

    // ── 2. 获取实时航空数据 ──
    aviationLoading.value = true;
    try {
      const data = (await dataApi.getAviationData()) as AviationData | undefined;
      if (!disposed && data) {
        aircraft.value = data.aircraft || [];
      }
    } catch (e) {
      if (!disposed) error.value = e;
    } finally {
      if (!disposed) aviationLoading.value = false;
    }

    inflight = false;
  }

  onMounted(() => {
    if (immediate) void refetch();
    if (refetchInterval > 0) {
      timer = setInterval(() => void refetch(), refetchInterval);
    }
  });

  onUnmounted(() => {
    disposed = true;
    if (timer) clearInterval(timer);
  });

  return {
    aircraftSignal,
    aircraft,
    cmsLoading,
    aviationLoading,
    error,
    refetch,
  };
}
