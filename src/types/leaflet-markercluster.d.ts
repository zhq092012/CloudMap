// leaflet.markercluster 没有自带类型声明，这里对 leaflet 模块做最小增强，
// 仅补全本项目用到的 API（创建聚合组、聚合图标工厂、获取子标记）。
import "leaflet";

declare module "leaflet" {
  namespace L {
    interface MarkerClusterGroupOptions {
      showCoverageOnHover?: boolean;
      zoomToBoundsOnClick?: boolean;
      spiderfyOnMaxZoom?: boolean;
      maxClusterRadius?: number;
      iconCreateFunction?: (cluster: any) => L.DivIcon;
    }

    function markerClusterGroup(options?: MarkerClusterGroupOptions): any;

    interface MarkerCluster {
      getChildCount(): number;
      getAllChildMarkers(): any[];
    }
  }
}
