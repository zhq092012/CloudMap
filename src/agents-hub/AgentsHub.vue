<template>
  <HubAuthGate>
    <div class="h-full overflow-y-auto custom-scrollbar bg-[#060c14] text-[#a3b8cc] p-8">
      <!-- header -->
      <div class="flex items-center justify-between mb-3 flex-wrap gap-3">
        <div class="flex items-center gap-3">
          <span class="w-9 h-9 rounded-lg flex items-center justify-center text-lg text-white"
            style="background: linear-gradient(135deg,#00f3ff 0%,#3b82f6 100%);">🤖</span>
          <h1 class="text-2xl font-bold text-white tracking-tight m-0">智能体中心</h1>
        </div>
        <div class="flex items-center gap-2">
          <!-- <button @click="go('AgentHubChannels')"
            class="px-3 py-1.5 rounded-lg border border-[#1e3452] text-[#a3b8cc] hover:text-white hover:border-[#2b5384] transition-colors text-sm">
            📡 渠道
          </button>
          <button @click="go('AgentHubMarketplaces')"
            class="px-3 py-1.5 rounded-lg border border-[#1e3452] text-[#a3b8cc] hover:text-white hover:border-[#2b5384] transition-colors text-sm">
            🧩 市场
          </button>
          <button @click="go('AgentHubProfile')"
            class="px-3 py-1.5 rounded-lg border border-[#1e3452] text-[#a3b8cc] hover:text-white hover:border-[#2b5384] transition-colors text-sm">
            👤 资料
          </button> -->
          <button @click="go('AgentHubTaskBoard')"
            class="px-3 py-1.5 rounded-lg border border-[#1e3452] text-[#a3b8cc] hover:text-white hover:border-[#2b5384] transition-colors text-sm">
            📋 智能任务看板
          </button>
          <button @click="go('AgentHubCreate')"
            class="px-4 py-1.5 rounded-lg font-semibold text-white text-sm transition-all"
            style="background: linear-gradient(135deg,#00f3ff 0%,#3b82f6 100%); box-shadow: 0 2px 6px rgba(0,243,255,0.35);">
            ＋ 新建智能体
          </button>
        </div>
      </div>

      <p class="text-[#708aa6] text-sm leading-relaxed max-w-3xl mb-6">
        每个智能体由其工作区文件夹定义 —— <code class="px-1.5 py-0.5 rounded bg-[#0f1927] text-[#00f3ff] text-xs">AGENTS.md</code>、
        <code class="px-1.5 py-0.5 rounded bg-[#0f1927] text-[#00f3ff] text-xs">tools.json</code>、技能与子智能体共同决定其行为。
      </p>

      <!-- filters -->
      <div class="flex gap-2 mb-6 flex-wrap">
        <button v-for="f in FILTERS" :key="f.key" @click="filter = f.key"
          class="px-3.5 py-1.5 rounded-full text-sm font-semibold border transition-colors inline-flex items-center gap-1.5"
          :class="filter === f.key
            ? 'bg-[#00f3ff] text-[#04121f] border-[#00f3ff]'
            : 'bg-[#0b131f] text-[#708aa6] border-[#1e324f] hover:border-[#2b5384] hover:text-[#a3b8cc]'">
          {{ f.label }}
          <span class="text-xs px-1.5 py-0.5 rounded-full"
            :class="filter === f.key ? 'bg-[#04121f]/20 text-[#04121f]' : 'bg-[#0f1927] text-[#526e8c]'">
            {{ countFor(f.key) }}
          </span>
        </button>
      </div>

      <!-- Agent类型 & 分类 筛选（参照 AgentsManage.vue） -->
      <div class="bg-[#0b131f]/40 border border-[#142338] rounded-lg p-4 mb-6 space-y-3">
        <div v-for="fc in filterConfigs" :key="fc.key" class="flex items-start gap-4">
          <span class="text-[#708aa6] w-20 py-1 flex-shrink-0 text-right text-sm">{{ fc.label }}</span>
          <div class="flex flex-wrap gap-1.5 flex-1">
            <button v-for="opt in fc.options" :key="opt" @click="handleFilterChange(fc.key, opt)"
              :class="activeFilters[fc.key] === opt
                ? 'bg-[#10243a] text-[#00f3ff] border-[#2b5384]'
                : 'bg-[#0f1927] text-[#708aa6] border-[#1e324f] hover:border-[#2b5384] hover:text-[#a3b8cc]'
              " class="border px-2.5 py-1 rounded transition-all text-xs min-w-[48px] text-center">
              {{ opt }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="store.error" class="text-[#ef4444] text-sm mb-4">{{ store.error }}</div>

      <!-- grid -->
      <div v-if="store.loading" class="text-[#708aa6] text-sm">加载中…</div>
      <div v-else class="grid gap-4 grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
        <div v-for="a in visible" :key="a.id"
          class="relative bg-[#0f1927] border border-[#1e324f] rounded-xl p-5 flex flex-col gap-2.5 cursor-pointer transition-all hover:-translate-y-0.5 hover:border-[#2b5384]"
          style="box-shadow: 0 1px 3px rgba(0,0,0,0.3);"
          @click="openAgent(a)">
          <div class="flex items-center gap-3">
            <span class="w-10 h-10 rounded-lg flex items-center justify-center text-xl border border-[#2b5384] flex-shrink-0"
              style="background: linear-gradient(135deg,#0b2030 0%,#102a44 100%);">🤖</span>
            <span class="font-semibold text-white text-[15px] flex-1 truncate">{{ a.name }}</span>
            <span class="px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap border"
              :style="{ background: badgeFor(a).bg, color: badgeFor(a).fg, borderColor: badgeFor(a).bd }">
              {{ badgeFor(a).label }}
            </span>
          </div>

          <div v-if="a.status || a.category || (a.tags && a.tags.length)" class="flex flex-wrap gap-1.5">
            <span v-if="a.status" class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
              :class="statusClass(a.status)">● {{ a.status }}</span>
            <span v-if="a.category" class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#10243a] text-[#7fd4ff] border border-[#1d3a57]">
              {{ categoryLabel(a.category) }}
            </span>
            <span v-for="tag in a.tags" :key="tag"
              class="px-2 py-0.5 rounded-sm text-[10px] font-medium border inline-flex items-center gap-1"
              :class="tagClass(tag)">
              {{ tagLabel(tag) }}
            </span>
          </div>

          <div class="text-[#708aa6] text-[13px] leading-relaxed min-h-[40px]">
            {{ a.description || '暂无描述' }}
          </div>

          <div class="flex items-center justify-between mt-1">
            <span class="text-[11px] text-[#526e8c] font-mono truncate">{{ a.id }}</span>
            <button v-if="canClone(a)" @click.stop="handleClone(a)" :disabled="busyId === a.id"
              class="bg-transparent text-[#708aa6] border border-[#1e324f] rounded-lg px-2.5 py-1 text-xs font-medium hover:text-[#00f3ff] hover:border-[#2b5384] transition-colors disabled:opacity-60">
              {{ busyId === a.id ? '⏳' : '🔁 Clone' }}
            </button>
          </div>
        </div>

        <div v-if="!store.loading && visible.length === 0"
          class="text-[#526e8c] text-sm italic col-span-full">该分类下暂无智能体。</div>
      </div>
    </div>
  </HubAuthGate>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import HubAuthGate from './HubAuthGate.vue';
import { useAgentHubStore } from './store';
import { getUserId } from './api';
import type { AgentDefinition } from './types';

type Filter = 'all' | 'mine' | 'shared' | 'global' | 'clone';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'mine', label: '我的' },
  { key: 'shared', label: '共享给我' },
  { key: 'global', label: '全局' },
  { key: 'clone', label: '仅可克隆' },
];

