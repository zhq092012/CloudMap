<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import * as api from '../api';
import type { AgentBinding, BindingTier, ChannelDetail, ChannelUpsertRequest } from '../types';

type UpdateChannelPayload = ChannelUpsertRequest & { bindings?: AgentBinding[] };

const route = useRoute();
const router = useRouter();
const channelId = computed(() => (route.params.channelId as string) ?? '');

const detail = ref<ChannelDetail | null>(null);
const types = ref<string[]>([]);
const err = ref<string | null>(null);
const info = ref<string | null>(null);

const type = ref('');
const dmScope = ref('');
const defaultAgentId = ref('');
const propsJson = ref('{\n}');
const bindings = ref<AgentBinding[]>([]);

const editIdx = ref<number | null>(null);
const editForm = ref<BindingForm | null>(null);

interface BindingForm {
  tier: BindingTier;
  peer: string;
  parentPeer: string;
  guild: string;
  roles: string;
  team: string;
  account: string;
  channel: string;
  sessionScope: string;
}

const TIERS: BindingTier[] = ['peer', 'parentPeer', 'guildRoles', 'guild', 'team', 'account', 'channel'];
const SCOPES = ['MAIN', 'PER_PEER', 'PER_CHANNEL_PEER', 'PER_ACCOUNT_CHANNEL_PEER'];

async function load() {
  err.value = null;
  try {
    const [d, t] = await Promise.all([api.getChannelDetail(channelId.value), api.listChannelTypes()]);
    detail.value = d;
    types.value = t;
    type.value = d.type;
    dmScope.value = d.dmScope ?? '';
    defaultAgentId.value = d.defaultAgentId ?? '';
    propsJson.value = d.properties ? JSON.stringify(d.properties, null, 2) : '{\n}';
    bindings.value = d.bindings ?? [];
  } catch (e) {
    err.value = e instanceof Error ? e.message : String(e);
  }
}

async function persist(overrides?: Partial<ChannelUpsertRequest> & { bindings?: AgentBinding[] }) {
  err.value = null;
  info.value = null;
  let parsedProps: Record<string, unknown> | null = null;
  const body = (overrides?.properties as Record<string, unknown> | null | undefined) ?? undefined;
  if (body === undefined) {
    if (propsJson.value.trim().length > 0) {
      try {
        const v = JSON.parse(propsJson.value);
        if (v && typeof v === 'object' && !Array.isArray(v)) parsedProps = v as Record<string, unknown>;
        else throw new Error('properties must be a JSON object');
      } catch (e) {
        err.value = `properties JSON invalid: ${e instanceof Error ? e.message : String(e)}`;
        return;
      }
    }
  } else {
    parsedProps = body;
  }
  const req: UpdateChannelPayload = {
    type: overrides?.type ?? type.value,
    dmScope: overrides?.dmScope !== undefined ? overrides.dmScope : (dmScope.value || undefined),
    defaultAgentId: overrides?.defaultAgentId !== undefined ? overrides.defaultAgentId : (defaultAgentId.value.trim() || undefined),
    properties: parsedProps ?? undefined,
    bindings: overrides?.bindings ?? bindings.value,
  };
  try {
    const updated = await api.updateChannel(channelId.value, req);
    detail.value = updated;
    bindings.value = updated.bindings ?? [];
    info.value = 'Saved. Channel hot-reloaded.';
  } catch (e) {
    err.value = e instanceof Error ? e.message : String(e);
  }
}

async function toggleDisabled() {
  if (!detail.value) return;
  try {
    if (detail.value.disabled) await api.enableChannel(channelId.value);
    else await api.disableChannel(channelId.value);
    await load();
  } catch (e) {
    err.value = e instanceof Error ? e.message : String(e);
  }
}

async function handleDeleteChannel() {
  if (!confirm(`Delete channel '${channelId.value}'? This removes its entry and all bindings.`)) return;
  try {
    await api.deleteChannel(channelId.value);
    router.push({ name: 'AgentHubChannels' });
  } catch (e) {
    err.value = e instanceof Error ? e.message : String(e);
  }
}

function describe(b: AgentBinding): string {
  const parts: string[] = [];
  if (b.peer) parts.push(`peer=${b.peer}`);
  if (b.parentPeer) parts.push(`parentPeer=${b.parentPeer}`);
  if (b.guild) parts.push(`guild=${b.guild}`);
  if (b.roles && b.roles.length) parts.push(`roles=${b.roles.join('|')}`);
  if (b.team) parts.push(`team=${b.team}`);
  if (b.account) parts.push(`account=${b.account}`);
  if (b.channel) parts.push(`channel=${b.channel}`);
  return `[${b.tier}] ${parts.join(', ') || '(catch-all)'}`;
}

