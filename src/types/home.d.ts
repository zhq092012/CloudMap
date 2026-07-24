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
  region: string;
  discoverTime: string;
  duration: string;
  isAnalyzed: boolean;
}
