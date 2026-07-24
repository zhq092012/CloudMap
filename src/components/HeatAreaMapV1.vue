<template>
  <div class="container" ref="containerRef">
    <div class="credit" ref="creditRef" />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import * as Cesium from "cesium";
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
  const geojsonAreainstances: Cesium.GeometryInstance[] = [];
  geoJsonAreas.forEach((area) => {
    // 加载geoJson区域图层
    const geometryInstances = loadGeoJsonArea(area.geojson, area.type);
    geojsonAreainstances.push(...geometryInstances);
    //加载热区核心点图层
    const coreInstances = loadCorePoints(area.cores, area.type);
    coreInstances.forEach((primitive) => {
      viewer?.scene.groundPrimitives.add(primitive);
    });
  });

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
const loadCorePoints = (
  cores: Array<[number, number]>,
  type: "red" | "blue",
): Array<Cesium.GroundPrimitive> => {
  const groundPrimitives: Cesium.GroundPrimitive[] = [];
  if (cores.length === 0) return [];
  const isRedZone = type === "red";
  const baseColor = isRedZone
    ? Cesium.Color.fromCssColorString("#FF786F")
    : Cesium.Color.fromCssColorString("#3C7CFF");

  const heatLayers = [
    { radius: 160000.0, alpha: 0.92, falloff: 3.2 },
    { radius: 340000.0, alpha: 0.42, falloff: 2.0 },
    { radius: 620000.0, alpha: 0.16, falloff: 1.1 },
  ];

  cores.forEach((core, index) => {
    heatLayers.forEach((layer, layerIndex) => {
      const layerColor = baseColor.withAlpha(layer.alpha);
      const heatMaterial = new Cesium.Material({
        fabric: {
          type: "HeatBlob",
          uniforms: {
            color: layerColor,
            falloff: layer.falloff,
          },
          source: `
            czm_material czm_getMaterial(czm_materialInput materialInput) {
              czm_material material = czm_getDefaultMaterial(materialInput);
              float d = distance(materialInput.st, vec2(0.5));
              float alpha = 1.0 - smoothstep(0.0, 0.5, d);
              alpha = pow(clamp(alpha, 0.0, 1.0), falloff);
              material.diffuse = color.rgb;
              material.alpha = color.a * alpha;
              return material;
            }
          `,
        },
      });

      const ellipseGeometry = new Cesium.EllipseGeometry({
        center: Cesium.Cartesian3.fromDegrees(core[0], core[1]),
        semiMajorAxis: layer.radius,
        semiMinorAxis: layer.radius,
        vertexFormat:
          Cesium.MaterialAppearance.MaterialSupport.TEXTURED.vertexFormat,
      });

      const heatPrimitive = new Cesium.GroundPrimitive({
        geometryInstances: new Cesium.GeometryInstance({
          geometry: ellipseGeometry,
          id: `${index}_${layerIndex}`,
        }),
        appearance: new Cesium.MaterialAppearance({
          material: heatMaterial,
          flat: true,
          translucent: true,
        }),
      });
      groundPrimitives.push(heatPrimitive);
    });
  });

  return groundPrimitives;
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
    ? Cesium.Color.fromCssColorString("#5F4848").withAlpha(0.5)
    : Cesium.Color.fromCssColorString("#444F6A").withAlpha(0.5);

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
