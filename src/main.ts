import { createApp } from "vue";
import * as Cesium from "cesium";
import ElementPlus from "element-plus";
import { createPinia } from "pinia";
import { PiniaSharedState } from "pinia-shared-state";
import "element-plus/dist/index.css";
import "./style.css";
import "./styles/deep-analysis.css";
import App from "./App.vue";
import router from "./router";

// 引入 cesium 样式
//import "cesium/Build/Cesium/Widgets/widgets.css";

// 声明全局 window 上的 CESIUM_BASE_URL，避免 TS 报错
declare global {
  interface Window {
    CESIUM_BASE_URL?: string;
  }
}
window.CESIUM_BASE_URL = "/cesium/";

Cesium.Ion.defaultAccessToken = '';

async function bootstrap() {
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
  app.use(pinia);
  app.use(router);
  app.use(ElementPlus, { size: "small" });

  app.mount("#app");
}

bootstrap();