function emptyBindingForm(): BindingForm {
  return { tier: 'peer', peer: '', parentPeer: '', guild: '', roles: '', team: '', account: '', channel: '', sessionScope: '' };
}

function bindingToForm(b: AgentBinding): BindingForm {
  return {
    tier: b.tier,
    peer: b.peer ?? '',
    parentPeer: b.parentPeer ?? '',
    guild: b.guild ?? '',
    roles: (b.roles ?? []).join(', '),
    team: b.team ?? '',
    account: b.account ?? '',
    channel: b.channel ?? '',
    sessionScope: b.sessionScope ?? '',
  };
}

function formToBinding(f: BindingForm, idx: number): AgentBinding {
  const entry: AgentBinding = {
    channelId: channelId.value,
    index: idx,
    tier: f.tier,
  };
  if (f.peer.trim()) entry.peer = f.peer.trim();
  if (f.parentPeer.trim()) entry.parentPeer = f.parentPeer.trim();
  if (f.guild.trim()) entry.guild = f.guild.trim();
  if (f.roles.trim()) entry.roles = f.roles.split(',').map((s) => s.trim()).filter(Boolean);
  if (f.team.trim()) entry.team = f.team.trim();
  if (f.account.trim()) entry.account = f.account.trim();
  if (f.channel.trim()) entry.channel = f.channel.trim();
  if (f.sessionScope) entry.sessionScope = f.sessionScope;
  return entry;
}

function startEditBinding(i: number) {
  editIdx.value = i;
  editForm.value = bindingToForm(bindings.value[i]);
}

function startAddBinding() {
  editIdx.value = bindings.value.length;
  editForm.value = emptyBindingForm();
}

async function saveBinding() {
  if (editForm.value == null || editIdx.value == null) return;
  const next = [...bindings.value];
  const entry = formToBinding(editForm.value, editIdx.value);
  if (editIdx.value >= bindings.value.length) next.push(entry);
  else next[editIdx.value] = entry;
  bindings.value = next;
  editIdx.value = null;
  editForm.value = null;
  await persist({ bindings: next });
}

async function deleteBindingAt(i: number) {
  if (!confirm(`Delete binding #${i} (${describe(bindings.value[i])})?`)) return;
  const next = bindings.value.filter((_, idx) => idx !== i);
  bindings.value = next;
  await persist({ bindings: next });
}

const status = computed(() => {
  if (!detail.value) return '';
  if (detail.value.disabled) return 'disabled';
  return detail.value.started ? 'running' : 'stopped';
});

onMounted(() => {
  if (!api.isAdmin()) {
    router.replace({ name: 'AgentsHub' });
    return;
  }
  void load();
});

watch(channelId, () => {
  if (api.isAdmin()) void load();
});
</script>

