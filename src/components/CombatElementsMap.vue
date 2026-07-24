<template>
  <div class="h-full w-full relative" ref="containerRef">
    <div class="hidden" ref="creditRef" />
    <ElDialog title="" v-model="warningStore.showWarningDialog" width="1000px" :center="true" destroy-on-close
      class="custom-black-dialog">
      <AnalysisDetailDialog />
    </ElDialog>
    <ElDialog v-model="isWarningDialogOpen" title="⚠️ 警告信息" width="1000px" :center="true" destroy-on-close
      class="custom-black-dialog">
      <WarningDialog />
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import * as Cesium from "cesium";
// import heatmapImage from "@/assets/images/heatareamap.png";
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
import { useWarningStore } from "@/store/modules/warnStore";

import geoJsonIranRaw from "@/assets/geojson/Iran1.geojson?raw";
import geoJsonIsraelRaw from "@/assets/geojson/Israel1.geojson?raw";
import { useHomeStore } from "@/store/modules/homeStore";
import type { CesiumMarker, MarkerType } from "@/types/home";
const isWarningDialogOpen = ref(false);
const warningStore = useWarningStore();
const homeStore = useHomeStore();
const containerRef = ref<HTMLElement | null>(null);
const creditRef = ref<HTMLElement | null>(null);
let viewer: Cesium.Viewer | null = null;
let hexPrimitive: Cesium.GroundPrimitive | null = null;
let linkPrimitive: Cesium.GroundPolylinePrimitive | null = null;

const geoJsonIran = JSON.parse(geoJsonIranRaw) as GeoJSON.FeatureCollection<
  GeoJSON.Polygon | GeoJSON.MultiPolygon
>;
const geoJsonIsrael = JSON.parse(geoJsonIsraelRaw) as GeoJSON.FeatureCollection<
  GeoJSON.Polygon | GeoJSON.MultiPolygon
>;

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
// 声明符合 Cesium 渲染要求的规范化点位实体接口


const addMarkers = (markers: CesiumMarker[], viewer: Cesium.Viewer) => {
  // 遍历经纬度数组
  markers.forEach((marker) => {


    const position = Cesium.Cartesian3.fromDegrees(
      marker.lng,
      marker.lat,
      marker.alt,
    );

    // 2. 根据你的映射关系动态获取导入的图标资源
    const iconImage =
      markerTypeToIcon[marker.type as Exclude<MarkerType, "count">];

    viewer.entities.add({
      id: `${marker.type}-${marker.id}`,
      name: marker.name,
      position,
      billboard: {
        image: iconImage, // 完美承接你的内部导入对象（如：redairport, baseCluster1等）
        width: marker.type.startsWith("warning") ? 50 : 20, // 警告点做稍微醒目处理
        height: marker.type.startsWith("warning") ? 50 : 20,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });
  });
};
const openDialog = (entityId: string) => {
  // 这里你可以根据 entityId 来决定打开哪个对话框，或者显示什么内容
  // 例如：
  if (!entityId) return;
  const type = entityId.split("-")[0] as MarkerType; // 通过 ID 前缀判断类型（如：redairport-1 -> redairport）
  const id = entityId.split("-")[1]; // 获取 ID 后缀 -之后的部分
  homeStore.SetSelectedEntity({ id, type }); // 将选中的实体信息存储到 Vuex 中，供对话框组件使用
  if (!type) return;
  switch (type) {
    case "warning1":
    case "warning2":
    case "warning3":
      // 打开警告信息对话框
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

  // 加载以色列和伊朗的边界线
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

  // 加载中东区域热区图贴图
  // viewer.entities.add({
  //   rectangle: {
  //     coordinates: Cesium.Rectangle.fromDegrees(31.0, 20.0, 63.0, 37.0),
  //     material: new Cesium.ImageMaterialProperty({
  //       image: heatmapImage, // 直接把图片路径传给材质
  //       transparent: true, // 开启半透明支持
  //     }),
  //   },
  // });

  // 绑定点击事件
  bindScreenSpaceEvent(viewer);

  addMarkers(homeStore.warningMarkers, viewer);

  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(
      46.401473,
      31.181497,
      4004051.29,
    ),
  });
};
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
onMounted(() => {
  initViewer();
});

onBeforeUnmount(() => {
  if (viewer && hexPrimitive) viewer.scene.primitives.remove(hexPrimitive);
  if (viewer && linkPrimitive)
    viewer.scene.groundPrimitives.remove(linkPrimitive);
  if (viewer) viewer.destroy();
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
