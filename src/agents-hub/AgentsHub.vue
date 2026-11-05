<template>
  <HubAuthGate>
    <div class="hub-page">
      <!-- header -->
      <div class="hub-head">
        <div class="hub-brand">
          <span class="hub-logo">🤖</span>
          <h1 class="hub-title">智能体中心</h1>
        </div>
        <div class="hub-actions">
          <!-- <button class="hub-ghost" @click="go('AgentHubChannels')">📡 渠道</button>
          <button class="hub-ghost" @click="go('AgentHubMarketplaces')">🧩 市场</button>
          <button class="hub-ghost" @click="go('AgentHubProfile')">👤 资料</button> -->
          <button class="hub-ghost" @click="go('AgentHubTaskBoard')">📋 智能任务看板</button>
          <button class="hub-primary" @click="go('AgentHubCreate')">＋ 新建智能体</button>
        </div>
      </div>

      <p class="hub-lead">
        每个智能体由其工作区文件夹定义 —— <code>AGENTS.md</code>、<code>tools.json</code>、技能与子智能体共同决定其行为。
      </p>

      <!-- filters：归属 / 权限 -->
      <div class="hub-pills">
        <button
          v-for="f in FILTERS"
          :key="f.key"
          class="hub-pill"
          :class="{ 'is-active': filter === f.key }"
          @click="filter = f.key"
        >
          {{ f.label }}
          <span class="hub-pill-count">{{ countFor(f.key) }}</span>
        </button>
      </div>

      <!-- Agent类型 & 分类 筛选 -->
      <div class="hub-panel">
        <div v-for="fc in filterConfigs" :key="fc.key" class="hub-panel-row">
          <span class="hub-panel-label">{{ fc.label }}</span>
          <div class="hub-panel-options">
            <button
              v-for="opt in fc.options"
              :key="opt"
              class="hub-chip"
              :class="{ 'is-active': activeFilters[fc.key] === opt }"
              @click="handleFilterChange(fc.key, opt)"
            >
              {{ opt }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="store.error" class="hub-error">{{ store.error }}</div>

      <!-- grid -->
      <div v-if="store.loading" class="hub-loading">加载中…</div>
      <div v-else class="hub-grid">
        <div v-for="a in visible" :key="a.id" class="hub-card" @click="openAgent(a)">
          <div class="hub-card-head">
            <span
              class="hub-avatar"
              :style="{ '--cat-a': meta(a).from, '--cat-b': meta(a).to }"
            >{{ meta(a).icon }}</span>
            <span class="hub-name" :title="a.name">{{ a.name }}</span>
            <span
              class="hub-scope"
              :style="{ background: badgeFor(a).bg, color: badgeFor(a).fg, borderColor: badgeFor(a).bd }"
            >
              {{ badgeFor(a).label }}
            </span>
          </div>

          <div v-if="a.status || a.category || (a.tags && a.tags.length)" class="hub-meta">
            <span v-if="a.status" class="hub-status">
              <i class="hub-dot" :class="`is-${statusKey(a.status)}`"></i>{{ statusLabel(a.status) }}
            </span>
            <span
              v-if="a.category"
              class="hub-cat"
              :style="{
                '--cat-c': meta(a).to,
                '--cat-bg': hexA(meta(a).to, 0.12),
                '--cat-bd': hexA(meta(a).to, 0.4),
              }"
            >{{ meta(a).label }}</span>
            <span v-for="tag in a.tags" :key="tag" class="hub-tag" :class="tagClass(tag)">
              {{ tagLabel(tag) }}
            </span>
          </div>

          <p class="hub-card-desc">{{ a.description || '暂无描述' }}</p>

          <div class="hub-card-foot">
            <span class="hub-id" :title="a.id">{{ a.id }}</span>
            <button v-if="canClone(a)" class="hub-clone" :disabled="busyId === a.id" @click.stop="handleClone(a)">
              {{ busyId === a.id ? '⏳' : '🔁 Clone' }}
            </button>
          </div>
        </div>

        <div v-if="visible.length === 0" class="hub-empty">该分类下暂无智能体。</div>
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

