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
  <div v-if="!agentId" class="ch-missing">缺少智能体 id。</div>
  <div v-else class="ch-page">
    <div class="ch-inner">
      <div class="ch-head">
        <h2 class="ch-title">渠道</h2>
        <span class="ch-sub">该智能体在各 IM 渠道上的绑定与默认路由</span>
      </div>

      <div v-if="dirty" class="ch-banner is-warn">
        ⚠ 不支持热更新配置的渠道适配器，将在下次重启时生效绑定变更。请查看服务端日志中
        BindingPersistence 输出的各渠道状态。
      </div>

      <div v-if="err" class="ch-err">{{ err }}</div>
      <div v-if="!canEdit" class="ch-note">当前权限（{{ tier ?? 'CLONE' }}）为只读，无法修改渠道绑定。</div>

      <div v-if="loading && channels.length === 0" class="ch-note">加载中…</div>
      <div v-else-if="channels.length === 0" class="ch-note">未注册任何渠道。</div>

      <section v-for="c in channels" :key="c.channelId" class="ch-card">
        <div class="ch-card-head">
          <span class="ch-card-name">{{ c.channelId }}</span>
          <span v-if="c.dmScope" class="ch-pill">{{ c.dmScope }}</span>
          <span v-if="!c.started" class="ch-pill is-danger">stopped</span>
          <span v-if="c.defaultAgentId === agentId" class="ch-pill is-accent">默认</span>
          <span class="ch-grow"></span>
          <template v-if="canEdit">
            <button v-if="c.defaultAgentId !== agentId" type="button" class="ch-ghost"
              @click="handleSetDefault(c.channelId)">设为默认</button>
            <button type="button" class="ch-primary" @click="bindChannel(c.channelId)">＋ 绑定渠道</button>
          </template>
        </div>

        <div v-if="(byChannel[c.channelId] ?? []).length === 0" class="ch-empty">该渠道暂无绑定。</div>
        <div v-for="b in byChannel[c.channelId] ?? []" :key="`${b.channelId}-${b.index}`" class="ch-bind-row">
          <span class="ch-tier">{{ b.tier }}</span>
          <span class="ch-bind-desc">{{ describe(b) }}</span>
          <span v-if="b.sessionScope" class="ch-pill">{{ b.sessionScope }}</span>
          <span class="ch-bind-index">#{{ b.index }}</span>
        </div>
      </section>

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

<style scoped lang="scss">
@use "../styles/tokens" as *;

.ch-missing {
  padding: 32px;
  font-size: 13px;
  color: $text-3;
}

.ch-page {
  min-height: 100%;
  padding: 26px 32px 34px;
  background: $bg-root;
  color: $text-2;
}

.ch-inner {
  max-width: 1100px;
}

.ch-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 16px;
}

.ch-title {
  margin: 0;
  font-size: 19px;
  font-weight: 700;
  letter-spacing: -0.2px;
  color: $text;
}

.ch-sub {
  font-size: 11.5px;
  color: $text-4;
}

.ch-banner {
  margin-bottom: 18px;
  padding: 11px 14px;
  border-radius: $radius-md;
  border: 1px solid $border;
  font-size: 12.5px;
  line-height: 1.75;

  &.is-warn {
    border-color: $orange-line;
    background: $orange-soft;
    color: $orange;
  }
}

.ch-err {
  margin-bottom: 8px;
  font-size: 12.5px;
  color: $red;
}

.ch-note {
  margin-bottom: 10px;
  font-size: 12.5px;
  color: $text-3;
}

/* ---- 渠道卡 ---- */
.ch-card {
  @include card;
  margin-bottom: 16px;
  padding: 18px 20px;
}

.ch-card-head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 9px;
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(45, 58, 77, 0.7);
}

.ch-card-name {
  font-size: 14px;
  font-weight: 600;
  color: $text;
}

.ch-grow {
  flex: 1;
}

.ch-pill {
  padding: 2px 9px;
  border-radius: 10px;
  border: 1px solid $border;
  background: $bg-sunken;
  font-size: 10.5px;
  font-weight: 500;
  line-height: 1.7;
  color: $text-3;

  &.is-accent {
    border-color: $accent-line;
    background: $accent-soft;
    color: $accent-text;
    font-weight: 600;
  }

  &.is-danger {
    border-color: $red-line;
    background: $red-soft;
    color: #fca5a5;
  }
}

.ch-ghost,
.ch-primary {
  height: 28px;
  padding: 0 13px;
  border-radius: $radius-md;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  cursor: pointer;
  transition: color $ease, border-color $ease, background $ease, box-shadow $ease;
}

.ch-ghost {
  border: 1px solid $border;
  background: $bg-sunken;
  color: $text-2;

  &:hover {
    color: $accent-text;
    border-color: $accent-line;
    background: $accent-soft;
  }
}

.ch-primary {
  border: 1px solid transparent;
  color: #fff;
  font-weight: 600;
  @include accent-gradient;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.28);

  &:hover {
    box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
  }
}

.ch-empty {
  font-size: 11.5px;
  color: $text-4;
}

.ch-bind-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 6px;
  padding: 8px 12px;
  border: 1px solid $border;
  border-radius: $radius-md;
  background: $bg-sunken;
}

.ch-tier {
  flex: none;
  padding: 1px 8px;
  border-radius: 9px;
  border: 1px solid $accent-line;
  background: $accent-soft;
  font-size: 10.5px;
  font-weight: 600;
  line-height: 1.7;
  color: $accent-text;
}

.ch-bind-desc {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--mono);
  font-size: 11.5px;
  color: $text-3;
}

.ch-bind-index {
  flex: none;
  font-family: var(--mono);
  font-size: 10.5px;
  color: $text-4;
}
</style>
