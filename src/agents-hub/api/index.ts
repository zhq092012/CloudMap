// ============================================================
// Ported API layer from agentbuilder-main/frontend/src/api/*.ts
// Self-contained: uses fetch + localStorage `claw_token` bearer auth,
// mirroring agentbuilder's exact HTTP methods/paths.
// ============================================================
import type {
  AgentDefinition,
  AgentDraft,
  AgentCreateRequest,
  AgentShareGrant,
  GranteeType,
  LoginResponse,
  MeResponse,
  UserProfile,
  ChatRequest,
  ChatEvent,
  CurrentSession,
  CloneAgentRequest,
  InboxEntry,
  InboxOptions,
  TurnEntry,
  ResetResult,
  ReadStateResult,
  WorkspaceSkillInfo,
  WorkspaceSkillDetail,
  InstallResult,
  MarketplaceInstallRequest,
  SubagentInfo,
  SubagentUpsertRequest,
  ActiveToolsResponse,
  BuiltinToolInfo,
  ToolsConfig,
  McpCatalogEntry,
  FileNode,
  WorkspaceSummary,
  ChannelInfo,
  AgentBinding,
  BindingCreateRequest,
  ChannelDetail,
  ChannelUpsertRequest,
  MarketplaceSummary,
  MarketplaceWriteRequest,
  TestConnectionResult,
  MarketSkillBrief,
  MarketSkillDetail,
  AddShareRequest,
  ActivityEvent,
  AdminUserView,
  CreateUserRequest,
  CreateUserResponse,
  TemplateSummary,
  TemplateDetail,
  KbSummary,
  KbDocument,
  KbSearchHit,
  KbSearchResponse,
} from '../types';

const TOKEN_KEY = 'claw_token';

// ---------- token / auth helpers ----------
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}
export function decodeJwt(token: string): Record<string, unknown> {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return {};
  }
}
export function getUsername(): string {
  const token = getToken();
  if (!token) return '';
  const p = decodeJwt(token);
  return (p.username as string) || (p.sub as string) || '';
}
export function getUserId(): string {
  const token = getToken();
  if (!token) return '';
  const p = decodeJwt(token);
  return (p.sub as string) || (p.userId as string) || '';
}
export function getRoles(): string[] {
  const token = getToken();
  if (!token) return [];
  const p = decodeJwt(token);
  return Array.isArray(p.roles) ? (p.roles as string[]) : [];
}
export function isAdmin(): boolean {
  return getRoles().some((r) => r.toLowerCase() === 'admin');
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
function jsonHeaders(): Record<string, string> {
  return { ...authHeaders(), 'Content-Type': 'application/json' };
}

async function readError(res: Response, fallback: string): Promise<Error> {
  try {
    const body = await res.json();
    if (body && typeof body === 'object' && 'message' in body && typeof body.message === 'string') {
      return new Error(body.message);
    }
  } catch {
    // ignore
  }
  return new Error(`${fallback} (${res.status})`);
}
async function asError(res: Response): Promise<never> {
  const msg = await res.text().catch(() => `${res.status}`);
  throw new Error(msg || `${res.status}`);
}

// ===================== auth =====================
export async function login(username: string, password: string): Promise<LoginResponse> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error('Invalid credentials');
  return res.json();
}
export async function me(): Promise<MeResponse> {
  const res = await fetch('/api/auth/me', { headers: authHeaders() });
  if (!res.ok) throw new Error('Unauthorized');
  return res.json();
}
export async function getProfile(): Promise<UserProfile> {
  const res = await fetch('/api/user/profile', { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch profile');
  return res.json();
}
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const res = await fetch('/api/user/change-password', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(msg || 'Failed to change password');
  }
}

// ===================== agents =====================
export async function listAgents(): Promise<AgentDefinition[]> {
  const res = await fetch('/api/agents', { headers: authHeaders() });
  if (!res.ok) throw new Error(`Failed to list agents: ${res.status}`);
  return res.json();
}
export async function getAgent(id: string): Promise<AgentDefinition> {
  const res = await fetch(`/api/agents/${encodeURIComponent(id)}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Failed to load agent: ${res.status}`);
  return res.json();
}
export async function createAgent(req: AgentCreateRequest): Promise<AgentDefinition> {
  const res = await fetch('/api/agents', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => `${res.status}`);
    throw new Error(`Failed to create agent: ${msg}`);
  }
  return res.json();
}
export async function updateAgent(id: string, req: AgentCreateRequest): Promise<AgentDefinition> {
  const res = await fetch(`/api/agents/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: jsonHeaders(),
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => `${res.status}`);
    throw new Error(`Failed to update agent: ${msg}`);
  }
  return res.json();
}
export async function deleteAgent(id: string): Promise<void> {
  const res = await fetch(`/api/agents/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(`Failed to delete agent: ${res.status}`);
  }
}
export async function draftAgentWithAi(description: string): Promise<AgentDraft> {
  const res = await fetch('/api/agents/draft', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ description }),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => `${res.status}`);
    throw new Error(msg || `Failed to draft agent: ${res.status}`);
  }
  return res.json();
}

