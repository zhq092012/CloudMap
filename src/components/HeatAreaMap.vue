<template>
  <div class="container" ref="containerRef">
    <div class="credit" ref="creditRef" />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import * as Cesium from "cesium";
import heatmapImage from "@/assets/images/heatareamap.png";
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

  viewer.imageryLayers.addImageryProvider(
    new Cesium.UrlTemplateImageryProvider({
      url: `${import.meta.env.VITE_DARKMAP_MATERIAL_URL}/{z}/{x}/{y}.png`, // 瓦片 URL 模板
      credit: "credit", // 版权信息
    }),
  );
  viewer.entities.add({
    rectangle: {
      coordinates: Cesium.Rectangle.fromDegrees(31.0, 20.0, 63.0, 37.0),
      material: new Cesium.ImageMaterialProperty({
        image: heatmapImage, // 直接把图片路径传给材质
        transparent: true, // 开启半透明支持
      }),
    },
  });
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(48.5, 29.5, 4000000),
  });
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