<template>
  <div class="min-h-screen bg-[#060c14] text-[#a3b8cc] p-9">
    <div class="max-w-[1100px] mx-auto">
      <button
        class="bg-none border-none cursor-pointer p-0 text-[#00f3ff] text-sm mb-3"
        @click="router.push({ name: 'AgentHubChannels' })"
      >← All channels</button>
      <h1 class="text-white text-2xl font-bold m-0 mb-1.5">{{ channelId }}</h1>
      <div class="text-[#708aa6] text-sm">
        Channel-scoped configuration. Saving any field hot-reloads the channel in place.
      </div>

      <div v-if="err" class="text-[#ef4444] text-sm mt-4">{{ err }}</div>
      <div v-if="info" class="text-[#00ffc4] text-sm mt-4">{{ info }}</div>

      <div v-if="!detail && !err" class="text-[#708aa6] text-sm mt-6">Loading…</div>

      <template v-if="detail">
        <div class="bg-[#0f1927] border border-[#1e324f] rounded-[14px] p-5 mb-4 mt-4">
          <div class="flex items-center gap-3 mb-3.5">
            <h2 class="text-white text-base font-semibold m-0">Configuration</h2>
            <span class="px-2.5 py-1 rounded-full text-[0.72rem] font-semibold bg-[#0f1927] text-[#a3b8cc] border border-[#1e324f]">{{ status }}</span>
            <span class="flex-1"></span>
            <button
              class="px-4 py-2 text-[0.86rem] font-medium rounded-lg cursor-pointer border border-[#142338] bg-[#0b131f] text-[#a3b8cc]"
              @click="toggleDisabled"
            >{{ detail.disabled ? 'Enable' : 'Disable' }}</button>
            <button
              class="px-4 py-2 text-[0.86rem] font-medium rounded-lg cursor-pointer border border-[#5a1f1f] bg-[#0b131f] text-[#ef4444]"
              @click="handleDeleteChannel"
            >Delete</button>
          </div>

          <div class="grid grid-cols-2 gap-3.5">
            <div>
              <label class="block text-[0.85rem] text-[#708aa6] mb-1.5 font-medium">Type</label>
              <select
                v-model="type"
                class="w-full box-border px-3 py-2.5 bg-[#0b131f] border border-[#1e324f] rounded-lg text-[#a3b8cc] text-sm"
              >
                <option v-for="t in types" :key="t" :value="t">{{ t }}</option>
              </select>
            </div>
            <div>
              <label class="block text-[0.85rem] text-[#708aa6] mb-1.5 font-medium">DM scope</label>
              <select
                v-model="dmScope"
                class="w-full box-border px-3 py-2.5 bg-[#0b131f] border border-[#1e324f] rounded-lg text-[#a3b8cc] text-sm"
              >
                <option value="">— default —</option>
                <option v-for="s in SCOPES" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>
            <div class="col-span-2">
              <label class="block text-[0.85rem] text-[#708aa6] mb-1.5 font-medium">Default agent id (used when no binding matches)</label>
              <input
                v-model="defaultAgentId"
                class="w-full box-border px-3 py-2.5 bg-[#0b131f] border border-[#1e324f] rounded-lg text-[#a3b8cc] text-sm placeholder-[#526e8c]"
                placeholder="e.g. default"
              />
            </div>
          </div>

          <div class="mt-3.5">
            <label class="block text-[0.85rem] text-[#708aa6] mb-1.5 font-medium">Properties (JSON object, type-specific)</label>
            <textarea
              v-model="propsJson"
              class="w-full box-border px-3 py-2.5 bg-[#0b131f] border border-[#1e324f] rounded-lg text-[#a3b8cc] text-sm font-mono min-h-[180px] resize-y"
            ></textarea>
          </div>

          <div class="flex justify-end mt-4">
            <button
              class="px-4 py-2 text-[0.86rem] font-semibold rounded-lg cursor-pointer border-none bg-[#00f3ff] text-[#060c14]"
              @click="persist()"
            >Save configuration</button>
          </div>
        </div>

        <div class="bg-[#0f1927] border border-[#1e324f] rounded-[14px] p-5">
          <div class="flex items-center gap-3 mb-3.5">
            <h2 class="text-white text-base font-semibold m-0">Bindings</h2>
            <span class="text-[#708aa6] text-sm">({{ bindings.length }})</span>
            <span class="flex-1"></span>
            <button
              class="px-4 py-2 text-[0.86rem] font-semibold rounded-lg cursor-pointer border-none bg-[#00f3ff] text-[#060c14]"
              @click="startAddBinding"
            >+ Add binding</button>
          </div>

          <div v-if="bindings.length === 0" class="text-[0.85rem] text-[#526e8c]">
            No bindings. Inbound messages will route to <code>defaultAgentId</code> if set.
          </div>
          <div
            v-for="(b, i) in bindings"
            :key="i"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#a3b8cc] bg-[#0b131f] mb-1.5 border border-[#142338]"
          >
            <span class="px-2.5 py-1 rounded-full text-[0.72rem] font-semibold bg-[#10233f] text-[#00f3ff] border border-[#2b5384]">#{{ b.index }}</span>
            <span class="flex-1 font-mono text-[0.86rem] text-[#708aa6]">{{ describe(b) }}</span>
            <button
              class="px-3 py-1.5 text-[0.84rem] font-medium rounded-lg cursor-pointer border border-[#142338] bg-[#0f1927] text-[#a3b8cc]"
              @click="startEditBinding(i)"
            >Edit</button>
            <button
              class="px-3 py-1.5 text-[0.84rem] font-medium rounded-lg cursor-pointer border border-[#5a1f1f] bg-[#0f1927] text-[#ef4444]"
              @click="deleteBindingAt(i)"
            >Delete</button>
          </div>
        </div>
      </template>
    </div>

    <!-- binding dialog -->
    <div
      v-if="editForm && editIdx != null"
      class="fixed inset-0 bg-[#060c14]/70 backdrop-blur-sm flex items-center justify-center z-50"
      @click.self="editForm = null; editIdx = null"
    >
      <div class="bg-[#0b131f] border border-[#1e324f] rounded-2xl p-7 w-[620px] max-w-[92vw] shadow-[0_24px_60px_rgba(0,0,0,0.5)]">
        <h3 class="text-white text-lg font-bold m-0 mb-4">{{ editIdx >= bindings.length ? 'Add binding' : 'Edit binding' }}</h3>
        <p class="text-[#708aa6] text-sm m-0 mb-3.5">
          Fill the most-specific selector you need; leave others blank. Routing tries
          peer → parentPeer → guild+roles → guild → team → account in that order.
        </p>

        <div class="grid grid-cols-2 gap-3.5" v-if="editForm">
          <div>
            <label class="block text-[0.85rem] text-[#708aa6] mb-1.5 font-medium">Tier</label>
            <select
              :value="editForm.tier"
              class="w-full box-border px-3 py-2.5 bg-[#0f1927] border border-[#1e324f] rounded-lg text-[#a3b8cc] text-sm"
              @change="editForm.tier = ($event.target as HTMLSelectElement).value as BindingTier"
            >
              <option v-for="t in TIERS" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
          <div>
            <label class="block text-[0.85rem] text-[#708aa6] mb-1.5 font-medium">Session scope (optional)</label>
            <select
              :value="editForm.sessionScope"
              class="w-full box-border px-3 py-2.5 bg-[#0f1927] border border-[#1e324f] rounded-lg text-[#a3b8cc] text-sm"
              @change="editForm.sessionScope = ($event.target as HTMLSelectElement).value"
            >
              <option value="">— inherit channel —</option>
              <option v-for="s in SCOPES" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
          <div>
            <label class="block text-[0.85rem] text-[#708aa6] mb-1.5 font-medium">peer</label>
            <input v-model="editForm.peer" class="w-full box-border px-3 py-2.5 bg-[#0f1927] border border-[#1e324f] rounded-lg text-[#a3b8cc] text-sm" />
          </div>
          <div>
            <label class="block text-[0.85rem] text-[#708aa6] mb-1.5 font-medium">parentPeer</label>
            <input v-model="editForm.parentPeer" class="w-full box-border px-3 py-2.5 bg-[#0f1927] border border-[#1e324f] rounded-lg text-[#a3b8cc] text-sm" />
          </div>
          <div>
            <label class="block text-[0.85rem] text-[#708aa6] mb-1.5 font-medium">guild</label>
            <input v-model="editForm.guild" class="w-full box-border px-3 py-2.5 bg-[#0f1927] border border-[#1e324f] rounded-lg text-[#a3b8cc] text-sm" />
          </div>
          <div>
            <label class="block text-[0.85rem] text-[#708aa6] mb-1.5 font-medium">roles (comma-separated)</label>
            <input v-model="editForm.roles" class="w-full box-border px-3 py-2.5 bg-[#0f1927] border border-[#1e324f] rounded-lg text-[#a3b8cc] text-sm" />
          </div>
          <div>
            <label class="block text-[0.85rem] text-[#708aa6] mb-1.5 font-medium">team</label>
            <input v-model="editForm.team" class="w-full box-border px-3 py-2.5 bg-[#0f1927] border border-[#1e324f] rounded-lg text-[#a3b8cc] text-sm" />
          </div>
          <div>
            <label class="block text-[0.85rem] text-[#708aa6] mb-1.5 font-medium">account</label>
            <input v-model="editForm.account" class="w-full box-border px-3 py-2.5 bg-[#0f1927] border border-[#1e324f] rounded-lg text-[#a3b8cc] text-sm" />
          </div>
          <div>
            <label class="block text-[0.85rem] text-[#708aa6] mb-1.5 font-medium">channel</label>
            <input v-model="editForm.channel" class="w-full box-border px-3 py-2.5 bg-[#0f1927] border border-[#1e324f] rounded-lg text-[#a3b8cc] text-sm" />
          </div>
        </div>

        <div class="flex justify-end gap-3 mt-6">
          <button
            class="px-3.5 py-2 text-[0.86rem] font-medium rounded-lg cursor-pointer border border-[#142338] bg-[#0b131f] text-[#a3b8cc]"
            @click="editForm = null; editIdx = null"
          >Cancel</button>
          <button
            class="px-4 py-2 text-[0.86rem] font-semibold rounded-lg cursor-pointer border-none bg-[#00f3ff] text-[#060c14]"
            @click="saveBinding"
          >{{ editIdx >= bindings.length ? 'Create' : 'Save' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>