// ===================== clone =====================
export async function cloneAgent(
  sourceAgentId: string,
  req: CloneAgentRequest = {},
): Promise<AgentDefinition> {
  const res = await fetch(`/api/agents/${encodeURIComponent(sourceAgentId)}/clone`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => `${res.status}`);
    throw new Error(msg || `Clone failed: ${res.status}`);
  }
  return res.json();
}

// ===================== chat =====================
export async function currentSession(agentId: string): Promise<CurrentSession> {
  const res = await fetch(`/api/agents/${encodeURIComponent(agentId)}/chat/session`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to resolve current session: ${res.status}`);
  return res.json();
}
export async function* stream(
  agentId: string,
  req: ChatRequest,
  opts?: { signal?: AbortSignal },
): AsyncGenerator<ChatEvent> {
  let res: Response;
  try {
    res = await fetch(`/api/agents/${encodeURIComponent(agentId)}/chat/stream`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(req),
      signal: opts?.signal,
    });
  } catch (e) {
    if (opts?.signal?.aborted) return;
    throw e;
  }
  if (!res.ok || !res.body) throw new Error(`Chat stream failed: ${res.status}`);

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  while (true) {
    let value: Uint8Array | undefined;
    let done = false;
    try {
      ({ value, done } = await reader.read());
    } catch (e) {
      if (opts?.signal?.aborted) return;
      throw e;
    }
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf('\n\n')) >= 0) {
      const evt = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      const lines = evt.split('\n');
      let data = '';
      for (const ln of lines) if (ln.startsWith('data:')) data += ln.slice(5).trim();
      if (!data) continue;
      try {
        yield JSON.parse(data) as ChatEvent;
      } catch {
        yield { type: 'token', data } as ChatEvent;
      }
    }
  }
}

// ===================== sessions =====================
export async function inbox(agentId: string, opts: InboxOptions = {}): Promise<InboxEntry[]> {
  const params = new URLSearchParams();
  if (opts.limit != null) params.set('limit', String(opts.limit));
  if (opts.unreadOnly) params.set('unreadOnly', 'true');
  const qs = params.toString();
  const url = `/api/agents/${encodeURIComponent(agentId)}/sessions/inbox${qs ? `?${qs}` : ''}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to load inbox');
  return res.json();
}
export async function turns(agentId: string, sessionKey: string): Promise<TurnEntry[]> {
  const res = await fetch(
    `/api/agents/${encodeURIComponent(agentId)}/sessions/${encodeURIComponent(sessionKey)}`,
    { headers: authHeaders() },
  );
  if (!res.ok) throw new Error('Failed to fetch session turns');
  return res.json();
}
export async function resetSession(agentId: string, sessionKey: string): Promise<ResetResult> {
  const res = await fetch(
    `/api/agents/${encodeURIComponent(agentId)}/sessions/${encodeURIComponent(sessionKey)}/reset`,
    { method: 'POST', headers: authHeaders() },
  );
  if (!res.ok) throw new Error('Failed to reset session');
  return res.json();
}
export async function markRead(agentId: string, sessionKey: string): Promise<ReadStateResult> {
  const res = await fetch(
    `/api/agents/${encodeURIComponent(agentId)}/sessions/${encodeURIComponent(sessionKey)}/read`,
    { method: 'PATCH', headers: authHeaders() },
  );
  if (!res.ok) throw new Error('Failed to mark session as read');
  return res.json();
}
export async function deleteSession(agentId: string, sessionKey: string): Promise<void> {
  const res = await fetch(
    `/api/agents/${encodeURIComponent(agentId)}/sessions/${encodeURIComponent(sessionKey)}`,
    { method: 'DELETE', headers: authHeaders() },
  );
  if (!res.ok && res.status !== 204) throw new Error('Failed to delete session');
}

// ===================== skills =====================
export async function listWorkspaceSkills(agentId: string): Promise<WorkspaceSkillInfo[]> {
  const res = await fetch(`/api/agents/${encodeURIComponent(agentId)}/skills/workspace`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw await readError(res, 'Failed to list workspace skills');
  return res.json();
}
export async function getWorkspaceSkill(
  agentId: string,
  name: string,
): Promise<WorkspaceSkillDetail> {
  const res = await fetch(
    `/api/agents/${encodeURIComponent(agentId)}/skills/workspace/${encodeURIComponent(name)}`,
    { headers: authHeaders() },
  );
  if (!res.ok) throw await readError(res, 'Failed to load workspace skill');
  return res.json();
}
export async function upsertWorkspaceSkill(
  agentId: string,
  name: string,
  markdown: string,
  resources?: Record<string, string>,
): Promise<WorkspaceSkillInfo> {
  const res = await fetch(
    `/api/agents/${encodeURIComponent(agentId)}/skills/workspace/${encodeURIComponent(name)}`,
    {
      method: 'PUT',
      headers: jsonHeaders(),
      body: JSON.stringify({ markdown, resources }),
    },
  );
  if (!res.ok) throw await readError(res, 'Failed to save workspace skill');
  return res.json();
}
export async function deleteWorkspaceSkill(agentId: string, name: string): Promise<void> {
  const res = await fetch(
    `/api/agents/${encodeURIComponent(agentId)}/skills/workspace/${encodeURIComponent(name)}`,
    { method: 'DELETE', headers: authHeaders() },
  );
  if (!res.ok && res.status !== 204) throw await readError(res, 'Failed to delete skill');
}
export async function installFromMarketplace(
  agentId: string,
  req: MarketplaceInstallRequest,
): Promise<InstallResult> {
  const res = await fetch(
    `/api/agents/${encodeURIComponent(agentId)}/skills/workspace/marketplace-install`,
    {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(req),
    },
  );
  if (res.status === 409) {
    return { status: 'conflict', conflictName: req.targetName ?? req.skillName };
  }
  if (!res.ok) throw await readError(res, 'Failed to install skill');
  const installed = (await res.json()) as WorkspaceSkillInfo;
  return { status: 'installed', installed };
}

// ===================== subagents =====================
function subBase(agentId: string): string {
  return `/api/agents/${encodeURIComponent(agentId)}/workspace/subagents`;
}
export async function listSubagents(agentId: string): Promise<SubagentInfo[]> {
  const res = await fetch(subBase(agentId), { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to list subagents');
  return res.json();
}
export async function upsertSubagent(
  agentId: string,
  name: string,
  req: SubagentUpsertRequest,
): Promise<SubagentInfo> {
  const res = await fetch(`${subBase(agentId)}/${encodeURIComponent(name)}`, {
    method: 'PUT',
    headers: jsonHeaders(),
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => `${res.status}`);
    throw new Error(`Failed to save subagent: ${msg}`);
  }
  return res.json();
}
export async function createFromAgent(
  agentId: string,
  sourceAgentId: string,
  name?: string,
): Promise<SubagentInfo> {
  const res = await fetch(`${subBase(agentId)}/from-agent`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ sourceAgentId, name }),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => `${res.status}`);
    throw new Error(`Failed to create subagent from agent: ${msg}`);
  }
  return res.json();
}
export async function deleteSubagent(agentId: string, name: string): Promise<void> {
  const res = await fetch(`${subBase(agentId)}/${encodeURIComponent(name)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok && res.status !== 204) throw new Error('Failed to delete subagent');
}

// ===================== tools =====================
function toolsBase(agentId: string): string {
  return `/api/agents/${encodeURIComponent(agentId)}/tools`;
}
export async function fetchActive(agentId: string): Promise<ActiveToolsResponse> {
  const res = await fetch(`${toolsBase(agentId)}/active`, { headers: authHeaders() });
  if (!res.ok) throw await readError(res, 'Failed to load active tools');
  return res.json();
}
export async function fetchConfig(agentId: string): Promise<ToolsConfig> {
  const res = await fetch(`${toolsBase(agentId)}/config`, { headers: authHeaders() });
  if (!res.ok) throw await readError(res, 'Failed to load tools config');
  return res.json();
}
export async function saveConfig(agentId: string, cfg: ToolsConfig): Promise<ToolsConfig> {
  const res = await fetch(`${toolsBase(agentId)}/config`, {
    method: 'PUT',
    headers: jsonHeaders(),
    body: JSON.stringify(cfg),
  });
  if (!res.ok) throw await readError(res, 'Failed to save tools config');
  return res.json();
}
export async function fetchBuiltinCatalog(agentId: string): Promise<BuiltinToolInfo[]> {
  const res = await fetch(`${toolsBase(agentId)}/catalog/builtins`, { headers: authHeaders() });
  if (!res.ok) throw await readError(res, 'Failed to load built-in catalog');
  return res.json();
}
export async function fetchMcpCatalog(agentId: string): Promise<McpCatalogEntry[]> {
  const res = await fetch(`${toolsBase(agentId)}/catalog/mcp-servers`, { headers: authHeaders() });
  if (!res.ok) throw await readError(res, 'Failed to load MCP catalog');
  return res.json();
}

// ===================== workspace =====================
function wsBase(agentId: string): string {
  return `/api/agents/${encodeURIComponent(agentId)}/workspace`;
}
export async function summary(agentId: string): Promise<WorkspaceSummary> {
  const res = await fetch(wsBase(agentId), { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to load workspace summary');
  return res.json();
}
export async function tree(agentId: string, recursive = true): Promise<FileNode[]> {
  const res = await fetch(`${wsBase(agentId)}/files?recursive=${recursive}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to load workspace files');
  return res.json();
}
export async function readFile(agentId: string, path: string): Promise<string> {
  const res = await fetch(`${wsBase(agentId)}/file?path=${encodeURIComponent(path)}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to read file');
  return res.text();
}
export async function writeFile(agentId: string, path: string, content: string): Promise<void> {
  const res = await fetch(`${wsBase(agentId)}/file?path=${encodeURIComponent(path)}`, {
    method: 'PUT',
    headers: jsonHeaders(),
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error('Failed to write file');
}
export async function createNode(agentId: string, path: string): Promise<void> {
  const res = await fetch(
    `${wsBase(agentId)}/file?path=${encodeURIComponent(path)}&type=file`,
    { method: 'POST', headers: authHeaders() },
  );
  if (!res.ok) throw new Error('Failed to create file');
}
export async function moveNode(agentId: string, from: string, to: string): Promise<void> {
  const res = await fetch(`${wsBase(agentId)}/file/move`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ from, to }),
  });
  if (!res.ok) throw new Error('Failed to move file');
}
export async function deleteNode(agentId: string, path: string): Promise<void> {
  const res = await fetch(`${wsBase(agentId)}/file?path=${encodeURIComponent(path)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok && res.status !== 204) throw new Error('Failed to delete file');
}
export async function uploadFile(agentId: string, path: string, file: File): Promise<void> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(`${wsBase(agentId)}/upload?path=${encodeURIComponent(path)}`, {
    method: 'POST',
    headers: authHeaders(),
    body: fd,
  });
  if (!res.ok) throw new Error('Failed to upload file');
}

// ===================== channels =====================
export async function listChannels(): Promise<ChannelInfo[]> {
  const res = await fetch('/api/channels', { headers: authHeaders() });
  if (!res.ok) return asError(res);
  return res.json();
}
export async function listChannelTypes(): Promise<string[]> {
  const res = await fetch('/api/channels/types', { headers: authHeaders() });
  if (!res.ok) return asError(res);
  return res.json();
}
export async function getChannelDetail(channelId: string): Promise<ChannelDetail> {
  const res = await fetch(`/api/channels/${encodeURIComponent(channelId)}`, {
    headers: authHeaders(),
  });
  if (!res.ok) return asError(res);
  return res.json();
}
export async function createChannel(req: ChannelUpsertRequest): Promise<ChannelDetail> {
  const res = await fetch('/api/channels', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(req),
  });
  if (!res.ok) return asError(res);
  return res.json();
}
export async function updateChannel(
  channelId: string,
  req: ChannelUpsertRequest,
): Promise<ChannelDetail> {
  const res = await fetch(`/api/channels/${encodeURIComponent(channelId)}`, {
    method: 'PUT',
    headers: jsonHeaders(),
    body: JSON.stringify(req),
  });
  if (!res.ok) return asError(res);
  return res.json();
}
export async function deleteChannel(channelId: string): Promise<void> {
  const res = await fetch(`/api/channels/${encodeURIComponent(channelId)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok && res.status !== 204) return asError(res);
}
export async function enableChannel(channelId: string): Promise<void> {
  const res = await fetch(`/api/channels/${encodeURIComponent(channelId)}/enable`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok && res.status !== 204) return asError(res);
}
export async function disableChannel(channelId: string): Promise<void> {
  const res = await fetch(`/api/channels/${encodeURIComponent(channelId)}/disable`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok && res.status !== 204) return asError(res);
}
export async function listAgentBindings(agentId: string): Promise<AgentBinding[]> {
  const res = await fetch(`/api/agents/${encodeURIComponent(agentId)}/bindings`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to load agent bindings');
  return res.json();
}
export async function addBinding(
  agentId: string,
  req: BindingCreateRequest,
): Promise<AgentBinding> {
  const res = await fetch(`/api/agents/${encodeURIComponent(agentId)}/bindings`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => `${res.status}`);
    throw new Error(msg || 'Failed to add binding');
  }
  return res.json();
}
export async function updateBinding(
  agentId: string,
  channelId: string,
  index: number,
  req: BindingCreateRequest,
): Promise<AgentBinding> {
  const url = `/api/agents/${encodeURIComponent(agentId)}/bindings/${index}?channelId=${encodeURIComponent(channelId)}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: jsonHeaders(),
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error('Failed to update binding');
  return res.json();
}
export async function deleteBinding(
  agentId: string,
  channelId: string,
  index: number,
): Promise<void> {
  const url = `/api/agents/${encodeURIComponent(agentId)}/bindings/${index}?channelId=${encodeURIComponent(channelId)}`;
  const res = await fetch(url, { method: 'DELETE', headers: authHeaders() });
  if (!res.ok && res.status !== 204) throw new Error('Failed to delete binding');
}
export async function setChannelDefault(agentId: string, channelId: string): Promise<void> {
  const res = await fetch(
    `/api/agents/${encodeURIComponent(agentId)}/channels/${encodeURIComponent(channelId)}/default`,
    { method: 'POST', headers: authHeaders() },
  );
  if (!res.ok) throw new Error('Failed to set channel default');
}

// ===================== marketplaces =====================
const MP_BASE = '/api/marketplaces';
export async function listMarketplaces(): Promise<MarketplaceSummary[]> {
  const res = await fetch(MP_BASE, { headers: authHeaders() });
  if (!res.ok) throw await readError(res, 'Failed to list marketplaces');
  return res.json();
}
export async function createMarketplace(req: MarketplaceWriteRequest): Promise<MarketplaceSummary> {
  const res = await fetch(MP_BASE, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(req),
  });
  if (!res.ok) throw await readError(res, 'Failed to create marketplace');
  return res.json();
}
export async function updateMarketplace(
  id: string,
  req: MarketplaceWriteRequest,
): Promise<MarketplaceSummary> {
  const res = await fetch(`${MP_BASE}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: jsonHeaders(),
    body: JSON.stringify(req),
  });
  if (!res.ok) throw await readError(res, 'Failed to update marketplace');
  return res.json();
}
export async function deleteMarketplace(id: string): Promise<void> {
  const res = await fetch(`${MP_BASE}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok && res.status !== 204) throw await readError(res, 'Failed to delete marketplace');
}
export async function testMarketplaceTransient(
  req: MarketplaceWriteRequest,
): Promise<TestConnectionResult> {
  const res = await fetch(`${MP_BASE}/test`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(req),
  });
  if (!res.ok) throw await readError(res, 'Failed to test marketplace');
  return res.json();
}
export async function testMarketplaceExisting(id: string): Promise<TestConnectionResult> {
  const res = await fetch(`${MP_BASE}/${encodeURIComponent(id)}/test`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok) throw await readError(res, 'Failed to test marketplace');
  return res.json();
}
export async function listMarketplaceSkills(id: string): Promise<MarketSkillBrief[]> {
  const res = await fetch(`${MP_BASE}/${encodeURIComponent(id)}/skills`, { headers: authHeaders() });
  if (!res.ok) throw await readError(res, 'Failed to list marketplace skills');
  return res.json();
}
export async function getMarketplaceSkill(id: string, name: string): Promise<MarketSkillDetail> {
  const res = await fetch(
    `${MP_BASE}/${encodeURIComponent(id)}/skills/${encodeURIComponent(name)}`,
    { headers: authHeaders() },
  );
  if (!res.ok) throw await readError(res, 'Failed to load marketplace skill');
  return res.json();
}

