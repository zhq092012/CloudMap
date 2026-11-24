<template>
  <div id="world-map" class="w-screen h-full"></div>

  <div class="map-topright">
    <div class="map-controls">
      <div class="map-control-row">
        <span class="map-control-label">设施</span>
        <el-switch v-model="iconsVisible" active-color="#3b82f6" inactive-color="#9e9e9e" />
      </div>
      <div class="map-control-row">
        <span class="map-control-label">情报</span>
        <el-switch v-model="clustersVisible" active-color="#3b82f6" inactive-color="#9e9e9e" />
      </div>
      <div class="map-control-row">
        <span class="map-control-label">轨迹</span>
        <el-switch v-model="tracksVisible" active-color="#3b82f6" inactive-color="#9e9e9e" />
      </div>
      <div class="map-control-row">
        <span class="map-control-label">异常</span>
        <el-switch v-model="breakingVisible" active-color="#ef4444" inactive-color="#9e9e9e" />
      </div>
      <!-- <div class="map-control-row">
        <span class="map-control-label">离线底图</span>
        <el-switch
          v-model="offlineTilesVisible"
          active-color="#3b82f6"
          inactive-color="#9e9e9e"
        />
      </div> -->

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, watch, ref } from "vue";
import { useHomeStore } from "@/store/modules/homeStore";
import { useLoadingStore } from "@/store/modules/loadingStore";
import { useArticlesList } from "@/composables/useArticles";
import { useAircraft } from "@/composables/useAircraft";
import { getAnomalyList } from "@/api/anomalies";
import type { ArticleListItem } from "@/api/data-api";
import type { AircraftData } from "@/composables/useAircraft";
import type { WarningMarker } from "@/types/home";
// leaflet 包未附带 .d.ts，且本任务仅改组件内类型
// @ts-expect-error TS7016 — 无官方声明文件
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import icon from "leaflet/dist/images/marker-icon.png";

import { FACILITY_TYPES, FACILITY_TYPE_LABELS_ZH, FACILITY_THREAT_LEVELS_ZH } from "@/assets/facilities.js"; // 导入设施类型定义
import { getCountryCenter } from "@/utils/countryCentroids";

/** Leaflet 图层/地图实例句柄（无 @types/leaflet 时用宽松别名） */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LeafletHandle = any;

type FacilityTypeDef = (typeof FACILITY_TYPES)[number];
type MarkerClusterLike = { getChildCount(): number; getAllChildMarkers(): Array<{ article?: ArticleListItem }> };

let map: LeafletHandle | null = null;
let geoLayer: LeafletHandle | null = null;
let facilitiesLayer: LeafletHandle | null = null;
let facilityMarkersByType: Record<string, LeafletHandle[]> = {};
// 记录当前选中图层
let selectedLayer: LeafletHandle | null = null;

// 文章聚合图层相关
let articleCluster: LeafletHandle | null = null;
// 有聚合文章的国家名称标注图层
let countryLabelLayer: LeafletHandle | null = null;

// ─── 异常文章聚合图层 ───
let breakingCluster: LeafletHandle | null = null;

// ─── 飞机聚合 / 轨迹图层 ───
let aircraftCluster: LeafletHandle | null = null;
let trajectoryLayer: LeafletHandle | null = null;
let selectedAircraftId: string | null = null;

const homeStore = useHomeStore();
const loadingStore = useLoadingStore();
const facilityVisibility = computed(() => homeStore.facilityTypeVisibility);

// 地图图层显隐总开关
// iconsVisible：仅控制「设施标记」的显隐（不影响文章聚合层）
// clustersVisible：仅控制「文章聚合层」的显隐（与图标开关相互独立）
// tracksVisible：仅控制「飞机轨迹聚合层」的显隐，默认关闭
// breakingVisible：控制「异常文章标记层」的显隐，默认开启（一进地图即加载）
const iconsVisible = ref(true);
const clustersVisible = ref(false);
const tracksVisible = ref(false);
const breakingVisible = ref(true);
// offlineTilesVisible：控制「中东离线瓦片底图」的显隐，默认开启
const offlineTilesVisible = ref(true);

// 中东离线瓦片底图（来自 public/tiles，由 scripts/download_tiles.py 预下载）
let offlineTileLayer: LeafletHandle | null = null;
/** 道路 / 地名标注叠图（Esri 参考图层，默认不加载） */
let roadLabelTileLayer: LeafletHandle | null = null;
const roadLabelsVisible = ref(false);
/** 无 geo 边界时的默认全览范围（中东） */
const DEFAULT_OVERVIEW_BOUNDS: [[number, number], [number, number]] = [
  [12, 24],
  [42, 65],
];

// ─── 飞机数据：从 redroom CMS (getSiteContent) 获取 aircraft 值 + 实时航空数据 ───
// 处于「战场图谱」模式（mapLeftTab === 'third'）时不再调用 /api/data/aviation 与 /api/data/cms
const {
  aircraft: aircraftList,
  aircraftSignal,
  aviationLoading,
  refetch: refetchAircraft,
} = useAircraft({
  refetchInterval: 30000,
  enabled: () => homeStore.mapLeftTab !== "third",
});

// 从战场图谱切回地图时，立即补拉一次航空/CMS 数据（图谱模式下被跳过了）
watch(
  () => homeStore.mapLeftTab,
  (tab) => {
    if (tab !== "third") void refetchAircraft();
  },
);

const facilityTypeMap = FACILITY_TYPES.reduce<Record<string, FacilityTypeDef>>((acc, type) => {
  acc[type.id] = type;
  return acc;
}, {});