// Agent 类型：调度类 / 角色类 / 执行类 / 校验类 / 仿真类
// 取值沿用后端既有枚举（scheduling / simulation / functional），新增执行类与校验类；
// 旧值同时兼容 xxx 侧命名（scheduler / role / simulator），保证历史数据也有颜色与中文名
type CategoryMeta = { label: string; icon: string; from: string; to: string };
const CATEGORY_META: Record<string, CategoryMeta> = {
  scheduling: { label: '调度类', icon: '🎯', from: '#3b82f6', to: '#2563eb' },
  scheduler: { label: '调度类', icon: '🎯', from: '#3b82f6', to: '#2563eb' },
  simulation: { label: '角色类', icon: '🎭', from: '#0ea5e9', to: '#0284c7' },
  role: { label: '角色类', icon: '🎭', from: '#0ea5e9', to: '#0284c7' },
  executor: { label: '执行类', icon: '⚡', from: '#10b981', to: '#059669' },
  validator: { label: '校验类', icon: '✓', from: '#f59e0b', to: '#d97706' },
  functional: { label: '仿真类', icon: '◐', from: '#ef4444', to: '#dc2626' },
  simulator: { label: '仿真类', icon: '◐', from: '#ef4444', to: '#dc2626' },
};
const FALLBACK_META: CategoryMeta = { label: '未分类', icon: '🤖', from: '#3b82f6', to: '#2563eb' };

const store = useAgentHubStore();
const router = useRouter();
const route = useRoute();
const filter = ref<Filter>('all');
const busyId = ref<string | null>(null);
const me = computed(() => getUserId());

// Agent类型 & 分类 筛选配置（仅这两项）
const filterConfigs = [
  { label: 'Agent类型', key: 'type', options: ['全部', '调度类', '角色类', '执行类', '校验类', '仿真类'] },
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
    // 归属/权限筛选（全部 / 我的 / 共享给我 / 全局 / 仅可克隆）
    if (!bucket(a).includes(filter.value)) return false;
    // Agent类型 筛选（按中文类型名比对，兼容新旧枚举值）
    if (activeFilters.type !== '全部' && meta(a).label !== activeFilters.type) return false;
    // 分类 筛选（红方 / 蓝方）
    if (activeFilters.classification !== '全部') {
      const want = activeFilters.classification === '红方' ? 'red-side' : 'blue-side';
      if (!(a.tags || []).includes(want)) return false;
    }
    return true;
  }),
);

// 类型元信息：未知类型退回兜底配色，label 用原始值
function meta(a: AgentDefinition): CategoryMeta {
  const hit = CATEGORY_META[a.category ?? ''];
  if (hit) return hit;
  return a.category ? { ...FALLBACK_META, label: a.category } : FALLBACK_META;
}