// ===================== shares =====================
export async function listShares(agentId: string): Promise<AgentShareGrant[]> {
  const res = await fetch(`/api/agents/${encodeURIComponent(agentId)}/shares`, {
    headers: authHeaders(),
  });
  if (!res.ok) return asError(res);
  return res.json();
}
export async function addShare(agentId: string, req: AddShareRequest): Promise<AgentShareGrant[]> {
  const res = await fetch(`/api/agents/${encodeURIComponent(agentId)}/shares`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(req),
  });
  if (!res.ok) return asError(res);
  return res.json();
}
export async function revokeShare(
  agentId: string,
  granteeType: GranteeType,
  granteeId: string,
): Promise<void> {
  const res = await fetch(
    `/api/agents/${encodeURIComponent(agentId)}/shares/${encodeURIComponent(
      granteeType,
    )}/${encodeURIComponent(granteeId)}`,
    {
      method: 'DELETE',
      headers: authHeaders(),
    },
  );
  if (!res.ok && res.status !== 204) return asError(res);
}

// ===================== activity =====================
export async function listActivity(
  agentId: string,
  opts: { since?: number; limit?: number } = {},
): Promise<ActivityEvent[]> {
  const params = new URLSearchParams();
  if (opts.since != null) params.set('since', String(opts.since));
  if (opts.limit != null) params.set('limit', String(opts.limit));
  const qs = params.toString();
  const url = `/api/agents/${encodeURIComponent(agentId)}/activity${qs ? `?${qs}` : ''}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) return asError(res);
  return res.json();
}

// ===================== admin =====================
export async function listUsers(): Promise<AdminUserView[]> {
  const res = await fetch('/api/admin/users', { headers: authHeaders() });
  if (!res.ok) return asError(res);
  return res.json();
}
export async function createUser(req: CreateUserRequest): Promise<CreateUserResponse> {
  const res = await fetch('/api/admin/users', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(req),
  });
  if (!res.ok) return asError(res);
  return res.json();
}
export async function resetPassword(userId: string, newPassword: string): Promise<AdminUserView> {
  const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/password`, {
    method: 'PATCH',
    headers: jsonHeaders(),
    body: JSON.stringify({ newPassword }),
  });
  if (!res.ok) return asError(res);
  return res.json();
}
export async function updateRoles(userId: string, roles: string[]): Promise<AdminUserView> {
  const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/roles`, {
    method: 'PATCH',
    headers: jsonHeaders(),
    body: JSON.stringify({ roles }),
  });
  if (!res.ok) return asError(res);
  return res.json();
}
export async function deleteUser(userId: string): Promise<void> {
  const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok && res.status !== 204) return asError(res);
}

// ===================== knowledge bases =====================
export async function listKnowledgeBases(): Promise<KbSummary[]> {
  const res = await fetch('/api/knowledge-bases', { headers: authHeaders() });
  if (res.status === 503) return []; // module disabled
  if (!res.ok) throw new Error('Failed to load knowledge bases');
  return res.json();
}

export async function createKnowledgeBase(name: string, description?: string): Promise<KbSummary> {
  const res = await fetch('/api/knowledge-bases', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ name, description }),
  });
  if (!res.ok) { const msg = await res.text().catch(() => `${res.status}`); throw new Error(msg); }
  return res.json();
}

export async function getKnowledgeBase(id: string): Promise<KbSummary> {
  const res = await fetch(`/api/knowledge-bases/${encodeURIComponent(id)}`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to load KB');
  return res.json();
}

export async function deleteKnowledgeBase(id: string): Promise<void> {
  const res = await fetch(`/api/knowledge-bases/${encodeURIComponent(id)}`, {
    method: 'DELETE', headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete KB');
}

export async function listKbDocuments(kbId: string): Promise<KbDocument[]> {
  const res = await fetch(`/api/knowledge-bases/${encodeURIComponent(kbId)}/documents`, { headers: authHeaders() });
  if (res.status === 503) return [];
  if (!res.ok) throw new Error('Failed to load KB documents');
  return res.json();
}

/**
 * 单文档状态查询（用于 202 之后的轮询）。
 * 后端 POST /{id}/documents 改为「落临时 + 建 docRow + 提交后台 worker」，
 * 立即回 202 + KbDocument(status: "indexing")；前端用本函数 1-2s 轮询到
 * status ∈ {completed, failed} 为止。
 */
export async function getKbDocument(kbId: string, docId: string): Promise<KbDocument> {
  const res = await fetch(`/api/knowledge-bases/${encodeURIComponent(kbId)}/documents/${encodeURIComponent(docId)}`, { headers: authHeaders() });
  if (res.status === 503) throw new Error('KB module disabled');
  if (!res.ok) { const msg = await res.text().catch(() => `${res.status}`); throw new Error(msg); }
  return res.json();
}

/**
 * 上传一个文件到知识库。
 * @returns 200/202 响应里的 KbDocument（status 可能是 "indexing"，需要继续轮询）
 */
export async function uploadKbDocument(kbId: string, file: File): Promise<KbDocument> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(`/api/knowledge-bases/${encodeURIComponent(kbId)}/documents`, {
    method: 'POST',
    headers: authHeaders(), // no Content-Type — browser sets multipart boundary
    body: fd,
  });
  if (!res.ok) { const msg = await res.text().catch(() => `${res.status}`); throw new Error(msg); }
  return res.json();
}

/**
 * 轮询一个 KB 文档的 indexing 状态，直到 completed 或 failed。
 * 1.5s 一次，最长 30 分钟（Ollama 冷启 + 大 PDF 的本地嵌入富余）。
 *
 * @returns Promise 在第一个终态 {completed, failed}（或网络硬错 / 30 分钟超时）
 *   兑现/拒绝；同时返回可控的错误闭包，调用方在 onBeforeUnmount (切页) 时可
 *   调 cancel() 停止轮询而不触发 unhandled promise reject。
 */
export function pollKbDocumentUntilDone(
  kbId: string,
  docId: string,
  onProgress?: (d: KbDocument) => void,
): { promise: Promise<KbDocument>; cancel: () => void } {
  const POLL_MS = 1500;
  const MAX_MS = 30 * 60 * 1000;
  const MAX_NET_ERRORS = 3;
  const start = Date.now();
  let cancelled = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let netErrs = 0;
  let settled = false;

  const promise = new Promise<KbDocument>((resolve, reject) => {
    const tick = async () => {
      if (cancelled) { return; }
      if (Date.now() - start > MAX_MS) {
        if (!settled) { settled = true; reject(new Error('Indexing timed out (30 min). Open the documents list to confirm.')); }
        return;
      }
      let doc: KbDocument;
      try {
        doc = await getKbDocument(kbId, docId);
      } catch (e) {
        netErrs += 1;
        if (netErrs > MAX_NET_ERRORS) {
          if (!settled) { settled = true; reject(e as Error); }
          return;
        }
        timer = setTimeout(tick, POLL_MS);
        return;
      }
      netErrs = 0;
      onProgress?.(doc);
      if (doc.status === 'completed' || doc.status === 'failed' || doc.status === 'done') {
        if (!settled) { settled = true; resolve(doc); }
        return;
      }
      timer = setTimeout(tick, POLL_MS);
    };
    timer = setTimeout(tick, 0);
  });

  return {
    promise,
    cancel: () => {
      if (cancelled || settled) return;
      cancelled = true;
      if (timer) clearTimeout(timer);
    },
  };
}

export async function deleteKbDocument(kbId: string, docId: string): Promise<void> {
  const res = await fetch(`/api/knowledge-bases/${encodeURIComponent(kbId)}/documents/${encodeURIComponent(docId)}`, {
    method: 'DELETE', headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete document');
}

export async function searchKnowledgeBase(kbId: string, query: string, limit?: number): Promise<KbSearchResponse> {
  const res = await fetch(`/api/knowledge-bases/${encodeURIComponent(kbId)}/search`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ query, limit }),
  });
  if (res.status === 503) return { hits: [], parent: null };
  if (!res.ok) throw new Error('Search failed');
  return res.json();
}

// ===================== templates =====================
export async function listTemplates(): Promise<TemplateSummary[]> {
  const res = await fetch('/api/templates', { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to load templates');
  return res.json();
}
export async function getTemplate(id: string): Promise<TemplateDetail> {
  const res = await fetch(`/api/templates/${encodeURIComponent(id)}`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to load template');
  return res.json();
}