const store = useAgentHubStore();
const router = useRouter();
const route = useRoute();
const filter = ref<Filter>('all');
const busyId = ref<string | null>(null);
const me = computed(() => getUserId());

// Agent类型 & 分类 筛选配置（参照 AgentsManage.vue，仅这两项）
const filterConfigs = [
  { label: 'Agent类型', key: 'type', options: ['全部', '角色模拟型', '功能型', '调度型'] },
  { label: '分类', key: 'classification', options: ['全部', '红方', '蓝方'] },
];
const activeFilters = reactive<Record<string, string>>({ type: '全部', classification: '全部' });
function handleFilterChange(key: string, option: string) {
  activeFilters[key] = option;
}

function bucket(a: AgentDefinition): Filter[] {
  const tags: Filter[] = ['all'];
  if (a.scope === 'global') tags.push('global');
  else if (a.ownerId === me.value) tags.push('mine');
  else if (a.tierForCurrentUser === 'CLONE') tags.push('clone');
  else tags.push('shared');
  return tags;
}
function countFor(key: Filter): number {
  return store.agents.filter((a) => bucket(a).includes(key)).length;
}
const visible = computed(() =>
  store.agents.filter((a) => {
    // 现有：按归属/权限（全部/我的/共享给我/全局/仅可克隆）筛选
    if (!bucket(a).includes(filter.value)) return false;
    // Agent类型 筛选（角色模拟型 / 功能型 / 调度型）
    if (activeFilters.type !== '全部' && categoryLabel(a.category ?? '') !== activeFilters.type) return false;
    // 分类 筛选（红方 / 蓝方）
    if (activeFilters.classification !== '全部') {
      const want = activeFilters.classification === '红方' ? 'red-side' : 'blue-side';
      if (!(a.tags || []).includes(want)) return false;
    }
    return true;
  }),
);

