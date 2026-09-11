// ==========================================
// 基础数据模型
// ==========================================

/** Agent 定义模型 */
export interface AgentDefinition {
  id: number;
  name: string;
  displayName: string;
  description: string;
  agentType: string;
  category: string;
  modelName: string;
  skillNames: string[];
  configJson: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  stance: string; // 红方/蓝方
}
