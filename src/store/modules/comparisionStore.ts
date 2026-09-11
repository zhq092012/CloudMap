import { defineStore } from "pinia";

interface ComparisonNode {
  nodeId: string
  type: string
  summary: string
  confidence: number
  riskLevel?: string
  isRecommended?: boolean
  weaponMismatch?: boolean
  nodeData: Record<string, any>
}

interface ComparisonState {
  selectedComparisonId: string | null;
  isComparing: boolean;
  workflowId: string | null;
  anomalyIds: string[];
  currentNode: ComparisonNode | null;
  evaluationNodes: ComparisonNode[];
  sourceNodes: ComparisonNode[];
}

export const useComparisonStore = defineStore("comparison", {
  state: (): ComparisonState => ({
    selectedComparisonId: null,
    isComparing: false,
    workflowId: null,
    anomalyIds: [],
    currentNode: null,
    evaluationNodes: [],
    sourceNodes: [],
  }),

  getters: {
    getSelectedId: (state) => state.selectedComparisonId,
    getIsComparing: (state) => state.isComparing,
    getRecommendedPlan: (state) =>
      state.evaluationNodes.find((n) => n.isRecommended) || null,
    getRankedPlans: (state) =>
      [...state.evaluationNodes].sort(
        (a, b) => (b.confidence || 0) - (a.confidence || 0)
      ),
  },

  actions: {
    setSelectedComparisonId(id: string | null) {
      this.selectedComparisonId = id;
    },
    setComparingStatus(status: boolean) {
      this.isComparing = status;
    },
    setWorkflowData(workflowId: string, anomalyIds: string[]) {
      this.workflowId = workflowId;
      this.anomalyIds = anomalyIds;
    },
    setComparisonNode(node: ComparisonNode) {
      this.currentNode = node;
    },
    setEvaluationNodes(nodes: ComparisonNode[]) {
      this.evaluationNodes = nodes;
    },
    setSourceNodes(nodes: ComparisonNode[]) {
      this.sourceNodes = nodes;
    },
    resetComparison() {
      this.selectedComparisonId = null;
      this.isComparing = false;
      this.workflowId = null;
      this.anomalyIds = [];
      this.currentNode = null;
      this.evaluationNodes = [];
      this.sourceNodes = [];
    },
  },

  persist: {
    storage: localStorage,
    pick: [],
  },
});
