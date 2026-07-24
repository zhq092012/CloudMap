import {
  getTaskActionPlans,
  getTaskPlans,
  getTaskReports,
} from "@/api/agents-api";
import type { EdgeData, NodeData } from "@antv/g6";
import { ElMessage } from "element-plus";
import { defineStore } from "pinia";

interface AnalysisState {
  rawNodes: NodeData[];
  rawEdges: EdgeData[];
  analysisType: "default" | "attack" | "defense";
  selectedNode: any;
}

export const useAnalysisStore = defineStore("analysis", {
  state: (): AnalysisState => ({
    // 1. 原始态势业务数据
    rawNodes: [],
    rawEdges: [],
    analysisType: "default",
    selectedNode: null,
  }),
  getters: {},

  actions: {
    // 设置当前选中的节点
    setSelectedNode(node: any) {
      this.selectedNode = node;
      if (node) {
        const nodeType = String(node.type || node._type || "");
        if (nodeType === "Attack") {
          this.analysisType = "attack";
        } else if (nodeType === "Defense") {
          this.analysisType = "defense";
        } else {
          this.analysisType = "default";
        }
      }
    },
    // 将原始数据中的节点放入Graph中
    addNodeToGraphByTitle(item: any) {
      this.rawNodes.push({
        id: item.id,
        text: item.title,
        type: "Origin", //原始节点
        isWarning: true,
        anomaly: item.anomaly,
        anomalyConf: item.anomalyConf,
        count: item.count,
        discoverTime: item.discoverTime,
        duration: item.duration,
        isAnalyzed: item.isAnalyzed,
        isHexagon: item.isHexagon,
        itemId: item.itemId,
        level: item.level,
        region: item.region,
        threat: item.threat,
        threatConf: item.threatConf,
        title: item.title,
      });
    },

    // 意图分析
    async IntentAnalysis() {
      const res = await getTaskReports(1);
      if (res) {
        const originNodes = this.rawNodes.filter(
          (node) => node.type === "Origin",
        );

        const sleep = (ms: number) =>
          new Promise((resolve) => setTimeout(resolve, ms));

        for (const node of originNodes) {
          const itemId = node.itemId;
          const childrenNodes = res.filter((item) => item.itemId === itemId);
          for (const item of childrenNodes) {
            const nodeId = "INTENT_" + item.id;
            const isNodeExist = this.rawNodes.some((n) => n.id === nodeId);
            if (!isNodeExist) {
              this.rawNodes.push({
                id: nodeId,
                itemId: item.itemId,
                text: item.title,
                type: "Intent", //意图节点
                isWarning: true,
                deleteStatus: item.deleteStatus,
                deleteReason: item.deleteReason,
                summary: item.summary,
              });
            }

            const isEdgeExist = this.rawEdges.some((e) => e.target === nodeId);
            if (!isEdgeExist) {
              this.rawEdges.push({
                id: nodeId,
                source: node.id,
                target: nodeId,
                type: "edge_origin_intent",
                dashed: item.deleteStatus === "1",
                isWarning: true,
                color: item.deleteStatus === "1" ? "#FFB800" : "#10b981",
              });
            }
            await sleep(2000);
          }
        }
      }
    },
    // 进攻方案分析
    async AttackPlanAnalysis() {
      // 如果没有选中的意图 提示并返回
      if (!this.selectedNode || this.selectedNode.type !== "Intent") {
        ElMessage.warning("请选择意图节点后进行攻击方案分析");
        return;
      }

      // 如果当前意图已经被剪枝,提示并返回
      const edge = this.rawEdges.find((e) => e.target === this.selectedNode.id);
      if (edge && edge.dashed) {
        ElMessage.warning("当前意图已经被剪枝,无法进行攻击方案分析");
        return;
      }

      this.analysisType = "attack";
      // 获取所有方案
      const plans = await getTaskActionPlans(1);
      if (plans) {
        const allIntentNodes = this.rawNodes.filter((s) => s.type === "Intent");
        // 只分析选择的意图节点对应的方案
        const selectedIntentNode = allIntentNodes.find(
          (s) => s.id === this.selectedNode.id,
        );
        if (selectedIntentNode) {
          const id = Number(selectedIntentNode.id.replace("INTENT_", ""));
          const planarr = plans.filter((p) => p.intentId === id);

          if (planarr.length > 0) {
            console.log(planarr);
            const sleep = (ms: number) =>
              new Promise((resolve) => setTimeout(resolve, ms));

            for (const item of planarr) {
              const nodeId = "PLAN_ATTACK_" + item.id;
              const isNodeExist = this.rawNodes.some((n) => n.id === nodeId);
              if (!isNodeExist) {
                this.rawNodes.push({
                  id: nodeId,
                  text: item.title,
                  type: "Attack", //进攻方案节点
                  isWarning: true,
                  itemId: item.itemId,
                  deleteStatus: item.deleteStatus,
                  deleteReason: item.deleteReason,
                  summary: item.summary,
                });
              }

              const isEdgeExist = this.rawEdges.some(
                (e) => e.target === nodeId,
              );
              if (!isEdgeExist) {
                this.rawEdges.push({
                  id: nodeId,
                  source: selectedIntentNode.id,
                  target: nodeId,
                  dashed: item.deleteStatus === "1",
                  type: "edge_intent_attackplan",
                  isWarning: true,
                  color:
                    item.deleteStatus === "PLANNED" ? "#FFB800" : "#0ea5e9",
                });
              }
              await sleep(2000);
            }
          }
        }
      }
    },
    // 防守方案分析
    async DefensePlanAnalysis() {
      // 如果没有选中的进攻方案或者类型不匹配
      if (!this.selectedNode || this.selectedNode.type !== "Attack") {
        ElMessage.warning("请选择进攻方案节点后进行防守方案分析");
        return;
      }

      // 如果当前进攻方案已经被剪枝, 提示并返回
      const edge = this.rawEdges.find((e) => e.target === this.selectedNode.id);
      if (edge && edge.dashed) {
        ElMessage.warning("当前进攻方案已经被剪枝,无法进行防守方案分析");
        return;
      }

      this.analysisType = "defense";
      // 获取所有防守方案
      const plans = await getTaskPlans(1);
      if (plans) {
        const allAttackNodes = this.rawNodes.filter((s) => s.type === "Attack");
        const selectedAttackNode = allAttackNodes.find(
          (s) => s.id === this.selectedNode.id,
        );
        if (selectedAttackNode) {
          const id = Number(selectedAttackNode.id.replace("PLAN_ATTACK_", ""));
          const planarr = plans.filter((p) => p.reportId === id);
          if (planarr.length > 0) {
            const sleep = (ms: number) =>
              new Promise((resolve) => setTimeout(resolve, ms));

            for (const item of planarr) {
              const nodeId = "PLAN_DEFENSE_" + item.id;
              const isNodeExist = this.rawNodes.some((n) => n.id === nodeId);
              if (!isNodeExist) {
                this.rawNodes.push({
                  id: nodeId,
                  text: item.title,
                  type: "Defense", //防守方案节点
                  reportId: item.reportId,
                  isWarning: true,
                  summary: item.summary,
                });
              }

              const isEdgeExist = this.rawEdges.some(
                (e) => e.target === nodeId,
              );
              if (!isEdgeExist) {
                this.rawEdges.push({
                  id: nodeId,
                  source: selectedAttackNode.id,
                  target: nodeId,
                  type: "edge_attack_defenseplan",
                  isWarning: true,
                  color: "#ef4444",
                });
              }
              await sleep(2000);
            }
          }
        }
      }
    },
  },

  persist: {
    storage: localStorage,
    pick: [],
  },
});
