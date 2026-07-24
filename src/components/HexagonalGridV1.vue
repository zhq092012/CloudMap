<template>
  <div class="container" ref="containerRef">
    <div class="credit" ref="creditRef" />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import * as Cesium from "cesium";
import * as turf from "@turf/turf";
import geoJsonIranRaw from "@/assets/geojson/Iran.geojson?raw";
import geoJsonIsraelRaw from "@/assets/geojson/Israel.geojson?raw";

// 定义区域数据的接口类型
interface AreaConfig {
  geojson: GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon>;
  type: "red" | "blue";
  cores: Array<[number, number]>; // 核心点坐标数组 [[lng, lat], [lng, lat], ...]
}

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
let linkPrimitive: Cesium.GroundPolylinePrimitive | null = null;

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

  const imageryProvider = new Cesium.UrlTemplateImageryProvider({
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    subdomains: ["a", "b", "c", "d"],
  });
  viewer.imageryLayers.addImageryProvider(imageryProvider);
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(48.5, 29.5, 4000000),
  });
};

// 1. 核心逻辑：加载多个区域的热力区域
const loadMultipleHeatAreas = (geoJsonAreas: AreaConfig[]) => {
  if (!viewer) return;
  const instances: Cesium.GeometryInstance[] = [];
  const outlineinsts: Cesium.GeometryInstance[] = [];

  geoJsonAreas.forEach((area) => {
    // 将 cores 传给单区域加载函数
    const [geometryInstances, outlineInstances] = loadHeatArea(
      area.geojson,
      area.type,
      area.cores,
    );
    instances.push(...geometryInstances);
    outlineinsts.push(...outlineInstances);
  });

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

  if (outlineinsts.length > 0) {
    linkPrimitive = new Cesium.GroundPolylinePrimitive({
      geometryInstances: outlineinsts,
      appearance: new Cesium.PolylineColorAppearance(),
    });
    viewer.scene.groundPrimitives.add(linkPrimitive);
  }
};

// 2. 针对单个区域生成热力区域（加入了 cores 核心点参数）
const loadHeatArea = (
  geojson: GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon>,
  type: "red" | "blue",
  cores: Array<[number, number]>,
): [Cesium.GeometryInstance[], Cesium.GeometryInstance[]] => {
  const bbox = turf.bbox(geojson);
  const cellSide = 40; // 六边形边长（公里）
  const maxRadius = 500; // 核心区域的最大影响半径（公里），可根据地图缩放大小调整

  const geometryInstances: Cesium.GeometryInstance[] = [];
  const outlineInstances: Cesium.GeometryInstance[] = [];

  const hexGridCollection = turf.hexGrid(bbox, cellSide, {
    units: "kilometers",
  });

  // 将传入的经纬度数组转换为 Turf 的 Point 节点列表，方便后续算距离
  const corePoints = cores.map((coord) => turf.point(coord));

  hexGridCollection.features.forEach((feature, index) => {
    if (!feature.geometry) return;

    const hexCenter = turf.centerOfMass(feature);
    const isInsideArea = geojson.features.some((areaFeature) =>
      turf.booleanPointInPolygon(hexCenter, areaFeature),
    );
    if (!isInsideArea) return;

    // --- 🌍 关键修改：基于核心点计算权重 ---
    let maxWeight = 0;

    if (corePoints.length > 0) {
      // 计算当前六边形中心到所有核心点的最短距离
      const distances = corePoints.map((core) =>
        turf.distance(hexCenter, core, { units: "kilometers" }),
      );
      const minDistance = Math.min(...distances);

      // 距离越近，权重越大（范围 0 ~ 1）
      maxWeight = Math.max(0, 1 - minDistance / maxRadius);

      // 可选：加个指数让衰减更平滑（例如平方，靠近核心更亮，外围衰减更快）
      maxWeight = Math.pow(maxWeight, 1.5);
    } else {
      maxWeight = 0.5; // 如果没传核心点，给个默认中间亮度
    }
    // ------------------------------------

    const coordinates = feature.geometry.coordinates[0];
    const degreesArray = coordinates.flatMap((coord) => [coord[0], coord[1]]);

    const isRedZone = type === "red";
    const baseColor = isRedZone
      ? Cesium.Color.fromCssColorString("#62231E")
      : Cesium.Color.fromCssColorString("#182747");

    // 核心区域最大透明度 0.65，边缘最低透明度 0.1
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
        // 边框也跟随权重变化，核心区边框更明显
        color: Cesium.ColorGeometryInstanceAttribute.fromColor(
          baseColor.withAlpha(0.35 + maxWeight * 0.35),
        ),
      },
    });
    outlineInstances.push(lineInstance);
  });
  return [geometryInstances, outlineInstances];
};

onMounted(() => {
  initViewer();

  // 在这里配置对应国家的核心城市/区域坐标 [经度, 纬度]
  loadMultipleHeatAreas([
    {
      geojson: geoJsonIsrael,
      type: "blue",
      cores: [
        [34.7818, 32.0853], // 特拉维夫
        [35.2137, 31.7683], // 耶路撒冷
      ],
    },
    {
      geojson: geoJsonIran,
      type: "red",
      cores: [
        [51.389, 35.6892], // 德黑兰
        [51.666, 32.6546], // 伊斯法罕
        [59.5694, 36.2972], // 马什哈德
      ],
    },
  ]);
});

onBeforeUnmount(() => {
  if (viewer && hexPrimitive) viewer.scene.primitives.remove(hexPrimitive);
  if (viewer && linkPrimitive)
    viewer.scene.groundPrimitives.remove(linkPrimitive);
  if (viewer) viewer.destroy();
});
</script>

<style scoped lang="scss">
.container {
  width: 100%;
  height: 100%;
  position: relative;
  .credit {
    display: none;
  }
}
</style>
