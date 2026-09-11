<template>
  <div v-if="!agentId" class="p-8 text-[#708aa6]">缺少智能体 id。</div>
  <div v-else-if="!agent" class="p-8 text-[#708aa6]">加载中…</div>

  <div v-else class="p-8 max-w-[860px] mx-auto">
    <!-- banners -->
    <div v-if="isGlobal"
      class="px-4 py-3.5 rounded-xl mb-5 text-sm border bg-[#0b1e2e] text-[#7fd4ff] border-[#1d3a57]">
      全局智能体（global）在界面中只读。请编辑 <code class="font-mono text-[#a3b8cc]">agentscope.json</code> 进行修改。
    </div>
    <div v-else-if="!canEdit"
      class="px-4 py-3.5 rounded-xl mb-5 text-sm border bg-[#2e240b] text-[#fbbf24] border-[#4a3a1d]">
      你对此智能体的访问权限为 <strong class="font-semibold">{{ tier ?? '无' }}</strong>。仅 EDIT 级协作者可修改设置。
    </div>

    <!-- Identity -->
    <section class="bg-[#0f1927] border border-[#1e324f] rounded-xl p-6 mb-5"
      style="box-shadow: 0 1px 3px rgba(0,0,0,0.3);">
      <span class="block text-[11px] font-bold uppercase tracking-[0.12em] text-[#526e8c] mb-4">Identity</span>

      <div class="mb-4">
        <label class="block text-sm font-medium text-[#a3b8cc] mb-2">Agent ID</label>
        <div class="font-mono text-sm text-[#708aa6]">{{ agent.id }}</div>
      </div>

      <div class="mb-4">
        <label class="block text-sm font-medium text-[#a3b8cc] mb-2">Name</label>
        <input v-model="name" :disabled="readOnly"
          class="w-full px-3.5 py-2.5 rounded-lg bg-[#0c1624] border text-white text-[0.95rem] focus:outline-none focus:border-[#00f3ff]/60 disabled:opacity-50 disabled:cursor-not-allowed"
          :class="readOnly ? 'border-[#142338]' : 'border-[#203554]'" />
      </div>

      <div>
        <label class="block text-sm font-medium text-[#a3b8cc] mb-2">Description</label>
        <input v-model="description" :disabled="readOnly" placeholder="卡片与标签页上显示的简短摘要"
          class="w-full px-3.5 py-2.5 rounded-lg bg-[#0c1624] border text-white placeholder-[#526e8c] text-[0.95rem] focus:outline-none focus:border-[#00f3ff]/60 disabled:opacity-50 disabled:cursor-not-allowed"
          :class="readOnly ? 'border-[#142338]' : 'border-[#203554]'" />
      </div>
    </section>

    <!-- Behavior -->
    <section class="bg-[#0f1927] border border-[#1e324f] rounded-xl p-6 mb-5"
      style="box-shadow: 0 1px 3px rgba(0,0,0,0.3);">
      <span class="block text-[11px] font-bold uppercase tracking-[0.12em] text-[#526e8c] mb-4">Behavior</span>

      <div class="mb-4">
        <label class="block text-sm font-medium text-[#a3b8cc] mb-2">System prompt</label>
        <textarea v-model="sysPrompt" :disabled="readOnly" rows="6"
          placeholder="高层指令。运行时工作区的 AGENTS.md 仍具有最高优先级。"
          class="w-full px-3.5 py-3 rounded-lg bg-[#0c1624] border border-[#203554] text-white placeholder-[#526e8c] text-[0.95rem] leading-relaxed focus:outline-none focus:border-[#00f3ff]/60 resize-y disabled:opacity-50 disabled:cursor-not-allowed"></textarea>
      </div>

      <div>
        <label class="block text-sm font-medium text-[#a3b8cc] mb-2">Max iterations</label>
        <input v-model="maxIters" :disabled="readOnly" type="number" min="1" max="64"
          class="w-[140px] px-3.5 py-2.5 rounded-lg bg-[#0c1624] border text-white text-[0.95rem] focus:outline-none focus:border-[#00f3ff]/60 disabled:opacity-50 disabled:cursor-not-allowed"
          :class="readOnly ? 'border-[#142338]' : 'border-[#203554]'" />
      </div>
    </section>

    <!-- Organization -->
    <section class="bg-[#0f1927] border border-[#1e324f] rounded-xl p-6 mb-5"
      style="box-shadow: 0 1px 3px rgba(0,0,0,0.3);">
      <span class="block text-[11px] font-bold uppercase tracking-[0.12em] text-[#526e8c] mb-4">Organization</span>

      <div class="mb-4">
        <label class="block text-sm font-medium text-[#a3b8cc] mb-2">Category</label>
        <select v-model="category" :disabled="readOnly"
          class="w-full px-3.5 py-2.5 rounded-lg bg-[#0c1624] border text-white text-[0.95rem] focus:outline-none focus:border-[#00f3ff]/60 disabled:opacity-50 disabled:cursor-not-allowed"
          :class="readOnly ? 'border-[#142338]' : 'border-[#203554]'">
          <option value="">选择分类</option>
          <option v-for="c in CATEGORIES" :key="c.value" :value="c.value">{{ c.label }}</option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-[#a3b8cc] mb-2">Tags</label>
        <div class="flex flex-wrap gap-2">
          <button v-for="opt in TAG_OPTIONS" :key="opt.value" type="button"
            :disabled="readOnly"
            @click="toggleTag(opt.value)"
            class="px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :class="tagsArr.includes(opt.value)
              ? 'bg-[#00f3ff] text-[#04121f] border-[#00f3ff]'
              : 'bg-[#0b131f] text-[#708aa6] border-[#1e324f] hover:border-[#2b5384]'">
            {{ opt.label }}
          </button>
        </div>
      </div>
    </section>

    <!-- Shares (EDIT only) -->
    <section v-if="canEdit" class="bg-[#0f1927] border border-[#1e324f] rounded-xl p-6 mb-5"
      style="box-shadow: 0 1px 3px rgba(0,0,0,0.3);">
      <span class="block text-[11px] font-bold uppercase tracking-[0.12em] text-[#526e8c] mb-4">Shares</span>

      <!-- workspace -->
      <div class="mb-5">
        <div class="text-[11px] text-[#526e8c] font-bold uppercase tracking-wider mb-2">整个工作区</div>
        <div class="flex items-center gap-3 px-3.5 py-3 rounded-lg border border-[#2b5384]"
          style="background: linear-gradient(135deg,#0b1320 0%,#0b1e2e 100%);">
          <span class="flex-1 text-sm text-[#708aa6]">所有已登录用户</span>
          <div class="flex gap-1.5">
            <span v-for="opt in WORKSPACE_OPTS" :key="opt.value"
              class="px-3 py-1 rounded-full text-xs font-semibold cursor-pointer select-none border transition-colors"
              :class="wsActive(opt.value)
                ? 'bg-[#00f3ff] text-[#04121f] border-[#00f3ff]'
                : 'bg-[#0b131f] text-[#708aa6] border-[#1e324f] hover:border-[#2b5384]'"
              @click="!busy && setWorkspaceTier(opt.value === 'none' ? null : (opt.value as ShareTier))">
              {{ opt.label }}
            </span>
          </div>
        </div>
      </div>

      <!-- add user -->
      <div class="mb-5">
        <div class="text-[11px] text-[#526e8c] font-bold uppercase tracking-wider mb-2">添加用户</div>
        <div class="flex gap-2 items-center">
          <input v-model="newGrantee" list="share-user-list"
            :placeholder="admin ? '选择或输入 userId' : '输入 userId'"
            class="flex-1 px-3 py-2.5 rounded-lg bg-[#0c1624] border border-[#203554] text-white placeholder-[#526e8c] focus:outline-none focus:border-[#00f3ff]/60 text-sm" />
          <datalist id="share-user-list">
            <option v-for="u in users.filter(u => u.userId !== agent!.ownerId)" :key="u.userId" :value="u.userId">
              {{ u.username }}
            </option>
          </datalist>
          <div class="flex gap-1.5">
            <span v-for="t in (['CLONE','RUN','EDIT'] as ShareTier[])" :key="t"
              class="px-3 py-1 rounded-full text-xs font-semibold cursor-pointer select-none border transition-colors"
              :class="newTier === t
                ? 'bg-[#00f3ff] text-[#04121f] border-[#00f3ff]'
                : 'bg-[#0b131f] text-[#708aa6] border-[#1e324f] hover:border-[#2b5384]'"
              @click="newTier = t">
              {{ t }}
            </span>
          </div>
          <button :disabled="busy"
            class="px-4 py-2.5 rounded-lg font-semibold text-white text-sm transition-all disabled:opacity-60"
            style="background: linear-gradient(135deg,#00f3ff 0%,#3b82f6 100%);"
            @click="addUserGrant">添加</button>
        </div>
      </div>

      <!-- granted users -->
      <div>
        <div class="text-[11px] text-[#526e8c] font-bold uppercase tracking-wider mb-2">已授予用户</div>
        <div v-if="userGrants.length === 0" class="text-[#526e8c] text-sm italic">暂无按用户授予。</div>
        <div v-else class="flex flex-col gap-2">
          <div v-for="g in userGrants" :key="`${g.granteeType}:${g.granteeId}`"
            class="flex items-center gap-3 px-3.5 py-2.5 rounded-lg border border-[#1e324f] bg-[#0b131f]">
            <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#0b1e2e] text-[#7fd4ff] border border-[#1d3a57]">USER</span>
            <span class="font-mono text-sm text-white flex-1 truncate">{{ g.granteeId }}</span>
            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold border" :class="tierBadgeClass(g.tier)">{{ g.tier }}</span>
            <button :disabled="busy" title="撤销"
              class="px-2.5 py-1 rounded-lg border border-[#1e324f] text-[#708aa6] hover:text-[#ef4444] hover:border-[#5a1f1f] transition-colors text-sm"
              @click="revoke('USER', g.granteeId)">✕</button>
          </div>
        </div>
      </div>

      <div v-if="shareErr" class="text-[#ef4444] text-sm mt-3">{{ shareErr }}</div>
    </section>

    <!-- actions -->
    <div v-if="canEdit" class="flex items-center gap-3.5 flex-wrap mb-6">
      <button :disabled="saving"
        class="px-6 py-2.5 rounded-lg font-semibold text-white text-sm transition-all disabled:opacity-60"
        style="background: linear-gradient(135deg,#00f3ff 0%,#3b82f6 100%); box-shadow: 0 2px 6px rgba(0,243,255,0.25);"
        @click="handleSave">
        {{ saving ? '保存中…' : '保存修改' }}
      </button>
      <button :disabled="busy"
        class="px-5 py-2.5 rounded-lg border border-[#2b5384] text-[#7fd4ff] hover:bg-[#10243a] text-sm font-semibold transition-colors disabled:opacity-50"
        @click="refreshShares">刷新共享</button>
      <button
        class="px-5 py-2.5 rounded-lg border border-[#5a1f1f] text-[#ef4444] hover:bg-[#2a1414] text-sm font-medium transition-colors"
        @click="handleDelete">删除智能体</button>
    </div>
    <p v-if="ok" class="text-[#00ffc4] text-sm mb-6">已保存。</p>
    <p v-if="err" class="text-[#ef4444] text-sm mb-6">{{ err }}</p>

    <!-- Metadata -->
    <section class="bg-[#0f1927] border border-[#1e324f] rounded-xl p-6"
      style="box-shadow: 0 1px 3px rgba(0,0,0,0.3);">
      <span class="block text-[11px] font-bold uppercase tracking-[0.12em] text-[#526e8c] mb-4">Metadata</span>
      <div class="mb-4">
        <label class="block text-sm font-medium text-[#a3b8cc] mb-2">Owner</label>
        <div class="font-mono text-sm text-[#708aa6]">{{ agent.ownerId ?? '—' }}</div>
      </div>
      <div class="mb-4">
        <label class="block text-sm font-medium text-[#a3b8cc] mb-2">Created</label>
        <div class="font-mono text-sm text-[#708aa6]">{{ fmt(agent.createdAt) }}</div>
      </div>
      <div>
        <label class="block text-sm font-medium text-[#a3b8cc] mb-2">Updated</label>
        <div class="font-mono text-sm text-[#708aa6]">{{ fmt(agent.updatedAt) }}</div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import * as api from '../api';
import type { Ref } from 'vue';
import type { AgentDefinition, AgentShareGrant, GranteeType, ShareTier } from '../types';

const CATEGORIES = [
  { value: 'simulation', label: '角色模拟型' },
  { value: 'functional', label: '功能型' },
  { value: 'scheduling', label: '调度型' },
];
const TAG_OPTIONS = [
  { value: 'red-side', label: '红方' },
  { value: 'blue-side', label: '蓝方' },
];
const WORKSPACE_OPTS = [
  { value: 'none', label: '无' },
  { value: 'CLONE', label: 'CLONE' },
  { value: 'RUN', label: 'RUN' },
  { value: 'EDIT', label: 'EDIT' },
];
const WORKSPACE_ID = '*';

const agentId = inject<Ref<string | undefined>>('agentHubId');
const agent = inject<Ref<AgentDefinition | null>>('agentHubAgent');

const router = useRouter();

const isGlobal = computed(() => agent?.value?.scope === 'global');
const tier = computed(() => agent?.value?.tierForCurrentUser ?? null);
const canEdit = computed(() => !isGlobal.value && tier.value === 'EDIT');
const readOnly = computed(() => !canEdit.value);

// ---- form state ----
const name = ref('');
const description = ref('');
const sysPrompt = ref('');
const maxIters = ref('12');
const category = ref('');
const tagsArr = ref<string[]>([]);

const saving = ref(false);
const ok = ref(false);
const err = ref<string | null>(null);

function syncFromAgent() {
  const a = agent?.value;
  if (!a) return;
  name.value = a.name;
  description.value = a.description ?? '';
  sysPrompt.value = a.sysPrompt ?? '';
  maxIters.value = String(a.maxIters ?? 12);
  category.value = a.category ?? '';
  tagsArr.value = a.tags ?? [];
}
watch(() => agent?.value?.id, syncFromAgent, { immediate: true });

function toggleTag(v: string) {
  if (readOnly.value) return;
  const i = tagsArr.value.indexOf(v);
  if (i >= 0) tagsArr.value.splice(i, 1);
  else tagsArr.value.push(v);
}

async function handleSave() {
  if (!agentId?.value) return;
  ok.value = false;
  err.value = null;
  saving.value = true;
  try {
    const iters = Number.parseInt(maxIters.value, 10);
    await api.updateAgent(agentId.value, {
      name: name.value.trim() || (agent?.value?.id ?? ''),
      description: description.value.trim() || undefined,
      sysPrompt: sysPrompt.value || undefined,
      maxIters: Number.isFinite(iters) && iters > 0 ? iters : undefined,
      category: category.value || undefined,
      tags: tagsArr.value.length > 0 ? [...tagsArr.value] : undefined,
    });
    ok.value = true;
  } catch (e) {
    err.value = e instanceof Error ? e.message : '保存失败';
  } finally {
    saving.value = false;
  }
}

async function handleDelete() {
  if (!agentId?.value || !agent?.value) return;
  if (!window.confirm(`删除智能体 "${agent?.value?.name}"？这将移除其工作区与会话。`)) return;
  try {
    await api.deleteAgent(agentId.value);
    router.push({ name: 'AgentsHub' });
  } catch (e) {
    err.value = e instanceof Error ? e.message : '删除失败';
  }
}

// ---- shares ----
const grants = ref<AgentShareGrant[]>([]);
const users = ref<{ userId: string; username: string; roles: string[] }[]>([]);
const shareErr = ref('');
const busy = ref(false);
const admin = api.isAdmin();

const workspaceGrant = computed(() => grants.value.find((g) => g.granteeType === 'WORKSPACE'));
const userGrants = computed(() => grants.value.filter((g) => g.granteeType === 'USER'));

const newGrantee = ref('');
const newTier = ref<ShareTier>('RUN');

function wsActive(opt: string): boolean {
  if (opt === 'none') return !workspaceGrant.value;
  return workspaceGrant.value?.tier === opt;
}
function tierBadgeClass(t: ShareTier): string {
  const map: Record<ShareTier, string> = {
    CLONE: 'bg-[#2e240b] text-[#fbbf24] border-[#4a3a1d]',
    RUN: 'bg-[#0b2e1f] text-[#00ffc4] border-[#1d4a38]',
    EDIT: 'bg-[#1d1330] text-[#a78bfa] border-[#3a2b57]',
  };
  return map[t];
}

async function refreshShares() {
  if (!agentId?.value) return;
  shareErr.value = '';
  try {
    grants.value = await api.listShares(agentId.value);
  } catch (e) {
    shareErr.value = e instanceof Error ? e.message : '加载共享失败';
  }
}
async function setWorkspaceTier(t: ShareTier | null) {
  if (!agentId?.value) return;
  busy.value = true;
  shareErr.value = '';
  try {
    if (t === null) {
      if (workspaceGrant.value) await api.revokeShare(agentId.value, 'WORKSPACE', WORKSPACE_ID);
    } else {
      await api.addShare(agentId.value, { granteeType: 'WORKSPACE', granteeId: WORKSPACE_ID, tier: t });
    }
    await refreshShares();
  } catch (e) {
    shareErr.value = e instanceof Error ? e.message : '更新工作区授权失败';
  } finally {
    busy.value = false;
  }
}
async function addUserGrant() {
  if (!agentId?.value) return;
  const granteeId = newGrantee.value.trim();
  if (!granteeId) {
    shareErr.value = '请选择用户';
    return;
  }
  busy.value = true;
  shareErr.value = '';
  try {
    await api.addShare(agentId.value, { granteeType: 'USER', granteeId, tier: newTier.value });
    await refreshShares();
    newGrantee.value = '';
  } catch (e) {
    shareErr.value = e instanceof Error ? e.message : '添加授权失败';
  } finally {
    busy.value = false;
  }
}
async function revoke(granteeType: GranteeType, granteeId: string) {
  if (!agentId?.value) return;
  busy.value = true;
  shareErr.value = '';
  try {
    await api.revokeShare(agentId.value, granteeType, granteeId);
    await refreshShares();
  } catch (e) {
    shareErr.value = e instanceof Error ? e.message : '撤销失败';
  } finally {
    busy.value = false;
  }
}

function fmt(ts: number): string {
  return new Date(ts).toLocaleString();
}

onMounted(async () => {
  if (!canEdit.value) return;
  try {
    const [gs, us] = await Promise.all([
      agentId?.value ? api.listShares(agentId.value) : Promise.resolve([] as AgentShareGrant[]),
      admin ? api.listUsers().catch(() => [] as typeof users.value) : Promise.resolve([] as typeof users.value),
    ]);
    grants.value = gs;
    users.value = us as typeof users.value;
  } catch (e) {
    shareErr.value = e instanceof Error ? e.message : '加载共享失败';
  }
});
</script>
