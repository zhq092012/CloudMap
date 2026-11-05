<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import * as api from '../api';
import type { ChannelInfo, ChannelUpsertRequest } from '../types';

type CreateChannelPayload = ChannelUpsertRequest & { channelId: string };

const router = useRouter();

const channels = ref<ChannelInfo[]>([]);
const types = ref<string[]>([]);
const loading = ref(true);
const err = ref<string | null>(null);
const creating = ref(false);

// create form
const newChannelId = ref('');
const newType = ref('');
const newDmScope = ref('');
const newDefaultAgentId = ref('');
const newPropsJson = ref('{\n}');
const createBusy = ref(false);
const createErr = ref<string | null>(null);

const DM_SCOPES = ['MAIN', 'PER_PEER', 'PER_CHANNEL_PEER', 'PER_ACCOUNT_CHANNEL_PEER'];

async function refresh() {
  loading.value = true;
  err.value = null;
  try {
    const [c, t] = await Promise.all([api.listChannels(), api.listChannelTypes()]);
    channels.value = c;
    types.value = t;
    if (!newType.value && t.length) newType.value = t[0];
  } catch (e) {
    err.value = e instanceof Error ? e.message : String(e);
  } finally {
    loading.value = false;
  }
}

const sorted = computed(() =>
  [...channels.value].sort((a, b) => a.channelId.localeCompare(b.channelId)),
);

function typeBadgeClass(type?: string): string {
  switch (type) {
    case 'chatui':
      return 'bg-[rgba(59,130,246,0.16)] text-[#93c5fd] border-[#3d4d64]';
    case 'dingtalk':
      return 'bg-[rgba(245,158,11,0.12)] text-[#f59e0b] border-[rgba(245,158,11,0.35)]';
    case 'wecom':
      return 'bg-[rgba(16,185,129,0.12)] text-[#10b981] border-[rgba(16,185,129,0.35)]';
    default:
      return 'bg-[#1a2332] text-[#cbd5e1] border-[#2d3a4d]';
  }
}

function openChannel(c: ChannelInfo) {
  router.push({ name: 'AgentHubChannelDetail', params: { channelId: c.channelId } });
}

async function toggleDisabled(c: ChannelInfo) {
  try {
    if (c.disabled) await api.enableChannel(c.channelId);
    else await api.disableChannel(c.channelId);
    await refresh();
  } catch (e) {
    err.value = e instanceof Error ? e.message : String(e);
  }
}

async function handleDelete(c: ChannelInfo) {
  if (!confirm(`Delete channel '${c.channelId}'? This removes its entry and all bindings.`)) return;
  try {
    await api.deleteChannel(c.channelId);
    await refresh();
  } catch (e) {
    err.value = e instanceof Error ? e.message : String(e);
  }
}

async function handleCreate() {
  createErr.value = null;
  if (!newChannelId.value.trim()) {
    createErr.value = 'channelId is required';
    return;
  }
  if (!newType.value) {
    createErr.value = 'type is required';
    return;
  }
  let parsed: Record<string, unknown> | null = null;
  if (newPropsJson.value.trim().length > 0) {
    try {
      const v = JSON.parse(newPropsJson.value);
      if (v && typeof v === 'object' && !Array.isArray(v)) parsed = v as Record<string, unknown>;
      else throw new Error('properties must be a JSON object');
    } catch (e) {
      createErr.value = `properties JSON invalid: ${e instanceof Error ? e.message : String(e)}`;
      return;
    }
  }
  const req: CreateChannelPayload = {
    channelId: newChannelId.value.trim(),
    type: newType.value,
    dmScope: newDmScope.value || undefined,
    defaultAgentId: newDefaultAgentId.value.trim() || undefined,
    properties: parsed ?? undefined,
  };
  createBusy.value = true;
  try {
    const created = await api.createChannel(req);
    creating.value = false;
    await refresh();
    router.push({ name: 'AgentHubChannelDetail', params: { channelId: created.channelId } });
  } catch (e) {
    createErr.value = e instanceof Error ? e.message : String(e);
  } finally {
    createBusy.value = false;
  }
}

