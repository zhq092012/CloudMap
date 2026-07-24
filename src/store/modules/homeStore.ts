import type { CesiumMarker, MarkerType, WarningItem, WarningMarker } from "@/types/home";
import {
  convertToG6Data,
  type G6Edge,
  type G6Node,
} from "@/utils/3d/graph/g6.helper";
import { defineStore } from "pinia";
// 默认激活的 Tab 标签，可以是 '要素'、'情报' 或 '图谱'
export type TabType = "作战要素" | "开源情报" | "战场图谱";

// 声明符合 Cesium 渲染要求的规范化点位实体接口

// 定义 Home 模块的状态接口
interface HomeState {
  cesiumMarkers: CesiumMarker[]; // 添加 cesiumMarkers 状态
  warningMarkers: WarningMarker[]; // 添加 warningMarkers 状态
  activeTab: TabType;
  graphData: {
    nodes: G6Node[]; // 根据实际情况定义节点数据类型
    edges: G6Edge[]; // 根据实际情况定义边数据类型
  } | null; // 用于存储生成的图谱数据
  selectedEntity: CesiumMarker | null; // 新增 selectedEntity 状态，用于存储选中的实体信息
  entityVisibility: {
    military: boolean;
    count: boolean;
    warning: boolean;
  };
  analysisList: WarningItem[]; // 用于存储已分析的异常事件簇列表
  isDeduceModalOpen: boolean;//是否打开智能分析弹窗
  selectedDate: string; // 新增当前选中的日期时间轴属性
}

