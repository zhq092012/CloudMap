<script setup lang="ts">
// ============================================================
// Ported from agentbuilder-main/frontend/src/components/ChannelBindingTable.tsx
// Editable table over AgentBinding[]: add / update / delete rows.
// ============================================================
import { ref, computed } from 'vue';
import * as api from '../api';
import type { AgentBinding, BindingCreateRequest, BindingTier, ChannelInfo } from '../types';

const props = withDefaults(
  defineProps<{
    agentId: string;
    channels: ChannelInfo[];
    bindings: AgentBinding[];
    readonly?: boolean;
  }>(),
  { readonly: false },
);

const emit = defineEmits<{ (e: 'change'): void }>();

type TierField = 'peer' | 'parentPeer' | 'roles' | 'guild' | 'team' | 'account' | 'channel';

const TIERS: { value: BindingTier; label: string; field: TierField }[] = [
  { value: 'peer', label: 'peer — 会话对端（最精确）', field: 'peer' },
  { value: 'parentPeer', label: 'parentPeer — 父级对端', field: 'parentPeer' },
  { value: 'guildRoles', label: 'guildRoles — 群组 + 角色', field: 'roles' },
  { value: 'guild', label: 'guild — 群组', field: 'guild' },
  { value: 'team', label: 'team — 团队', field: 'team' },
  { value: 'account', label: 'account — 账号', field: 'account' },
  { value: 'channel', label: 'channel — 渠道（兜底）', field: 'channel' },
];

const SCOPES: { value: string; label: string }[] = [
  { value: 'MAIN', label: 'MAIN — 每渠道单会话' },
  { value: 'PER_PEER', label: 'PER_PEER — 每发送者一个' },
  { value: 'PER_CHANNEL_PEER', label: 'PER_CHANNEL_PEER — 每渠道+发送者一个' },
  { value: 'PER_ACCOUNT_CHANNEL_PEER', label: 'PER_ACCOUNT_CHANNEL_PEER — 最精确' },
];

