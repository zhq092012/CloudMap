<script setup lang="ts">
// ============================================================
// Ported from agentbuilder-main/frontend/src/pages/AgentChannelsPage.tsx
// (+ the channel-card shell of components/ChannelBindingTable.tsx)
// Child tab page: receives the agent through Vue inject.
// ============================================================
import { ref, computed, onMounted, inject } from 'vue';
import type { Ref } from 'vue';
import * as api from '../api';
import type { AgentBinding, AgentDefinition, ChannelInfo } from '../types';
import ChannelBindingTable from './ChannelBindingTable.vue';

const agentId = inject<Ref<string | undefined>>('agentHubId');
const agent = inject<Ref<AgentDefinition | null>>('agentHubAgent');

const channels = ref<ChannelInfo[]>([]);
const bindings = ref<AgentBinding[]>([]);
const err = ref<string | null>(null);
const dirty = ref(false);
const loading = ref(false);

const tableRef = ref<InstanceType<typeof ChannelBindingTable> | null>(null);

// tier gating: CLONE / RUN cannot mutate bindings; EDIT (or owner) can.
const tier = computed(() => agent?.value?.tierForCurrentUser ?? null);
const canEdit = computed(() => {
  if (agent?.value?.scope === 'global') return api.isAdmin();
  return tier.value == null || tier.value === 'EDIT';
});

const byChannel = computed<Record<string, AgentBinding[]>>(() => {
  const m: Record<string, AgentBinding[]> = {};
  for (const b of bindings.value) {
    (m[b.channelId] ??= []).push(b);
  }
  return m;
});

function describe(b: AgentBinding): string {
  if (b.tier === 'peer' && b.peer) return `peer = ${b.peer}`;
  if (b.tier === 'parentPeer' && b.parentPeer) return `parentPeer = ${b.parentPeer}`;
  if (b.tier === 'guildRoles')
    return `guild = ${b.guild ?? '*'}, roles = ${(b.roles ?? []).join('|') || '*'}`;
  if (b.tier === 'guild' && b.guild) return `guild = ${b.guild}`;
  if (b.tier === 'team' && b.team) return `team = ${b.team}`;
  if (b.tier === 'account' && b.account) return `account = ${b.account}`;
  if (b.tier === 'channel') return `channel = ${b.channel ?? b.channelId}`;
  return b.tier;
}

async function reload(): Promise<void> {
  if (!agentId?.value) return;
  err.value = null;
  loading.value = true;
  try {
    const [c, b] = await Promise.all([api.listChannels(), api.listAgentBindings(agentId.value)]);
    channels.value = c;
    bindings.value = b;
  } catch (e) {
    err.value = e instanceof Error ? e.message : '加载失败';
  } finally {
    loading.value = false;
  }
}

function bindChannel(channelId: string): void {
  if (!canEdit.value) return;
  tableRef.value?.startAdd(channelId);
}

async function handleSetDefault(channelId: string): Promise<void> {
  if (!agentId?.value || !canEdit.value) return;
  err.value = null;
  try {
    await api.setChannelDefault(agentId.value, channelId);
    dirty.value = true;
    await reload();
  } catch (e) {
    err.value = e instanceof Error ? e.message : '操作失败';
  }
}

async function handleTableChange(): Promise<void> {
  dirty.value = true;
  await reload();
}

onMounted(() => {
  if (!agentId?.value) return;
  void reload();
});
</script>