const normalizeFacilityType = (type: string | null | undefined) => {
  if (!type || type === null || type === undefined || type === "") return "other";
  return type;
};
const createFacilityIcon = (type: string | null | undefined) => {
  const normalized = normalizeFacilityType(type);
  const typeDef = facilityTypeMap[normalized] || facilityTypeMap["other"];
  const html = `<div style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;">${typeDef.svgIcon}</div>`;
  return L.divIcon({
    className: "facility-marker",
    html,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
};

// ============ 文章按国家聚合（leaflet.markercluster） ============
// 单篇文章标记：只显示数字 “1”
const articleMarkerIcon = L.divIcon({
  className: "article-marker",
  html: `<div class="article-marker__inner">1</div>`,
  iconSize: [30, 30],
});

// 聚合图标：只显示聚合的文章数目
const createArticleClusterIcon = (cluster: MarkerClusterLike) => {
  const count = cluster.getChildCount();
  return L.divIcon({
    className: "article-cluster",
    html: `<div class="article-cluster__inner">${count}</div>`,
    iconSize: [40, 40],
  });
};

// 国家名称标注：取数据中的 country 字段，显示在有聚合文章的国家中心
// interactive:false 使其不拦截地图点击；文字通过 CSS 平移到聚合气泡下方
const createCountryLabelIcon = (name: string, _count?: number) => {
  const safe = String(name ?? "").replace(/[<>&]/g, "");
  return L.divIcon({
    className: "country-label",
    html: `<div class="country-label__inner">${safe}</div>`,
    iconSize: [0, 0],
  });
};

// 点击聚合 / 单篇标记 -> 设置文章筛选；再次点击同一聚合则取消筛选
const onArticlePick = (picked: ArticleListItem[]) => {
  const ids = picked
    .map((a: ArticleListItem) => a.id)
    .sort((x: number, y: number) => x - y)
    .join(",");
  if (homeStore.selectedClusterIds === ids) {
    homeStore.clearClusterFilter();
  } else {
    homeStore.setClusterSelection(ids, picked);
    // 联动 MapLeft：自动切到「开源情报」标签并展示对应聚合文章
    homeStore.mapLeftTab = "second";
  }
};

// 根据文章列表，按 country 聚合到地图对应国家
// country 无值或无法匹配到坐标的文章将被跳过（不在地图显示）
const renderArticleMarkers = (list: ArticleListItem[] | null | undefined) => {
  if (!map) return;
  const items = list ?? [];
  if (!articleCluster) {
    articleCluster = L.markerClusterGroup({
      showCoverageOnMaxZoom: false, // 关掉「聚合到最上层」的强制拆分，保持聚合稳定
      showCoverageOnHover: false,
      zoomToBoundsOnClick: false, // 点击聚合不缩放，保持聚合可见以便再次点击取消筛选
      spiderfyOnMaxZoom: false, // 禁用点击展开为多个小图标（蛛网/蜘蛛腿）的行为
      maxClusterRadius: 50,
      iconCreateFunction: createArticleClusterIcon,
    });
    articleCluster.on("clusterclick", (e: { layer: MarkerClusterLike }) => {
      const childMarkers = e.layer.getAllChildMarkers();
      onArticlePick(childMarkers.map((mk) => mk.article).filter(Boolean) as ArticleListItem[]);
    });
    map.addLayer(articleCluster);
  } else {
    articleCluster.clearLayers();
  }

  const markers = [];
  for (const a of items) {
    const center = getCountryCenter(a.country);
    if (!center) continue; // country 没有值 / 无法匹配坐标 -> 不在地图显示
    const m = L.marker([center[0], center[1]], { icon: articleMarkerIcon });
    m.article = a;
    m.on("click", () => onArticlePick([a]));
    markers.push(m);
  }
  articleCluster.addLayers(markers);

  // 按 country 聚合，统计每个国家文章数，并在地图对应国家中心标注国家名称
  const countryCounts = new Map<string, number>();
  for (const a of items) {
    if (!getCountryCenter(a.country)) continue; // country 无值 / 无法匹配坐标 -> 跳过
    const key = a.country ?? "";
    if (!key) continue;
    countryCounts.set(key, (countryCounts.get(key) || 0) + 1);
  }
  if (!countryLabelLayer) {
    countryLabelLayer = L.layerGroup().addTo(map);
  } else {
    countryLabelLayer.clearLayers();
  }
  for (const [name, count] of countryCounts) {
    const center = getCountryCenter(name);
    if (!center) continue;
    const label = L.marker([center[0], center[1]], {
      icon: createCountryLabelIcon(name, count),
      interactive: false,
    });
    countryLabelLayer.addLayer(label);
  }

  // 数据轮询刷新时保持当前筛选状态（用新数据重新计算子集）
  // 注意：以 store.selectedClusterIds 为唯一数据源，清除筛选（chip__close）后它为 null，
  // 此处便不会再复活旧筛选；若新数据已不包含这些 id，则一并清除选择态。
  if (homeStore.selectedClusterIds) {
    const idSet = new Set(homeStore.selectedClusterIds.split(",").map(Number));
    const filtered = items.filter((a) => idSet.has(a.id));
    if (filtered.length) {
      homeStore.setClusterArticles(filtered);
    } else {
      homeStore.clearClusterFilter();
    }
  } else {
    homeStore.setClusterArticles(null);
  }

  // 依据显隐开关决定是否把聚合层挂到地图上
  applyLayerVisibility();
};

const breakingArticles = ref<ArticleListItem[]>([])

// 异常文章聚合图标：数字 + 红色边框（与「情报」聚合样式一致，仅改色）
const createBreakingClusterIcon = (cluster: MarkerClusterLike) => {
  const count = cluster.getChildCount();
  return L.divIcon({
    className: "breaking-cluster",
    html: `<div class="breaking-cluster__inner">${count}</div>`,
    iconSize: [40, 40],
  });
};

// 单篇异常文章标记：数字 "1" + 红色边框
const breakingMarkerIcon = L.divIcon({
  className: "breaking-marker",
  html: `<div class="breaking-marker__inner">1</div>`,
  iconSize: [30, 30],
});

// 渲染异常文章聚合标记到地图（聚合 + 点击联动左侧）
const renderBreakingMarkers = (list: ArticleListItem[] | null | undefined) => {
  if (!map) return;
  if (!breakingCluster) {
    breakingCluster = L.markerClusterGroup({
      showCoverageOnHover: false,
      zoomToBoundsOnClick: false, // 点击聚合不缩放，保持聚合可见以便再次点击取消筛选
      spiderfyOnMaxZoom: false,
      maxClusterRadius: 50,
      iconCreateFunction: createBreakingClusterIcon,
    });
    breakingCluster.on("clusterclick", (e: { layer: MarkerClusterLike }) => {
      const childMarkers = e.layer.getAllChildMarkers();
      onArticlePick(childMarkers.map((mk) => mk.article).filter(Boolean) as ArticleListItem[]);
    });
    // 不在此处 addLayer 到 map，由 applyLayerVisibility 根据开关统一控制显隐
  } else {
    breakingCluster.clearLayers();
  }

  if (!list || list.length === 0) {
    applyLayerVisibility();
    return;
  }

  const markers = [];
  for (const a of list) {
    const center = getCountryCenter(a.country);
    if (!center) continue; // country 没有值 / 无法匹配坐标 -> 不在地图显示
    const m = L.marker([center[0], center[1]], { icon: breakingMarkerIcon });
    m.article = a;
    m.on("click", () => onArticlePick([a]));
    markers.push(m);
  }
  breakingCluster.addLayers(markers);

  applyLayerVisibility();
};

// ═══════════════════════════════════════════════════════════════════
// 飞机聚合 / 轨迹绘制
// ═══════════════════════════════════════════════════════════════════

/**
 * Great Circle Arc 计算 —— 对标 redroom Sigint.tsx 中的实现。
 * 在球面上两点之间插值出一条大圆弧线，返回 L.LatLng 数组。
 */
function greatCircleArc(lat1d: number, lon1d: number, lat2d: number, lon2d: number, steps = 40) {
  const lat1 = (lat1d * Math.PI) / 180;
  const lon1 = (lon1d * Math.PI) / 180;
  const lat2 = (lat2d * Math.PI) / 180;
  const lon2 = (lon2d * Math.PI) / 180;
  const d =
    2 *
    Math.asin(
      Math.sqrt(
        Math.pow(Math.sin((lat2 - lat1) / 2), 2) +
        Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin((lon2 - lon1) / 2), 2),
      ),
    );
  if (d < 0.0001) return [L.latLng(lat1d, lon1d), L.latLng(lat2d, lon2d)];
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const f = i / steps;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
    const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
    const z = A * Math.sin(lat1) + B * Math.sin(lat2);
    points.push(
      L.latLng(
        (Math.atan2(z, Math.sqrt(x * x + y * y)) * 180) / Math.PI,
        (Math.atan2(y, x) * 180) / Math.PI,
      ),
    );
  }
  return points;
}