function badgeFor(a: AgentDefinition) {
  if (a.scope === 'global')
    return { label: '全局', bg: 'rgba(0,243,255,0.12)', fg: '#00f3ff', bd: 'rgba(0,243,255,0.4)' };
  if (a.ownerId === me.value)
    return { label: '拥有者', bg: 'rgba(0,255,196,0.12)', fg: '#00ffc4', bd: 'rgba(0,255,196,0.4)' };
  if (a.tierForCurrentUser === 'CLONE')
    return { label: '🔁 仅可克隆', bg: 'rgba(245,158,11,0.12)', fg: '#fbbf24', bd: 'rgba(245,158,11,0.4)' };
  return { label: `共享自 ${a.ownerId ?? '?'}`, bg: 'rgba(59,130,246,0.12)', fg: '#7fd4ff', bd: 'rgba(59,130,246,0.4)' };
}
function canClone(a: AgentDefinition) {
  const t = a.tierForCurrentUser;
  return t === 'CLONE' || t === 'RUN' || t === 'EDIT';
}
function canOpen(a: AgentDefinition) {
  return a.scope === 'global' || a.tierForCurrentUser === 'RUN' || a.tierForCurrentUser === 'EDIT';
}
function statusClass(s: string) {
  const map: Record<string, string> = {
    ready: 'bg-[#0b2e1f] text-[#00ffc4]',
    inuse: 'bg-[#2e2a0b] text-[#fbbf24]',
    shared: 'bg-[#0b1e2e] text-[#7fd4ff]',
    offline: 'bg-[#2e0b0b] text-[#ef4444]',
    free: 'bg-[#0f1927] text-[#708aa6]',
  };
  return map[s] ?? 'bg-[#0f1927] text-[#708aa6]';
}
function categoryLabel(c: string) {
  return c === 'simulation' ? '角色模拟型' : c === 'functional' ? '功能型' : c === 'scheduling' ? '调度型' : c;
}
function tagClass(t: string) {
  if (t === 'red-side') return 'bg-[#2e0b0b] text-[#ef4444] border-[#5a1f1f]';
  if (t === 'blue-side') return 'bg-[#0b1e2e] text-[#7fd4ff] border-[#1d3a57]';
  return 'bg-[#0f1927] text-[#708aa6] border-[#1e324f]';
}
function tagLabel(t: string) {
  return t === 'red-side' ? '红方' : t === 'blue-side' ? '蓝方' : t;
}

function openAgent(a: AgentDefinition) {
  if (canOpen(a)) router.push(`/agents-hub/agent/${encodeURIComponent(a.id)}/chat`);
  else if (canClone(a)) router.push(`/agents-hub/agent/${encodeURIComponent(a.id)}/chat`);
}
async function handleClone(src: AgentDefinition) {
  busyId.value = src.id;
  store.error = '';
  try {
    const clone = await store.cloneAgent(src.id, {});
    router.push(`/agents-hub/agent/${encodeURIComponent(clone.id)}/chat`);
  } catch (e) {
    store.error = (e as Error).message || '克隆失败';
  } finally {
    busyId.value = null;
  }
}
function go(name: string) {
  router.push({ name });
}

onMounted(() => {
  store.fetchAgents();
});

// ?clone=<id> deep-link from CLONE-only landing card
watch(
  () => route.query.clone,
  async (q) => {
    if (!q || typeof q !== 'string' || store.loading) return;
    const src = store.agents.find((a) => a.id === q);
    if (!src) return;
    router.replace({ name: 'AgentsHub' });
    await handleClone(src);
  },
  { immediate: true },
);
</script>
