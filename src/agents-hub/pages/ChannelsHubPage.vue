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
      return 'bg-[#10233f] text-[#00f3ff] border-[#2b5384]';
    case 'dingtalk':
      return 'bg-[#2a2410] text-[#fbbf24] border-[#5a4a16]';
    case 'wecom':
      return 'bg-[#0d2a22] text-[#00ffc4] border-[#1e5a48]';
    default:
      return 'bg-[#0f1927] text-[#a3b8cc] border-[#1e324f]';
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
  <div class="min-h-screen bg-[#060c14] text-[#a3b8cc] p-10">
    <div class="max-w-[1200px] mx-auto">
      <div class="flex items-center justify-between mb-3">
        <h1 class="text-white text-2xl font-bold tracking-tight m-0">Channels</h1>
        <button
          class="inline-flex items-center gap-2 bg-[#00f3ff] text-[#060c14] border-none rounded-[10px] px-5 py-2.5 text-sm font-semibold cursor-pointer"
          @click="openCreate"
        >
          ＋ New channel
        </button>
      </div>

      <p class="text-[#708aa6] text-base leading-relaxed max-w-[760px] mb-6">
        Channels are inbound surfaces (chatui, DingTalk, WeCom, …) registered in
        <code class="bg-[#0f1927] px-1.5 py-0.5 rounded text-[#00f3ff] text-[0.92em]">agentscope.json</code>.
        Each channel owns its bindings and routes incoming messages to agents. Changes apply immediately —
        the channel is unregistered and re-registered in place.
      </p>

      <div v-if="loading" class="text-[#708aa6] text-sm">Loading…</div>
      <div v-if="err" class="text-[#ef4444] text-sm mb-4">{{ err }}</div>

      <div v-if="!loading" class="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
        <div
          v-for="c in sorted"
          :key="c.channelId"
          class="relative bg-[#0f1927] border border-[#1e324f] rounded-[14px] p-5 flex flex-col gap-2.5 cursor-pointer transition hover:-translate-y-0.5 hover:border-[#2b5384] hover:shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
          @click="openChannel(c)"
        >
          <div class="flex items-center gap-2.5">
            <span class="font-semibold text-base text-white flex-1 truncate">{{ c.channelId }}</span>
            <span
              class="px-2.5 py-1 rounded-full text-[0.72rem] font-semibold border whitespace-nowrap"
              :class="typeBadgeClass(c.type)"
            >{{ c.type }}</span>
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            <span v-if="c.dmScope" class="px-2.5 py-1 rounded-full text-[0.72rem] font-semibold bg-[#0f1927] text-[#a3b8cc] border border-[#1e324f]">{{ c.dmScope }}</span>
            <span v-if="c.defaultAgentId" class="px-2.5 py-1 rounded-full text-[0.72rem] font-semibold bg-[#10233f] text-[#00f3ff] border border-[#2b5384]">default → {{ c.defaultAgentId }}</span>
            <span v-if="c.disabled" class="px-2.5 py-1 rounded-full text-[0.72rem] font-semibold bg-[#2a1010] text-[#ef4444] border border-[#5a1f1f]">disabled</span>
            <span v-if="!c.disabled && c.started" class="px-2.5 py-1 rounded-full text-[0.72rem] font-semibold bg-[#0d2a22] text-[#00ffc4] border border-[#1e5a48]">running</span>
          </div>
          <div class="flex gap-2 mt-1.5" @click.stop>
            <button
              class="px-3.5 py-1.5 text-[0.84rem] font-medium rounded-lg cursor-pointer border border-[#142338] bg-[#0b131f] text-[#a3b8cc]"
              @click="toggleDisabled(c)"
            >{{ c.disabled ? 'Enable' : 'Disable' }}</button>
            <button
              class="px-3.5 py-1.5 text-[0.84rem] font-medium rounded-lg cursor-pointer border border-[#5a1f1f] bg-[#0b131f] text-[#ef4444]"
              @click="handleDelete(c)"
            >Delete</button>
          </div>
        </div>
        <div v-if="!loading && sorted.length === 0" class="text-[#526e8c] text-sm italic">
          No channels registered. Click + New channel to add one.
        </div>
      </div>
    </div>

    <!-- create dialog -->
    <div
      v-if="creating"
      class="fixed inset-0 bg-[#060c14]/70 backdrop-blur-sm flex items-center justify-center z-50"
      @click.self="creating = false"
    >
      <div class="bg-[#0b131f] border border-[#1e324f] rounded-2xl p-7 w-[600px] max-w-[92vw] shadow-[0_24px_60px_rgba(0,0,0,0.5)]">
        <h3 class="text-white text-lg font-bold m-0 mb-4">New channel</h3>

        <div class="grid grid-cols-2 gap-3.5">
          <div>
            <label class="block text-[0.85rem] text-[#708aa6] mb-1.5 font-medium">Channel id</label>
            <input
              v-model="newChannelId"
              class="w-full box-border px-3 py-2.5 bg-[#0f1927] border border-[#1e324f] rounded-lg text-[#a3b8cc] text-sm placeholder-[#526e8c]"
              placeholder="e.g. dingtalk-prod"
            />
          </div>
          <div>
            <label class="block text-[0.85rem] text-[#708aa6] mb-1.5 font-medium">Type</label>
            <select
              v-model="newType"
              class="w-full box-border px-3 py-2.5 bg-[#0f1927] border border-[#1e324f] rounded-lg text-[#a3b8cc] text-sm"
            >
              <option v-if="types.length === 0" value="">— no types registered —</option>
              <option v-for="t in types" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
          <div>
            <label class="block text-[0.85rem] text-[#708aa6] mb-1.5 font-medium">DM scope (optional)</label>
            <select
              v-model="newDmScope"
              class="w-full box-border px-3 py-2.5 bg-[#0f1927] border border-[#1e324f] rounded-lg text-[#a3b8cc] text-sm"
            >
              <option value="">— default —</option>
              <option v-for="s in DM_SCOPES" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
          <div>
            <label class="block text-[0.85rem] text-[#708aa6] mb-1.5 font-medium">Default agent id (optional)</label>
            <input
              v-model="newDefaultAgentId"
              class="w-full box-border px-3 py-2.5 bg-[#0f1927] border border-[#1e324f] rounded-lg text-[#a3b8cc] text-sm placeholder-[#526e8c]"
              placeholder="e.g. default"
            />
          </div>
        </div>

        <div class="mt-3.5">
          <label class="block text-[0.85rem] text-[#708aa6] mb-1.5 font-medium">Properties (JSON object, type-specific)</label>
          <textarea
            v-model="newPropsJson"
            class="w-full box-border px-3 py-2.5 bg-[#0f1927] border border-[#1e324f] rounded-lg text-[#a3b8cc] text-sm font-mono min-h-[140px] resize-y"
          ></textarea>
        </div>

        <div v-if="createErr" class="text-[#ef4444] text-sm mt-2.5">{{ createErr }}</div>

        <div class="flex justify-end gap-3 mt-6">
          <button
            class="px-3.5 py-2 text-[0.86rem] font-medium rounded-lg cursor-pointer border border-[#142338] bg-[#0b131f] text-[#a3b8cc]"
            :disabled="createBusy"
            @click="creating = false"
          >Cancel</button>
          <button
            class="px-4 py-2 text-[0.86rem] font-semibold rounded-lg cursor-pointer border-none bg-[#00f3ff] text-[#060c14] disabled:opacity-60"
            :disabled="createBusy"
            @click="handleCreate"
          >{{ createBusy ? 'Creating…' : 'Create' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>
