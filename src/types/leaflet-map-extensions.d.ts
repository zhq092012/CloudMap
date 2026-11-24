/**
 * Leaflet 地图业务扩展：Marker 挂载字段与 markercluster 插件事件。
 */
import type { ArticleListItem } from "@/api/data-api";
import type { AircraftData } from "@/composables/useAircraft";

import "leaflet";

declare module "leaflet" {
  interface Marker {
    /** 情报 / 异常文章聚合单点绑定的文章 */
    article?: ArticleListItem;
    /** 飞机聚合单点绑定的航空数据 */
    acData?: AircraftData;
    /** 设施点位类型 id（与 FACILITY_TYPES 对齐） */
    facilityType?: string;
  }

  /** markercluster 插件：点击聚合簇 */
  interface MarkerClusterClickEvent extends LeafletMouseEvent {
    /** 被点击的聚合簇图层 */
    layer: MarkerCluster;
  }

  interface LeafletEventHandlerFnMap {
    clusterclick?: LeafletEventHandlerFn;
  }
}