<template>
  <div v-if="!agentId" class="p-8 text-[#708aa6]">缺少智能体 id。</div>
  <div v-else class="min-h-full bg-[#060c14] text-[#a3b8cc] px-8 py-7">
    <div class="max-w-[1100px]">
      <h2 class="text-white text-[1.4rem] font-bold m-0 mb-4 tracking-tight">渠道</h2>

      <div
        v-if="dirty"
        class="px-4 py-3 rounded-[10px] text-[0.88rem] mb-5 bg-[#2e240b] border border-[#4a3a1d] text-[#fbbf24]"
      >
        ⚠ 不支持热更新配置的渠道适配器，将在下次重启时生效绑定变更。请查看服务端日志中
        BindingPersistence 输出的各渠道状态。
      </div>

      <div v-if="err" class="text-[#ef4444] text-sm mb-2">{{ err }}</div>
      <div v-if="!canEdit" class="text-[#526e8c] text-[0.84rem] mb-3">
        当前权限（{{ tier ?? 'CLONE' }}）为只读，无法修改渠道绑定。
      </div>

      <div v-if="loading && channels.length === 0" class="text-[#708aa6] text-sm">加载中…</div>
      <div v-else-if="channels.length === 0" class="text-[#526e8c] text-[0.85rem]">未注册任何渠道。</div>

      <div
        v-for="c in channels"
        :key="c.channelId"
        class="bg-[#0f1927] border border-[#1e324f] rounded-[14px] px-5 py-5 mb-4"
      >
        <div class="flex items-center gap-3 mb-3.5 flex-wrap">
          <span class="text-[1.05rem] font-semibold text-white">{{ c.channelId }}</span>
          <span
            v-if="c.dmScope"
            class="px-2.5 py-1 rounded-full text-[0.76rem] font-medium bg-[#0b131f] text-[#a3b8cc] border border-[#1e324f]"
          >{{ c.dmScope }}</span>
          <span
            v-if="!c.started"
            class="px-2.5 py-1 rounded-full text-[0.76rem] font-medium bg-[#0b131f] text-[#ef4444] border border-[#5a1f1f]"
          >stopped</span>
          <span
            v-if="c.defaultAgentId === agentId"
            class="px-2.5 py-1 rounded-full text-[0.76rem] font-semibold bg-[#10233f] text-[#00f3ff] border border-[#2b5384]"
          >默认</span>
          <span class="flex-1"></span>
          <template v-if="canEdit">
            <button
              v-if="c.defaultAgentId !== agentId"
              type="button"
              class="px-3.5 py-1.5 text-[0.84rem] font-medium rounded-lg cursor-pointer border border-[#142338] bg-[#0b131f] text-[#a3b8cc] hover:bg-[#142338]"
              @click="handleSetDefault(c.channelId)"
            >设为默认</button>
            <button
              type="button"
              class="px-4 py-1.5 text-[0.84rem] font-semibold rounded-lg cursor-pointer border-none bg-[#00f3ff] text-[#060c14]"
              @click="bindChannel(c.channelId)"
            >+ 绑定渠道</button>
          </template>
        </div>

        <div v-if="(byChannel[c.channelId] ?? []).length === 0" class="text-[0.78rem] text-[#526e8c]">
          该渠道暂无绑定。
        </div>
        <div
          v-for="b in byChannel[c.channelId] ?? []"
          :key="`${b.channelId}-${b.index}`"
          class="flex items-center gap-3 px-3 py-2.5 rounded-[9px] text-sm text-[#a3b8cc] bg-[#0b131f] border border-[#142338] mb-1.5"
        >
          <span class="px-2.5 py-1 rounded-full text-[0.72rem] font-semibold bg-[#10233f] text-[#00f3ff] border border-[#2b5384]">{{ b.tier }}</span>
          <span class="flex-1 font-mono text-[0.86rem] text-[#708aa6]">{{ describe(b) }}</span>
          <span
            v-if="b.sessionScope"
            class="px-2.5 py-1 rounded-full text-[0.72rem] font-medium bg-[#0f1927] text-[#a3b8cc] border border-[#1e324f]"
          >{{ b.sessionScope }}</span>
          <span class="text-[0.72rem] text-[#526e8c] font-mono">#{{ b.index }}</span>
        </div>
      </div>

      <ChannelBindingTable
        ref="tableRef"
        :agent-id="agentId"
        :channels="channels"
        :bindings="bindings"
        :readonly="!canEdit"
        @change="handleTableChange"
      />
    </div>
  </div>
</template>
