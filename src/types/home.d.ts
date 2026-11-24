export interface CesiumMarker {
  id: string; // 实体ID
  type: MarkerType; //实体类型
  name?: string; // 实体名称
  description?: string; // 实体描述
  lng: number; //经度
  lat: number; //纬度
  alt: number; //高度
  count?: number; // 聚合数量
  date: string; //日期
  itemId?: number;
}
export type MarkerType =
  | "redairport"
  | "redport"
  | "rednuclear"
  | "redhq"
  | "redairbase"
  | "blueairport"
  | "blueport"
  | "bluehq"
  | "blueairbase"
  | "warning1"
  | "warning2"
  | "warning3"
  | "rednavalbase"
  | "redarmybase"
  | "redairdefense"
  | "count";
export interface WarningMarker extends CesiumMarker {
  type: "warning1" | "warning2" | "warning3";
  itemId: number;
  isAnalyzed: boolean;
  score?: number;
  confidence?: number;
  threatLevel?: string | number;
  /** 异常事件状态：POTENTIAL 待研判 / CONFIRMED 已确认 / ANALYSIS 分析中（后端可能为空，前端按待研判处理） */
  status?: string;
  /** 异常事件创建时间（原始字符串，左上「异常征候」按是否满 24 小时划分历史） */
  createdAt?: string;
  /** 异常类型：article / aircraft / vessel / satellite（左栏「异常」分组展示用） */
  assetType?: string;
}
/** 地图视图工具栏可调用的 Leaflet 能力（由 Map.vue 注册） */
export interface MapViewportApi {
  /** 放大一级 */
  zoomIn: () => void;
  /** 缩小一级 */
  zoomOut: () => void;
  /** 全览默认范围 */
  fitOverview: () => void;
  /**
   * 道路/地名标注叠图显隐。
   * @param visible - 是否显示
   */
  setRoadLabelsVisible: (visible: boolean) => void;
}

export interface WarningItem {
  id: string;
  itemId: number;
  title: string;
  count: number;
  level: string;
  threat: string;
  threatConf: string;
  anomaly: string;
  anomalyConf: string;
  type: string;
  assetType?: string;
  region: string;
  discoverTime: string;
  duration: string;
  isAnalyzed: boolean;
}
