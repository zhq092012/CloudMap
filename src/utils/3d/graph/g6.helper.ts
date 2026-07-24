import type { EdgeData, NodeData } from "@antv/g6";
// 定义符合 G6 v5 的数据结构接口
interface G6Node extends NodeData {
  id: string;
  style: {
    x: number;
    y: number;
    fill: string;
    stroke: string;
    radius: number;
    size: [number, number] | number;
  };
  data: {
    title: string;
    rawType: string;
  };
}

interface G6Edge extends EdgeData {
  id: string;
  source: string;
  target: string;
}

interface G6Data {
  nodes: G6Node[];
  edges: G6Edge[];
}

// 原始 Cesium 坐标边界提取（用于映射计算）
// 经度区间大概在 34 ~ 66，纬度区间大概在 16 ~ 38
const mapCoordinatesToXY = (
  lng: number,
  lat: number,
): { x: number; y: number } => {
  // 画布中心基准映射算法，放大间距防止重叠
  const scaleX = 45;
  const scaleY = 45;
  const minLng = 34;
  const maxLat = 38;

  return {
    x: (lng - minLng) * scaleX + 50,
    // 纬度在地理上往北递增，而在屏幕坐标系中往底递增，故需反向
    y: (maxLat - lat) * scaleY + 80,
  };
};

// 核心调色盘：严格匹配科技大屏态势的暗色系色值
const getColorByFaction = (type: string) => {
  const t = type.toLowerCase();
  if (t.startsWith("blue")) {
    return {
      fill: "#38bdf8", // 暗夜蓝
      stroke: "#1e40af", // 科技蓝
    };
  } else if (t.startsWith("red") || t.includes("nuclear")) {
    return {
      fill: "#ef4444", // 隐蔽红
      stroke: "#991b1b", // 警戒红
    };
  } else if (t.includes("warning") || t.includes("warn")) {
    return {
      fill: "#facc15", // 警示黄
      stroke: "#854d0e", // 硫磺黄
    };
  }
  // 默认兜底
  return { fill: "#111625", stroke: "#2d3748" };
};

// 执行转化
const convertToG6Data = (markers: any[]): G6Data => {
  const nodes: G6Node[] = markers.map((marker) => {
    const coords = mapCoordinatesToXY(
      marker.lng || marker.longitude || 45,
      marker.lat || marker.latitude || 30,
    );
    const colors = getColorByFaction(marker.type);

    return {
      id: marker.id,
      style: {
        x: coords.x,
        y: coords.y,
        fill: colors.fill,
        stroke: colors.stroke,
        radius: 4,
        size: 32, // 规整尺寸大小
      },
      data: {
        title: marker.name,
        rawType: marker.type,
      },
    };
  });

  // 构造战术仿真网络下的模拟关系线（Edge）
  const edges: G6Edge[] = [
    // 蓝色联军：总指挥部到战术前进基地的辐射线
    { id: "e_b_1", source: "b_11", target: "b_9" }, // 约旦边境战术指挥部 -> 以色列北部海防
    { id: "e_b_2", source: "b_11", target: "b_10" }, // 约旦边境战术指挥部 -> 以色列内盖夫前线
    { id: "e_b_3", source: "b_13", target: "b_12" }, // 科威特城联合指挥所 -> 科威特北部边境
    { id: "e_b_4", source: "b_13", target: "b_14" }, // 科威特城联合指挥所 -> 科威特阿里·萨利赫空军
    { id: "e_b_5", source: "b_17", target: "b_16" }, // 第五舰队总部 -> 巴林空军基地
    { id: "e_b_6", source: "b_17", target: "b_18" }, // 第五舰队总部 -> 卡塔尔乌代德战略空军
    { id: "e_b_7", source: "b_25", target: "b_31" }, // 阿里夫坚军营 -> 阿里萨利姆空军基地

    // 红色阵营：德黑兰总指挥部到各大战略要地与核设施的管辖/依托线
    { id: "e_r_1", source: "r_2", target: "r_3" }, // 德黑兰西部防空总指挥部 -> 德黑兰机动雷达
    { id: "e_r_2", source: "r_2", target: "r_4" }, // 德黑兰西部防空总指挥部 -> 萨韦核工业防御
    { id: "e_r_3", source: "r_5", target: "r_7" }, // 革命卫队战略导弹控制中心 -> 纳坦兹地下铀浓缩
    { id: "e_r_4", source: "r_5", target: "r_6" }, // 革命卫队战略导弹控制中心 -> 阿拉克重水反应堆
    { id: "e_r_5", source: "r_2", target: "r_11" }, // 德黑兰西部防空总指挥部 -> 伊斯法罕第八空军基地
    { id: "e_r_6", source: "r_15", target: "r_16" }, // 阿巴斯港海军总部 -> 霍尔木兹岛前哨

    // 预警切片关联线：异常风险点指向最近的防御基地或交火侦察中继
    { id: "e_w_1", source: "w_13", target: "r_16" }, // 霍尔木兹海峡导弹封锁演练区 -> 霍尔木兹岛前哨
    { id: "e_w_2", source: "w_5", target: "b_4" }, // 埃尔比勒联军基地拦截警报 -> 伊拉克埃尔比勒联军基地
    { id: "e_w_3", source: "w_11", target: "b_17" }, // 波斯湾中部国际航道对峙 -> 第五舰队总部
  ];

  // 过滤掉在当前节点列表中不存在的源节点或目标节点的边，防止 G6 报错 "Node not found for id"
  const nodeIds = new Set(nodes.map((n) => n.id));
  const filteredEdges = edges.filter(
    (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target)
  );

  return { nodes, edges: filteredEdges };
};

// 在组件内直接导出使用
export { convertToG6Data, type G6Data, type G6Node, type G6Edge };
