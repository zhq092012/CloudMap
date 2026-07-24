import { deleteAgent, getAgentList, updateAgent } from "@/api/agents-api";
import type { AgentDefinition } from "@/types/agent";
import { defineStore } from "pinia";

interface AgentState {
  agentsList: AgentDefinition[];
  agents: AgentDefinition[];
  currentAgent: AgentDefinition | null;
  loading: boolean;
  error: string | null;
  currentTaskType:
    | "态势感知"
    | "潜在异常"
    | "意图穷举"
    | "蓝方方案"
    | "红方方案"
    | null; //当前的任务类型
  eventId: number | null;
}

export const useAgentStore = defineStore("agent", {
  state: (): AgentState => ({
    agents: [],
    currentAgent: null,
    loading: false,
    error: null,
    currentTaskType: null,
    eventId: null,
    agentsList: [],
  }),

  getters: {
    runningAgents(): AgentDefinition[] {
      return this.agentsList.filter((agent) => agent.enabled);
    },
  },

  actions: {
    async fetchAgentsData() {
      const res = await getAgentList();
      this.agentsList = res;
    },

    setAgents(agents: AgentDefinition[]) {
      this.agents = agents;
    },

    addAgent(agent: AgentDefinition) {
      const exists = this.agents.some((item) => item.id === agent.id);
      if (!exists) {
        this.agents.push(agent);
      }
    },

    updateAgent(agent: AgentDefinition) {
      const index = this.agents.findIndex((item) => item.id === agent.id);
      if (index !== -1) {
        this.agents[index] = { ...this.agents[index], ...agent };
      }
    },

    setCurrentAgent(agent: AgentDefinition | null) {
      this.currentAgent = agent;
    },
    async deleteCurrentAgent() {
      if (this.currentAgent) {
        await deleteAgent(this.currentAgent.id);
        this.currentAgent = null;
      }
    },
    async toggleCurrentAgentStatus() {
      if (this.currentAgent) {
        await updateAgent(this.currentAgent.id, {
          ...this.currentAgent,
          enabled: !this.currentAgent.enabled,
        });
      }
    },
    setLoading(loading: boolean) {
      this.loading = loading;
    },

    setError(error: string | null) {
      this.error = error;
    },
    // 设置当前的任务类型
    setCurrentTaskType(
      taskType:
        | "态势感知"
        | "潜在异常"
        | "意图穷举"
        | "蓝方方案"
        | "红方方案"
        | null,
    ) {
      this.currentTaskType = taskType;
    },

    // 设置当前的eventId
    setEventId(eventId: number | null) {
      this.eventId = eventId;
    },
    reset() {
      this.agents = [];
      this.currentAgent = null;
      this.loading = false;
      this.error = null;
      this.currentTaskType = null;
    },
  },
  share: {
    enable: true,
    initialize: true,
  },
  persist: {
    storage: localStorage,
    pick: ["agentsList", "currentTaskType", "eventId"],
  },
});