interface FormState {
  channelId: string;
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

type BindingPayload = BindingCreateRequest & { channelId: string };

function emptyForm(channelId: string): FormState {
  return {
    channelId,
    tier: 'peer',
    peer: '',
    parentPeer: '',
    guild: '',
    roles: '',
    team: '',
    account: '',
    channel: '',
    sessionScope: '',
  };
}

function bindingToForm(b: AgentBinding): FormState {
  return {
    channelId: b.channelId,
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

function formToReq(f: FormState): BindingPayload {
  const req: BindingPayload = { channelId: f.channelId, tier: f.tier };
  if (f.peer.trim()) req.peer = f.peer.trim();
  if (f.parentPeer.trim()) req.parentPeer = f.parentPeer.trim();
  if (f.guild.trim()) req.guild = f.guild.trim();
  if (f.roles.trim()) req.roles = f.roles.split(',').map((s) => s.trim()).filter(Boolean);
  if (f.team.trim()) req.team = f.team.trim();
  if (f.account.trim()) req.account = f.account.trim();
  if (f.channel.trim()) req.channel = f.channel.trim();
  if (f.sessionScope) req.sessionScope = f.sessionScope;
  return req;
}

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

function fieldOf(tier: BindingTier): TierField | undefined {
  return TIERS.find((t) => t.value === tier)?.field;
}

const err = ref<string | null>(null);
const draft = ref<FormState | null>(null);
// null when creating a new row, otherwise the existing binding being edited.
const editingKey = ref<string | null>(null);
const adding = ref(false);

const draftField = computed(() => (draft.value ? fieldOf(draft.value.tier) : undefined));
const rowKey = (b: AgentBinding) => `${b.channelId}#${b.index}`;

const channelIds = computed(() => props.channels.map((c) => c.channelId));

function startAdd(channelId?: string): void {
  if (props.readonly) return;
  err.value = null;
  adding.value = true;
  editingKey.value = null;
  draft.value = emptyForm(channelId ?? channelIds.value[0] ?? '');
}

function startEdit(b: AgentBinding): void {
  if (props.readonly) return;
  err.value = null;
  adding.value = false;
  editingKey.value = rowKey(b);
  draft.value = bindingToForm(b);
}

function cancel(): void {
  adding.value = false;
  editingKey.value = null;
  draft.value = null;
}

async function save(): Promise<void> {
  if (!draft.value) return;
  const form = draft.value;
  if (!form.channelId) {
    err.value = '请选择渠道。';
    return;
  }
  err.value = null;
  const req = formToReq(form);
  try {
    if (adding.value) {
      await api.addBinding(props.agentId, req);
    } else {
      const target = props.bindings.find((b) => rowKey(b) === editingKey.value);
      if (!target) throw new Error('绑定已不存在，请刷新。');
      await api.updateBinding(props.agentId, form.channelId, target.index, req);
    }
    cancel();
    emit('change');
  } catch (e) {
    err.value = e instanceof Error ? e.message : '保存失败';
  }
}

async function remove(b: AgentBinding): Promise<void> {
  if (props.readonly) return;
  if (!confirm(`删除绑定（${describe(b)}）？`)) return;
  err.value = null;
  try {
    await api.deleteBinding(props.agentId, b.channelId, b.index);
    if (editingKey.value === rowKey(b)) cancel();
    emit('change');
  } catch (e) {
    err.value = e instanceof Error ? e.message : '删除失败';
  }
}

defineExpose({ startAdd });
</script>

<template>
  <div class="bg-[#1a2332] border border-[#2d3a4d] rounded-lg p-5">
    <div class="flex items-center gap-3 mb-3.5">
      <h3 class="text-white text-[13.5px] font-semibold m-0">绑定表</h3>
      <span class="text-[#9ca3af] text-[12.5px]">({{ props.bindings.length }})</span>
      <span class="flex-1"></span>
      <button
        v-if="!props.readonly"
        type="button"
        class="px-4 py-2 text-[12.5px] font-semibold rounded-lg cursor-pointer border-none bg-[linear-gradient(135deg,#3b82f6_0%,#2563eb_100%)] text-white"
        @click="startAdd()"
      >+ 新增绑定</button>
    </div>

    <div v-if="err" class="text-[#ef4444] text-[12.5px] mb-2.5">{{ err }}</div>

    <div class="overflow-x-auto">
      <table class="w-full border-collapse text-[12.5px]">
        <thead>
          <tr class="text-left text-[10.5px] font-semibold uppercase tracking-wide text-[#6b7280]">
            <th class="px-3 py-2 border-b border-[#2d3a4d]">渠道</th>
            <th class="px-3 py-2 border-b border-[#2d3a4d]">层级</th>
            <th class="px-3 py-2 border-b border-[#2d3a4d]">匹配配置</th>
            <th class="px-3 py-2 border-b border-[#2d3a4d]">会话范围</th>
            <th class="px-3 py-2 border-b border-[#2d3a4d] text-right">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="props.bindings.length === 0 && !adding">
            <td colspan="5" class="px-3 py-4 text-[12.5px] text-[#6b7280]">暂无绑定。</td>
          </tr>

          <template v-for="b in props.bindings" :key="rowKey(b)">
            <!-- read-only row -->
            <tr v-if="editingKey !== rowKey(b)" class="border-b border-[#2d3a4d]">
              <td class="px-3 py-2.5 text-[#cbd5e1] font-mono text-[12.5px]">{{ b.channelId }}</td>
              <td class="px-3 py-2.5">
                <span class="px-2.5 py-1 rounded-full text-[10.5px] font-semibold bg-[rgba(59,130,246,0.16)] text-[#93c5fd] border border-[#3d4d64]">{{ b.tier }}</span>
              </td>
              <td class="px-3 py-2.5 font-mono text-[12.5px] text-[#9ca3af]">{{ describe(b) }}</td>
              <td class="px-3 py-2.5">
                <span
                  v-if="b.sessionScope"
                  class="px-2.5 py-1 rounded-full text-[10.5px] font-medium bg-[#1a2332] text-[#cbd5e1] border border-[#2d3a4d]"
                >{{ b.sessionScope }}</span>
                <span v-else class="text-[#6b7280] text-[12px]">— 继承渠道 —</span>
              </td>
              <td class="px-3 py-2.5 text-right whitespace-nowrap">
                <template v-if="!props.readonly">
                  <button
                    type="button"
                    class="px-3 py-1.5 text-[12.5px] font-medium rounded-lg cursor-pointer border border-[#2d3a4d] bg-[#111827] text-[#cbd5e1] hover:bg-[#253141]"
                    @click="startEdit(b)"
                  >编辑</button>
                  <button
                    type="button"
                    class="ml-2 px-3 py-1.5 text-[12.5px] font-medium rounded-lg cursor-pointer border border-[rgba(239,68,68,0.4)] bg-[#111827] text-[#ef4444] hover:bg-[rgba(239,68,68,0.1)]"
                    @click="remove(b)"
                  >删除</button>
                </template>
                <span v-else class="text-[#6b7280] text-[12px]">只读</span>
              </td>
            </tr>

            <!-- edit row -->
            <tr v-else-if="draft" class="border-b border-[#2d3a4d] bg-[#111827]">
              <td class="px-3 py-2.5 text-[#cbd5e1] font-mono text-[12.5px] align-top">{{ draft.channelId }}</td>
              <td class="px-3 py-2.5 align-top">
                <select
                  v-model="draft.tier"
                  class="w-full box-border px-2.5 py-2 bg-[#1a2332] border border-[#2d3a4d] rounded-lg text-[#cbd5e1] text-[12.5px]"
                >
                  <option v-for="t in TIERS" :key="t.value" :value="t.value">{{ t.label }}</option>
                </select>
              </td>
              <td class="px-3 py-2.5 align-top">
                <div class="flex flex-col gap-2">
                  <input
                    v-if="draftField === 'peer'"
                    v-model="draft.peer"
                    placeholder="例如 user-42"
                    class="w-full box-border px-2.5 py-2 bg-[#1a2332] border border-[#2d3a4d] rounded-lg text-[#cbd5e1] text-[12.5px] placeholder-[#6b7280]"
                  />
                  <input
                    v-if="draftField === 'parentPeer'"
                    v-model="draft.parentPeer"
                    placeholder="parentPeer"
                    class="w-full box-border px-2.5 py-2 bg-[#1a2332] border border-[#2d3a4d] rounded-lg text-[#cbd5e1] text-[12.5px] placeholder-[#6b7280]"
                  />
                  <template v-if="draftField === 'roles'">
                    <input
                      v-model="draft.guild"
                      placeholder="guild"
                      class="w-full box-border px-2.5 py-2 bg-[#1a2332] border border-[#2d3a4d] rounded-lg text-[#cbd5e1] text-[12.5px] placeholder-[#6b7280]"
                    />
                    <input
                      v-model="draft.roles"
                      placeholder="roles（逗号分隔），如 admin, support"
                      class="w-full box-border px-2.5 py-2 bg-[#1a2332] border border-[#2d3a4d] rounded-lg text-[#cbd5e1] text-[12.5px] placeholder-[#6b7280]"
                    />
                  </template>
                  <input
                    v-if="draftField === 'guild'"
                    v-model="draft.guild"
                    placeholder="guild"
                    class="w-full box-border px-2.5 py-2 bg-[#1a2332] border border-[#2d3a4d] rounded-lg text-[#cbd5e1] text-[12.5px] placeholder-[#6b7280]"
                  />
                  <input
                    v-if="draftField === 'team'"
                    v-model="draft.team"
                    placeholder="team"
                    class="w-full box-border px-2.5 py-2 bg-[#1a2332] border border-[#2d3a4d] rounded-lg text-[#cbd5e1] text-[12.5px] placeholder-[#6b7280]"
                  />
                  <input
                    v-if="draftField === 'account'"
                    v-model="draft.account"
                    placeholder="account"
                    class="w-full box-border px-2.5 py-2 bg-[#1a2332] border border-[#2d3a4d] rounded-lg text-[#cbd5e1] text-[12.5px] placeholder-[#6b7280]"
                  />
                  <input
                    v-if="draftField === 'channel'"
                    v-model="draft.channel"
                    :placeholder="draft.channelId || '留空表示兜底'"
                    class="w-full box-border px-2.5 py-2 bg-[#1a2332] border border-[#2d3a4d] rounded-lg text-[#cbd5e1] text-[12.5px] placeholder-[#6b7280]"
                  />
                </div>
              </td>
              <td class="px-3 py-2.5 align-top">
                <select
                  v-model="draft.sessionScope"
                  class="w-full box-border px-2.5 py-2 bg-[#1a2332] border border-[#2d3a4d] rounded-lg text-[#cbd5e1] text-[12.5px]"
                >
                  <option value="">— 继承渠道 —</option>
                  <option v-for="s in SCOPES" :key="s.value" :value="s.value">{{ s.label }}</option>
                </select>
              </td>
              <td class="px-3 py-2.5 text-right align-top whitespace-nowrap">
                <button
                  type="button"
                  class="px-3.5 py-2 text-[12.5px] font-semibold rounded-lg cursor-pointer border-none bg-[linear-gradient(135deg,#3b82f6_0%,#2563eb_100%)] text-white"
                  @click="save"
                >保存</button>
                <button
                  type="button"
                  class="ml-2 px-3 py-2 text-[12.5px] font-medium rounded-lg cursor-pointer border border-[#2d3a4d] bg-[#111827] text-[#cbd5e1] hover:bg-[#253141]"
                  @click="cancel"
                >取消</button>
              </td>
            </tr>
          </template>

          <!-- new row -->
          <tr v-if="adding && draft" class="border-b border-[#2d3a4d] bg-[#111827]">
            <td class="px-3 py-2.5 align-top">
              <select
                v-model="draft.channelId"
                class="w-full box-border px-2.5 py-2 bg-[#1a2332] border border-[#2d3a4d] rounded-lg text-[#cbd5e1] text-[12.5px]"
              >
                <option value="">— 选择渠道 —</option>
                <option v-for="cid in channelIds" :key="cid" :value="cid">{{ cid }}</option>
              </select>
            </td>
            <td class="px-3 py-2.5 align-top">
              <select
                v-model="draft.tier"
                class="w-full box-border px-2.5 py-2 bg-[#1a2332] border border-[#2d3a4d] rounded-lg text-[#cbd5e1] text-[12.5px]"
              >
                <option v-for="t in TIERS" :key="t.value" :value="t.value">{{ t.label }}</option>
              </select>
            </td>
            <td class="px-3 py-2.5 align-top">
              <div class="flex flex-col gap-2">
                <input
                  v-if="draftField === 'peer'"
                  v-model="draft.peer"
                  placeholder="例如 user-42"
                  class="w-full box-border px-2.5 py-2 bg-[#1a2332] border border-[#2d3a4d] rounded-lg text-[#cbd5e1] text-[12.5px] placeholder-[#6b7280]"
                />
                <input
                  v-if="draftField === 'parentPeer'"
                  v-model="draft.parentPeer"
                  placeholder="parentPeer"
                  class="w-full box-border px-2.5 py-2 bg-[#1a2332] border border-[#2d3a4d] rounded-lg text-[#cbd5e1] text-[12.5px] placeholder-[#6b7280]"
                />
                <template v-if="draftField === 'roles'">
                  <input
                    v-model="draft.guild"
                    placeholder="guild"
                    class="w-full box-border px-2.5 py-2 bg-[#1a2332] border border-[#2d3a4d] rounded-lg text-[#cbd5e1] text-[12.5px] placeholder-[#6b7280]"
                  />
                  <input
                    v-model="draft.roles"
                    placeholder="roles（逗号分隔），如 admin, support"
                    class="w-full box-border px-2.5 py-2 bg-[#1a2332] border border-[#2d3a4d] rounded-lg text-[#cbd5e1] text-[12.5px] placeholder-[#6b7280]"
                  />
                </template>
                <input
                  v-if="draftField === 'guild'"
                  v-model="draft.guild"
                  placeholder="guild"
                  class="w-full box-border px-2.5 py-2 bg-[#1a2332] border border-[#2d3a4d] rounded-lg text-[#cbd5e1] text-[12.5px] placeholder-[#6b7280]"
                />
                <input
                  v-if="draftField === 'team'"
                  v-model="draft.team"
                  placeholder="team"
                  class="w-full box-border px-2.5 py-2 bg-[#1a2332] border border-[#2d3a4d] rounded-lg text-[#cbd5e1] text-[12.5px] placeholder-[#6b7280]"
                />
                <input
                  v-if="draftField === 'account'"
                  v-model="draft.account"
                  placeholder="account"
                  class="w-full box-border px-2.5 py-2 bg-[#1a2332] border border-[#2d3a4d] rounded-lg text-[#cbd5e1] text-[12.5px] placeholder-[#6b7280]"
                />
                <input
                  v-if="draftField === 'channel'"
                  v-model="draft.channel"
                  :placeholder="draft.channelId || '留空表示兜底'"
                  class="w-full box-border px-2.5 py-2 bg-[#1a2332] border border-[#2d3a4d] rounded-lg text-[#cbd5e1] text-[12.5px] placeholder-[#6b7280]"
                />
              </div>
            </td>
            <td class="px-3 py-2.5 align-top">
              <select
                v-model="draft.sessionScope"
                class="w-full box-border px-2.5 py-2 bg-[#1a2332] border border-[#2d3a4d] rounded-lg text-[#cbd5e1] text-[12.5px]"
              >
                <option value="">— 继承渠道 —</option>
                <option v-for="s in SCOPES" :key="s.value" :value="s.value">{{ s.label }}</option>
              </select>
            </td>
            <td class="px-3 py-2.5 text-right align-top whitespace-nowrap">
              <button
                type="button"
                class="px-3.5 py-2 text-[12.5px] font-semibold rounded-lg cursor-pointer border-none bg-[linear-gradient(135deg,#3b82f6_0%,#2563eb_100%)] text-white"
                @click="save"
              >创建</button>
              <button
                type="button"
                class="ml-2 px-3 py-2 text-[12.5px] font-medium rounded-lg cursor-pointer border border-[#2d3a4d] bg-[#111827] text-[#cbd5e1] hover:bg-[#253141]"
                @click="cancel"
              >取消</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="text-[#6b7280] text-[12px] mt-3 mb-0">
      填写最精确的匹配项，其余留空。路由匹配顺序：peer → parentPeer → guild+roles → guild → team → account → channel。
    </p>
  </div>
</template>
