import { createApp } from "vue";
import ElementPlus from "element-plus";
import { createPinia } from "pinia";
import { PiniaSharedState } from "pinia-shared-state";
import "./style.css";
import "element-plus/dist/index.css";
import App from "./App.vue";
import router from "./router";

// 引入 cesium 样式
import "cesium/Build/Cesium/Widgets/widgets.css";

// 声明全局 window 上的 CESIUM_BASE_URL，避免 TS 报错
declare global {
  interface Window {
    CESIUM_BASE_URL?: string;
  }
}
window.CESIUM_BASE_URL = "/cesium/";
const app = createApp(App);
const pinia = createPinia();
pinia.use(
  PiniaSharedState({
    enable: true,
    initialize: true,
    type: "native",
    serializer: {
      serialize: JSON.stringify,
      deserialize: JSON.parse,
    },
  }),
);
app.use(router);
app.use(ElementPlus, { size: "small" });
app.use(pinia);
app.mount("#app");
