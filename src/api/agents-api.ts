import { requestAPI } from "@/utils/http/request";
import type { AgentDefinition } from "@/types/agent";

// ==========================================
// Agent 管理接口
// ==========================================

/** 1. 获取 Agent 列表 */
export const getAgentList = () => {
  const url = `/api/agents`;
  return requestAPI.get<AgentDefinition[]>(url);
};

/** 2. 根据 ID 获取指定 Agent 的详细信息 */
export const getAgentById = (id: number | string) => {
  const url = `/api/agents/${id}`;
  return requestAPI.get<AgentDefinition>(url);
};

/** 3. 注册一个新的 Agent 定义 */
export const createAgent = (data: Partial<AgentDefinition>) => {
  const url = `/api/agents`;
  return requestAPI.post<AgentDefinition>(url, data);
};

/** 4. 更新指定 Agent 的定义信息 */
export const updateAgent = (id: number | string, data: AgentDefinition) => {
  const url = `/api/agents/${id}`;
  return requestAPI.put<AgentDefinition>(url, data);
};

/** 5. 删除指定 Agent */
export const deleteAgent = (id: number | string) => {
  const url = `/api/agents/${id}`;
  return requestAPI.delete<void>(url);
};

/** 6. 切换 Agent 的启用/禁用状态 */
export const toggleAgentStatus = (id: number | string) => {
  const url = `/api/agents/${id}/toggle`;
  return requestAPI.post<void>(url);
};