function openCreate() {
  createErr.value = null;
  newChannelId.value = '';
  newType.value = types.value[0] ?? '';
  newDmScope.value = '';
  newDefaultAgentId.value = '';
  newPropsJson.value = '{\n}';
  creating.value = true;
}

onMounted(() => {
  if (!api.isAdmin()) {
    router.replace({ name: 'AgentsHub' });
    return;
  }
  void refresh();
});
</script>

<template>
  <div class="min-h-screen bg-[#0a0e17] text-[#cbd5e1] p-10">
    <div class="max-w-[1200px] mx-auto">
      <div class="flex items-center justify-between mb-3">
        <h1 class="text-white text-[19px] font-bold tracking-tight m-0">Channels</h1>
        <button
          class="inline-flex items-center gap-2 bg-[linear-gradient(135deg,#3b82f6_0%,#2563eb_100%)] text-white border-none rounded-lg px-5 py-2.5 text-[12.5px] font-semibold cursor-pointer"
          @click="openCreate"
        >
          ＋ New channel
        </button>
      </div>

      <p class="text-[#9ca3af] text-[13.5px] leading-relaxed max-w-[760px] mb-6">
        Channels are inbound surfaces (chatui, DingTalk, WeCom, …) registered in
        <code class="bg-[#1a2332] px-1.5 py-0.5 rounded text-[#93c5fd] text-[0.92em]">agentscope.json</code>.
        Each channel owns its bindings and routes incoming messages to agents. Changes apply immediately —
        the channel is unregistered and re-registered in place.
      </p>

      <div v-if="loading" class="text-[#9ca3af] text-[12.5px]">Loading…</div>
      <div v-if="err" class="text-[#ef4444] text-[12.5px] mb-4">{{ err }}</div>

      <div v-if="!loading" class="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
        <div
          v-for="c in sorted"
          :key="c.channelId"
          class="relative bg-[#1a2332] border border-[#2d3a4d] rounded-lg p-5 flex flex-col gap-2.5 cursor-pointer transition hover:-translate-y-0.5 hover:border-[#3d4d64] hover:shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
          @click="openChannel(c)"
        >
          <div class="flex items-center gap-2.5">
            <span class="font-semibold text-[13.5px] text-white flex-1 truncate">{{ c.channelId }}</span>
            <span
              class="px-2.5 py-1 rounded-full text-[10.5px] font-semibold border whitespace-nowrap"
              :class="typeBadgeClass(c.type)"
            >{{ c.type }}</span>
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            <span v-if="c.dmScope" class="px-2.5 py-1 rounded-full text-[10.5px] font-semibold bg-[#1a2332] text-[#cbd5e1] border border-[#2d3a4d]">{{ c.dmScope }}</span>
            <span v-if="c.defaultAgentId" class="px-2.5 py-1 rounded-full text-[10.5px] font-semibold bg-[rgba(59,130,246,0.16)] text-[#93c5fd] border border-[#3d4d64]">default → {{ c.defaultAgentId }}</span>
            <span v-if="c.disabled" class="px-2.5 py-1 rounded-full text-[10.5px] font-semibold bg-[rgba(239,68,68,0.12)] text-[#ef4444] border border-[rgba(239,68,68,0.4)]">disabled</span>
            <span v-if="!c.disabled && c.started" class="px-2.5 py-1 rounded-full text-[10.5px] font-semibold bg-[rgba(16,185,129,0.12)] text-[#10b981] border border-[rgba(16,185,129,0.35)]">running</span>
          </div>
          <div class="flex gap-2 mt-1.5" @click.stop>
            <button
              class="px-3.5 py-1.5 text-[12.5px] font-medium rounded-lg cursor-pointer border border-[#2d3a4d] bg-[#111827] text-[#cbd5e1]"
              @click="toggleDisabled(c)"
            >{{ c.disabled ? 'Enable' : 'Disable' }}</button>
            <button
              class="px-3.5 py-1.5 text-[12.5px] font-medium rounded-lg cursor-pointer border border-[rgba(239,68,68,0.4)] bg-[#111827] text-[#ef4444]"
              @click="handleDelete(c)"
            >Delete</button>
          </div>
        </div>
        <div v-if="!loading && sorted.length === 0" class="text-[#6b7280] text-[12.5px] italic">
          No channels registered. Click + New channel to add one.
        </div>
      </div>
    </div>

    <!-- create dialog -->
    <div
      v-if="creating"
      class="fixed inset-0 bg-[#0a0e17]/70 backdrop-blur-sm flex items-center justify-center z-50"
      @click.self="creating = false"
    >
      <div class="bg-[#111827] border border-[#2d3a4d] rounded-2xl p-7 w-[600px] max-w-[92vw] shadow-[0_24px_60px_rgba(0,0,0,0.5)]">
        <h3 class="text-white text-[15px] font-bold m-0 mb-4">New channel</h3>

        <div class="grid grid-cols-2 gap-3.5">
          <div>
            <label class="block text-[12.5px] text-[#9ca3af] mb-1.5 font-medium">Channel id</label>
            <input
              v-model="newChannelId"
              class="w-full box-border px-3 py-2.5 bg-[#1a2332] border border-[#2d3a4d] rounded-lg text-[#cbd5e1] text-[12.5px] placeholder-[#6b7280]"
              placeholder="e.g. dingtalk-prod"
            />
          </div>
          <div>
            <label class="block text-[12.5px] text-[#9ca3af] mb-1.5 font-medium">Type</label>
            <select
              v-model="newType"
              class="w-full box-border px-3 py-2.5 bg-[#1a2332] border border-[#2d3a4d] rounded-lg text-[#cbd5e1] text-[12.5px]"
            >
              <option v-if="types.length === 0" value="">— no types registered —</option>
              <option v-for="t in types" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
          <div>
            <label class="block text-[12.5px] text-[#9ca3af] mb-1.5 font-medium">DM scope (optional)</label>
            <select
              v-model="newDmScope"
              class="w-full box-border px-3 py-2.5 bg-[#1a2332] border border-[#2d3a4d] rounded-lg text-[#cbd5e1] text-[12.5px]"
            >
              <option value="">— default —</option>
              <option v-for="s in DM_SCOPES" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
          <div>
            <label class="block text-[12.5px] text-[#9ca3af] mb-1.5 font-medium">Default agent id (optional)</label>
            <input
              v-model="newDefaultAgentId"
              class="w-full box-border px-3 py-2.5 bg-[#1a2332] border border-[#2d3a4d] rounded-lg text-[#cbd5e1] text-[12.5px] placeholder-[#6b7280]"
              placeholder="e.g. default"
            />
          </div>
        </div>

        <div class="mt-3.5">
          <label class="block text-[12.5px] text-[#9ca3af] mb-1.5 font-medium">Properties (JSON object, type-specific)</label>
          <textarea
            v-model="newPropsJson"
            class="w-full box-border px-3 py-2.5 bg-[#1a2332] border border-[#2d3a4d] rounded-lg text-[#cbd5e1] text-[12.5px] font-mono min-h-[140px] resize-y"
          ></textarea>
        </div>

        <div v-if="createErr" class="text-[#ef4444] text-[12.5px] mt-2.5">{{ createErr }}</div>

        <div class="flex justify-end gap-3 mt-6">
          <button
            class="px-3.5 py-2 text-[12.5px] font-medium rounded-lg cursor-pointer border border-[#2d3a4d] bg-[#111827] text-[#cbd5e1]"
            :disabled="createBusy"
            @click="creating = false"
          >Cancel</button>
          <button
            class="px-4 py-2 text-[12.5px] font-semibold rounded-lg cursor-pointer border-none bg-[linear-gradient(135deg,#3b82f6_0%,#2563eb_100%)] text-white disabled:opacity-60"
            :disabled="createBusy"
            @click="handleCreate"
          >{{ createBusy ? 'Creating…' : 'Create' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>
