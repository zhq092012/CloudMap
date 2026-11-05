import {
  createDeepAnalysisWorkflow,
  listIncompleteWorkflows,
  selectDeepAnalysisNode,
  startPhaseAnalysisWithSSE,
  type AnalysisSSEEvent,
  listDeepAnalysisNodesByType,
  pruneDeepAnalysisNode,
  selectDeepAnalysisNodes,
  getExecutionStatus,
  toBackendNodeType,
  checkExistingIntents,
  type IntentCheckResult,
  checkExistingSteps,
  type StepCheckResult,
  getChainsByAnomalies,
  addAnomaliesToWorkflow,
  getDeepAnalysisWorkflow,
  type ByAnomaliesResult,
} from "@/api/deep-analysis";
import { confirmAnomaly, getAnomalyById } from "@/api/anomalies";
import type { EdgeData, NodeData } from "@antv/g6";
import { ElMessage } from "element-plus";
import { defineStore } from "pinia";

interface ProgressLogEntry {
  time: string;
  text: string;
  type: "info" | "success" | "error" | "warning";
  kind?: "dataflow" | "dispatch" | "agent-input";
  data?: any;
  expanded?: boolean;
}

interface AnalysisState {
  rawNodes: NodeData[];
  rawEdges: EdgeData[];
  analysisType: "default" | "attack" | "defense" | "evaluation";
  selectedNode: any;
  workflowId: string | null;
  workflowTitle: string;
  anomalyIds: string[];
  anomalyId: string | null;
  coveredAnomalyIds: string[];
  workflowList: any[];
  currentPhase: number;
  isAnalyzing: boolean;
  progressLogs: ProgressLogEntry[];
  canAdvance: boolean;
}

/* progressLogs 条目的到达时间戳（epoch ms），与 progressLogs 平行维护，用于 AGENT_RESULT 耗时估算 */
const progressLogEpochMs: number[] = [];

function commitProgressLog(logs: ProgressLogEntry[], entry: ProgressLogEntry) {
  logs.push(entry);
  progressLogEpochMs.push(Date.now());
}

/** 首个非空行截断 n 字（超长追加 …） */
function firstLine(s: unknown, n: number): string {
  if (typeof s !== "string") return "";
  const line = s
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 0);
  if (!line) return "";
  return line.length > n ? line.substring(0, n) + "…" : line;
}

/** 当前 AGENT_RESULT 与该 stepId 对应 dispatch 行的时间差（末条记录 − dispatch 行）；取不到返回 null */
function stepDurationSinceLastDispatch(logs: ProgressLogEntry[]): number | null {
  const now = Date.now();
  for (let i = logs.length - 1; i >= 0; i--) {
    if (logs[i]?.kind === "dispatch") {
      const diff = now - progressLogEpochMs[i];
      return diff >= 0 ? diff : null;
    }
  }
  return null;
}

/** 展示类型 → 中文文案（键须与 rawNodes[].type 运行时取值一致，未命中走旧回退） */
const TYPE_LABELS: Record<string, string> = {
  Intent: "意图",
  Attack: "蓝方方案",
  Defense: "红方方案",
  Evaluation: "评估报告",
};

/**
 * 从 startPid（节点 raw.parentNodeId，可能是 nodeId 或 stepId）出发，
 * 在 rawNodes 中逐跳上溯（r.id === pid || r.raw?.stepId === pid）直至 type === "Origin"。
 * visited set 防环，最多 8 跳；链根缺失/断链返回 null。
 */
function findOrigin(rawNodes: NodeData[], startPid: string): NodeData | null {
  const visited = new Set<string>();
  let pid = startPid || "";
  for (let hop = 0; hop < 8; hop++) {
    if (!pid || visited.has(pid)) return null;
    visited.add(pid);
    const r = rawNodes.find(
      (x) => x.id === pid || (x as any).raw?.stepId === pid
    );
    if (!r) return null;
    if (r.type === "Origin") return r;
    pid = ((r as any).raw?.parentNodeId as string) || "";
  }
  return null;
}

/** 截断 n 字（超长追加 …）；非字符串/空白返回 "" */
function truncateName(s: unknown, n: number): string {
  const t = typeof s === "string" ? s.trim() : "";
  if (!t) return "";
  return t.length > n ? t.substring(0, n) + "…" : t;
}

