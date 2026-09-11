declare module "*.geojson" {
  const value: any;
  export default value;
}

declare module "@/assets/facilities.js" {
  export const FACILITIES: any[];
  export const FACILITY_TYPES: Array<{
    id: string | number;
    label?: string;
    color?: string;
    svgIcon?: string;
  }>;
  export const FACILITY_TYPE_LABELS_ZH: Record<string, string>;
  export const FACILITY_THREAT_LEVELS_ZH: Record<string, string>;
}

declare module "*.js" {
  const value: any;
  export default value;
}