/**
 * 飞机聚合图标 —— 与文章聚合样式区分：
 * 文章聚合：金色圆形 #c1a465
 * 飞机聚合：深/近黑六边形（具体配色见 CSS .aircraft-cluster__inner）
 */
const createAircraftClusterIcon = (cluster: MarkerClusterLike) => {
  const count = cluster.getChildCount();
  const size = count >= 500 ? 46 : count >= 200 ? 40 : count >= 100 ? 34 : count >= 50 ? 30 : 26;
  const fontSize = size >= 40 ? 13 : size >= 34 ? 12 : size >= 30 ? 11 : 10;
  const label = count >= 1000 ? `${(count / 1000).toFixed(1)}k` : String(count);
  return L.divIcon({
    className: "aircraft-cluster",
    html: `<div class="aircraft-cluster__inner" style="width:${size}px;height:${size}px;font-size:${fontSize}px;">${label}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

/**
 * 单架飞机图标 —— 带点的箭头。
 * 箭头方向跟随 heading 旋转，中心有一个亮点。
 * 对标 redroom Sigint.tsx 中的飞机 SVG 但增强为"带点箭头"。
 */
const createAircraftIcon = (ac: AircraftData) => {
  const heading = ac.heading || 0;
  const isMilitary = ac.isMilitary || ac.category === "MIL" || ac.category === 7;
  const isOnGround = ac.onGround;
  const color = isMilitary ? "#b91c1c" : isOnGround ? "#1e40af" : "#1d4ed8"; // 军用深红，民用深蓝
  const glowColor = isMilitary ? "#b91c1c" : "#1d4ed8";
  // const svg = `<svg width="22" height="22" viewBox="0 0 24 24" style="transform:rotate(${heading}deg);overflow:visible;">
  //   <path d="M12 1L7 13h3v6l-2 2h8l-2-2v-6h3L12 1z"
  //     fill="${color}" fill-opacity="0.9"
  //     stroke="#fff" stroke-width="0.4"
  //     style="filter:drop-shadow(0 0 4px ${glowColor});"/>
  //   <circle cx="12" cy="12" r="2.5" fill="#fff" fill-opacity="0.95"/>
  //   <circle cx="12" cy="12" r="1.2" fill="${color}"/>
  // </svg>`;
  const svg = `
    <svg t="1787208326005" style="transform:rotate(${heading}deg);overflow:visible;" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="7146" width="22" height="22">
      <path fill="${color}" fill-opacity="0.9" stroke="#fff" stroke-width="0.4" style="filter:drop-shadow(0 0 4px ${glowColor});" d="M499.260235 128.602353c-39.815529 19.877647-72.583529 70.475294-72.583529 136.824471l-0.030118 120.199529-262.806588 219.075765a26.352941 26.352941 0 0 0-9.487059 20.239058v70.264471l0.210824 3.403294a26.352941 26.352941 0 0 0 37.948235 20.178824l242.928941-121.494589v107.91153l-83.817412 134.174118-1.505882 2.68047c-10.059294 20.781176 10.480941 44.423529 33.099294 35.960471l131.282824-49.272471 131.312941 49.272471 2.921412 0.903529c22.377412 5.752471 41.472-19.094588 28.672-39.54447l-83.84753-134.174118v-107.91153l242.959059 121.494589a26.352941 26.352941 0 0 0 38.159059-23.582118V624.941176l-0.210824-3.312941a26.352941 26.352941 0 0 0-9.276235-16.926117L602.352941 385.626353v-120.169412c0-69.029647-35.448471-120.982588-77.402353-139.083294a26.352941 26.352941 0 0 0-20.871529 0l-4.818824 2.258824z" p-id="7147"></path>
    </svg>
  `
  return L.divIcon({
    className: "aircraft-marker",
    html: svg,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -14],
  });
};

/**
 * 清除当前轨迹
 */
const clearTrajectory = () => {
  if (trajectoryLayer) {
    trajectoryLayer.clearLayers();
  }
  selectedAircraftId = null;
};

/**
 * 绘制飞机轨迹 —— 对标 redroom Sigint.tsx 的 route + trail 绘制逻辑：
 * 1. origin → current: 实线大圆弧
 * 2. current → destination: 虚线大圆弧
 * 3. origin/destination 标记
 * 4. trail 历史: 渐变透明度折线
 * 5. heading 投影（无 origin/destination 时的后备方案）
 */
const drawAircraftTrajectory = (ac: AircraftData) => {
  if (!trajectoryLayer || !map) return;
  trajectoryLayer.clearLayers();
  selectedAircraftId = ac.icao24 || ac.callsign || null;

  const isMilitary = ac.isMilitary || ac.category === "MIL" || ac.category === 7;
  const color = isMilitary ? "#b91c1c" : "#1e3a5f";   // 军用深红，民用深蓝

  // ── Trail 历史：渐变透明度 ──
  if (ac.trail && ac.trail.length > 1) {
    const trailPoints = ac.trail;
    for (let t = 1; t < trailPoints.length; t++) {
      const opacity = (t / trailPoints.length) * 0.5;
      L.polyline(
        [
          [trailPoints[t - 1].lat, trailPoints[t - 1].lon],
          [trailPoints[t].lat, trailPoints[t].lon],
        ],
        { color, weight: 1.5, opacity, interactive: false },
      ).addTo(trajectoryLayer);
    }
  }

  // ── 高亮当前飞机位置 ──
  const pulse = L.circleMarker([ac.lat, ac.lon], {
    radius: 16,
    fillColor: color,
    fillOpacity: 0.12,
    color,
    weight: 2,
    opacity: 0.8,
    className: "aircraft-pulse",
  });
  trajectoryLayer.addLayer(pulse);

  // ── 航线：origin → current → destination ──
  const origin = ac.origin;
  const destination = ac.destination;

  if (origin && origin.lat && origin.lon) {
    // origin → current: 实线大圆弧
    const arc1 = greatCircleArc(origin.lat, origin.lon, ac.lat, ac.lon, 30);
    L.polyline(arc1, { color, weight: 2.5, opacity: 0.6 }).addTo(trajectoryLayer);

    // origin 标记
    const oIcon = L.divIcon({
      className: "aircraft-route-marker",
      html: `<div style="width:10px;height:10px;border-radius:50%;border:2px solid ${color};background:rgba(51,51,51,0.2);"></div>`,
      iconSize: [10, 10],
      iconAnchor: [5, 5],
    });
    const oMarker = L.marker([origin.lat, origin.lon], { icon: oIcon });
    oMarker.bindTooltip(
      `<span style="font-family:monospace;font-size:10px;color:${color};">${origin.code || "ORIGIN"}</span>`,
      { permanent: false, direction: "top", className: "aircraft-tooltip" },
    );
    trajectoryLayer.addLayer(oMarker);
  }

  if (destination && destination.lat && destination.lon) {
    // current → destination: 虚线大圆弧
    const arc2 = greatCircleArc(ac.lat, ac.lon, destination.lat, destination.lon, 30);
    L.polyline(arc2, {
      color,
      weight: 2,
      opacity: 0.5,
      dashArray: "8, 5",
    }).addTo(trajectoryLayer);

    // destination 标记
    const dIcon = L.divIcon({
      className: "aircraft-route-marker",
      html: `<div style="width:12px;height:12px;border-radius:50%;border:2px solid ${color};background:rgba(51,51,51,0.3);display:flex;align-items:center;justify-content:center;"><div style="width:4px;height:4px;border-radius:50%;background:${color};"></div></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    });
    const dMarker = L.marker([destination.lat, destination.lon], { icon: dIcon });
    dMarker.bindTooltip(
      `<span style="font-family:monospace;font-size:10px;color:${color};">${destination.code || "DEST"}</span>`,
      { permanent: false, direction: "top", className: "aircraft-tooltip" },
    );
    trajectoryLayer.addLayer(dMarker);
  }

  // ── heading 投影（无 origin/destination 时的后备方案） ──
  if (
    (!origin || !origin.lat) &&
    (!destination || !destination.lat) &&
    ac.heading !== null &&
    ac.heading !== undefined
  ) {
    const heading = ac.heading;
    const speed = ac.speed || 400;
    const distKm = speed * 1.852 * 1.5;
    const R = 6371;
    const lat1 = (ac.lat * Math.PI) / 180;
    const lon1 = (ac.lon * Math.PI) / 180;
    const brng = (heading * Math.PI) / 180;
    const d = distKm / R;
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(brng),
    );
    const lon2 =
      lon1 +
      Math.atan2(
        Math.sin(brng) * Math.sin(d) * Math.cos(lat1),
        Math.cos(d) - Math.sin(lat1) * Math.sin(lat2),
      );
    const projLat = (lat2 * 180) / Math.PI;
    const projLon = (lon2 * 180) / Math.PI;
    L.polyline(
      [[ac.lat, ac.lon], [projLat, projLon]],
      { color, weight: 2, opacity: 0.5, dashArray: "8, 6" },
    ).addTo(trajectoryLayer);
    L.circleMarker([projLat, projLon], {
      radius: 5,
      fillColor: color,
      fillOpacity: 0.5,
      color: "#fff",
      weight: 1,
    }).addTo(trajectoryLayer);
  }

  // ── 自动飞到航线范围 ──
  if (origin && origin.lat && destination && destination.lat) {
    const bounds = L.latLngBounds([
      [origin.lat, origin.lon],
      [ac.lat, ac.lon],
      [destination.lat, destination.lon],
    ]);
    map.flyToBounds(bounds, { padding: [60, 60], maxZoom: 6, duration: 1 });
  }
};

/**
 * 渲染飞机聚合标记到地图
 * 使用 leaflet.markercluster，聚合样式为青色六边形（区别于文章的金色圆形）
 */
const renderAircraftMarkers = (list: AircraftData[]) => {
  if (!map) return;

  // 初始化飞机聚合组
  if (!aircraftCluster) {
    aircraftCluster = L.markerClusterGroup({
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      spiderfyOnMaxZoom: false,
      maxClusterRadius: 45,
      iconCreateFunction: createAircraftClusterIcon,
    });
    map.addLayer(aircraftCluster);
  } else {
    aircraftCluster.clearLayers();
  }

  // 初始化轨迹图层
  if (!trajectoryLayer) {
    trajectoryLayer = L.layerGroup().addTo(map);
  }

  if (!list || list.length === 0) {
    applyLayerVisibility();
    return;
  }

  const markers = [];
  for (const ac of list) {
    if (!ac.lat || !ac.lon) continue;
    const m = L.marker([ac.lat, ac.lon], { icon: createAircraftIcon(ac) });
    const acId = ac.icao24 || ac.callsign || "";
    m.acData = ac;

    // tooltip
    const altStr = ac.altitude ? ` · FL${Math.round(ac.altitude / 100)}` : "";
    const spdStr = ac.speed ? ` · ${Math.round(ac.speed)}kt` : "";
    m.bindTooltip(
      `${ac.callsign || ac.icao24 || "Unknown"}${altStr}${spdStr}`,
      {
        direction: "top",
        offset: [0, -12],
        className: "aircraft-tooltip",
        permanent: false,
        opacity: 0.95,
      },
    );

    // 点击 → 绘制轨迹
    m.on("click", (e: { originalEvent?: Event }) => {
      L.DomEvent.stopPropagation(e);
      // 如果点击的是当前选中的飞机，则清除轨迹
      const currentId = ac.icao24 || ac.callsign;
      if (selectedAircraftId === currentId) {
        clearTrajectory();
      } else {
        drawAircraftTrajectory(ac);
      }
    });

    markers.push(m);
  }

  aircraftCluster.addLayers(markers);
  applyLayerVisibility();
};

// 飞机数据变化时重新渲染
watch(aircraftList, (list) => {
  renderAircraftMarkers(list || []);
});

// 监听 tracksVisible 开关变化
watch(tracksVisible, (visible) => {
  if (!map) return;
  if (visible) {
    // 开启时，若已有数据则渲染
    if (aircraftList.value && aircraftList.value.length > 0) {
      renderAircraftMarkers(aircraftList.value);
    }
  } else {
    // 关闭时，移除飞机聚合层和轨迹
    if (aircraftCluster && map.hasLayer(aircraftCluster)) {
      map.removeLayer(aircraftCluster);
    }
    clearTrajectory();
    if (trajectoryLayer && map.hasLayer(trajectoryLayer)) {
      map.removeLayer(trajectoryLayer);
    }
  }
});

// 点击地图空白处清除轨迹
const onMapClickClearTrajectory = () => {
  clearTrajectory();
};

// 统一根据显隐开关控制各图层
const applyLayerVisibility = () => {
  if (!map) return;

  // 设施标记：受「图标」总开关 + 各类型独立开关共同控制
  if (facilitiesLayer) {
    if (iconsVisible.value) {
      Object.entries(facilityMarkersByType).forEach(([type, markers]) => {
        const visible = homeStore.facilityTypeVisibility[type] ?? true;
        markers.forEach((marker: LeafletHandle) => {
          if (visible && !facilitiesLayer.hasLayer(marker)) {
            facilitiesLayer.addLayer(marker);
          } else if (!visible && facilitiesLayer.hasLayer(marker)) {
            facilitiesLayer.removeLayer(marker);
          }
        });
      });
      if (!map.hasLayer(facilitiesLayer)) map.addLayer(facilitiesLayer);
    } else if (map.hasLayer(facilitiesLayer)) {
      map.removeLayer(facilitiesLayer);
    }
  }

  // 文章聚合层：仅受「聚合」开关独立控制，与「图标」开关无关
  if (articleCluster) {
    const showCluster = clustersVisible.value;
    if (showCluster && !map.hasLayer(articleCluster)) {
      map.addLayer(articleCluster);
    } else if (!showCluster && map.hasLayer(articleCluster)) {
      map.removeLayer(articleCluster);
    }
  }

  // 异常文章聚合层：受「异常」开关独立控制
  if (breakingCluster) {
    const showBreaking = breakingVisible.value;
    if (showBreaking && !map.hasLayer(breakingCluster)) {
      map.addLayer(breakingCluster);
    } else if (!showBreaking && map.hasLayer(breakingCluster)) {
      map.removeLayer(breakingCluster);
    }
  }

  // 注意：国家名称标注层（countryLabelLayer）刻意不在此处处理，
  // 它与文章聚合层「互不影响」——常驻地图上、独立显示，不受「聚合」开关控制。
  if (countryLabelLayer) {
    const showLabel = clustersVisible.value;
    if (showLabel && !map.hasLayer(countryLabelLayer)) {
      map.addLayer(countryLabelLayer);
    } else if (!showLabel && map.hasLayer(countryLabelLayer)) {
      map.removeLayer(countryLabelLayer);
    }
  }

  // 飞机聚合层 + 轨迹层：仅受「轨迹」开关独立控制
  if (aircraftCluster) {
    const showAircraft = tracksVisible.value;
    if (showAircraft && !map.hasLayer(aircraftCluster)) {
      map.addLayer(aircraftCluster);
    } else if (!showAircraft && map.hasLayer(aircraftCluster)) {
      map.removeLayer(aircraftCluster);
    }
  }
  if (trajectoryLayer) {
    const showTraj = tracksVisible.value;
    if (showTraj && !map.hasLayer(trajectoryLayer)) {
      map.addLayer(trajectoryLayer);
    } else if (!showTraj && map.hasLayer(trajectoryLayer)) {
      map.removeLayer(trajectoryLayer);
    }
  }
};

// 样式配置
const STYLE_DEFAULT = {
  color: "#373737", // 边界颜色
  weight: 0.5,
  fillColor: "transparent", // 填充色透明，仅保留国界描边
  fillOpacity: 0,
  opacity: 1,
};
const STYLE_HOVER = {
  color: "#4488ff",
  weight: 1.2,
  opacity: 0.7,
  fillColor: "#4488ff",
  fillOpacity: 0.18,
  interactive: false
};
const STYLE_SELECT = {
  color: "#ff4444",
  weight: 1.5,
  opacity: 0.9,
  fillColor: "#ff4444",
  fillOpacity: 0.22,
  interactive: false
};

// 获取异常事件数据并注入 homeStore.warningMarkers
const fetchWarningData = async () => {
  try {
    const res = await getAnomalyList();
    console.log("[Map] 获取到异常事件数据:", res);

    if (res && res.length > 0) {
      const formatDateToYYYYMMDD = (dateStr: string | null | undefined) => {
        if (!dateStr) return "";
        try {
          const d = new Date(dateStr);
          if (isNaN(d.getTime())) {
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
            return "";
          }
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        } catch {
          return "";
        }
      };

      const parseTrajectoryData = (td: unknown) => {
        if (!td) return null;
        try {
          const parsed = typeof td === "string" ? JSON.parse(td) : td;
          if (Array.isArray(parsed) && parsed.length > 0) {
            return { lat: parsed[0].lat, lng: parsed[0].lon };
          }
        } catch { }
        return null;
      };

      const parseLocationCoords = (loc: string | null | undefined) => {
        if (!loc) return null;
        const m = loc.match(/\(([-\d.]+),\s*([-\d.]+)\)/);
        return m ? { lat: parseFloat(m[1]), lng: parseFloat(m[2]) } : null;
      };

      const warningMarkers = res.map((item) => {
        let lat = 27.18;
        let lng = 56.26;
        const coords = parseTrajectoryData(item.assetData)
          || parseLocationCoords(item.location);
        if (coords) { lat = coords.lat; lng = coords.lng; }

        return {
          id: item.anomalyId || `ANM_${item.rowId}`,
          name: item.name || item.source || "",
          description: item.location || "",
          itemId: item.rowId,
          lng,
          lat,
          alt: 0,
          type: "warning1" as const,
          isAnalyzed: false,
          date: formatDateToYYYYMMDD(item.eventTime || item.createdAt),
          score: Number(item.deviationScore) || 0,
          confidence: Math.round(Number(item.confidence) || 0),
          threatLevel: item.threatLevel ?? "",
          // 「异常征候」左栏分组所需：状态 + 创建时间（原始字符串，时间判断在 AnomalySignsLeftPanel 内做）
          status: item.status ?? "",
          createdAt: item.createdAt || item.eventTime || "",
          // 「异常」分组按 WarningLeftPanel 的列表口径展示，需要异常类型
          assetType: item.assetType ?? "",
        };
      });

      // 按 name 去重
      const seenNames = new Set();
      const uniqueWarningMarkers = warningMarkers.filter((marker) => {
        const trimmedName = (marker.name || "").trim();
        if (seenNames.has(trimmedName)) return false;
        seenNames.add(trimmedName);
        return true;
      });

      homeStore.setWarningMarkers(uniqueWarningMarkers as WarningMarker[]);
      console.log("[Map] 异常警告标记点已成功注入:", uniqueWarningMarkers.length);
    }
  } catch (error) {
    console.error("[Map] 获取警告数据失败:", error);
  }
};

const initMap = async () => {
  // marker图标修复
  const DefaultIcon = L.icon({
    iconUrl: icon,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });
  L.Marker.prototype.options.icon = DefaultIcon;

  map = L.map("world-map", {
    zoomControl: false,
    minZoom: 3,
    maxZoom: 12,
    worldCopyJump: true,
    attributionControl: false,
    // 可选：设置地图画布背景色
    // preferCanvas: true
  }).setView([32.4279, 53.688], 4); // 伊朗地理中心

  // ========== 移除底图！不再加载瓦片 ==========
  offlineTileLayer = L.tileLayer("/offline_tiles/{z}/{x}/{y}.jpg", {
    minZoom: 3,
    maxZoom: 12,
    minNativeZoom: 4,
    maxNativeZoom: 8,
    attribution:
      '© Esri — 离线瓦片（全球）| 边界数据 © OpenStreetMap',
    errorTileUrl:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pLvAAAAAElFTkSuQmCC",
    className: "offline-tile-layer",
  });
  if (offlineTilesVisible.value) offlineTileLayer.addTo(map);

  roadLabelTileLayer = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
    {
      maxZoom: 16,
      opacity: 0.88,
      className: "road-label-tile-layer",
    },
  );

  // 读取 public 下 geojson
  const res = await fetch("/world.geojson");
  const geoData = await res.json();

  geoLayer = L.geoJSON(geoData, {
    style: () => STYLE_DEFAULT,
    onEachFeature(_feature: unknown, layer: LeafletHandle) {
      // 悬浮
      layer.on("mouseover", () => {
        if (layer !== selectedLayer) {
          layer.setStyle(STYLE_HOVER);
        }
      });
      // 离开
      layer.on("mouseout", () => {
        if (layer !== selectedLayer) {
          geoLayer.resetStyle(layer);
        }
      });
      // 点击选中/取消选中
      layer.on("click", () => {
        if (selectedLayer === layer) {
          geoLayer.resetStyle(layer);
          selectedLayer = null;
        } else {
          if (selectedLayer) {
            geoLayer.resetStyle(selectedLayer);
          }
          layer.setStyle(STYLE_SELECT);
          selectedLayer = layer;
        }
      });
    },
  }).addTo(map);

  homeStore.mapViewportApi = {
    zoomIn: () => {
      map?.zoomIn();
    },
    zoomOut: () => {
      map?.zoomOut();
    },
    fitOverview: () => {
      if (!map) return;
      try {
        if (geoLayer?.getBounds) {
          map.fitBounds(geoLayer.getBounds(), { padding: [32, 32], maxZoom: 6 });
          return;
        }
      } catch {
        /* fallback */
      }
      map.fitBounds(DEFAULT_OVERVIEW_BOUNDS, { padding: [32, 32], maxZoom: 6 });
    },
    setRoadLabelsVisible: (visible: boolean) => {
      roadLabelsVisible.value = visible;
      if (!map || !roadLabelTileLayer) return;
      if (visible) {
        if (!map.hasLayer(roadLabelTileLayer)) roadLabelTileLayer.addTo(map);
      } else if (map.hasLayer(roadLabelTileLayer)) {
        map.removeLayer(roadLabelTileLayer);
      }
    },
  };

  // 渲染设施点位
  facilitiesLayer = L.layerGroup();
  facilityMarkersByType = {};
  homeStore.facilities.forEach((facility) => {
    const normalizedType = normalizeFacilityType(facility.type);
    const zhName = facility.nameZh || facility.name;
    const zhDesc = facility.descriptionZh || facility.description || "—";
    const typeLabelZh = FACILITY_TYPE_LABELS_ZH[normalizedType] || normalizedType;
    const cityText = facility.city || "—";
    const operatorText = facility.operator || "—";
    const threatText = (facility.threatLevel && FACILITY_THREAT_LEVELS_ZH[facility.threatLevel]) || facility.threatLevel || "—";
    const marker = L.marker([facility.latitude, facility.longitude], {
      icon: createFacilityIcon(facility.type),
      title: zhName,
      riseOnHover: true,
    });
    marker.facilityType = facility.type;

    marker.bindPopup(
      `<div style="font-size:14px;line-height:1.6;color:#efefef;">
        <strong style="font-size:15px;display:block;margin-bottom:6px;margin-top:20px;">${zhName}</strong>
        <div>国家：${facility.country}</div>
        <div>城市：${cityText}</div>
        <div>类型：${typeLabelZh}</div>
        <div>威胁等级：${threatText}</div>
        <div>操作方：${operatorText}</div>
        <div style="margin-top:6px;">${zhDesc}</div>
      </div>`,
      { minWidth: 240 }
    );

    facilitiesLayer.addLayer(marker);
    if (!facilityMarkersByType[normalizedType]) {
      facilityMarkersByType[normalizedType] = [];
    }
    facilityMarkersByType[normalizedType].push(marker);
  });
  facilitiesLayer.addTo(map);

  watch(
    facilityVisibility,
    () => {
      applyLayerVisibility();
    },
    { immediate: true, deep: true },
  );

  // 显隐总开关变化时统一刷新图层
  watch([iconsVisible, clustersVisible, tracksVisible, breakingVisible], () => {
    applyLayerVisibility();
  });

  watch(offlineTilesVisible, (v) => {
    if (!offlineTileLayer) return;
    if (v) offlineTileLayer.addTo(map);
    else offlineTileLayer.remove();
  });

  // 战场图谱模式：进入时地图被隐藏（v-show），切回地图时需重新计算画布尺寸，
  // 否则地图容器在 display 切换后会出现尺寸错乱 / 瓦片空白。
  watch(
    () => homeStore.mapLeftTab,
    (tab) => {
      if (tab !== "third" && map) {
        nextTick(() => map.invalidateSize());
      }
    },
  );
  // 地图点击空白处清除轨迹
  map.on("click", onMapClickClearTrajectory);

  // 地图就绪后，若文章已先加载则补打点
  renderArticleMarkers(articles.value);
  breakingArticles.value = (articles.value || []).filter((a) => a.isBreaking === true);
  renderBreakingMarkers(breakingArticles.value);
  applyLayerVisibility();

  // 地图就绪后，若飞机数据已先加载且轨迹开关已开启则补打点
  if (tracksVisible.value && aircraftList.value && aircraftList.value.length > 0) {
    renderAircraftMarkers(aircraftList.value);
  }

};

const selectedTopics = ref<string[]>([]);
const searchQuery = ref("");
const region = ref(undefined); // 默认 Global；如需按区域过滤在此赋值
const timeWindowHours = ref(24);
const articlesSince = computed(
  () => new Date(Date.now() - timeWindowHours.value * 60 * 60 * 1000),
);

const {
  articles,
  isLoading: articlesLoading,
  refetch: refetchArticles,
} = useArticlesList(
  () => ({
    region: region.value,
    topics: selectedTopics.value.length > 0 ? selectedTopics.value : undefined,
    search: searchQuery.value || undefined,
    limit: 1000,
    since: articlesSince.value,
    // hours: 48
  }),
  // 战场图谱模式下暂停 30s 自动轮询（改为图谱右上角「刷新」按钮手动触发）
  { refetchInterval: 30000, enabled: () => homeStore.mapLeftTab !== "third" },
);

// 注册手动刷新：图谱右上角「刷新」按钮通过 store.articlesRefetch 调用（force 绕过 enabled 门控）
homeStore.articlesRefetch = () => refetchArticles(true);
// 注册异常列表刷新：「异常征候」左栏确认 / 排除后通过 store.anomaliesRefetch 重新拉取
homeStore.anomaliesRefetch = () => fetchWarningData();

// 文章加载完成后用于地图按国家聚合打点
watch(articles, (list) => {
  homeStore.setArticles(list);
  // 筛选异常文章（isBreaking 为 true）
  breakingArticles.value = (list || []).filter((a) => a.isBreaking === true);
  renderArticleMarkers(list);
  renderBreakingMarkers(breakingArticles.value);
  applyLayerVisibility();
});

// ═══════════════════════════════════════════════════════════════════
// 全局 loading 控制：底图(geojson) + 文章数据 + 飞机数据 全部就绪后才关闭遮罩
// ═══════════════════════════════════════════════════════════════════
const mapReady = ref(false);
const articlesReady = ref(false);
const aircraftReady = ref(false);

const checkAllReady = () => {
  if (mapReady.value && articlesReady.value && aircraftReady.value) {
    loadingStore.finishMapLoading();
  }
};

// 文章首次加载完成（含失败）即视为就绪
watch(articlesLoading, (loading) => {
  if (!loading) {
    articlesReady.value = true;
    checkAllReady();
  }
});

// 飞机数据首次加载完成（含失败）即视为就绪
watch(aviationLoading, (loading) => {
  if (!loading) {
    aircraftReady.value = true;
    checkAllReady();
  }
});

onMounted(async () => {
  // 进入地图即开启全屏 loading，直到底图与数据全部就绪
  loadingStore.startMapLoading();

  // 兜底：无论网络连接是否异常，最长 20s 后强制关闭遮罩，避免永久卡在 loading
  const safetyTimer = window.setTimeout(() => {
    mapReady.value = true;
    articlesReady.value = true;
    aircraftReady.value = true;
    loadingStore.finishMapLoading();
  }, 20000);

  try {
    await homeStore.loadFacilities();
    await initMap();
    // 加载异常事件数据到 warningMarkers
    await fetchWarningData();
  } catch (e) {
    console.error("[Map] init failed:", e);
  } finally {
    mapReady.value = true;
    window.clearTimeout(safetyTimer);
    checkAllReady();
  }
});

onUnmounted(() => {
  // 兜底：离开页面时无论如何关闭 loading 遮罩
  loadingStore.finishMapLoading();
  homeStore.mapViewportApi = null;
  if (map) {
    if (articleCluster) {
      articleCluster.clearLayers();
      articleCluster = null;
    }
    if (countryLabelLayer) {
      countryLabelLayer.clearLayers();
      countryLabelLayer = null;
    }
    if (aircraftCluster) {
      aircraftCluster.clearLayers();
      aircraftCluster = null;
    }
    if (trajectoryLayer) {
      trajectoryLayer.clearLayers();
      trajectoryLayer = null;
    }
    if (breakingCluster) {
      breakingCluster.clearLayers();
      breakingCluster = null;
    }
    homeStore.clearClusterFilter();
    map.remove();
    map = null;
    geoLayer = null;
    roadLabelTileLayer = null;
    facilitiesLayer = null;
    selectedLayer = null;
  }
});
</script>

<style lang="scss">
.road-label-tile-layer {
  pointer-events: none;
}

#world-map {
  background: #0c0c0c;
}

.facility-marker {
  background: transparent;
  border: none;
  transition: filter 140ms ease;
  will-change: filter;
  box-shadow: 0 0 6px #36cfc9, 0 0 10px rgba(54, 207, 201, 0.55);
}

.map-topright {
  position: absolute;
  /* 右下角：底边距随底部节点统计条抬高；距右 = 右栏 w-95(380px) + 12px */
  bottom: calc(20px + var(--map-dock-reserve, 0px));
  right: calc(380px + 12px);
  z-index: 1100;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  pointer-events: none;
  /* 高于底部 Dock(host z-1000)，避免叠层遮挡 */
}

.map-controls {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 10px;
  background: rgba(17, 24, 39, 0.85);
  border: 1px solid rgba(45, 58, 77, 0.9);
  border-radius: 8px;
  pointer-events: auto;
  /* 开关可交互 */
  backdrop-filter: blur(2px);
}

.map-control-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.map-control-label {
  font-size: 12px;
  line-height: 1;
  color: #e5e7eb;
  user-select: none;
}

.articles-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  font-size: 12px;
  line-height: 1;
  color: #e5e7eb;
  background: rgba(15, 23, 42, 0.78);
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 999px;
  pointer-events: none;
  user-select: none;

  .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #36cfc9;
    animation: articles-pulse 1s ease-in-out infinite;
  }

  &.is-loading {
    color: #93c5fd;
  }
}

@keyframes articles-pulse {

  0%,
  100% {
    opacity: 0.35;
  }

  50% {
    opacity: 1;
  }
}
</style>

<!-- 文章聚合标记 / 聚合图标：非 scoped，leaflet 动态注入的 divIcon 不受 scoped 影响 -->
<style>
.leaflet-popup-content-wrapper {
  background: #1a2332;
  border: 1px solid #2d3a4d;
  border-radius: 6px;
}

.leaflet-popup-content {
  margin: 10px 20px;
}

.article-cluster,
.article-marker {
  background: transparent;
  border: none;
}

.article-cluster__inner,
.article-marker__inner {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  font-weight: 700;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.4), 0 2px 6px rgba(0, 0, 0, 0.45);
}

.article-cluster__inner {
  background: rgba(20, 20, 20, 0.92);
  border: 2px solid #c1a465;
  color: #f0d9a8;
  font-size: 14px;
}

/* 单篇标记：青色描边 */
.article-marker__inner {
  background: rgba(20, 20, 20, 0.92);
  border: 2px solid #36cfc9;
  color: #d6f7f4;
  font-size: 12px;
}

/* ═══════════════════════════════════════════════════════════════
   有聚合文章的国家名称标注
   ═══════════════════════════════════════════════════════════════ */
.country-label {
  background: transparent;
  border: none;
}

.country-label__inner {
  /* 水平居中于国家中心，并下移到聚合气泡下方，避免与数目气泡重叠 */
  transform: translate(-50%, 22px);
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
  color: #f0d9a8;
  background: rgba(12, 18, 30, 0.86);
  /* border: 1px solid rgba(193, 164, 101, 0.6); */
  /* border-radius: 999px; */
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
  pointer-events: none;
  user-select: none;
}

.country-label__count {
  color: #67e8f9;
  font-weight: 700;
}

/* ═══════════════════════════════════════════════════════════════
   飞机聚合 / 单机图标 / 轨迹样式
   ═══════════════════════════════════════════════════════════════ */

/* 飞机聚合：深/近黑六边形（区别于文章的金色圆形） */
.aircraft-cluster {
  background: transparent;
  border: none;
}

.aircraft-cluster__inner {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  /* 六边形 clip-path */
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  background: rgba(20, 40, 70, 0.6);
  border: none;
  /* clip-path 下 border 无效，用外层模拟 */
  color: #f97316;
  font-family: "Courier New", monospace;
  font-weight: 700;
  letter-spacing: -0.5px;
  position: relative;
  box-shadow: 0 0 8px rgba(20, 40, 70, 0.5), 0 0 0 2px rgba(20, 40, 70, 0.9);
}

/* 飞机聚合外发光环 */
.aircraft-cluster::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 110%;
  height: 110%;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  background: radial-gradient(circle, rgba(0, 0, 0, 0.22) 0%, transparent 70%);
  pointer-events: none;
}

/* 单架飞机标记 */
.aircraft-marker {
  background: transparent;
  border: none;
  cursor: pointer;
  transition: filter 120ms ease;
}

.aircraft-marker:hover {
  filter: brightness(1.4) drop-shadow(0 0 8px #a3e635);
  z-index: 1000;
}

/* 轨迹起降点标记 */
.aircraft-route-marker {
  background: transparent;
  border: none;
}

/* 飞机 tooltip */
.leaflet-tooltip.aircraft-tooltip {
  background: rgba(8, 16, 32, 0.92);
  border: 1px solid rgba(6, 182, 212, 0.4);
  border-radius: 4px;
  color: #67e8f9;
  font-family: "Courier New", monospace;
  font-size: 10px;
  padding: 3px 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}

/* 选中飞机的脉冲动画 */
.aircraft-pulse {
  animation: aircraft-pulse-anim 1.8s ease-out infinite;
}

@keyframes aircraft-pulse-anim {
  0% {
    fill-opacity: 0.25;
    opacity: 0.8;
  }

  70% {
    fill-opacity: 0;
    opacity: 0;
  }

  100% {
    fill-opacity: 0;
    opacity: 0;
  }
}

/* ═══════════════════════════════════════════════════════════════
   异常文章聚合标记样式（红色边框 + 数字，与「情报」聚合一致仅改色）
   ═══════════════════════════════════════════════════════════════ */
.breaking-cluster,
.breaking-marker {
  background: transparent;
  border: none;
}

.breaking-cluster__inner,
.breaking-marker__inner {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  font-weight: 700;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.4), 0 2px 6px rgba(0, 0, 0, 0.45);
}

/* 聚合：红边圆 + 数字 */
.breaking-cluster__inner {
  background: rgba(20, 20, 20, 0.92);
  border: 2px solid #ef4444;
  color: #fca5a5;
  font-size: 14px;
}

/* 单篇：红边圆 + "1" */
.breaking-marker__inner {
  background: rgba(20, 20, 20, 0.92);
  border: 2px solid #ef4444;
  color: #fca5a5;
  font-size: 12px;
}
</style>