export const useAnalysisStore = defineStore("analysis", {
  state: (): AnalysisState => ({
    rawNodes: [],
    rawEdges: [],
    analysisType: "default",
    selectedNode: null,
    workflowId: null,
    workflowTitle: "",
    anomalyIds: [],
    anomalyId: null,
    coveredAnomalyIds: [],
    workflowList: [],
    currentPhase: 0,
    isAnalyzing: false,
    progressLogs: [],
    canAdvance: false,
  }),

  getters: {},

  actions: {
    setSelectedNode(node: any) {
      this.selectedNode = node;
      if (node) {
        const nodeType = String(node.type || node._type || "");
        if (nodeType === "Attack") {
          this.analysisType = "attack";
        } else if (nodeType === "Defense") {
          this.analysisType = "defense";
        } else if (nodeType === "Evaluation") {
          this.analysisType = "evaluation";
        } else {
          this.analysisType = "default";
        }
        this.syncSelectionToBackend(node.id, nodeType).catch(() => {});
      }
    },

    async syncSelectionToBackend(nodeId: string, displayType: string) {
      if (!this.workflowId) return;
      const backendType = toBackendNodeType(displayType);
      await selectDeepAnalysisNode(this.workflowId, nodeId, backendType).catch(() => {});
    },
    addLog(text: string, type: "info" | "success" | "error" | "warning" = "info") {
      commitProgressLog(this.progressLogs, {
        time: new Date().toLocaleTimeString(),
        text,
        type,
      });
    },

    /* dispatch 事件的可展开条目：仅当 SSE 载荷带 sysPrompt 时追加 */
    pushDispatchLog(data: Record<string, any>) {
      if (data?.sysPrompt == null) return;
      commitProgressLog(this.progressLogs, {
        time: new Date().toLocaleTimeString(),
        text: `Agent《${data.agentName ?? data.agentId}》系统提示词（点击展开）`,
        type: "info",
        kind: "dispatch",
        data,
        expanded: false,
      });
    },

    /* dataflow 事件的可展开条目：按事件类型生成一行摘要 + 原始载荷 */
    pushDataflowLog(
      data: { stepId: string; seq: number; type: string; agentName: string; payload: any }
    ) {
      const type = data?.type;
      const payload =
        data?.payload && typeof data.payload === "object"
          ? (data.payload as Record<string, any>)
          : ({} as Record<string, any>);
      let text = "";
      let logType: ProgressLogEntry["type"] = "info";
      if (type === "TEXT") {
        text = `模型输出：${firstLine(payload.text, 60)}`;
      } else if (type === "THINKING") {
        text = `思考：${firstLine(payload.text, 60)}`;
      } else if (type === "TOOL_CALL") {
        text = `工具调用 ${payload.name ?? "?"}（${payload.result?.state ?? "ok"}，${
          payload.durationMs ?? 0
        }ms）`;
      } else if (type === "MODEL_CALL") {
        text = `模型调用完成：输入 ${payload.usage?.inputTokens ?? 0} / 输出 ${
          payload.usage?.outputTokens ?? 0
        } tokens，耗时 ${payload.durationMs ?? 0}ms`;
      } else if (type === "AGENT_RESULT") {
        logType = "success";
        const usage = payload.usage;
        text = `步骤完成（agent《${data.agentName ?? "?"}》）：输入 ${usage?.inputTokens ?? 0} / 输出 ${
          usage?.outputTokens ?? 0
        } tokens`;
        const stepDurationMs = stepDurationSinceLastDispatch(this.progressLogs);
        if (stepDurationMs != null) {
          text += `，耗时 ≈${stepDurationMs}ms`;
        }
      } else if (type === "ERROR") {
        logType = "error";
        text = `错误：${payload.message ?? "未知错误"}`;
      } else {
        text = `事件 ${type}`;
      }
      commitProgressLog(this.progressLogs, {
        time: new Date().toLocaleTimeString(),
        text,
        type: logType,
        kind: "dataflow",
        data,
        expanded: false,
      });
    },

    /* agent-input 事件的可展开条目：调用 agent 前实际发给它的完整输入（+知识图谱参考段落） */
    pushAgentInputLog(data: Record<string, any>) {
      const prompt = typeof data?.prompt === "string" ? data.prompt : "";
      const name = data?.agentName ?? data?.agentId ?? "?";
      let text = `Agent《${name}》输入：${firstLine(prompt, 60) || "（无文本）"}`;
      if (data?.promptTruncated === true && typeof data?.promptTotalChars === "number") {
        text += `（共 ${data.promptTotalChars} 字，已截断）`;
      }
      text += "（点击展开）";
      commitProgressLog(this.progressLogs, {
        time: new Date().toLocaleTimeString(),
        text,
        type: "info",
        kind: "agent-input",
        data,
        expanded: false,
      });
    },

    getEdgeType(displayType: string): string {
      const types: Record<string, string> = {
        Intent: "edge_origin_intent",
        Attack: "edge_intent_attackplan",
        Defense: "edge_attack_defenseplan",
        Evaluation: "edge_defense_evaluation",
      };
      return types[displayType] || "edge_default";
    },

    getNodeColor(type: string, pruned: boolean, node: any): string {
      if (pruned) return "#FFB800";
      const colors: Record<string, string> = {
        Origin: "#fbbf24",
        Intent: "#10b981",
        Attack: "#0ea5e9",
        Defense: "#ef4444",
        Evaluation: node?.isRecommended ? "#22c55e" : "#a855f7",
      };
      return colors[type] || "#475569";
    },

    resetNodes() {
      this.rawNodes = [];
      this.rawEdges = [];
      this.workflowTitle = "";
      this.currentPhase = 0;
      this.progressLogs = [];
      progressLogEpochMs.length = 0;
      this.canAdvance = false;
      this.selectedNode = null;
      this.analysisType = "default";
      this.isAnalyzing = false;
      this.anomalyIds = [];
    },

    async startAnalysis(anomalyId: string) {
      if (this.isAnalyzing) {
        ElMessage.warning("分析已在进行中");
        return;
      }
      this.resetNodes();
      this.anomalyIds = [anomalyId];
      this.anomalyId = anomalyId;

      try {
        this.addLog("确认异常事件...", "info");
        await confirmAnomaly(anomalyId);
        this.addLog("异常已确认", "success");

        this.addLog("创建深度分析工作流...", "info");
        const workflow = await createDeepAnalysisWorkflow(this.anomalyIds);
        this.workflowId = workflow.workflowId;
        this.workflowTitle = workflow.title || "";
        const workflowId = this.workflowId;
        this.currentPhase = 0;
        if (!workflowId) {
          throw new Error("工作流创建失败");
        }
        this.addLog(
          `工作流 ${workflowId.substring(0, 12)}... 已创建`,
          "success"
        );

        this.addLog("加载原始异常节点...", "info");
        const originNodes = await listDeepAnalysisNodesByType(
          workflowId,
          "ORIGIN"
        );
        this.addLog(
          `加载 ${originNodes.length} 个原始异常节点`,
          "success"
        );
        this.addNodeFromWorkflow(originNodes, "Origin");
        this.canAdvance = true;

        const originNodeIds = this.rawNodes
          .filter((n) => n.type === "Origin")
          .map((n) => n.id);
        await this.proceedToIntent(originNodeIds);
      } catch (e: any) {
        this.isAnalyzing = false;
        this.addLog(
          `分析启动失败: ${e?.message || "未知错误"}`,
          "error"
        );
        ElMessage.error(`分析启动失败: ${e?.message}`);
      }
    },

    async proceedToIntent(originIds: string[]) {
      if (this.isAnalyzing) {
        ElMessage.warning("分析已在进行中");
        return;
      }
      const workflowId = this.workflowId;
      if (!workflowId || originIds.length === 0) {
        ElMessage.warning("请先选择一个原始异常节点");
        return;
      }

      /* ── DB-first 去重：先查库，已有意图直接展示，只生成未覆盖的 ── */
      this.isAnalyzing = true;
      try {
        this.addLog("查库检查已有意图...", "info");
        const check: IntentCheckResult = await checkExistingIntents(
          workflowId,
          originIds
        ).catch(() => ({
          existingIntents: [],
          uncoveredOriginNodeIds: originIds,
        }));

        /* 1) 库中已存在的意图：直接展示，不重复调 LLM */
        if (check.existingIntents && check.existingIntents.length > 0) {
          this.addNodeFromWorkflow(check.existingIntents, "Intent");
          this.addLog(
            `直接展示库中已有 ${check.existingIntents.length} 个意图`,
            "success"
          );
          // 关键修复：在等 SSE 生成新意图之前，先把已有意图的下游链路（蓝方/红方/校验）
          // 从库里恢复出来。否则用户在新意图生成等待期间只看到孤零零的意图节点，
          // 已经分析好的链路就“丢了”。
          await this.restoreChainFromDB();
        }

        const uncovered = check.uncoveredOriginNodeIds || [];
        if (uncovered.length === 0) {
          /* 全部已有意图，无需再次生成 */
          this.isAnalyzing = false;
          this.currentPhase = 1;
          this.canAdvance = true;
          this.addLog("所选异常均已生成意图，直接展示", "success");
          return;
        }

        /* 2) 仅对未覆盖的 origin 节点选中并生成意图 */
        await selectDeepAnalysisNodes(workflowId, uncovered, "ORIGIN").catch(
          () => {}
        );
        this.addLog(
          `已选择 ${uncovered.length} 个未覆盖节点, 启动意图分析...`,
          "info"
        );

        this.currentPhase = 1;

        /* SSE progress callback */
        const sseCallback = (event: AnalysisSSEEvent) => {
          if (event.eventType === 'log') {
            this.addLog(event.data?.message || JSON.stringify(event.data), "info");
          } else if (event.eventType === 'dispatch') {
            this.addLog(`Agent dispatch: step ${event.data?.step ?? '?'}`, "info");
            this.pushDispatchLog(event.data);
          } else if (event.eventType === 'dataflow') {
            this.pushDataflowLog(
              event.data as {
                stepId: string;
                seq: number;
                type: string;
                agentName: string;
                payload: any;
              }
            );
          } else if (event.eventType === 'agent-input') {
            this.pushAgentInputLog(event.data);
          } else if (event.eventType === 'error') {
            this.addLog(`错误: ${event.data?.error || '未知错误'}`, "error");
          }
        }

        const sseResult = await startPhaseAnalysisWithSSE(workflowId, 1, sseCallback);
        this.isAnalyzing = false;
        if (sseResult.status === "FAILED" || sseResult.status === "FAILED_TIMEOUT") {
          this.addLog("意图分析失败: 后端未找到对应源节点或执行异常", "error");
          ElMessage.error("意图分析失败：未找到对应源节点，请确认当前画布属于该节点所在的工作流");
          return;
        }

        /* Final: fetch result nodes (包含本次新生成的) */
        const intentNodes = await listDeepAnalysisNodesByType(workflowId, "INTENT").catch(() => []);
        this.addNodeFromWorkflow(intentNodes, "Intent");

        // 新意图生成后，再次尝试恢复下游链路（全局去重下，新意图可能也已有蓝方/红方/校验）。
        await this.restoreChainFromDB();

        if (intentNodes.length > 0) {
          this.canAdvance = true;
          this.addLog(
            `意图分析完成, 共 ${intentNodes.length} 个结果`,
            "success"
          );
        }
      } catch (e: any) {
        this.isAnalyzing = false;
        this.addLog(`意图分析失败: ${e?.message}`, "error");
        ElMessage.error(`意图分析失败: ${e?.message}`);
      }
    },

    async proceedToBluePlan(intentIds: string[]) {
      if (!this.workflowId || intentIds.length === 0) {
        ElMessage.warning("请先选择一个意图节点");
        return;
      }

      /* ── DB-first 去重：先查库，已有蓝方方案直接展示，只生成未覆盖的 ── */
      this.isAnalyzing = true;
      try {
        this.addLog("查库检查已有蓝方方案...", "info");
        const check: StepCheckResult = await checkExistingSteps(
          this.workflowId,
          intentIds,
          "BLUE_PLAN"
        ).catch(() => ({ existingSteps: [], uncoveredParentNodeIds: intentIds }));

        if (check.existingSteps && check.existingSteps.length > 0) {
          this.addNodeFromWorkflow(check.existingSteps, "Attack");
          this.addLog(
            `直接展示库中已有 ${check.existingSteps.length} 个蓝方方案`,
            "success"
          );
        }

        const uncovered = check.uncoveredParentNodeIds || [];
        if (uncovered.length === 0) {
          this.isAnalyzing = false;
          this.currentPhase = 2;
          this.canAdvance = true;
          this.addLog("所选意图均已生成蓝方方案，直接展示", "success");
          return;
        }

        await selectDeepAnalysisNodes(this.workflowId, uncovered, "INTENT").catch(
          () => {}
        );
        this.addLog(
          `已选择 ${uncovered.length} 个未覆盖意图, 启动蓝方方案分析...`,
          "info"
        );
        this.currentPhase = 2;

        const sseCallback = (event: AnalysisSSEEvent) => {
          if (event.eventType === 'log') {
            this.addLog(event.data?.message || JSON.stringify(event.data), "info");
          } else if (event.eventType === 'dispatch') {
            this.addLog(`Agent dispatch: step ${event.data?.step ?? '?'}`, "info");
            this.pushDispatchLog(event.data);
          } else if (event.eventType === 'dataflow') {
            this.pushDataflowLog(
              event.data as {
                stepId: string;
                seq: number;
                type: string;
                agentName: string;
                payload: any;
              }
            );
          } else if (event.eventType === 'agent-input') {
            this.pushAgentInputLog(event.data);
          } else if (event.eventType === 'error') {
            this.addLog(`错误: ${event.data?.error || '未知错误'}`, "error");
          }
        }

        const sseResult = await startPhaseAnalysisWithSSE(this.workflowId, 2, sseCallback);
        this.isAnalyzing = false;
        if (sseResult.status === "FAILED" || sseResult.status === "FAILED_TIMEOUT") {
          this.addLog("蓝方方案分析失败: 后端未找到对应意图源节点或执行异常", "error");
          ElMessage.error("蓝方方案分析失败：未找到对应意图源节点，请确认当前画布属于该意图所在的工作流");
          return;
        }

        const planNodes = await listDeepAnalysisNodesByType(this.workflowId, "BLUE_PLAN").catch(() => []);
        this.addNodeFromWorkflow(planNodes, "Attack");

        if (planNodes.length > 0) {
          this.canAdvance = true;
          this.addLog(
            `蓝方方案分析完成, 共 ${planNodes.length} 个结果`,
            "success"
          );
        }
      } catch (e: any) {
        this.isAnalyzing = false;
        this.addLog(`蓝方方案分析失败: ${e?.message}`, "error");
        ElMessage.error(`蓝方方案分析失败: ${e?.message}`);
      }
    },

    async proceedToRedPlan(bluePlanIds: string[]) {
      if (!this.workflowId || bluePlanIds.length === 0) {
        ElMessage.warning("请先选择一个蓝方方案节点");
        return;
      }

      /* ── DB-first 去重：先查库，已有红方方案直接展示，只生成未覆盖的 ── */
      this.isAnalyzing = true;
      try {
        this.addLog("查库检查已有红方方案...", "info");
        const check: StepCheckResult = await checkExistingSteps(
          this.workflowId,
          bluePlanIds,
          "RED_PLAN"
        ).catch(() => ({ existingSteps: [], uncoveredParentNodeIds: bluePlanIds }));

        if (check.existingSteps && check.existingSteps.length > 0) {
          this.addNodeFromWorkflow(check.existingSteps, "Defense");
          this.addLog(
            `直接展示库中已有 ${check.existingSteps.length} 个红方方案`,
            "success"
          );
        }

        const uncovered = check.uncoveredParentNodeIds || [];
        if (uncovered.length === 0) {
          this.isAnalyzing = false;
          this.currentPhase = 3;
          this.canAdvance = true;
          this.addLog("所选蓝方方案均已生成红方方案，直接展示", "success");
          return;
        }

        await selectDeepAnalysisNodes(this.workflowId, uncovered, "BLUE_PLAN").catch(
          () => {}
        );
        this.addLog(
          `已选择 ${uncovered.length} 个未覆盖蓝方方案, 启动红方方案分析...`,
          "info"
        );
        this.currentPhase = 3;

        const sseCallback = (event: AnalysisSSEEvent) => {
          if (event.eventType === 'log') {
            this.addLog(event.data?.message || JSON.stringify(event.data), "info");
          } else if (event.eventType === 'dispatch') {
            this.addLog(`Agent dispatch: step ${event.data?.step ?? '?'}`, "info");
            this.pushDispatchLog(event.data);
          } else if (event.eventType === 'dataflow') {
            this.pushDataflowLog(
              event.data as {
                stepId: string;
                seq: number;
                type: string;
                agentName: string;
                payload: any;
              }
            );
          } else if (event.eventType === 'agent-input') {
            this.pushAgentInputLog(event.data);
          } else if (event.eventType === 'error') {
            this.addLog(`错误: ${event.data?.error || '未知错误'}`, "error");
          }
        }

        const sseResult = await startPhaseAnalysisWithSSE(this.workflowId, 3, sseCallback);
        this.isAnalyzing = false;
        if (sseResult.status === "FAILED" || sseResult.status === "FAILED_TIMEOUT") {
          this.addLog("红方方案分析失败: 后端未找到对应蓝方源节点或执行异常", "error");
          ElMessage.error("红方方案分析失败：未找到对应蓝方源节点，请确认当前画布属于该节点所在的工作流");
          return;
        }

        const planNodes = await listDeepAnalysisNodesByType(this.workflowId, "RED_PLAN").catch(() => []);
        this.addNodeFromWorkflow(planNodes, "Defense");

        if (planNodes.length > 0) {
          this.canAdvance = true;
          this.addLog(
            `红方方案分析完成, 共 ${planNodes.length} 个结果`,
            "success"
          );
        }
      } catch (e: any) {
        this.isAnalyzing = false;
        this.addLog(`红方方案分析失败: ${e?.message}`, "error");
        ElMessage.error(`红方方案分析失败: ${e?.message}`);
      }
    },

    async proceedToEvaluation(redPlanIds: string[]) {
      if (!this.workflowId || redPlanIds.length === 0) {
        ElMessage.warning("请先选择一个红方方案节点");
        return;
      }

      /* ── DB-first 去重：先查库，已有核验评估直接展示，只生成未覆盖的 ── */
      this.isAnalyzing = true;
      try {
        this.addLog("查库检查已有核验评估...", "info");
        const check: StepCheckResult = await checkExistingSteps(
          this.workflowId,
          redPlanIds,
          "EVALUATION"
        ).catch(() => ({ existingSteps: [], uncoveredParentNodeIds: redPlanIds }));

        if (check.existingSteps && check.existingSteps.length > 0) {
          this.addNodeFromWorkflow(check.existingSteps, "Evaluation");
          this.addLog(
            `直接展示库中已有 ${check.existingSteps.length} 个核验评估`,
            "success"
          );
        }

        const uncovered = check.uncoveredParentNodeIds || [];
        if (uncovered.length === 0) {
          this.isAnalyzing = false;
          this.currentPhase = 4;
          this.canAdvance = true;
          this.addLog("所选红方方案均已生成核验评估，直接展示", "success");
          return;
        }

        await selectDeepAnalysisNodes(this.workflowId, uncovered, "RED_PLAN").catch(
          () => {}
        );
        this.addLog(
          `已选择 ${uncovered.length} 个未覆盖红方方案, 启动核验评估...`,
          "info"
        );
        this.currentPhase = 4;

        const sseCallback = (event: AnalysisSSEEvent) => {
          if (event.eventType === 'log') {
            this.addLog(event.data?.message || JSON.stringify(event.data), "info");
          } else if (event.eventType === 'dispatch') {
            this.addLog(`Agent dispatch: step ${event.data?.step ?? '?'}`, "info");
            this.pushDispatchLog(event.data);
          } else if (event.eventType === 'dataflow') {
            this.pushDataflowLog(
              event.data as {
                stepId: string;
                seq: number;
                type: string;
                agentName: string;
                payload: any;
              }
            );
          } else if (event.eventType === 'agent-input') {
            this.pushAgentInputLog(event.data);
          } else if (event.eventType === 'error') {
            this.addLog(`错误: ${event.data?.error || '未知错误'}`, "error");
          }
        }

        const sseResult = await startPhaseAnalysisWithSSE(this.workflowId, 4, sseCallback);
        this.isAnalyzing = false;
        if (sseResult.status === "FAILED" || sseResult.status === "FAILED_TIMEOUT") {
          this.addLog("核验评估失败: 后端未找到对应红方源节点或执行异常", "error");
          ElMessage.error("核验评估失败：未找到对应红方源节点，请确认当前画布属于该节点所在的工作流");
          return;
        }

        const evalNodes = await listDeepAnalysisNodesByType(this.workflowId, "EVALUATION").catch(() => []);
        this.addNodeFromWorkflow(evalNodes, "Evaluation");

        if (evalNodes.length > 0) {
          this.canAdvance = true;
          this.addLog(
            `核验评估完成, 共 ${evalNodes.length} 个结果`,
            "success"
          );
        }
      } catch (e: any) {
        this.isAnalyzing = false;
        this.addLog(`核验评估失败: ${e?.message}`, "error");
        ElMessage.error(`核验评估失败: ${e?.message}`);
      }
    },

    async pollPhaseNodes(
      workflowId: string,
      nodeType: string,
      maxRetries: number = 120,
      intervalMs: number = 3000
    ): Promise<any[]> {
      const typeToPhase: Record<string, number> = {
        INTENT: 1, BLUE_PLAN: 2, RED_PLAN: 3, EVALUATION: 4,
      };
      const phaseNum = typeToPhase[nodeType];

      for (let i = 0; i < maxRetries; i++) {
        /* Check execution status separately — never let a status error swallow valid node data */
        let execStatus: any = null;
        if (phaseNum !== undefined) {
          try {
            execStatus = await getExecutionStatus(workflowId, phaseNum);
          } catch {
            /* Status check failed, ignore */
          }
        }

        if (execStatus?.status === "FAILED") {
          this.addLog(`分析执行失败: 后端报告 FAILED`, "error");
          throw new Error("Phase execution FAILED on server");
        }

        /* Always try to fetch nodes — even if status check failed */
        let allNodes: any[] = [];
        try {
          allNodes = await listDeepAnalysisNodesByType(workflowId, nodeType);
        } catch (err: any) {
          if (i % 20 === 0) {
            this.addLog(`获取${nodeType}节点异常: ${err?.message || "网络错误"}`, "error");
          }
          await new Promise((r) => setTimeout(r, intervalMs));
          continue;
        }

        /* If backend says COMPLETED, always return whatever we have */
        if (execStatus?.status === "COMPLETED") {
          return allNodes;
        }

        /* Got new nodes — return them */
        const newNodes = allNodes.filter(
          (n) => !this.rawNodes.find((r) => r.id === n.nodeId)
        );
        if (newNodes.length > 0) {
          return allNodes;
        }

        if (i % 10 === 0) {
          this.addLog(
            `等待${nodeType}分析结果... (${Math.round((i * intervalMs) / 1000)}s)`,
            "info"
          );
        }
        await new Promise((r) => setTimeout(r, intervalMs));
      }
      return await listDeepAnalysisNodesByType(workflowId, nodeType).catch(() => []);
    },

    /**
     * 将后端节点转为前端视图节点。
     * 支持通过 stepId 解析 parentNodeId（当 parentNodeId 为 stepId 而非 nodeId 时）。
     */
    addNodeFromWorkflow(backendNodes: any[], displayType: string) {
      for (const n of backendNodes) {
        if (this.rawNodes.find((r) => r.id === n.nodeId)) continue;

        let displayText = "";
        let confidence = 0;
        try {
          const parsed =
            typeof n.nodeData === "string"
              ? JSON.parse(n.nodeData)
              : n.nodeData;
          if (displayType === "Origin") {
            displayText = parsed.name || parsed.title || parsed.summary || JSON.stringify(parsed).substring(0, 60);
          } else {
            /* 回退文案：旧逻辑逐字保留（未知类型 / 链根未找到 / origin 无 name） */
            const legacyLabel =
              parsed.summary || parsed.title || JSON.stringify(parsed).substring(0, 200);
            const phaseLabel = TYPE_LABELS[displayType];
            const origin = phaseLabel
              ? findOrigin(this.rawNodes as NodeData[], n.parentNodeId || "")
              : null;
            let originName = "";
            if (origin) {
              try {
                const originParsed =
                  typeof (origin as any).nodeData === "string"
                    ? JSON.parse((origin as any).nodeData)
                    : (origin as any).nodeData;
                originName = truncateName(originParsed?.name, 30);
              } catch {
                originName = "";
              }
            }
            /* 名称主体：节点自身分析结果摘要（截 90 字 ≈ 画布框 3 行容量）→ 回退 origin 名前 30 字 */
            const namePart = truncateName(parsed.summary, 90) || originName;
            if (phaseLabel && namePart) {
              /* 序号：同一 Origin 链内同类型下标（1 基，按推送顺序，仅推送时计算一次）；
                 链根缺失时退化为全画布同类型计数（保持有号） */
              const seq = origin
                ? this.rawNodes.filter(
                    (r) =>
                      r.type === displayType &&
                      findOrigin(
                        this.rawNodes as NodeData[],
                        ((r as any).raw?.parentNodeId as string) || ""
                      ) === origin
                  ).length + 1
                : this.rawNodes.filter((r) => r.type === displayType).length + 1;
              displayText = `${phaseLabel}${seq} ${namePart}`;
            } else {
              displayText = legacyLabel;
            }
          }
          confidence =
            n.confidence != null ? n.confidence : parsed.confidence || 0;
        } catch {
          /* parse failed, use defaults */
        }

        this.rawNodes.push({
          id: n.nodeId,
          text: displayText,
          type: displayType,
          isWarning: true,
          deleteStatus: n.pruned ? "1" : "0",
          deleteReason: n.pruneReason || "",
          summary: displayText,
          confidence,
          // 保留原始字段，供点击节点时获取（confidence 已提取到顶层，其余从后端节点保留）
          createdAt: n.createdAt ?? null,
          nodeData: n.nodeData ?? null,
          nodeType: n.nodeType ?? displayType,
          raw: n,
        });

        if (n.parentNodeId) {
          /* parentNodeId 可能是 nodeId 或 stepId：先按 nodeId 匹配，再按 raw.stepId 匹配 */
          let parentNode = this.rawNodes.find((r) => r.id === n.parentNodeId);
          if (!parentNode) {
            parentNode = this.rawNodes.find(
              (r) => (r as any).raw?.stepId === n.parentNodeId
            );
          }
          if (parentNode) {
            /* 父节点在当前画布上 → 正常连边 */
            this.rawEdges.push({
              id: `${parentNode.id}->${n.nodeId}`,
              source: parentNode.id,
              target: n.nodeId,
              type: this.getEdgeType(displayType),
              dashed: n.pruned,
              isWarning: true,
              color: this.getNodeColor(displayType, n.pruned, n),
            });
          } else {
            /* ORIGIN 节点可能是由 stepId=parentStepId，退而求 honour */
            this.rawEdges.push({
              id: `${n.parentNodeId}->${n.nodeId}`,
              source: n.parentNodeId,
              target: n.nodeId,
              type: this.getEdgeType(displayType),
              dashed: n.pruned,
              isWarning: true,
              color: this.getNodeColor(displayType, n.pruned, n),
            });
          }
        }

        const logType = n.pruned ? "warning" : "success";
        const typeLabel =
          displayType === "Origin"
            ? "原始异常"
            : displayType === "Intent"
              ? "意图"
              : displayType === "Attack"
                ? "蓝方方案"
                : displayType === "Defense"
                  ? "红方方案"
                  : "评估报告";
        this.addLog(
          `[${typeLabel}] ${displayText.substring(0, 60)} (置信度 ${Math.round(confidence)}%)`,
          logType
        );
      }
    },

    async pruneNodeAction(nodeId: string, reason?: string) {
      if (!this.workflowId) return;
      try {
        await pruneDeepAnalysisNode(this.workflowId, nodeId, reason);
        const node = this.rawNodes.find((n) => n.id === nodeId);
        if (node) {
          (node as any).deleteStatus = "1";
          (node as any).deleteReason = reason || "User pruned";
        }
        const edge = this.rawEdges.find((e) => e.target === `${nodeId}`);
        if (edge) {
          edge.dashed = true;
          edge.color = "#FFB800";
        }
        ElMessage.success("节点已剪枝");
      } catch (e: any) {
        ElMessage.error(`剪枝失败: ${e?.message}`);
      }
    },

    selectNodeAction(nodeId: string) {
      const node = this.rawNodes.find((n) => n.id === nodeId);
      if (node) {
        this.setSelectedNode(node);
      }
    },

    resetAnalysis() {
      this.resetNodes();
      this.workflowId = null;
      this.anomalyId = null;
    },

    /**
     * 载入某一个未完成工作流到画布（工作流切换器使用）：
     * 先清空画布，再完整还原该工作流本身的链路（不依赖全局去重）。
     */
    async loadWorkflow(wf: any): Promise<boolean> {
      if (!wf || !wf.workflowId) return false;
      this.resetNodes();
      return this.loadWorkflowCore(wf);
    },

    /**
     * 把一个工作流实例完整还原到画布（前提：调用方已清理画布，日志保留）：
     * 按该工作流自身的所有节点类型加载重建链路，RUNNING 时恢复阶段轮询。
     * restoreByAnomalies 仅按「最新工作流实例」恢复画布时直接使用它。
     */
    async loadWorkflowCore(wf: any): Promise<boolean> {
      try {
        this.workflowId = wf.workflowId;
        this.workflowTitle = wf.title || "";
        this.currentPhase = wf.currentPhase ?? 0;
        this.anomalyIds = wf.anomalyIds || [];
        this.isAnalyzing = wf.status === "RUNNING";

        /* Rebuild left-panel analysis list by querying anomaly details from backend */
        await this.rebuildAnalysisListFromBackend();

        const workflowId = this.workflowId;
        if (!workflowId) {
          throw new Error("工作流 ID 缺失");
        }
        this.addLog(
          `载入深度分析工作流: ${workflowId.substring(0, 12)}... (阶段 ${this.currentPhase}, 状态 ${wf.status})`,
          "info"
        );

        const types: Array<{ backend: string; display: string }> = [
          { backend: "ORIGIN", display: "Origin" },
          { backend: "INTENT", display: "Intent" },
          { backend: "BLUE_PLAN", display: "Attack" },
          { backend: "RED_PLAN", display: "Defense" },
          { backend: "EVALUATION", display: "Evaluation" },
        ];

        for (const t of types) {
          try {
            const nodes = await listDeepAnalysisNodesByType(workflowId, t.backend);
            if (nodes.length > 0) {
              this.addNodeFromWorkflow(nodes, t.display);
            }
          } catch (err: any) {
            this.addLog(`加载${t.display}节点失败: ${err?.message}`, "warning");
          }
        }

        this.canAdvance = this.rawNodes.some((n) => n.type !== "Origin");

        if (this.isAnalyzing) {
          this.addLog(`阶段 ${this.currentPhase} 仍在执行中，恢复轮询...`, "info");
          const phaseMap: Record<number, { type: string; display: string }> = {
            1: { type: "INTENT", display: "Intent" },
            2: { type: "BLUE_PLAN", display: "Attack" },
            3: { type: "RED_PLAN", display: "Defense" },
            4: { type: "EVALUATION", display: "Evaluation" },
          };
          const info = phaseMap[this.currentPhase];
          if (info) {
            const pollResult = await this.pollPhaseNodes(workflowId, info.type, 180, 3000);
            this.isAnalyzing = false;
            this.addNodeFromWorkflow(pollResult, info.display);
          }
        }

        this.addLog(`工作流载入完成, 共 ${this.rawNodes.length} 个节点`, "success");
        return true;
      } catch (e: any) {
        this.addLog(`工作流载入失败: ${e?.message}`, "error");
        return false;
      }
    },

    /**
     * 进入深度分析页面时，按「所选异常」而非「某个工作流」恢复画布：
     * 调后端 by-anomalies 接口检查所选异常的已有分析结果（跨工作流），
     * 画布上只展示「最新执行的」工作流实例
     *（defaultWorkflowId = 最近更新 ORIGIN 所在的工作流）；
     * 所选异常跨多个工作流时不合并其链路，其余异常不画节点，
     * 仅保留在左侧列表供「加入当前分析 / 开始分析」，
     * 同时把该最新工作流实例复用为后续生成目标。
     * @param queryIds 从首页跳转时路由携带的异常ID列表；为空时从 homeStore.analysisList 恢复（页面刷新场景）
     */
    async restoreByAnomalies(queryIds?: string[]): Promise<boolean> {
      try {
        const { useHomeStore } = await import("./homeStore");
        const homeStore = useHomeStore();

        // 优先使用路由传入的 queryIds（首页跳转场景）
        if (queryIds && queryIds.length > 0) {
          this.addLog(`从首页携带 ${queryIds.length} 个异常事件进入深度分析`, "info");
          // 确认这些异常已加入 homeStore.analysisList
          for (const qId of queryIds) {
            if (!homeStore.analysisList.some((i: any) => i.id === qId || i.anomalyId === qId)) {
              try {
                const anomaly = await getAnomalyById(qId);
                homeStore.addToAnalysis({
                  id: anomaly.anomalyId,
                  itemId: anomaly.rowId,
                  title: anomaly.name || "未知警告",
                  count: anomaly.count || 0,
                  level: anomaly.threatLevel || "low",
                  threat: String(anomaly.threatScore ?? "75"),
                  threatConf: String(anomaly.confidence ?? "82"),
                  anomaly: String(anomaly.deviation ?? "94"),
                  anomalyConf: String(anomaly.deviationConf ?? "91"),
                  type: anomaly.type || "军事调动",
                  region: anomaly.location || "未知区域",
                  discoverTime: anomaly.eventTime || "",
                  duration: anomaly.duration || "",
                  isAnalyzed: true,
                });
              } catch {
                /* 忽略查询失败，使用 homeStore.analysisList 中的已有数据 */
              }
            }
          }
        } else if (
          (!homeStore.analysisList || homeStore.analysisList.length === 0) &&
          this.anomalyIds &&
          this.anomalyIds.length > 0
        ) {
          // 兜底：页面刷新后 homeStore.analysisList 可能未被持久化恢复（空数组），
          // 但本 store 的 anomalyIds 已持久化。此时用持久化的 anomalyIds 重建 analysisList，
          // 否则下面会把 this.anomalyIds 也覆盖为空，导致画布和左栏都空白。
          this.addLog("正在从持久化状态恢复异常列表...", "info");
          await this.rebuildAnalysisListFromBackend();
        }

        const anomalyIds = (homeStore.analysisList || [])
          .map((i: any) => i.id || i.anomalyId)
          .filter((id: string) => !!id);

        this.resetNodes();
        this.workflowId = null;
        this.anomalyIds = anomalyIds;
        this.anomalyId = null;
        this.coveredAnomalyIds = [];
        this.currentPhase = 0;
        this.canAdvance = false;

        if (anomalyIds.length === 0) {
          this.addLog("没有已选择的异常，画布为空", "info");
          return false;
        }

        const res = await getChainsByAnomalies(anomalyIds).catch(() => null);
        if (!res) {
          this.addLog("查询异常已有分析结果失败", "warning");
          return false;
        }

        // 标记哪些异常已有内容（用于左栏「开始分析」按钮的显隐）
        this.coveredAnomalyIds = res.coveredAnomalyIds || [];

        if (res.defaultWorkflowId) {
          // 画布只展示「最新执行的」工作流实例，不跨工作流合并：
          // by-anomalies 的链路是跨工作流的全局结果，直接追加会把多个
          // 工作流的链路同时画进画布；这里改用 loadWorkflowCore 按
          // defaultWorkflowId（最近更新 ORIGIN 所在工作流）完整还原，
          // 与左栏「载入分析」、tab 进入的「最新工作流」逻辑一致；
          // 属于其他工作流的异常不画节点，继续通过左栏
          // 「加入当前分析 / 开始分析」并入。
          this.addLog(
            `画布展示最新工作流实例 ${res.defaultWorkflowId.substring(0, 12)}...`,
            "info"
          );
          try {
            const wf = await getDeepAnalysisWorkflow(res.defaultWorkflowId);
            await this.loadWorkflowCore(wf);
          } catch (e: any) {
            // 加载失败时仍把该实例记为后续生成目标
            this.workflowId = res.defaultWorkflowId;
            this.addLog(
              `加载最新工作流实例失败: ${e?.message || "未知错误"}`,
              "error"
            );
          }
        }

        this.addLog(
          `已载入所选异常的分析结果` +
            (res.defaultWorkflowId
              ? `（最新工作流实例，画布共 ${this.rawNodes.length} 个节点）`
              : "（所选异常均无已生成内容，可点击开始分析）"),
          res.defaultWorkflowId ? "success" : "info"
        );
        return true;
      } catch (e: any) {
        this.addLog(`按异常恢复失败: ${e?.message}`, "error");
        return false;
      }
    },

    /**
     * 把 by-anomalies 返回的链路节点按阶段顺序「追加」进画布：
     * addNodeFromWorkflow 内部已按 nodeId 去重，绝不清空现有画布
     * （父 origin 先于子节点入画布，保证边能正确连上）。
     * 返回本次实际新增的节点数。
     */
    appendChainsFromByAnomalies(res: ByAnomaliesResult | null | undefined): number {
      if (!res) return 0;
      const before = this.rawNodes.length;
      if (res.origins?.length) this.addNodeFromWorkflow(res.origins, "Origin");
      if (res.intents?.length) this.addNodeFromWorkflow(res.intents, "Intent");
      if (res.bluePlans?.length) this.addNodeFromWorkflow(res.bluePlans, "Attack");
      if (res.redPlans?.length) this.addNodeFromWorkflow(res.redPlans, "Defense");
      if (res.evaluations?.length) this.addNodeFromWorkflow(res.evaluations, "Evaluation");
      return this.rawNodes.length - before;
    },

    /**
     * 1a-UX：已覆盖异常「加入当前分析」——加入工作流（后端幂等去重）+
     * 仅按 by-anomalies 已有链路追加画布展示，不调 LLM、不清空现有画布。
     * 返回实际新增的节点数；失败时抛错由调用方提示。
     */
    async joinAnomalyToCurrentFlow(anomalyId: string): Promise<number> {
      const workflowId = this.workflowId;
      if (!workflowId) throw new Error("当前没有进行中的分析流程");

      this.addLog(`将异常 ${anomalyId} 加入当前分析流程...`, "info");
      const workflow = await addAnomaliesToWorkflow(workflowId, [anomalyId]);
      this.anomalyIds = workflow.anomalyIds || [...this.anomalyIds, anomalyId];
      this.anomalyId = anomalyId;
      if (workflow.title) this.workflowTitle = workflow.title;
      if (!this.coveredAnomalyIds.includes(anomalyId)) {
        this.coveredAnomalyIds.push(anomalyId);
      }

      const res = await getChainsByAnomalies([anomalyId]);
      const added = this.appendChainsFromByAnomalies(res);
      this.addLog(
        `已加入异常 ${anomalyId}，载入 ${added} 个已有结果节点`,
        "success"
      );
      return added;
    },

    /**
     * 1a-UX：已覆盖但无工作流的异常「载入历史分析」——
     * 只做 by-anomalies 画布展示（不建 workflow、不 confirm、不 LLM）。
     */
    async loadHistoryAnomaly(anomalyId: string): Promise<number> {
      this.addLog(
        `载入异常 ${anomalyId} 的历史分析结果（不创建/变更工作流）...`,
        "info"
      );
      const res = await getChainsByAnomalies([anomalyId]);
      const added = this.appendChainsFromByAnomalies(res);
      this.addLog(
        `已载入异常 ${anomalyId} 的 ${added} 个历史结果节点`,
        added > 0 ? "success" : "warning"
      );
      return added;
    },

    /**
     * On page refresh or mount: query backend for ALL incomplete workflows,
     * restore the most recently updated one to the canvas, and expose the full
     * list via `workflowList` so the user can switch to any of them (e.g. 48/49).
     */
    async restoreExistingWorkflow(): Promise<boolean> {
      try {
        const incomplete = await listIncompleteWorkflows().catch(() => []);
        this.workflowList = incomplete || [];
        if (!incomplete || incomplete.length === 0) return false;

        /* 默认恢复「最近更新」的未完成工作流（最可能是用户正在使用的那个），
           而非仅按阶段高低——避免像 48/49 这类已生成意图但阶段较低的工作流被忽略。 */
        const latest = incomplete.reduce((best: any, w: any) => {
          const bu = best.updatedAt ? new Date(best.updatedAt).getTime() : 0;
          const wu = w.updatedAt ? new Date(w.updatedAt).getTime() : 0;
          if (wu !== bu) return wu > bu ? w : best;
          return (w.createdAt || "") >= (best.createdAt || "") ? w : best;
        }, incomplete[0]);

        return await this.loadWorkflow(latest);
      } catch (e: any) {
        this.addLog(`工作流恢复失败: ${e?.message}`, "error");
        return false;
      }
    },

    /**
     * Rebuild homeStore.analysisList by fetching anomaly details from backend.
     * Uses the workflow's anomalyIds to query backend, avoiding localStorage race conditions.
     */
    async rebuildAnalysisListFromBackend() {
      const { useHomeStore } = await import("./homeStore");
      const homeStore = useHomeStore();

      if (!this.anomalyIds || this.anomalyIds.length === 0) return;

      for (const anomalyId of this.anomalyIds) {
        try {
          const anomaly = await getAnomalyById(anomalyId);
          const exists = homeStore.analysisList.some(
            (item: any) => item.id === anomaly.anomalyId
          );
          if (!exists) {
            homeStore.addToAnalysis({
              id: anomaly.anomalyId,
              itemId: anomaly.rowId,
              title: anomaly.name || "未知警告",
              count: anomaly.count || 0,
              level: anomaly.threatLevel || "low",
              threat: String(anomaly.threatScore ?? "75"),
              threatConf: String(anomaly.confidence ?? "82"),
              anomaly: String(anomaly.deviation ?? "94"),
              anomalyConf: String(anomaly.deviationConf ?? "91"),
              type: anomaly.type || "军事调动",
              region: anomaly.location || "未知区域",
              discoverTime: anomaly.eventTime || "",
              duration: anomaly.duration || "",
              isAnalyzed: true,
            });
          }

          /* Also mark the corresponding warningMarker */
          const markerIndex = homeStore.warningMarkers.findIndex(
            (m: any) => m.id === anomaly.anomalyId
          );
          if (markerIndex >= 0) {
            homeStore.warningMarkers[markerIndex].isAnalyzed = true;
          }
        } catch (e: any) {
          this.addLog(`加载异常详情失败 (${anomalyId}): ${e?.message}`, "warning");
        }
      }
    },

    /**
     * 沿 意图→蓝方→红方→校验 逐级把「已分析好的下游节点」按全局 source_anomaly_id 去重
     * 重新挂回画布（只展示，不重新生成）。用于「并入新异常」重建工作流后，恢复之前
     * 已分析完整的链路，避免画布只显示意图、蓝/红/校验丢失。
     */
    async restoreChainFromDB() {
      if (!this.workflowId) return;

      const phases: Array<{ childType: "BLUE_PLAN" | "RED_PLAN" | "EVALUATION"; display: string; parentType: string; label: string }> = [
        { childType: "BLUE_PLAN", display: "Attack", parentType: "Intent", label: "蓝方方案" },
        { childType: "RED_PLAN", display: "Defense", parentType: "Attack", label: "红方方案" },
        { childType: "EVALUATION", display: "Evaluation", parentType: "Defense", label: "校验评估" },
      ];

      for (const p of phases) {
        const parents = this.rawNodes
          .filter((n) => n.type === p.parentType)
          .map((n) => n.id);
        if (parents.length === 0) continue;
        try {
          const r = await checkExistingSteps(this.workflowId, parents, p.childType);
          if (r.existingSteps && r.existingSteps.length > 0) {
            // 后端按 source_anomaly_id 全局去重，多个同异常父节点会返回重复子节点，
            // 这里按 nodeId 去重后再加入画布，避免重复布局和边计算。
            const uniqueSteps = Array.from(
              new Map(r.existingSteps.map((s: any) => [s.nodeId, s])).values()
            );
            this.addNodeFromWorkflow(uniqueSteps, p.display);
            this.addLog(
              `从库中恢复 ${uniqueSteps.length} 个${p.label}节点`,
              "success"
            );
          }
        } catch (e: any) {
          this.addLog(`恢复${p.label}链路失败: ${e?.message || "未知错误"}`, "warning");
        }
      }
    },

    waitForNodes(nodeType: string, timeout: number = 60000): Promise<boolean> {
      return new Promise((resolve) => {
        const interval = setInterval(() => {
          const hasNodes = this.rawNodes.some(
            (n) => n.type === nodeType
          );
          if (hasNodes) {
            clearInterval(interval);
            resolve(true);
          }
        }, 500);
        setTimeout(() => {
          clearInterval(interval);
          resolve(false);
        }, timeout);
      });
    },
  },

  persist: {
    storage: localStorage,
    pick: ["workflowId", "anomalyIds", "coveredAnomalyIds"],
  },
});
