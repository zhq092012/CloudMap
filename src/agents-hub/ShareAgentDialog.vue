<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]" @click="$emit('close')">
    <div class="w-[720px] max-w-[94vw] max-h-[88vh] overflow-auto rounded-2xl border border-[#1e324f] bg-[#0b131f] flex flex-col"
      style="box-shadow: 0 24px 60px rgba(0,0,0,0.5);" @click.stop>
      <div class="p-5 border-b border-[#1a2b42] flex items-center justify-between">
        <h2 class="text-lg font-bold text-white m-0">↗ 共享 "{{ agent.name }}"</h2>
        <button class="px-3 py-1 rounded-lg border border-[#1e324f] text-[#708aa6] hover:text-white transition-colors text-sm"
          @click="$emit('close')">关闭</button>
      </div>

      <div class="p-5 flex flex-col gap-5">
        <div v-if="loading" class="text-[#708aa6] text-sm">加载中…</div>
        <template v-else>
          <!-- workspace -->
          <section>
            <div class="text-[11px] text-[#526e8c] font-bold uppercase tracking-wider mb-3">整个工作区</div>
            <div class="flex items-center gap-3 px-3.5 py-3 rounded-lg border border-[#2b5384]"
              style="background: linear-gradient(135deg,#0b1320 0%,#0b1e2e 100%);">
              <span class="flex-1 text-sm text-[#708aa6]">所有已登录用户</span>
              <div class="flex gap-1.5">
                <span v-for="opt in workspaceOpts" :key="opt.value"
                  class="px-3 py-1 rounded-full text-xs font-semibold cursor-pointer select-none border transition-colors"
                  :class="wsActive(opt.value)
                    ? 'bg-[#00f3ff] text-[#04121f] border-[#00f3ff]'
                    : 'bg-[#0b131f] text-[#708aa6] border-[#1e324f] hover:border-[#2b5384]'"
                  @click="!busy && setWorkspaceTier(opt.value === 'none' ? null : (opt.value as ShareTier))">
                  {{ opt.label }}
                </span>
              </div>
            </div>
          </section>

          <!-- add user -->
          <section>
            <div class="text-[11px] text-[#526e8c] font-bold uppercase tracking-wider mb-3">添加用户</div>
            <div class="flex gap-2 items-center">
              <input v-model="newGrantee" list="share-user-list"
                :placeholder="admin ? '选择或输入 userId' : '输入 userId'"
                class="flex-1 px-3 py-2.5 rounded-lg bg-[#0c1624] border border-[#203554] text-white placeholder-[#526e8c] focus:outline-none focus:border-[#00f3ff]/60 text-sm" />
              <datalist id="share-user-list">
                <option v-for="u in users.filter(u => u.userId !== agent.ownerId)" :key="u.userId" :value="u.userId">
                  {{ u.username }}
                </option>
              </datalist>
              <div class="flex gap-1.5">
                <span v-for="t in ['CLONE','RUN','EDIT'] as ShareTier[]" :key="t"
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
                @click="addUserGrant">
                添加
              </button>
            </div>
          </section>

          <!-- granted users -->
          <section>
            <div class="text-[11px] text-[#526e8c] font-bold uppercase tracking-wider mb-3">已授予用户</div>
            <div v-if="userGrants.length === 0" class="text-[#526e8c] text-sm italic">暂无按用户授予。</div>
            <div v-else class="flex flex-col gap-2">
              <div v-for="g in userGrants" :key="`${g.granteeType}:${g.granteeId}`"
                class="flex items-center gap-3 px-3.5 py-2.5 rounded-lg border border-[#1e324f] bg-[#0f1927]">
                <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#0b1e2e] text-[#7fd4ff] border border-[#1d3a57]">USER</span>
                <span class="font-mono text-sm text-white flex-1 truncate">{{ g.granteeId }}</span>
                <span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold border"
                  :class="tierBadgeClass(g.tier)">{{ g.tier }}</span>
                <button :disabled="busy" title="撤销"
                  class="px-2.5 py-1 rounded-lg border border-[#1e324f] text-[#708aa6] hover:text-[#ef4444] hover:border-[#5a1f1f] transition-colors text-sm"
                  @click="revoke('USER', g.granteeId)">✕</button>
              </div>
            </div>
          </section>

          <div v-if="err" class="text-[#ef4444] text-sm">{{ err }}</div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { addShare, listShares, revokeShare } from './api';