// #rrggbb → rgba()，供类型色标签的半透明底/边框使用
function hexA(hex: string, alpha: number) {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

function badgeFor(a: AgentDefinition) {
  if (a.scope === 'global')
    return { label: '全局', bg: 'rgba(59,130,246,0.12)', fg: '#93c5fd', bd: 'rgba(59,130,246,0.4)' };
  if (a.ownerId === me.value)
    return { label: '拥有者', bg: 'rgba(16,185,129,0.12)', fg: '#6ee7b7', bd: 'rgba(16,185,129,0.4)' };
  if (a.tierForCurrentUser === 'CLONE')
    return { label: '🔁 仅可克隆', bg: 'rgba(245,158,11,0.12)', fg: '#f59e0b', bd: 'rgba(245,158,11,0.4)' };
  return { label: `共享自 ${a.ownerId ?? '?'}`, bg: 'rgba(59,130,246,0.12)', fg: '#93c5fd', bd: 'rgba(59,130,246,0.4)' };
}
function canClone(a: AgentDefinition) {
  const t = a.tierForCurrentUser;
  return t === 'CLONE' || t === 'RUN' || t === 'EDIT';
}
function canOpen(a: AgentDefinition) {
  return a.scope === 'global' || a.tierForCurrentUser === 'RUN' || a.tierForCurrentUser === 'EDIT';
}

// 运行状态：圆点着色，文字统一用次要文本色（同 xxx agent-status 的写法）
const STATUS_TEXT: Record<string, string> = {
  ready: '就绪',
  inuse: '占用中',
  shared: '共享',
  offline: '离线',
  free: '空闲',
};
const STATUS_TONE: Record<string, string> = {
  ready: 'ok',
  inuse: 'warn',
  shared: 'info',
  offline: 'danger',
  free: 'idle',
};
function statusLabel(s: string) {
  return STATUS_TEXT[s] ?? s;
}
function statusKey(s: string) {
  return STATUS_TONE[s] ?? 'idle';
}

function tagClass(t: string) {
  if (t === 'red-side') return 'is-red';
  if (t === 'blue-side') return 'is-blue';
  return 'is-neutral';
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

<style scoped lang="scss">
/* ============================================================
   配色 / 字号 / 间距取自 xxx「主屏原型_云图系统.html」智能体中心
   （token 同 xxx/components.css 的 --yt-* 一套）
   ============================================================ */
$bg-root: #0a0e17;
$bg-panel: #1a2332;
$bg-sunken: #111827;
$border: #2d3a4d;
$border-strong: #3d4d64;
$text: #e5e7eb;
$text-2: #9ca3af;
$text-3: #6b7280;
$accent: #3b82f6;
$accent-soft: rgba(59, 130, 246, 0.1);
$accent-active: rgba(59, 130, 246, 0.16);
$green: #10b981;
$orange: #f59e0b;
$red: #ef4444;
$radius-sm: 4px;
$radius-md: 6px;
$radius-lg: 8px;
$ease: 0.15s ease;

.hub-page {
  height: 100%;
  overflow-y: auto;
  padding: 26px 32px 32px;
  background: $bg-root;
  color: $text;
  scrollbar-width: thin;
  scrollbar-color: rgba(61, 77, 100, 0.9) transparent;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    border-radius: 4px;
    background: rgba(45, 58, 77, 0.9);
  }

  &::-webkit-scrollbar-thumb:hover {
    background: $border-strong;
  }
}

/* ---------- 页头 ---------- */
.hub-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.hub-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.hub-logo {
  width: 34px;
  height: 34px;
  border-radius: $radius-lg;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  line-height: 1;
  flex: none;
  background: linear-gradient(135deg, $accent 0%, #2563eb 100%);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.28);
}

.hub-title {
  margin: 0;
  font-size: 21px;
  font-weight: 700;
  letter-spacing: -0.2px;
  line-height: 1.2;
  color: $text;
}

.hub-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hub-ghost,
.hub-primary {
  height: 32px;
  padding: 0 14px;
  border-radius: $radius-md;
  font-size: 12.5px;
  font-weight: 500;
  line-height: 1;
  cursor: pointer;
  transition: color $ease, border-color $ease, background $ease, box-shadow $ease;
}

.hub-ghost {
  background: transparent;
  border: 1px solid $border;
  color: $text-2;

  &:hover {
    color: $text;
    border-color: $border-strong;
    background: rgba(59, 130, 246, 0.06);
  }
}

.hub-primary {
  border: 1px solid transparent;
  color: #fff;
  font-weight: 600;
  background: linear-gradient(135deg, $accent 0%, #2563eb 100%);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.32);

  &:hover {
    box-shadow: 0 4px 14px rgba(59, 130, 246, 0.42);
  }
}

.hub-lead {
  max-width: 760px;
  margin: 0 0 18px;
  font-size: 12.5px;
  line-height: 1.75;
  color: $text-3;

  code {
    padding: 1px 6px;
    border-radius: $radius-sm;
    background: $bg-sunken;
    border: 1px solid rgba(59, 130, 246, 0.18);
    color: #93c5fd;
    font-size: 11.5px;
    font-family: var(--mono);
  }
}

/* ---------- 一级筛选（归属 / 权限） ---------- */
.hub-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 14px;
}

.hub-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 12px;
  border-radius: 15px;
  border: 1px solid $border;
  background: $bg-panel;
  color: $text-2;
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  transition: all $ease;

  &:hover {
    border-color: $border-strong;
    color: $text;
  }

  &.is-active {
    background: $accent-active;
    border-color: rgba(59, 130, 246, 0.45);
    color: #93c5fd;
  }

  .hub-pill-count {
    padding: 0 6px;
    border-radius: 9px;
    font-size: 10.5px;
    line-height: 16px;
    color: $text-3;
    background: $bg-sunken;
  }

  &.is-active .hub-pill-count {
    color: #93c5fd;
    background: rgba(59, 130, 246, 0.2);
  }
}

/* ---------- 二级筛选面板 ---------- */
.hub-panel {
  padding: 12px 14px;
  margin-bottom: 16px;
  border: 1px solid $border;
  border-radius: $radius-lg;
  background: rgba(17, 24, 39, 0.6);
}

.hub-panel-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;

  & + & {
    margin-top: 8px;
  }
}

