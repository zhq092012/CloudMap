// ============================================================
// Ported data models from agentbuilder-main/frontend/src/api/*.ts
// Self-contained types for the agents-hub subsystem.
// ============================================================

export type ShareTier = 'CLONE' | 'RUN' | 'EDIT';
export type GranteeType = 'USER' | 'WORKSPACE';

export interface AgentShareGrant {
  granteeType: GranteeType;
  granteeId: string;
  tier: ShareTier;
  createdAt: number;
  createdBy: string;
}

export interface AgentDefinition {
  id: string;
  name: string;
  description?: string;
  sysPrompt?: string;
  maxIters?: number;
  tools?: string[];
  scope: 'global' | 'user';
  ownerId?: string;
  createdAt: number;
  updatedAt: number;
  shares?: AgentShareGrant[];
  runAs?: string;
  forkOf?: string;
  workspacePath?: string;
  tierForCurrentUser?: ShareTier;
  category?: string;
  tags?: string[];
  status?: string;
  knowledgeBaseIds?: string[];
}

export interface AgentDraft {
  name: string;
  description?: string;
  sysPrompt?: string;
  suggestedTools?: string[];
  suggestedSkills?: { name: string; content: string }[];
  suggestedSubagents?: { name: string; content: string }[];
}

export interface AgentCreateRequest {
  id?: string;
  name: string;
  description?: string;
  sysPrompt?: string;
  maxIters?: number;
  templateId?: string;
  aiDraft?: AgentDraft;
  workspacePath?: string;
  category?: string;
  tags?: string[];
  knowledgeBaseIds?: string[];
}

// ---- knowledge base ----
export interface KbSummary {
  id: string;
  name: string;
  description?: string;
  dimensions: number;
  docCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface KbDocument {
  kbRowId: number;
  docId: string;
  fileName: string;
  fileSize?: number;
  chunkCount: number;
  status: string;
  errorMsg?: string;
  createdAt: number;
  updatedAt: number;
}

export interface KbSearchHit {
  kbName: string;
  kbId: string;
  fileName: string;
  score: number;
  content: string;
  docId: string;
}

export interface KbParentView {
  parentPresent: boolean;
  parentTotalCount: number;
  text: string;
}

export interface KbSearchResponse {
  hits: KbSearchHit[];
  parent: KbParentView | null;
}

// ---- auth ----
export interface LoginResponse {
  token: string;
  userId: string;
  username: string;
  roles: string[];
}
export interface MeResponse {
  userId: string;
  username: string;
  roles: string[];
  aiAvailable?: boolean;
  isAdmin: boolean;
}
export interface UserProfile {
  userId: string;
  username: string;
  roles: string[];
}

// ---- chat ----
export interface ChatRequest {
  message: string;
  sessionKey?: string;
}
export type ChatEventType = 'token' | 'tool_call' | 'tool_result' | 'done' | 'error' | 'processing' | string;
export interface ChatEvent {
  type: ChatEventType;
  data?: string;
  message?: string;
  toolName?: string;
  toolInput?: string;
  toolResult?: string;
  error?: string;
  sessionKey?: string;
}
export interface CurrentSession {
  sessionKey: string | null;
  exists: boolean;
}

// ---- clone ----
export interface CloneAgentRequest {
  newAgentId?: string;
  name?: string;
}

// ---- sessions ----
export interface InboxEntry {
  sessionKey: string;
  sessionId: string;
  agentId: string;
  label?: string;
  lastActivityMs: number;
  lastMessage?: string;
  unread: boolean;
}
export interface InboxOptions {
  limit?: number;
  unreadOnly?: boolean;
}
export interface TurnEntry {
  id: string;
  parentId?: string;
  role: 'USER' | 'ASSISTANT' | 'TOOL' | string;
  content?: string;
  timestampMs: number;
  toolName?: string;
  toolInput?: string;
  toolResult?: string;
}
export interface ResetResult {
  sessionKey: string;
  resetAt: number;
}
export interface ReadStateResult {
  sessionKey: string;
  unread: boolean;
  readAt: number;
}

// ---- skills ----
export type SkillOrigin = 'custom' | 'marketplace';
export interface SkillMarketplaceMeta {
  repoType: string;
  repoLocation: string;
  originalName: string;
  installedAt: number;
}
export interface WorkspaceSkillInfo {
  dirName: string;
  name: string;
  description?: string;
  sizeBytes: number;
  resourceCount: number;
  hasReferences: boolean;
  hasScripts: boolean;
  origin: SkillOrigin;
  marketplace?: SkillMarketplaceMeta;
}
export interface WorkspaceSkillDetail {
  name: string;
  description?: string;
  markdown: string;
  resources: Record<string, string>;
}
export interface InstallResult {
  status: 'installed' | 'conflict';
  conflictName?: string;
  installed?: WorkspaceSkillInfo;
}
export interface MarketplaceInstallRequest {
  marketplaceId: string;
  skillName: string;
  targetName?: string;
  overwrite?: boolean;
}

// ---- subagents ----
export interface SubagentInfo {
  name: string;
  description: string;
  model?: string;
  maxIters?: number;
  tools?: string[];
  workspaceMode: 'isolated' | 'shared';
  workspacePath?: string;
  hasInlineBody: boolean;
  sourceAgentId?: string;
}
export interface SubagentUpsertRequest {
  description: string;
  model?: string;
  maxIters?: number;
  tools?: string[];
  workspaceMode?: 'isolated' | 'shared';
  workspacePath?: string;
  inlineBody?: string;
  sourceAgentId?: string;
}

// ---- tools ----
export interface ActiveTool {
  name: string;
  description?: string;
  source: 'built-in' | 'mcp' | string;
}
export interface ActiveToolsResponse {
  tools: ActiveTool[];
  warnings?: string[];
}
export interface BuiltinToolInfo {
  id: string;
  description?: string;
  group?: string;
}
export interface McpServerConfig {
  transport: string;
  url?: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  enableTools?: string[];
  timeout?: number;
}
export interface ToolsConfig {
  allow?: string[];
  deny?: string[];
  mcpServers?: Record<string, McpServerConfig>;
}
export interface McpCatalogEntry {
  id: string;
  name: string;
  description?: string;
  transport: string;
  url?: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  requiredEnv?: string[];
  docsUrl?: string;
}

// ---- workspace ----
export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size?: number;
  children?: FileNode[];
}
export interface WorkspaceSummary {
  agentId: string;
  workspacePath: string;
  exists: boolean;
  agentsMdExists: boolean;
  memoryMdExists: boolean;
  skillCount: number;
  subagentCount: number;
  dailyMemoryCount: number;
}