export const useHomeStore = defineStore("home", {
  state: (): HomeState => ({
    cesiumMarkers: [
      // ==================== 蓝色阵营 / 沿海与驻军基地 (WGS84) ====================
      {
        id: "b_1",
        type: "blueairport",
        name: "Adana (土耳其阿达纳空军基地)",
        lng: 48.3213,
        lat: 37.0016,
        alt: 0,
        date: "2026-02-28",
      },
      {
        id: "b_2",
        type: "blueport",
        name: "Cyprus Coast (塞浦路斯东部港口海域)",
        lng: 50.5,
        lat: 35.0,
        alt: 0,
        date: "2026-02-27",
      },
      {
        id: "b_3",
        type: "blueairbase",
        name: "Mosul (伊拉克摩苏尔前线机场)",
        lng: 48.1472,
        lat: 36.3172,
        alt: 0,
        date: "2026-02-24",
      },
      {
        id: "b_4",
        type: "blueairbase",
        name: "Erbil (伊拉克埃尔比勒联军基地)",
        lng: 49.9592,
        lat: 36.1911,
        alt: 0,
        date: "2026-02-25",
      },
      {
        id: "b_5",
        type: "blueairbase",
        name: "North Iraq (伊拉克北部空军据点)",
        lng: 48.5,
        lat: 34.5,
        alt: 0,
        date: "2026-02-23",
      },
      {
        id: "b_6",
        type: "blueairport",
        name: "Baghdad North (巴格达北部枢纽)",
        lng: 48.3614,
        lat: 33.5,
        alt: 0,
        date: "2026-02-24",
      },
      {
        id: "b_7",
        type: "blueairbase",
        name: "Baghdad South (巴格达南部核心基地)",
        lng: 48.2,
        lat: 33.1,
        alt: 0,
        date: "2026-02-25",
      },
      {
        id: "b_8",
        type: "blueairport",
        name: "Karbala (卡尔巴拉后勤点)",
        lng: 47.025,
        lat: 32.616,
        alt: 0,
        date: "2026-02-26",
      },
      {
        id: "b_9",
        type: "blueairbase",
        name: "Israel Coast North (以色列北部海防基地)",
        lng: 47.9,
        lat: 32.5,
        alt: 0,
        date: "2026-02-23",
      },
      {
        id: "b_10",
        type: "blueairbase",
        name: "Israel Coast South (以色列内盖夫前线基地)",
        lng: 47.7,
        lat: 31.8,
        alt: 0,
        date: "2026-02-23",
      },
      {
        id: "b_11",
        type: "bluehq",
        name: "Jordan Border (约旦边境战术指挥部)",
        lng: 48.5,
        lat: 31.5,
        alt: 0,
        date: "2026-02-24",
      },
      {
        id: "b_12",
        type: "bluehq",
        name: "Kuwait Top (科威特北部边境防区)",
        lng: 50.7,
        lat: 29.8,
        alt: 0,
        date: "2026-02-25",
      },
      {
        id: "b_13",
        type: "bluehq",
        name: "Kuwait Mid (科威特城联合指挥所)",
        lng: 50.9783,
        lat: 29.3759,
        alt: 0,
        date: "2026-02-26",
      },
      {
        id: "b_14",
        type: "blueairbase",
        name: "Kuwait Bottom (科威特阿里·萨利赫空军基地)",
        lng: 50.1,
        lat: 28.8,
        alt: 0,
        date: "2026-02-27",
      },
      {
        id: "b_15",
        type: "bluehq",
        name: "Saudi Inland (沙特内陆防空预警中心)",
        lng: 48.7,
        lat: 24.7,
        alt: 0,
        date: "2026-02-24",
      },
      {
        id: "b_16",
        type: "blueairbase",
        name: "Bahrain Coast (巴林麦纳麦空军基地)",
        lng: 52.6,
        lat: 26.2,
        alt: 0,
        date: "2026-02-28",
      },
      {
        id: "b_17",
        type: "blueport",
        name: "Bahrain Port (美国第五舰队驻巴林总部)",
        lng: 52.7,
        lat: 26.0,
        alt: 0,
        date: "2026-02-25",
      },
      {
        id: "b_18",
        type: "blueairport",
        name: "Qatar East (卡塔尔乌代德战略空军基地)",
        lng: 53.3,
        lat: 25.1,
        alt: 0,
        date: "2026-02-28",
      },
      {
        id: "b_19",
        type: "blueport",
        name: "UAE Coast North (阿联酋杰贝阿里深水港)",
        lng: 58.3,
        lat: 25.2,
        alt: 0,
        date: "2026-02-28",
      },
      {
        id: "b_20",
        type: "blueairbase",
        name: "UAE Coast South (阿联酋达夫拉空军基地)",
        lng: 58.5,
        lat: 24.25,
        alt: 0,
        date: "2026-02-22",
      },
      {
        id: "b_21",
        type: "blueairport",
        name: "Oman Coast North (阿曼湾前哨机场)",
        lng: 58.4,
        lat: 23.6,
        alt: 0,
        date: "2026-02-26",
      },
      {
        id: "b_22",
        type: "blueport",
        name: "Oman Coast South (阿曼马斯喀特海军港口)",
        lng: 61.5,
        lat: 22.5,
        alt: 0,
        date: "2026-02-23",
      },
      {
        id: "b_23",
        type: "blueairbase",
        name: "卡塔尔乌代德空军基地",
        lat: 25.1173,
        lng: 51.315,
        alt: 0,
        date: "2026-02-28",
      },
      {
        id: "b_24",
        type: "blueport",
        name: "巴林贾法勒海军基地",
        lat: 26.2157,
        lng: 50.6014,
        alt: 0,
        date: "2026-02-27",
      },
      {
        id: "b_25",
        type: "bluehq",
        name: "科威特阿里夫坚军营",
        lat: 28.899,
        lng: 48.1505,
        alt: 0,
        date: "2026-02-26",
      },
      {
        id: "b_26",
        type: "blueairbase",
        name: "阿联酋宰夫拉空军基地",
        lat: 24.2482,
        lng: 54.5477,
        alt: 0,
        date: "2026-02-22",
      },
      {
        id: "b_27",
        type: "blueairbase",
        name: "沙特阿拉伯苏丹王子空军基地",
        lat: 24.0627,
        lng: 47.5805,
        alt: 0,
        date: "2026-02-22",
      },
      {
        id: "b_28",
        type: "blueairbase",
        name: "约旦穆沃费格·萨勒提空军基地",
        lat: 31.8256,
        lng: 36.782,
        alt: 0,
        date: "2026-02-23",
      },
      {
        id: "b_29",
        type: "blueairbase",
        name: "土耳其因吉尔利克空军基地",
        lat: 37.0021,
        lng: 35.4259,
        alt: 0,
        date: "2026-02-26",
      },
      {
        id: "b_30",
        type: "blueairbase",
        name: "以色列奥夫达空军基地",
        lat: 29.9403,
        lng: 34.9358,
        alt: 0,
        date: "2026-02-25",
      },
      {
        id: "b_31",
        type: "blueairbase",
        name: "科威特阿里萨利姆空军基地",
        lat: 29.3467,
        lng: 47.5208,
        alt: 0,
        date: "2026-02-28",
      },
      {
        id: "b_32",
        type: "blueport",
        name: "阿联酋富查伊拉海军基地",
        lat: 29.6986,
        lng: 47.4353,
        alt: 0,
        date: "2026-02-28",
      },
      {
        id: "b_33",
        type: "bluehq",
        name: "沙特阿拉伯埃斯坎村军事基地",
        lat: 25.1288,
        lng: 56.3265,
        alt: 0,
        date: "2026-02-21",
      },
      {
        id: "b_34",
        type: "blueairbase",
        name: "阿曼马西拉岛空军基地",
        lat: 24.567,
        lng: 46.85,
        alt: 0,
        date: "2026-02-26",
      },
      {
        id: "b_35",
        type: "bluehq",
        name: "约旦安曼特种作战训练中心",
        lat: 20.6754,
        lng: 58.8905,
        alt: 0,
        date: "2026-02-26",
      },
      {
        id: "b_36",
        type: "blueairbase",
        name: "伊拉克安巴尔省阿萨德空军基地",
        lat: 19.6733,
        lng: 57.7169,
        alt: 0,
        date: "2026-02-21",
      },
      {
        id: "b_37",
        type: "blueairbase",
        name: "伊拉克库尔德自治区埃尔比勒哈里尔空军基地",
        lat: 16.9988,
        lng: 54.1,
        alt: 0,
        date: "2026-02-25",
      },
      {
        id: "b_38",
        type: "bluehq",
        name: "叙利亚南部边境坦夫军事基地",
        lat: 32.0362,
        lng: 35.9776,
        alt: 0,
        date: "2026-02-26",
      },
      {
        id: "b_39",
        type: "bluehq",
        name: "叙利亚东北部库尔德控制区军事基地群",
        lat: 33.7856,
        lng: 42.4412,
        alt: 0,
        date: "2026-02-26",
      },
      {
        id: "b_40",
        type: "blueport",
        name: "阿曼杜库姆港",
        lat: 36.5269,
        lng: 44.3472,
        alt: 0,
        date: "2026-02-28",
      },
      {
        id: "b_41",
        type: "blueport",
        name: "阿曼萨拉莱港",
        lat: 33.5073,
        lng: 38.6213,
        alt: 0,
        date: "2026-02-25",
      },
      {
        id: "b_42",
        type: "bluehq",
        name: "科威特比林军营",
        lat: 36.5,
        lng: 40.75,
        alt: 0,
        date: "2026-02-24",
      },
      {
        id: "il_1",
        type: "blueairbase",
        name: "奥夫达空军基地",
        lat: 30.1097,
        lng: 35.2236,
        alt: 0,
        date: "2026-02-23",
      },
      {
        id: "il_2",
        type: "blueairbase",
        name: "拉蒙空军基地",
        lat: 31.2067,
        lng: 34.855,
        alt: 0,
        date: "2026-02-22",
      },
      {
        id: "il_3",
        type: "blueairbase",
        name: "内瓦提姆空军基地",
        lat: 31.2433,
        lng: 35.02,
        alt: 0,
        date: "2026-02-27",
      },
      {
        id: "il_4",
        type: "blueairbase",
        name: "泰勒诺夫空军基地",
        lat: 32.02,
        lng: 34.84,
        alt: 0,
        date: "2026-02-23",
      },
      {
        id: "il_5",
        type: "blueairbase",
        name: "拉马特戴维空军基地",
        lat: 32.83,
        lng: 35.17,
        alt: 0,
        date: "2026-02-26",
      },
      {
        id: "il_6",
        type: "blueport",
        name: "海法海军基地",
        lat: 32.82,
        lng: 35.01,
        alt: 0,
        date: "2026-02-22",
      },
      {
        id: "il_7",
        type: "blueport",
        name: "阿什杜德海军基地",
        lat: 31.82,
        lng: 34.65,
        alt: 0,
        date: "2026-02-22",
      },
      {
        id: "il_8",
        type: "blueport",
        name: "埃拉特海军基地",
        lat: 29.56,
        lng: 34.95,
        alt: 0,
        date: "2026-02-26",
      },
      {
        id: "il_9",
        type: "bluehq",
        name: "特泽菲姆陆军基地",
        lat: 31.25,
        lng: 34.67,
        alt: 0,
        date: "2026-02-26",
      },
      {
        id: "il_10",
        type: "bluehq",
        name: "戈兰尼陆军基地",
        lat: 33.17,
        lng: 35.83,
        alt: 0,
        date: "2026-02-24",
      },
      {
        id: "il_11",
        type: "bluehq",
        name: "利达陆军基地",
        lat: 32.01,
        lng: 34.89,
        alt: 0,
        date: "2026-02-23",
      },
      {
        id: "il_12",
        type: "bluehq",
        name: "阿卜杜拉二世国王特种作战训练中心（约旦）",
        lat: 31.96,
        lng: 36.04,
        alt: 0,
        date: "2026-02-24",
      },
      {
        id: "il_13",
        type: "bluehq",
        name: "米茨佩・拉蒙联合基地（以色列）",
        lat: 30.62,
        lng: 34.81,
        alt: 0,
        date: "2026-02-23",
      },
      {
        id: "il_14",
        type: "bluehq",
        name: "迪莫纳军事基地（以色列）",
        lat: 30.97,
        lng: 35.09,
        alt: 0,
        date: "2026-02-22",
      },

      // ==================== 红色阵营 / 核心集结区 (WGS84) ====================
      {
        id: "r_1",
        type: "redairbase",
        name: "Tabriz (伊朗大不里士战术空军基地)",
        lng: 56.2919,
        lat: 33.0962,
        alt: 0,
        date: "2026-02-24",
      },
      {
        id: "r_2",
        type: "redhq",
        name: "Tehran West (德黑兰西部防空总指挥部)",
        lng: 61.0,
        lat: 25.7,
        alt: 0,
        date: "2026-02-24",
      },
      {
        id: "r_3",
        type: "redhq",
        name: "Tehran Suburb (德黑兰机动雷达节点)",
        lng: 65.5,
        lat: 25.5,
        alt: 0,
        date: "2026-02-23",
      },
      {
        id: "r_4",
        type: "rednuclear",
        name: "Saveh (萨韦核工业配套防御阵地)",
        lng: 60.35,
        lat: 25.0,
        alt: 0,
        date: "2026-02-23",
      },
      {
        id: "r_5",
        type: "redhq",
        name: "Tehran East 1 (革命卫队战略导弹控制中心)",
        lng: 61.6,
        lat: 25.6,
        alt: 0,
        date: "2026-02-25",
      },
      {
        id: "r_6",
        type: "rednuclear",
        name: "Arak West (阿拉克重水反应堆保密区)",
        lng: 60.0,
        lat: 30.1,
        alt: 0,
        date: "2026-02-25",
      },
      {
        id: "r_7",
        type: "rednuclear",
        name: "Kashan North (纳坦兹地下铀浓缩核心设施)",
        lng: 61.9,
        lat: 30.7,
        alt: 0,
        date: "2026-02-21",
      },
      {
        id: "r_8",
        type: "redairbase",
        name: "Gorgan Border (戈尔甘边境集结场)",
        lng: 54.4,
        lat: 33.8,
        alt: 0,
        date: "2026-02-26",
      },
      {
        id: "r_9",
        type: "redhq",
        name: "Semnan (塞姆南国家航天战略发射场)",
        lng: 53.4,
        lat: 35.5,
        alt: 0,
        date: "2026-02-21",
      },
      {
        id: "r_10",
        type: "rednuclear",
        name: "Isfahan North (伊斯法罕核燃料组件中心)",
        lng: 56.7,
        lat: 30.8,
        alt: 0,
        date: "2026-02-25",
      },
      {
        id: "r_11",
        type: "redairbase",
        name: "Isfahan City (伊斯法罕第八战术空军基地)",
        lng: 59.85,
        lat: 30.6,
        alt: 0,
        date: "2026-02-23",
      },
      {
        id: "r_12",
        type: "redhq",
        name: "Yazd South (亚兹德地下深层导弹库)",
        lng: 61.4,
        lat: 30.5,
        alt: 0,
        date: "2026-02-26",
      },
      {
        id: "r_13",
        type: "rednuclear",
        name: "Bushehr (布什尔轻水核电站阵地)",
        lng: 58.8,
        lat: 30.9,
        alt: 0,
        date: "2026-02-22",
      },
      {
        id: "r_14",
        type: "redhq",
        name: "Kerman Border (克尔曼东南防区骨干)",
        lng: 57.0,
        lat: 30.3,
        alt: 0,
        date: "2026-02-21",
      },
      {
        id: "r_15",
        type: "redport",
        name: "Bandar Abbas (阿巴斯港海军第一战区总部)",
        lng: 65.28,
        lat: 28.18,
        alt: 0,
        date: "2026-02-27",
      },
      {
        id: "r_16",
        type: "redport",
        name: "Hormuz Port (霍尔木兹岛革命卫队前哨)",
        lng: 64.45,
        lat: 27.05,
        alt: 0,
        date: "2026-02-27",
      },
      {
        id: "r_17",
        type: "redhq",
        name: "Zahedan West (扎黑丹边防火箭炮阵地)",
        lng: 61.5,
        lat: 29.5,
        alt: 0,
        date: "2026-02-22",
      },
      {
        id: "r_18",
        type: "redport",
        name: "哈马丹空军基地",
        lng: 48.6722,
        lat: 35.1236,
        alt: 0,
        date: "2026-02-27",
      },
      {
        id: "r_19",
        type: "redport",
        name: "设拉子空军基地",
        lng: 52.5878,
        lat: 29.5364,
        alt: 0,
        date: "2026-02-23",
      },
      {
        id: "r_20",
        type: "redport",
        name: "阿巴斯港空军基地",
        lng: 56.37,
        lat: 27.22,
        alt: 0,
        date: "2026-02-26",
      },
      {
        id: "r_21",
        type: "redairbase",
        name: "梅赫拉巴德空军基地",
        lng: 51.3128,
        lat: 35.6886,
        alt: 0,
        date: "2026-02-24",
      },
      {
        id: "r_22",
        type: "redairbase",
        name: "大不里士空军基地",
        lng: 46.2392,
        lat: 38.1289,
        alt: 0,
        date: "2026-02-24",
      },
      {
        id: "r_23",
        type: "rednavalbase",
        name: "阿巴斯港海军基地",
        lng: 56.32,
        lat: 27.19,
        alt: 0,
        date: "2026-02-22",
      },
      {
        id: "r_24",
        type: "rednavalbase",
        name: "恰巴哈尔海军基地",
        lng: 60.62,
        lat: 25.29,
        alt: 0,
        date: "2026-02-27",
      },
      {
        id: "r_25",
        type: "rednavalbase",
        name: "恩泽利港海军基地",
        lng: 49.46,
        lat: 37.47,
        alt: 0,
        date: "2026-02-22",
      },
      {
        id: "r_26",
        type: "rednavalbase",
        name: "布什尔海军基地",
        lng: 50.84,
        lat: 28.92,
        alt: 0,
        date: "2026-02-26",
      },
      {
        id: "r_27",
        type: "redarmybase",
        name: "德黑兰革命卫队总部基地",
        lng: 51.42,
        lat: 35.71,
        alt: 0,
        date: "2026-02-22",
      },
      {
        id: "r_28",
        type: "redarmybase",
        name: "库姆革命卫队基地",
        lng: 50.87,
        lat: 34.64,
        alt: 0,
        date: "2026-02-26",
      },
      {
        id: "r_29",
        type: "redarmybase",
        name: "伊斯法罕陆军基地",
        lng: 51.67,
        lat: 32.64,
        alt: 0,
        date: "2026-02-22",
      },
      {
        id: "r_30",
        type: "redairdefense",
        name: "德黑兰防空反导基地",
        lng: 51.5,
        lat: 35.76,
        alt: 0,
        date: "2026-02-27",
      },
      {
        id: "r_31",
        type: "redairdefense",
        name: "布什尔防空反导基地",
        lng: 50.87,
        lat: 28.99,
        alt: 0,
        date: "2026-02-25",
      },
      {
        id: "r_32",
        type: "rednavalbase",
        name: "叙利亚塔尔图斯海军基地",
        lng: 35.86,
        lat: 34.89,
        alt: 0,
        date: "2026-02-23",
      },
      {
        id: "r_33",
        type: "redairbase",
        name: "叙利亚霍姆斯空军基地",
        lng: 37.62,
        lat: 34.52,
        alt: 0,
        date: "2026-02-28",
      },
      {
        id: "r_34",
        type: "redarmybase",
        name: "黎巴嫩贝卡谷地基地",
        lng: 35.87,
        lat: 33.81,
        alt: 0,
        date: "2026-02-23",
      },
      {
        id: "r_35",
        type: "redarmybase",
        name: "伊拉克巴格达革命卫队基地",
        lng: 44.42,
        lat: 33.31,
        alt: 0,
        date: "2026-02-23",
      },
      {
        id: "r_36",
        type: "rednavalbase",
        name: "也门荷台达港基地",
        lng: 42.96,
        lat: 14.79,
        alt: 0,
        date: "2026-02-21",
      },


      // ==================== 绿色聚合统计标签 (WGS84) ====================
      { id: "g_1", type: "count", count: 3, lng: 49.5, lat: 34.0, alt: 0, date: "2026-02-27" },
      { id: "g_2", type: "count", count: 3, lng: 52.5, lat: 33.5, alt: 0, date: "2026-02-23" },
      { id: "g_3", type: "count", count: 1, lng: 49.0, lat: 31.5, alt: 0, date: "2026-02-22" },
      { id: "g_4", type: "count", count: 3, lng: 48.5, lat: 28.0, alt: 0, date: "2026-02-23" },
      { id: "g_5", type: "count", count: 3, lng: 49.5, lat: 39.2, alt: 0, date: "2026-02-27" },
      { id: "g_11", type: "count", count: 20, lng: 50.5, lat: 36.5, alt: 0, date: "2026-02-27" },
      { id: "g_12", type: "count", count: 10, lng: 52.0, lat: 34.0, alt: 0, date: "2026-02-21" },
      { id: "g_16", type: "count", count: 26, lng: 55.5, lat: 32.8, alt: 0, date: "2026-02-24" },
      { id: "g_22", type: "count", count: 5, lng: 50.8, lat: 30.5, alt: 0, date: "2026-02-21" },
    ],
    warningMarkers: [], // 初始化 warningMarkers 为空数组
    selectedEntity: null, // 新增 selectedEntity 状态，用于存储选中的实体信息
    graphData: null, // 初始化 graphData 为 null，表示尚未生成图谱数据
    activeTab: "作战要素",
    entityVisibility: {
      military: true,
      count: true,
      warning: true,
    },
    analysisList: [],
    isDeduceModalOpen: false,
    selectedDate: "2026-02-21"
  }),

  // 定义 getters，用于从 state 中派生状态
  getters: {
    getGraphData: (state) => state.graphData,
    getFilteredMarkers: (state) => {
      const allMarkers = [...state.cesiumMarkers, ...state.warningMarkers];
      return allMarkers.filter((marker) => {
        const isWarning = marker.type.startsWith("warning");
        const isCount = marker.type === "count";
        const isMilitary = !isWarning && !isCount;

        if (isWarning && !state.entityVisibility.warning) return false;
        if (isCount && !state.entityVisibility.count) return false;
        if (isMilitary && !state.entityVisibility.military) return false;

        // 过滤日期：如果 marker 有 date，且与当前选中的日期不同，则过滤掉
        if (marker.date && marker.date !== state.selectedDate) return false;

        return true;
      });
    },
  },

  actions: {
    generateGraphDataUseMarkers() {
      // 合并基础标记点和警告标记点，确保图谱中包含所有节点并能正确渲染连接边
      const allMarkers = [...this.cesiumMarkers, ...this.warningMarkers];
      // 过滤掉 type 为 'count' 的聚合统计标签，因为它们不应在图谱中作为节点展示
      const filteredMarkers = allMarkers.filter(
        (marker) => marker.type !== "count",
      );
      const data = convertToG6Data(filteredMarkers);
      this.graphData = { nodes: data.nodes, edges: data.edges };
    },
    clearGraphData() {
      this.graphData = null; // 清除图谱数据
    },

    SetSelectedEntity(payload: { id: string; type: MarkerType }) {
      // 这里可以将选中的实体信息存储到状态中，供对话框组件使用
      // 例如：
      console.log("Selected Entity:", payload);
      // 可以在这里设置一个 selectedEntity 状态来存储选中的实体信息
      this.selectedEntity =
        this.cesiumMarkers.find((marker) => marker.id === payload.id) || null;
    },

    toggleEntityVisibility(
      type: keyof HomeState["entityVisibility"],
      visible: boolean,
    ) {
      this.entityVisibility[type] = visible;
    },
    // 设置警告标记的方法
    setWarningMarkers(markers: WarningMarker[]) {
      this.warningMarkers = markers;
    },
    setSelectedWarningMarker(payload: { id: string; type: MarkerType }) {
      const marker = this.warningMarkers.find(
        (marker) => marker.id === payload.id,
      );
      this.selectedEntity = marker || null;
    },
    addToAnalysis(item: WarningItem) {
      const index = this.warningMarkers.findIndex(
        (marker) => marker.id === item.id,
      );
      if (index !== -1) {
        this.warningMarkers[index].isAnalyzed = true;
      }
      const exists = this.analysisList.some(
        (existingItem) => existingItem.id === item.id,
      );
      if (!exists) {
        this.analysisList.push(item);
      }
    },
    removeFromAnalysisBatch(ids: string[]) {
      this.analysisList = this.analysisList.filter(
        (item) => !ids.includes(item.id),
      );
      this.warningMarkers.forEach((marker) => {
        if (ids.includes(marker.id)) {
          marker.isAnalyzed = false;
        }
      });
    },
    clearAnalysis() {
      this.analysisList = [];
      this.warningMarkers.forEach((marker) => {
        marker.isAnalyzed = false;
      });
    },
    setSelectedDate(date: string) {
      this.selectedDate = date;
    },
  },

  // 配置状态持久化
  persist: {
    storage: localStorage,
    pick: ["activeTab", "warningMarkers"],
  },
});