.hub-panel-label {
  flex: none;
  width: 64px;
  padding-top: 4px;
  text-align: right;
  font-size: 12px;
  line-height: 1.5;
  color: $text-3;
}

.hub-panel-options {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.hub-chip {
  min-width: 52px;
  height: 26px;
  padding: 0 10px;
  border-radius: $radius-sm;
  border: 1px solid $border;
  background: $bg-panel;
  color: $text-2;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all $ease;

  &:hover {
    border-color: $border-strong;
    color: $text;
  }

  &.is-active {
    background: $accent-active;
    border-color: rgba(59, 130, 246, 0.45);
    color: #93c5fd;
  }
}

/* ---------- 卡片区 ---------- */
.hub-error {
  margin-bottom: 12px;
  font-size: 12.5px;
  color: $red;
}

.hub-loading {
  font-size: 12.5px;
  color: $text-3;
}

.hub-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 14px;
}

.hub-empty {
  grid-column: 1 / -1;
  padding: 28px 0;
  text-align: center;
  font-size: 12.5px;
  color: $text-3;
}

.hub-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  border: 1px solid $border;
  border-radius: $radius-lg;
  background: $bg-panel;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  transition: border-color $ease, transform $ease, box-shadow $ease, background $ease;

  &:hover {
    border-color: $accent;
    background: #1b2637;
    transform: translateY(-2px);
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.2);
  }
}

.hub-card-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.hub-avatar {
  width: 34px;
  height: 34px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-md;
  font-size: 15px;
  line-height: 1;
  color: #fff;
  background: linear-gradient(135deg, var(--cat-a, #3b82f6), var(--cat-b, #2563eb));
}

.hub-name {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  color: $text;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hub-scope {
  flex: none;
  padding: 2px 8px;
  border: 1px solid transparent;
  border-radius: 10px;
  font-size: 10.5px;
  font-weight: 600;
  line-height: 1.5;
  white-space: nowrap;
}

.hub-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: -2px;
}

.hub-status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  line-height: 1.5;
  color: $text-3;
}

.hub-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: $text-3;

  &.is-ok {
    background: $green;
  }

  &.is-warn {
    background: $orange;
    animation: hub-pulse 1.2s ease-in-out infinite;
  }

  &.is-info {
    background: $accent;
  }

  &.is-danger {
    background: $red;
  }

  &.is-idle {
    background: $text-3;
  }
}

@keyframes hub-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.35;
  }
}

.hub-cat {
  padding: 1px 8px;
  border-radius: $radius-sm;
  border: 1px solid var(--cat-bd, rgba(59, 130, 246, 0.4));
  background: var(--cat-bg, rgba(59, 130, 246, 0.12));
  color: var(--cat-c, #3b82f6);
  font-size: 10.5px;
  font-weight: 600;
  line-height: 1.6;
}

.hub-tag {
  padding: 1px 8px;
  border-radius: $radius-sm;
  border: 1px solid $border;
  font-size: 10.5px;
  font-weight: 500;
  line-height: 1.6;
  color: $text-3;

  &.is-red {
    border-color: rgba(239, 68, 68, 0.35);
    background: rgba(239, 68, 68, 0.1);
    color: #fca5a5;
  }

  &.is-blue {
    border-color: rgba(59, 130, 246, 0.35);
    background: rgba(59, 130, 246, 0.1);
    color: #93c5fd;
  }
}

.hub-card-desc {
  flex: 1;
  min-height: 40px;
  margin: 0;
  font-size: 12.5px;
  line-height: 1.7;
  color: $text-2;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.hub-card-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-top: 9px;
  border-top: 1px solid rgba(45, 58, 77, 0.7);
}

.hub-id {
  min-width: 0;
  font-family: var(--mono);
  font-size: 10.5px;
  line-height: 1.5;
  color: $text-3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hub-clone {
  flex: none;
  height: 24px;
  padding: 0 9px;
  border-radius: $radius-sm;
  border: 1px solid $border;
  background: transparent;
  color: $text-2;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all $ease;

  &:hover:not(:disabled) {
    color: #93c5fd;
    border-color: rgba(59, 130, 246, 0.45);
    background: $accent-soft;
  }

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
}
</style>
