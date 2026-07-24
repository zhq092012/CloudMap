<template>
  <div class="h-full w-full relative" ref="containerRef">
    <div class="hidden" ref="creditRef" />
    <!-- 地图上方的复选框 -->
    <div
      class="absolute top-4 left-4 z-10 bg-gray-800 bg-opacity-75 p-3 rounded-md text-sm text-gray-200"
    >
      <label>
        <input type="checkbox" v-model="visibility.military" /> 军备资源
      </label>
      <label>
        <input type="checkbox" v-model="visibility.count" /> 聚合统计
      </label>
      <label>
        <input type="checkbox" v-model="visibility.warning" /> 异常警告
      </label>
    </div>
    <div
      class="absolute top-4 right-4 z-10 bg-gray-800 bg-opacity-75 p-3 rounded-md text-sm text-gray-200"
    >
      <!-- 右上角内容 -->
      <label>
        <input type="radio" v-model="mapType" value="GeoJSON" /> 原始地图
        <input type="radio" v-model="mapType" value="Heatmap" /> 热力图
        <input type="radio" v-model="mapType" value="HexagonalGrid" />
        六边形网格
      </label>
    </div>
    <ElDialog
      v-model="isWarningDialogOpen"
      title="⚠️ 警告信息"
      width="1000px"
      :center="true"
      destroy-on-close
      class="custom-black-dialog"
    >
      <WarningDialog :title="warningTitle" :description="warningDescription" />
    </ElDialog>
    <ElDialog
      v-model="isAirportDialogOpen"
      title="🏢 设施详情"
      width="520px"
      :center="true"
      destroy-on-close
      class="custom-black-dialog"
    >
      <AirportDialog />
    </ElDialog>
    <AgentDeduceDialog
      :isOpen="homeStore.isDeduceModalOpen"
      @close="homeStore.isDeduceModalOpen = false"
    />

    <!-- 日期时间轴控件 -->
    <div
      class="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 w-[700px] bg-slate-950/85 backdrop-blur-md border border-slate-800/80 p-4 rounded-xl shadow-2xl flex flex-col gap-3 text-slate-200"
    >
      <!-- 顶部控制栏：显示当前选中日期 & 自动播放/暂停 -->
      <div class="flex items-center justify-between px-2">
        <div class="flex items-center gap-2">
          <span
            class="text-slate-400 text-[11px] font-semibold tracking-wider uppercase"
            >时间周期</span
          >
          <span class="text-amber-400 font-mono text-base font-bold">{{
            selectedDate
          }}</span>
        </div>
        <button
          @click="togglePlay"
          class="flex items-center gap-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 rounded text-xs font-bold transition-all duration-200 cursor-pointer shadow-md"
        >
          <!-- Play / Pause Icon -->
          <svg
            v-if="isPlaying"
            xmlns="http://www.w3.org/2000/svg"
            class="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="3"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            class="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="3"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{{ isPlaying ? "暂停演示" : "自动播放" }}</span>
        </button>
      </div>

      <!-- 时间轴主体 -->
      <div class="relative flex items-center justify-between px-4 mt-2 h-10">
        <!-- 背景横线 -->
        <div
          class="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-slate-800 rounded"
        >
          <!-- 激活状态的进度条 -->
          <div
            class="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded transition-all duration-300"
            :style="{
              width: `${(selectedDateIndex / (dates.length - 1)) * 100}%`,
            }"
          ></div>
        </div>

        <!-- 各个日期刻度点 -->
        <div
          v-for="(date, index) in dates"
          :key="date"
          @click="selectDate(date)"
          class="relative z-20 flex flex-col items-center cursor-pointer group"
          :style="{ width: '50px' }"
        >
          <!-- 刻度点小圆圈 -->
          <div
            class="w-4 h-4 rounded-full flex items-center justify-center transition-all duration-300 border-2"
            :class="[
              date === selectedDate
                ? 'bg-amber-500 border-amber-300 scale-125 shadow-lg shadow-amber-500/50'
                : index < selectedDateIndex
                  ? 'bg-amber-500 border-amber-600'
                  : 'bg-slate-900 border-slate-700 group-hover:border-slate-500 group-hover:scale-110',
            ]"
          >
            <!-- 中心亮点 -->
            <div
              v-if="date === selectedDate"
              class="w-1.5 h-1.5 bg-slate-950 rounded-full"
            ></div>
          </div>

          <!-- 日期标签 -->
          <span
            class="absolute top-6 text-[10px] font-mono whitespace-nowrap transition-all duration-300"
            :class="[
              date === selectedDate
                ? 'text-amber-400 font-bold scale-105'
                : 'text-slate-500 group-hover:text-slate-300',
            ]"
          >
            {{ formatDateLabel(date) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import * as Cesium from "cesium";
import * as turf from "@turf/turf";

import redport from "@/assets/icons/red_port.png";
import redairport from "@/assets/icons/red_airport.png";
import redhq from "@/assets/icons/red_hq.png";
import rednuclear from "@/assets/icons/red_nuclear.png";
import redairbase from "@/assets/icons/red_air_base.png";

import blueport from "@/assets/icons/blue_port.png";
import blueairport from "@/assets/icons/blue_airport.png";
import bluehq from "@/assets/icons/blue_hq.png";
import blueairbase from "@/assets/icons/blue_air_base.png";

import warning1 from "@/assets/icons/warning1.png";
import warning2 from "@/assets/icons/warning2.png";
import warning3 from "@/assets/icons/warning3.png";
import geoJsonIranRaw from "@/assets/geojson/Iran1.geojson?raw";
import geoJsonIsraelRaw from "@/assets/geojson/Israel1.geojson?raw";
import WarningDialog from "@/components/Dialogs/WarningDialog.vue";
import AirportDialog from "@/components/Dialogs/AirportDialog.vue";
import { ElDialog } from "element-plus";
import { createCoordinatePickingTool } from "@/utils/3d/cesium";
import type { CesiumMarker, MarkerType, WarningMarker } from "@/types/home";
import { useHomeStore } from "@/store/modules/homeStore";
import { storeToRefs } from "pinia";
import { getTaskAnomalyRanks } from "@/api/agents-api";
// import heatmapImage from "@/assets/images/heatareamap.png";
// import heatGridImage from "@/assets/images/heatareagrid.png";
import AgentDeduceDialog from "./Dialogs/AgentDeduceDialog.vue";
import { useAgentStore } from "@/store/modules/agentStore";
const homeStore = useHomeStore();
const agentStore = useAgentStore();
const { entityVisibility: visibility, getFilteredMarkers } =
  storeToRefs(homeStore);
const mapType = ref<"GeoJSON" | "Heatmap" | "HexagonalGrid">("GeoJSON");
const heatMapEntity = ref<Cesium.Entity | null>(null);
const hexagonalEntity = ref<Cesium.Entity | null>(null);
const warningTitle = ref("");
const warningDescription = ref("");

let heatMapPrimitive: Cesium.GroundPrimitive | null = null;
let activeHeatMaterial: Cesium.Material | null = null;

const updateHeatmapFromMarkers = () => {
  if (!viewer || mapType.value !== "Heatmap") return;

  // 移除旧的热力图图层
  if (heatMapPrimitive) {
    viewer.scene.groundPrimitives.remove(heatMapPrimitive);
    heatMapPrimitive = null;
  }

  const activeMarkers = getFilteredMarkers.value || [];

  // 动态拼装 GLSL 节点位置及权重，根据真实 CesiumMarker 的坐标来渲染热力图的集中深色区域
  let pointsSource = "";
  if (activeMarkers.length > 0) {
    activeMarkers.forEach((marker) => {
      // 过滤聚合点或无有效经纬度的标记点
      if (
        marker.type === "count" ||
        marker.lng === undefined ||
        marker.lat === undefined
      )
        return;

      // 将真实坐标 map 进 st 纹理空间 (West 31°, South 19°, East 63°, North 38°)
      const s = (marker.lng - 31.0) / (63.0 - 31.0);

      // 纹理 st 坐标在 RectangleGeometry 中是基于经纬度线性插值的
      const t = (marker.lat - 19.0) / (38.0 - 19.0);

      // 转换为 shader 内部的 uv 空间 (uv = materialInput.st * 4.0 - 2.0; uv.x *= 1.6842)
      const targetX = (s * 4.0 - 2.0) * 1.6842;
      const targetY = t * 4.0 - 2.0;

      // 对异常警告标记点赋予更高的能量值 and 更大的影响范围，普通标记点赋予稍弱的能量
      const weight = marker.type === "warning1" ? 0.95 : 0.4;
      const radius = marker.type === "warning1" ? 0.7 : 0.45;
      //distance(uv, target)：计算当前像素点到热力中心的距离
      //1.0 - 距离/半径：一种反比衰减。中心点处值为 1.0，边缘处降为 0.0，超过半径变为负数。
      //max(0.0, ...)：把超过半径的负数剔除，确保影响范围严格控制在 radius 内
      //pow(..., 2.0)：二次方平滑（抛物线衰减）。它让热力中心点非常尖锐（能量集中），向外围衰减得更快，形成自然扩散的火山口状能量场。
      //权重与半径分级：代码根据 marker.type === "warning1" 进行了分级。异常警告点拥有极高的能量（0.95）和大范围（0.70），普通点则较弱。
      //所有点的能量场在 GPU 中通过 totalWeight += ... 叠加，交界处会自动融合。
      pointsSource += `
        totalWeight += ${weight.toFixed(2)} * pow(max(0.0, 1.0 - distance(uv, vec2(${targetX.toFixed(5)}, ${targetY.toFixed(5)})) / ${radius.toFixed(2)}), 2.0);
      `;
    });
  }

  // 编译生成热力图材质
  activeHeatMaterial = new Cesium.Material({
    fabric: {
      type: "ShadertoyHeatmap",
      uniforms: {
        iTime: 0.0,
      },
      source: `
        czm_material czm_getMaterial(czm_materialInput materialInput) {
          czm_material material = czm_getDefaultMaterial(materialInput);
          
          vec2 uv = materialInput.st * 4.0 - vec2(2.0);// 将 [0,1] 映射到 [-2, 2]
          uv.x *= 1.6842; // 把 X 轴拉伸 1.6842 倍，使得在 Shader 的 uv 空间里，横纵单位距离代表的实际地理距离一致，这样处理后，每一个热力点算出来的距离才是正圆。
          
          // 在内部，Shader 定义了一个包含 5 个控制点的经典热力图颜色渐变带
          vec3 colors[5];
          float points[5];
          colors[0] = vec3(0.0, 0.0, 0.0); // 黑色底，完全透明
          colors[1] = vec3(0.0, 0.8, 1.0); // 青蓝色
          colors[2] = vec3(0.0, 1.0, 0.0); // 绿色
          colors[3] = vec3(1.0, 1.0, 0.0); // 黄色
          colors[4] = vec3(1.0, 0.0, 0.0); // 红色
          points[0] = 0.0;
          points[1] = 0.15;
          points[2] = 0.4;
          points[3] = 0.65;
          points[4] = 1.0;
          
          float totalWeight = 0.0;
          ${pointsSource}
          
          vec3 heatColor;
          if (totalWeight <= points[0]) {
              heatColor = colors[0];
          } else if (totalWeight >= points[4]) {
              heatColor = colors[4];
          } else {
              heatColor = colors[0];

              //Shader 接下来的 for 循环是在做多级线性插值：计算当前的 totalWeight 落在哪两个颜色区间内，
              //然后通过比例 a 混合出最终的 heatColor，并赋给 material.diffuse。
              for (int i = 1; i < 5; ++i) {
                  if (totalWeight < points[i]) {
                      float a = (totalWeight - points[i-1]) / (points[i] - points[i-1]);
                      heatColor = vec3(colors[i-1].x + a * (colors[i].x - colors[i-1].x),
                                       colors[i-1].y + a * (colors[i].y - colors[i-1].y),
                                       colors[i-1].z + a * (colors[i].z - colors[i-1].z));
                      break;
                  }
              }
          }
          
          material.diffuse = heatColor;
          
          // 边缘羽化（2% 渐变），消除边界硬切的同时保留大部分可视热力区域
          // 这会在矩形边界的 2% 范围内做透明度渐变。这样可以防止热力图在边缘处被“硬生生切断”，使其自然隐入地表。
          float edgeFade = smoothstep(0.0, 0.02, materialInput.st.x) * 
                           smoothstep(1.0, 0.98, materialInput.st.x) * 
                           smoothstep(0.0, 0.02, materialInput.st.y) * 
                           smoothstep(1.0, 0.98, materialInput.st.y);
          
          //热度透明度映射
          //意味着当热度低于 0.01 时完全透明（隐藏底色），在 0.01 到 0.35 之间透明度快速平滑上升，最高透明度乘以 0.85 封顶，确保能隐约看到底下的卫星地图。
          float alpha = smoothstep(0.01, 0.35, totalWeight);
          material.alpha = alpha * 0.85 * edgeFade;
          
          return material;
        }
      `,
    },
  });
  const rectangleGeometry = new Cesium.RectangleGeometry({
    rectangle: Cesium.Rectangle.fromDegrees(31.0, 19.0, 63.0, 38.0), //以弧度表示具有西、南、东、北四个属性的制图矩形。

    // 指定该几何体的顶点格式、这里引用了 TEXTURED（纹理）材质所需的顶点格式。
    // 这意味着这个矩形在生成时，不仅会计算每个点在地球上的 3D 位置（position），还会自动计算并生成 纹理坐标（st / UV 坐标） 以及 法线（normal）。
    // 这样设置后，你后续就可以为这个矩形赋予包含图片、网络纹理、或复杂的着色器材质，而不会因为缺少“纹理坐标”导致贴图无法正确映射或报错。
    vertexFormat:
      Cesium.MaterialAppearance.MaterialSupport.TEXTURED.vertexFormat,
  });
  //核心作用：创建一个贴地图元（GroundPrimitive）
  //为什么要用它？：
  //普通的 Cesium.Primitive 是悬浮或穿透地形的绝对 3D 几何体。
  //而 GroundPrimitive 会自动贴合地球表面的起伏地形（Terrain）或 3D Tiles 建筑模型。
  //对于热力图这种“贴在地面上”的二维数据可视化，必须使用 GroundPrimitive，否则山峰会穿透热力图，或者热力图会悬空。
  heatMapPrimitive = new Cesium.GroundPrimitive({
    //几何体实例：它封装了几何体及其属性。
    //我们创建了一个包含上面定义的 rectangleGeometry 的 GeometryInstance。
    //id 用于在后续的查询或删除操作中识别这个图元。
    geometryInstances: new Cesium.GeometryInstance({
      geometry: rectangleGeometry, //这是图元的“骨架”和身份标签，把你在上一段代码里定义的那个中东地区的矩形范围拿过来，作为热力图的边界。

      //给这个实例绑定一个唯一标识符（ID）。从名字可以看出，这个热力图材质可能借鉴了 Shadertoy（一个著名的着色器分享网站）
      //的 Shader 算法。设置 ID 的主要目的是方便后续做鼠标点击拾取（Picking）或通过 ID 找到并删除这个图元。
      id: "shadertoy_heatmap",
    }),
    //(外观配置)这是图元的“皮肤”和渲染规则：
    appearance: new Cesium.MaterialAppearance({
      //赋予它具体的热力图材质（这通常是一个包含了颜色渐变、权重计算的自定义着色器 Shader 材质）。
      material: activeHeatMaterial,

      //非常关键的一项。 设置为 true 意味着禁用光照阴影计算。
      //热力图属于二维分析图表，不需要像 3D 建筑物那样随着太阳角度的变化产生明暗、阴影效果。
      //开启 flat 可以让热力图颜色保持纯正，同时提高渲染性能。
      flat: true,

      //开启半透明。热力图必须是半透明的，否则它会像一块密不透风的厚布一样把地面的卫星底图、道路全遮挡住。
      translucent: true,
    }),
  });

  //作用：将创建好的热力图图元正式添加进场景的贴地图元集合（groundPrimitives）中。
  //注意点：Cesium 内部有两套渲染集合：viewer.scene.primitives（普通图元，如 3D 战机、飞线）和 viewer.scene.groundPrimitives（贴地图元）。
  //只有把 GroundPrimitive 放进对应的 groundPrimitives 集合里，它的“贴地（Draping）”效果才会生效。
  viewer.scene.groundPrimitives.add(heatMapPrimitive);
};

watch(mapType, (newType) => {
  if (!viewer) return;

  // 统一清理动态图层和实体
  if (heatMapPrimitive) {
    viewer.scene.groundPrimitives.remove(heatMapPrimitive);
    heatMapPrimitive = null;
  }
  activeHeatMaterial = null;
  if (heatMapEntity.value) {
    viewer.entities.remove(heatMapEntity.value);
  }
  if (hexagonalEntity.value) {
    viewer.entities.remove(hexagonalEntity.value);
  }
  if (hexOutlinePrimitive) {
    viewer.scene.groundPrimitives.remove(hexOutlinePrimitive);
    hexOutlinePrimitive = null;
  }
  if (hexPrimitive) {
    viewer.scene.primitives.remove(hexPrimitive);
    hexPrimitive = null;
  }

  // 根据类型重新初始化
  switch (newType) {
    case "GeoJSON":
      loadGeoJsonAreas(viewer);
      break;
    case "Heatmap":
      updateHeatmapFromMarkers();
      break;
    case "HexagonalGrid":
      updateHexagonalGridFromMarkers();
      break;
  }
});
const geoJsonIran = JSON.parse(geoJsonIranRaw) as GeoJSON.FeatureCollection<
  GeoJSON.Polygon | GeoJSON.MultiPolygon
>;
const geoJsonIsrael = JSON.parse(geoJsonIsraelRaw) as GeoJSON.FeatureCollection<
  GeoJSON.Polygon | GeoJSON.MultiPolygon
>;

const containerRef = ref<HTMLElement | null>(null);
const creditRef = ref<HTMLElement | null>(null);
let viewer: Cesium.Viewer | null = null;
let hexPrimitive: Cesium.GroundPrimitive | null = null;
let hexOutlinePrimitive: Cesium.GroundPolylinePrimitive | null = null;
// marker type 和 icon 的映射关系
const markerTypeToIcon: Record<Exclude<MarkerType, "count">, string> = {
  redairport: redairport, //红方机场
  redport: redport, //红方港口
  rednuclear: rednuclear, //红方核设施
  redhq: redhq, //红方指挥部
  redairbase: redairbase, //红方空军基地
  rednavalbase: redport, //红方海军基地（暂用港口图标）
  redarmybase: redhq, //红方陆军基地（暂用指挥部图标）
  redairdefense: redairbase, //红方防空基地（暂用空军基地图标）
  blueairport: blueairport, //蓝方机场
  blueport: blueport, //蓝方港口
  bluehq: bluehq, //蓝方指挥部
  blueairbase: blueairbase, //蓝方空军基地
  warning1: warning1, // 警告点图标
  warning2: warning2, // 警告点图标
  warning3: warning3, // 警告点图标
};

const addMarkers = (markers: CesiumMarker[], viewer: Cesium.Viewer) => {
  // 遍历经纬度数组
  markers.forEach((marker) => {
    const position = Cesium.Cartesian3.fromDegrees(
      marker.lng,
      marker.lat,
      marker.alt,
    );

    if (marker.type === "count") {
      // 1. 独立处理绿色聚合标签
      viewer.entities.add({
        id: `${marker.type}-${marker.id}`,
        position,
        label: {
          text: marker.count?.toString() || "1",
          font: "bold 11px monospace",
          fillColor: Cesium.Color.WHITE,
          backgroundColor: Cesium.Color.fromCssColorString("#10b981"), // 契合 Tailwind 的 emerald-500
          showBackground: true,
          backgroundPadding: new Cesium.Cartesian2(5, 3),
          disableDepthTestDistance: Number.POSITIVE_INFINITY, // 防止图标被地形遮挡
        },
      });
    } else {
      // 2. 根据你的映射关系动态获取导入的图标资源
      const iconImage =
        markerTypeToIcon[marker.type as Exclude<MarkerType, "count">];

      viewer.entities.add({
        id: `${marker.type}-${marker.id}`,
        name: marker.name,
        position,
        label: {
          text: marker.name,
          font: "bold 11px monospace",
          fillColor: Cesium.Color.WHITE,
          backgroundColor: Cesium.Color.fromCssColorString("#10b981"), // 契合 Tailwind 的 emerald-500
          showBackground: true,
          backgroundPadding: new Cesium.Cartesian2(5, 3),
          pixelOffset: new Cesium.Cartesian2(0, 30),
          disableDepthTestDistance: Number.POSITIVE_INFINITY, // 防止图标被地形遮挡
        },
        billboard: {
          image: iconImage, // 完美承接你的内部导入对象（如：redairport, baseCluster1等）
          width: marker.type.startsWith("warning") ? 50 : 20, // 警告点做稍微醒目处理
          height: marker.type.startsWith("warning") ? 50 : 20,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
    }
  });
};

// 2. 针对单个区域生成热力区域（加入了 cores 核心点参数）
const loadGeoJsonArea = (
  geojson: GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon>,
  type: "red" | "blue",
): Cesium.GeometryInstance[] => {
  const geometryInstances: Cesium.GeometryInstance[] = [];
  const isRedZone = type === "red";
  // 定义一个固定的基础颜色和透明度
  const baseColor = isRedZone
    ? Cesium.Color.fromCssColorString("#dc2626").withAlpha(0.5)
    : Cesium.Color.fromCssColorString("#2563eb").withAlpha(0.5);

  // 遍历 GeoJSON 中的每一个面要素
  geojson.features.forEach((feature, index) => {
    if (!feature.geometry) return;

    const createInstance = (
      coordinates: GeoJSON.Position[][],
      subIndex: number,
    ) => {
      // 提取外环坐标并扁平化为 [lng, lat, lng, lat...]
      const outerRing = coordinates[0];
      const degreesArray = outerRing.flatMap((coord) => [coord[0], coord[1]]);

      // 处理内环（洞），如果有的话
      let holes: Cesium.PolygonHierarchy[] = [];
      if (coordinates.length > 1) {
        holes = coordinates.slice(1).map((holeCoords) => {
          const holeDegrees = holeCoords.flatMap((coord) => [
            coord[0],
            coord[1],
          ]);
          return new Cesium.PolygonHierarchy(
            Cesium.Cartesian3.fromDegreesArray(holeDegrees),
          );
        });
      }

      const polygonGeometry = new Cesium.PolygonGeometry({
        polygonHierarchy: new Cesium.PolygonHierarchy(
          Cesium.Cartesian3.fromDegreesArray(degreesArray),
          holes,
        ),
        vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
      });

      const instance = new Cesium.GeometryInstance({
        geometry: polygonGeometry,
        attributes: {
          color: Cesium.ColorGeometryInstanceAttribute.fromColor(baseColor),
        },
        id: `area_cell_${type}_${index}_${subIndex}`,
      });

      geometryInstances.push(instance);
    };

    // 兼容 Polygon 和 MultiPolygon 两种类型
    if (feature.geometry.type === "Polygon") {
      createInstance(feature.geometry.coordinates as GeoJSON.Position[][], 0);
    } else if (feature.geometry.type === "MultiPolygon") {
      const multiCoords = feature.geometry
        .coordinates as GeoJSON.Position[][][];
      multiCoords.forEach((coords, subIndex) => {
        createInstance(coords, subIndex);
      });
    }
  });

  return geometryInstances;
};

// 针对单个区域生成蜂窝热力网格和边框几何体
const loadHexagonalGridArea = (
  geojson: GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon>,
  type: "red" | "blue",
  cores: Array<[number, number]>,
): [Cesium.GeometryInstance[], Cesium.GeometryInstance[]] => {
  const bbox = turf.bbox(geojson);
  const cellSide = 40; // 六边形边长（公里）
  const maxRadius = 500; // 核心区域的最大影响半径（公里）

  const geometryInstances: Cesium.GeometryInstance[] = [];
  const outlineInstances: Cesium.GeometryInstance[] = [];

  const hexGridCollection = turf.hexGrid(bbox, cellSide, {
    units: "kilometers",
  });

  const corePoints = cores.map((coord) => turf.point(coord));

  hexGridCollection.features.forEach((feature, index) => {
    if (!feature.geometry) return;

    const hexCenter = turf.centerOfMass(feature);
    const isInsideArea = geojson.features.some((areaFeature) =>
      turf.booleanPointInPolygon(hexCenter, areaFeature),
    );
    if (!isInsideArea) return;

    let maxWeight = 0;

    if (corePoints.length > 0) {
      const distances = corePoints.map((core) =>
        turf.distance(hexCenter, core, { units: "kilometers" }),
      );
      const minDistance = Math.min(...distances);

      // 距离越近，权重越大（范围 0 ~ 1）
      maxWeight = Math.max(0, 1 - minDistance / maxRadius);
      maxWeight = Math.pow(maxWeight, 1.5);
    } else {
      maxWeight = 0.5; // 无核心点时给默认值
    }

    const coordinates = feature.geometry.coordinates[0];
    const degreesArray = coordinates.flatMap((coord) => [coord[0], coord[1]]);

    const isRedZone = type === "red";
    const baseColor = isRedZone
      ? Cesium.Color.fromCssColorString("#62231E")
      : Cesium.Color.fromCssColorString("#182747");

    const finalColor = baseColor.withAlpha(0.45 + maxWeight * 0.55);

    const polygonGeometry = new Cesium.PolygonGeometry({
      polygonHierarchy: new Cesium.PolygonHierarchy(
        Cesium.Cartesian3.fromDegreesArray(degreesArray),
      ),
      vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
    });

    const instance = new Cesium.GeometryInstance({
      geometry: polygonGeometry,
      attributes: {
        color: Cesium.ColorGeometryInstanceAttribute.fromColor(finalColor),
      },
      id: `hex_cell_${type}_${index}`,
    });

    geometryInstances.push(instance);

    const outlineGeometry = new Cesium.GroundPolylineGeometry({
      positions: Cesium.Cartesian3.fromDegreesArray(degreesArray),
      width: 1.5,
    });

    const lineInstance = new Cesium.GeometryInstance({
      geometry: outlineGeometry,
      attributes: {
        color: Cesium.ColorGeometryInstanceAttribute.fromColor(
          baseColor.withAlpha(0.35 + maxWeight * 0.35),
        ),
      },
    });
    outlineInstances.push(lineInstance);
  });
  return [geometryInstances, outlineInstances];
};

const updateHexagonalGridFromMarkers = () => {
  if (!viewer || mapType.value !== "HexagonalGrid") return;

  // 清除旧的蜂窝 Primitive
  if (hexPrimitive) {
    viewer.scene.primitives.remove(hexPrimitive);
    hexPrimitive = null;
  }
  if (hexOutlinePrimitive) {
    viewer.scene.groundPrimitives.remove(hexOutlinePrimitive);
    hexOutlinePrimitive = null;
  }

  const activeMarkers = getFilteredMarkers.value || [];
  const redCores: Array<[number, number]> = [];
  const blueCores: Array<[number, number]> = [];

  activeMarkers.forEach((marker) => {
    if (
      marker.type === "count" ||
      marker.lng === undefined ||
      marker.lat === undefined
    )
      return;
    if (marker.type.startsWith("red")) {
      redCores.push([marker.lng, marker.lat]);
    } else if (marker.type.startsWith("blue")) {
      blueCores.push([marker.lng, marker.lat]);
    }
  });

  const instances: Cesium.GeometryInstance[] = [];
  const outlineInstances: Cesium.GeometryInstance[] = [];

  // 计算红方（伊朗）
  const [iranInstances, iranOutlines] = loadHexagonalGridArea(
    geoJsonIran,
    "red",
    redCores,
  );
  instances.push(...iranInstances);
  outlineInstances.push(...iranOutlines);

  // 计算蓝方（以色列）
  const [israelInstances, israelOutlines] = loadHexagonalGridArea(
    geoJsonIsrael,
    "blue",
    blueCores,
  );
  instances.push(...israelInstances);
  outlineInstances.push(...israelOutlines);

  // 渲染蜂窝面
  if (instances.length > 0) {
    hexPrimitive = new Cesium.GroundPrimitive({
      geometryInstances: instances,
      appearance: new Cesium.PerInstanceColorAppearance({
        flat: true,
        translucent: true,
        renderState: {
          depthTest: { enabled: true },
          depthMask: false,
          blending: Cesium.BlendingState.ALPHA_BLEND,
          polygonOffset: { enabled: true, factor: -1.0, units: -1.0 },
        },
      }),
      asynchronous: true,
    });
    viewer.scene.primitives.add(hexPrimitive);
  }

  // 渲染蜂窝边框线
  if (outlineInstances.length > 0) {
    hexOutlinePrimitive = new Cesium.GroundPolylinePrimitive({
      geometryInstances: outlineInstances,
      appearance: new Cesium.PolylineColorAppearance(),
    });
    viewer.scene.groundPrimitives.add(hexOutlinePrimitive);
  }
};

const loadGeoJsonAreas = (viewer: Cesium.Viewer) => {
  const geojsonAreainstances: Cesium.GeometryInstance[] = [];
  // 加载伊朗国界热力区域
  const iranInstances = loadGeoJsonArea(geoJsonIran, "red");
  // 加载以色列国界热力区域
  const israelInstances = loadGeoJsonArea(geoJsonIsrael, "blue");
  geojsonAreainstances.push(...iranInstances, ...israelInstances);
  if (geojsonAreainstances.length > 0) {
    hexPrimitive = new Cesium.GroundPrimitive({
      geometryInstances: geojsonAreainstances,
      appearance: new Cesium.PerInstanceColorAppearance({
        flat: true,
        translucent: true,
        renderState: {
          depthTest: { enabled: true },
          depthMask: false,
          blending: Cesium.BlendingState.ALPHA_BLEND,
          polygonOffset: { enabled: true, factor: -1.0, units: -1.0 },
        },
      }),
      asynchronous: true,
    });
    viewer.scene.primitives.add(hexPrimitive);
  }
};

const isWarningDialogOpen = ref(false);
const isAirportDialogOpen = ref(false);
const openDialog = (entityId: string) => {
  if (!entityId) return;
  const type = entityId.split("-")[0] as MarkerType; // 通过 ID 前缀判断类型（如：redairport-1 -> redairport）
  const id = entityId.split("-")[1]; // 获取 ID 后缀 -之后的部分
  homeStore.setSelectedWarningMarker({ id, type }); // 将选中的实体信息存储到 Vuex 中，供对话框组件使用
  // 设置 agent 事件编排类型和eventId
  agentStore.setCurrentTaskType("潜在异常");
  agentStore.setEventId(homeStore.selectedEntity?.itemId ?? 1);

  if (!type) return;
  switch (type) {
    case "redairport":
    case "redport":
    case "rednuclear":
    case "redhq":
    case "redairbase":
      // 打开红色阵营的详细信息对话框
      isAirportDialogOpen.value = true;
      break;
    case "blueairport":
    case "blueport":
    case "bluehq":
    case "blueairbase":
      // 打开蓝色阵营的详细信息对话框
      isAirportDialogOpen.value = true;
      break;
    case "warning1":
    case "warning2":
    case "warning3":
      // 打开警告信息对话框
      const selectedWarning = homeStore.selectedEntity;
      warningTitle.value = selectedWarning?.name || "未知警告";

      let descText = "暂无详细描述";
      if (selectedWarning?.description) {
        try {
          const parsed = JSON.parse(selectedWarning.description);
          if (parsed && typeof parsed === "object") {
            const parts: string[] = [];
            if (parsed.detail) {
              parts.push(`【影响详情】${parsed.detail}`);
            }
            if (parsed.score !== undefined) {
              parts.push(`【影响得分】${parsed.score}`);
            }
            if (parsed.scope !== undefined) {
              parts.push(`【影响范围】${parsed.scope}`);
            }
            if (parsed.suspicious_points !== undefined) {
              parts.push(`【可疑点】${parsed.suspicious_points}`);
            }
            if (parsed.reasoning) {
              parts.push(`【推理依据】${parsed.reasoning}`);
            }
            descText = parts.join("\n");
          } else {
            descText = selectedWarning.description;
          }
        } catch (e) {
          descText = selectedWarning.description;
        }
      }
      warningDescription.value = descText;
      isWarningDialogOpen.value = true;
      break;
    default:
      console.log(`Unknown entity type for ${entityId}`);
  }
};
const bindScreenSpaceEvent = (viewer: Cesium.Viewer) => {
  viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
    Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK,
  );
  viewer.screenSpaceEventHandler.setInputAction(async function (
    event: Cesium.ScreenSpaceEventHandler.PositionedEvent,
  ) {
    const picked = viewer.scene.pick(event.position);
    if (!Cesium.defined(picked)) {
      return;
    }

    const pickedId = picked.id;
    if (!pickedId) return;
    const entityId = String(pickedId._id);
    openDialog(entityId);
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
};
const initViewer = async () => {
  if (!containerRef.value || !creditRef.value) return;

  Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_TOKEN;
  viewer = new Cesium.Viewer(containerRef.value, {
    animation: false,
    timeline: false,
    navigationHelpButton: false,
    infoBox: false,
    selectionIndicator: false,
    fullscreenButton: false,
    geocoder: false,
    sceneModePicker: false,
    homeButton: false,
    creditContainer: creditRef.value,
    baseLayer: false,
    baseLayerPicker: false,
  });

  viewer.scene.morphTo2D(0);
  viewer.scene.globe.depthTestAgainstTerrain = true;

  viewer.imageryLayers.addImageryProvider(
    new Cesium.UrlTemplateImageryProvider({
      url: `${import.meta.env.VITE_DARKMAP_MATERIAL_URL}/{z}/{x}/{y}.png`, // 瓦片 URL 模板
      credit: "credit", // 版权信息
    }),
  );
  loadGeoJsonAreas(viewer);

  // 1. 完善查询 Agent 获取任务异常排名数据的函数 (暂未启用)
  const fetchWarningData = async () => {
    try {
      const res = await getTaskAnomalyRanks(1); //
      console.log("获取到原始异常排名数据:", res);

      if (res && res.length > 0) {
        const datesRange = [
          "2026-02-21",
          "2026-02-22",
          "2026-02-23",
          "2026-02-24",
          "2026-02-25",
          "2026-02-26",
          "2026-02-27",
          "2026-02-28",
        ];
        const getRandomDate = () =>
          datesRange[Math.floor(Math.random() * datesRange.length)];
        const formatDateToYYYYMMDD = (dateStr: string): string => {
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

        // 将 AnomalyRank[] 转换为地图所需的 CesiumMarker[] 结构
        const warningMarkers = res.map((item): WarningMarker => {
          // 📍 生成中东核心海域（覆盖波斯湾、霍尔木兹海峡及周边）的随机安全经纬度
          const lng = Math.random() * (58.0 - 48.0) + 48.0; // 经度范围 48°E ~ 58°E
          const lat = Math.random() * (34.0 - 24.0) + 24.0; // 纬度范围 24°N ~ 34°N

          // 规范化日期格式
          const normalizedDate =
            formatDateToYYYYMMDD(item.date) || getRandomDate();

          return {
            id: `LLM_${String(item.id)}`,
            name: ` ${item.itemTitle}`,
            description: `${item.detail}`,
            itemId: item.itemId,
            lng,
            lat,
            alt: 0,
            type: "warning1",
            isAnalyzed: false,
            date: normalizedDate,
            score: item.score,
            confidence: Math.round((item.weight || 0.8) * 100),
          };
        });

        // 按照 name 去重
        const seenNames = new Set<string>();
        const uniqueWarningMarkers = warningMarkers.filter((marker) => {
          const trimmedName = (marker.name || "").trim();
          if (seenNames.has(trimmedName)) {
            return false;
          }
          seenNames.add(trimmedName);
          return true;
        });

        // 将生成的动态动态警告点，源源不断地注入 Pinia 全局状态库中
        homeStore.setWarningMarkers(uniqueWarningMarkers);
        console.log("异常警告标记点已成功注入集群状态机。");
      }
    } catch (error) {
      console.error("获取警告数据失败:", error);
    }
  };

  // 2. ⚠️ 关键调整：必须先 await 执行获取数据，再进行批量 addMarkers 渲染
  await fetchWarningData();

  // 始终预加载 marker，便于后续动态控制显隐
  addMarkers(homeStore.cesiumMarkers, viewer);
  addMarkers(homeStore.warningMarkers, viewer);

  // 初始化地图实体可见性状态（过滤不合规的日期或类型的点位）
  updateMarkerVisibility();

  bindScreenSpaceEvent(viewer);

  // 开发环境下启用坐标拾取工具，方便调试和开发
  if (import.meta.env.DEV) {
    const destroyPicker = createCoordinatePickingTool(viewer);
    onUnmounted(() => {
      destroyPicker(); // 组件卸载时清理
    });
  }

  // 设置初始视角，确保用户进入时能看到整个地图区域
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(
      46.401473,
      31.181497,
      4004051.29,
    ),
  });
};

// ==================== 时间轴相关逻辑 ====================
const dates = [
  "2026-02-21",
  "2026-02-22",
  "2026-02-23",
  "2026-02-24",
  "2026-02-25",
  "2026-02-26",
  "2026-02-27",
  "2026-02-28",
];

const selectedDate = ref(homeStore.selectedDate);
const isPlaying = ref(false);
let playIntervalId: any = null;

const selectedDateIndex = computed(() => dates.indexOf(selectedDate.value));

const selectDate = (date: string) => {
  selectedDate.value = date;
  homeStore.setSelectedDate(date);
};

const formatDateLabel = (dateStr: string) => {
  return dateStr.substring(5);
};

const togglePlay = () => {
  if (isPlaying.value) {
    stopPlay();
  } else {
    startPlay();
  }
};

const startPlay = () => {
  isPlaying.value = true;
  playIntervalId = setInterval(() => {
    let nextIndex = selectedDateIndex.value + 1;
    if (nextIndex >= dates.length) {
      nextIndex = 0;
    }
    selectDate(dates[nextIndex]);
  }, 2000);
};

const stopPlay = () => {
  isPlaying.value = false;
  if (playIntervalId) {
    clearInterval(playIntervalId);
    playIntervalId = null;
  }
};

onUnmounted(() => {
  stopPlay();
  if (viewer) {
    if (heatMapPrimitive) {
      viewer.scene.groundPrimitives.remove(heatMapPrimitive);
      heatMapPrimitive = null;
    }
    if (hexPrimitive) {
      viewer.scene.primitives.remove(hexPrimitive);
      hexPrimitive = null;
    }
    if (hexOutlinePrimitive) {
      viewer.scene.groundPrimitives.remove(hexOutlinePrimitive);
      hexOutlinePrimitive = null;
    }
  }
});

// 监听状态库中日期的改变以保持同步
watch(
  () => homeStore.selectedDate,
  (newVal) => {
    if (newVal !== selectedDate.value) {
      selectedDate.value = newVal;
    }
  },
);

// 统一根据最新 getFilteredMarkers 状态更新地图上实体的隐藏和显示
const updateMarkerVisibility = () => {
  if (!viewer) return;
  // 1. 隐藏所有 entity
  viewer.entities.values.forEach((entity) => {
    entity.show = false;
  });

  // 2. 显示满足过滤条件的 entity
  getFilteredMarkers.value.forEach((marker) => {
    const entityId = `${marker.type}-${marker.id}`;
    const entity = viewer?.entities.getById(entityId);
    if (entity) {
      entity.show = true;
    } else {
      console.warn(`未找到实体: ${entityId}`);
    }
  });
};

// 监听根据 Checkbox / 时间轴筛选出的最新 marker 列表并实时刷新地图显示以及更新热力图图层
watch(getFilteredMarkers, () => {
  updateMarkerVisibility();
  updateHeatmapFromMarkers();
  updateHexagonalGridFromMarkers();
});
onMounted(() => {
  if (!viewer) {
    initViewer();
  }
  // 获取所有的agent 并存储起来
  agentStore.fetchAgentsData();
});
</script>
<style scoped>
/* 针对该弹窗的外部边框和圆角进行控制 */
:deep(.custom-black-dialog) {
  border: 1px solid #000000;
  /* 纯黑边框，或者使用 Tailwind 的 #1e293b 等深色线 */
  background-color: #111625;
  /* 保持与你主面板一致的深色底，如果是纯黑可改为 #000000 */
  border-radius: 8px;
  /* 圆角 */
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
  /* 调暗阴影 */
}

/* 如果需要，也可以一并调整弹窗头部的文字颜色 */
:deep(.custom-black-dialog .el-dialog__title) {
  color: #e2e8f0;
}

/* 如果需要调整弹窗自带的关闭按钮颜色 */
:deep(.custom-black-dialog .el-dialog__headerbtn .el-dialog__close) {
  color: #94a3b8;
}

:deep(.custom-black-dialog .el-dialog__headerbtn:hover .el-dialog__close) {
  color: #ffffff;
}
</style>
