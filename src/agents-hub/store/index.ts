// ============================================================
// Self-contained Pinia store for the agents-hub subsystem.
// Mirrors agentbuilder's local state: token in localStorage, a
// `me()` auth probe, agents list cache, and current agent + tier.
// ============================================================
import { defineStore } from 'pinia';
import * as api from '../api';
import type { AgentDefinition, MeResponse, ShareTier } from '../types';

const TOKEN_KEY = 'claw_token';

export const useAgentHubStore = defineStore('agentHub', {
  state: () => ({
    token: localStorage.getItem(TOKEN_KEY) || '',
    me: null as MeResponse | null,
    agents: [] as AgentDefinition[],
    loading: false,
    error: '' as string,
    currentAgent: null as AgentDefinition | null,
  }),
  getters: {
    isAuthed: (s): boolean => !!s.token,
    isAdmin: (s): boolean => !!s.me?.isAdmin,
    tier: (s): ShareTier | null => s.currentAgent?.tierForCurrentUser ?? null,
  },
  actions: {
    setToken(t: string) {
      this.token = t;
      localStorage.setItem(TOKEN_KEY, t);
    },
    clearToken() {
      this.token = '';
      localStorage.removeItem(TOKEN_KEY);
    },
    async probe(): Promise<boolean> {
      if (!this.token) return false;
      try {
        this.me = await api.me();
        return true;
      } catch {
        return false;
      }
    },
    async login(username: string, password: string) {
      const res = await api.login(username, password);
      this.setToken(res.token);
      this.me = {
        userId: res.userId,
        username: res.username,
        roles: res.roles,
        isAdmin: res.roles.some((r) => r.toLowerCase() === 'admin'),
        aiAvailable: false,
      };
    },
    logout() {
      this.clearToken();
      this.me = null;
      this.agents = [];
      this.currentAgent = null;
    },
    async fetchAgents() {
      this.loading = true;
      this.error = '';
      try {
        this.agents = await api.listAgents();
      } catch (e) {
        this.error = (e as Error).message;
      } finally {
        this.loading = false;
      }
    },
    async fetchAgent(id: string): Promise<AgentDefinition | null> {
      try {
        this.currentAgent = await api.getAgent(id);
        return this.currentAgent;
      } catch (e) {
        this.error = (e as Error).message;
        this.currentAgent = null;
        return null;
      }
    },
    async cloneAgent(sourceId: string, req: { newAgentId?: string; name?: string } = {}) {
      const created = await api.cloneAgent(sourceId, req);
      await this.fetchAgents();
      return created;
    },
  },
});