import { listUsers, isAdmin as apiIsAdmin } from './api';
import type { AgentDefinition, AgentShareGrant, GranteeType, ShareTier } from './types';

const props = defineProps<{ agent: AgentDefinition }>();
const emit = defineEmits<{ close: [] }>();

const grants = ref<AgentShareGrant[]>([]);
const users = ref<{ userId: string; username: string; roles: string[] }[]>([]);
const loading = ref(true);
const err = ref('');
const newGrantee = ref('');
const newTier = ref<ShareTier>('RUN');
const busy = ref(false);

const admin = apiIsAdmin();
const WORKSPACE_ID = '*';

const workspaceOpts = [
  { value: 'none', label: '无' },
  { value: 'CLONE', label: 'CLONE' },
  { value: 'RUN', label: 'RUN' },
  { value: 'EDIT', label: 'EDIT' },
];

const workspaceGrant = computed(() => grants.value.find((g) => g.granteeType === 'WORKSPACE'));
const userGrants = computed(() => grants.value.filter((g) => g.granteeType === 'USER'));

function wsActive(opt: string): boolean {
  if (opt === 'none') return !workspaceGrant.value;
  return workspaceGrant.value?.tier === opt;
}
function tierBadgeClass(tier: ShareTier): string {
  const map: Record<ShareTier, string> = {
    CLONE: 'bg-[#2e240b] text-[#fbbf24] border-[#4a3a1d]',
    RUN: 'bg-[#0b2e1f] text-[#00ffc4] border-[#1d4a38]',
    EDIT: 'bg-[#1d1330] text-[#a78bfa] border-[#3a2b57]',
  };
  return map[tier];
}

async function refresh() {
  grants.value = await listShares(props.agent.id);
}
async function setWorkspaceTier(tier: ShareTier | null) {
  busy.value = true;
  err.value = '';
  try {
    if (tier === null) {
      if (workspaceGrant.value) await revokeShare(props.agent.id, 'WORKSPACE', WORKSPACE_ID);
    } else {
      await addShare(props.agent.id, { granteeType: 'WORKSPACE', granteeId: WORKSPACE_ID, tier });
    }
    await refresh();
  } catch (e) {
    err.value = (e as Error).message || '更新工作区授权失败';
  } finally {
    busy.value = false;
  }
}
async function addUserGrant() {
  const granteeId = newGrantee.value.trim();
  if (!granteeId) {
    err.value = '请选择用户';
    return;
  }
  busy.value = true;
  err.value = '';
  try {
    await addShare(props.agent.id, { granteeType: 'USER', granteeId, tier: newTier.value });
    await refresh();
    newGrantee.value = '';
  } catch (e) {
    err.value = (e as Error).message || '添加授权失败';
  } finally {
    busy.value = false;
  }
}
async function revoke(granteeType: GranteeType, granteeId: string) {
  busy.value = true;
  err.value = '';
  try {
    await revokeShare(props.agent.id, granteeType, granteeId);
    await refresh();
  } catch (e) {
    err.value = (e as Error).message || '撤销失败';
  } finally {
    busy.value = false;
  }
}

onMounted(async () => {
  loading.value = true;
  try {
    const [gs, us] = await Promise.all([
      listShares(props.agent.id),
      admin ? listUsers().catch(() => [] as typeof users.value) : Promise.resolve([] as typeof users.value),
    ]);
    grants.value = gs;
    users.value = us as typeof users.value;
  } catch (e) {
    err.value = (e as Error).message;
  } finally {
    loading.value = false;
  }
});
</script>