// ---- channels ----
export type BindingTier = 'peer' | 'parentPeer' | 'guildRoles' | 'guild' | 'team' | 'account' | 'channel';
export interface ChannelInfo {
  channelId: string;
  type?: string;
  dmScope?: string;
  defaultAgentId?: string;
  disabled?: boolean;
  started: boolean;
}
export interface AgentBinding {
  channelId: string;
  index: number;
  tier: BindingTier;
  peer?: string;
  parentPeer?: string;
  guild?: string;
  roles?: string[];
  team?: string;
  account?: string;
  channel?: string;
  sessionScope?: string;
}
export interface BindingCreateRequest {
  tier: BindingTier;
  peer?: string;
  parentPeer?: string;
  guild?: string;
  roles?: string[];
  team?: string;
  account?: string;
  channel?: string;
  sessionScope?: string;
}
export interface BindingConfigEntry extends BindingCreateRequest {
  index: number;
}
export interface ChannelDetail {
  channelId: string;
  type: string;
  dmScope?: string;
  defaultAgentId?: string;
  properties: Record<string, unknown>;
  bindings: AgentBinding[];
  disabled?: boolean;
  started?: boolean;
}
export interface ChannelUpsertRequest {
  type: string;
  dmScope?: string;
  defaultAgentId?: string;
  properties?: Record<string, unknown>;
}

// ---- marketplaces ----
export type MarketplaceType = 'git' | 'nacos';
export interface MarketplaceSummary {
  id: string;
  type: MarketplaceType;
  properties: Record<string, unknown>;
}
export interface MarketplaceWriteRequest {
  id: string;
  type: MarketplaceType;
  properties: Record<string, unknown>;
}
export interface TestConnectionResult {
  ok: boolean;
  message?: string;
  skillCount?: number;
}
export interface MarketSkillBrief {
  name: string;
  description?: string;
  version?: string;
}
export interface MarketSkillDetail {
  name: string;
  description?: string;
  markdown: string;
  resources: Record<string, string>;
}

// ---- shares ----
export interface AddShareRequest {
  granteeType: GranteeType;
  granteeId: string | null;
  tier: ShareTier;
}

// ---- activity ----
export interface ActivityEvent {
  id: string;
  timestampMs: number;
  actorUserId?: string;
  actorUsername?: string;
  action: string;
  target?: string;
  metadata?: Record<string, unknown>;
}

// ---- admin ----
export interface AdminUserView {
  userId: string;
  username: string;
  roles: string[];
}
export interface CreateUserRequest {
  username: string;
  initialPassword?: string;
  roles: string[];
}
export interface CreateUserResponse {
  user: AdminUserView;
  generatedPassword?: string;
}

// ---- templates ----
export interface TemplateSummary {
  id: string;
  name: string;
  description: string;
  tags: string[];
  agentsMdPreview: string;
}
export interface TemplateFile {
  path: string;
  content: string;
}
export interface TemplateDetail {
  id: string;
  name: string;
  description: string;
  tags: string[];
  files: TemplateFile[];
}
