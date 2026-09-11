import { defineStore } from "pinia";
import { ref } from "vue";

/**
 * 全局加载状态 store。
 * mapLoading=true 时，App.vue 中渲染的全屏遮罩（MapLoading）会显示，
 * 用于「地图完全加载 + 数据就绪之前」的全局等待态。
 */
export const useLoadingStore = defineStore("loading", () => {
  /** 地图/数据是否仍在加载中 */
  const mapLoading = ref(false);

  const startMapLoading = () => {
    mapLoading.value = true;
  };

  const finishMapLoading = () => {
    mapLoading.value = false;
  };

  return { mapLoading, startMapLoading, finishMapLoading };
});
