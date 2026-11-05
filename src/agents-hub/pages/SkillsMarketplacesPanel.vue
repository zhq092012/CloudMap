<script setup lang="ts">
// ============================================================
// Ported from agentbuilder-main/frontend/src/components/SkillsMarketplacesPanel.tsx
// Browse marketplaces bound to this host, expand to list their skills, preview a
// SKILL.md, and install into this agent's workspace/skills/.
// ============================================================
import { ref, watch, onMounted } from 'vue';
import * as api from '../api';
import type {
  MarketplaceSummary,
  MarketSkillBrief,
  MarketSkillDetail,
  MarketplaceInstallRequest,
} from '../types';

const props = defineProps<{
  /** When omitted, install buttons are hidden — browse-only mode. */
  agentId?: string;
}>();

const emit = defineEmits<{
  (e: 'installed'): void;
}>();

interface MpState {
  loading: boolean;
  loaded: boolean;
  error: string | null;
  skills: MarketSkillBrief[];
}

const marketplaces = ref<MarketplaceSummary[]>([]);
const topError = ref<string | null>(null);
const openId = ref<string | null>(null);
const mpState = ref<Record<string, MpState>>({});
const previewing = ref<MarketSkillDetail | null>(null);
const installing = ref<string | null>(null);

async function loadMarketplaces() {
  try {
    const list = await api.listMarketplaces();
    marketplaces.value = list;
    topError.value = null;
    // Only set the default on initial load / explicit refresh.
    if (list.length > 0 && openId.value == null) openId.value = list[0].id;
  } catch (e) {
    topError.value = (e as Error).message;
  }
}

async function ensureLoaded(id: string, force = false) {
  const st = mpState.value[id];
  if (!force && (st?.loaded || st?.loading)) return;
  mpState.value = {
    ...mpState.value,
    [id]: { loading: true, loaded: false, error: null, skills: [] },
  };
  try {
    const skills = await api.listMarketplaceSkills(id);
    mpState.value = {
      ...mpState.value,
      [id]: { loading: false, loaded: true, error: null, skills },
    };
  } catch (e) {
    mpState.value = {
      ...mpState.value,
      [id]: { loading: false, loaded: true, error: (e as Error).message, skills: [] },
    };
  }
}

watch(openId, (id) => {
  if (id != null) ensureLoaded(id);
});
onMounted(loadMarketplaces);

function describeLocation(mp: MarketplaceSummary): string {
  const p = mp.properties ?? {};
  if (mp.type === 'git') {
    const remote = typeof p.remoteUrl === 'string' ? p.remoteUrl : '';
    const branch = typeof p.branch === 'string' && p.branch ? `#${p.branch}` : '';
    return remote ? `${remote}${branch}` : '(no remote URL)';
  }
  if (mp.type === 'nacos') {
    const addr = typeof p.serverAddr === 'string' ? p.serverAddr : '';
    const ns = typeof p.namespaceId === 'string' && p.namespaceId ? p.namespaceId : 'public';
    return addr ? `${addr} / ${ns}` : '(no server)';
  }
  return '';
}

function badgeClass(type: string): string {
  const t = type.toLowerCase();
  if (t === 'git') return 'bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/40';
  if (t === 'nacos') return 'bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/40';
  return 'bg-[#6b7280]/10 text-[#cbd5e1] border border-[#2d3a4d]';
}

async function handleInstall(marketplaceId: string, skillName: string) {
  if (!props.agentId) return;
  installing.value = `${marketplaceId}/${skillName}`;
  try {
    const req: MarketplaceInstallRequest = { marketplaceId, skillName };
    const result = await api.installFromMarketplace(props.agentId, req);
    if (result.status === 'conflict') {
      const overwrite = window.confirm(
        `工作区中已存在名为 “${result.conflictName}” 的技能，是否覆盖？`,
      );
      if (!overwrite) return;
      const r2 = await api.installFromMarketplace(props.agentId, {
        marketplaceId,
        skillName,
        overwrite: true,
      });
      if (r2.status === 'installed') emit('installed');
      return;
    }
    emit('installed');
  } catch (e) {
    window.alert(`安装失败：${(e as Error).message}`);
  } finally {
    installing.value = null;
  }
}

async function handlePreview(marketplaceId: string, skillName: string) {
  try {
    previewing.value = await api.getMarketplaceSkill(marketplaceId, skillName);
  } catch (e) {
    window.alert(`预览失败：${(e as Error).message}`);
  }
}
</script>

<template>
  <div class="p-[18px] flex flex-col gap-3.5 h-full overflow-y-auto bg-[#0a0e17]">
    <div class="text-[11.5px] text-[#9ca3af]">技能市场在本机所有智能体之间共享。</div>

    <div
      v-if="topError"
      class="p-3 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/40 text-[#ef4444] text-[12.5px]"
    >
      {{ topError }}
    </div>

    <div
      v-if="!topError && marketplaces.length === 0"
      class="p-[18px] bg-[#1a2332] border border-dashed border-[#2d3a4d] rounded-lg text-[#9ca3af] text-[13px]"
    >
      <div class="font-semibold mb-1.5 text-white">尚未配置任何技能市场。</div>
      前往「我的技能市场」页面注册一个 git 仓库或 Nacos 命名空间，即可在此浏览并安装其技能。
    </div>

    <!-- ---------- marketplace cards ---------- -->
    <div
      v-for="mp in marketplaces"
      :key="mp.id"
      class="bg-[#1a2332] border border-[#2d3a4d] rounded-lg overflow-hidden"
    >
      <div
        class="px-[18px] py-[14px] flex items-center gap-3 cursor-pointer"
        :class="openId === mp.id ? 'bg-[#111827] border-b border-[#2d3a4d]' : ''"
        @click="openId = openId === mp.id ? null : mp.id"
      >
        <span
          class="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-wider"
          :class="badgeClass(mp.type)"
        >
          {{ mp.type }}
        </span>
        <div class="min-w-0 flex-1">
          <div class="text-[13px] font-semibold text-white truncate" :title="mp.id">
            {{ mp.id }}
          </div>
          <div class="text-[11px] text-[#6b7280] mt-0.5 truncate" :title="describeLocation(mp)">
            {{ describeLocation(mp) }}
            <template v-if="mpState[mp.id]?.loaded">
              · {{ mpState[mp.id].skills.length }} 个技能</template
            >
          </div>
        </div>
        <span class="text-[#6b7280] text-[12.5px]">{{ openId === mp.id ? '▼' : '▶' }}</span>
      </div>

      <div v-if="openId === mp.id">
        <div v-if="mpState[mp.id]?.loading" class="p-4 text-[#6b7280] text-[12.5px]">
          正在加载技能…
        </div>
        <div
          v-else-if="mpState[mp.id]?.error"
          class="p-3 text-[#ef4444] text-[12.5px] bg-[#ef4444]/10"
        >
          {{ mpState[mp.id].error }}
        </div>
        <div
          v-else-if="mpState[mp.id]?.loaded && mpState[mp.id].skills.length === 0"
          class="p-4 text-[#6b7280] text-[12.5px]"
        >
          该技能市场中未找到技能。
        </div>

        <div
          v-for="s in mpState[mp.id]?.skills"
          :key="s.name"
          class="px-[18px] py-2.5 border-t border-[#2d3a4d] flex items-center gap-3"
        >
          <div class="min-w-0 flex-1">
            <div class="text-[13px] font-semibold text-white">
              {{ s.name
              }}<span v-if="s.version" class="ml-2 text-[10.5px] text-[#6b7280] font-medium"
                >v{{ s.version }}</span
              >
            </div>
            <div v-if="s.description" class="text-[12px] text-[#9ca3af] mt-1 leading-relaxed">
              {{ s.description }}
            </div>
          </div>

          <button
            type="button"
            class="px-3 py-1.5 rounded-lg border border-[#2d3a4d] bg-[#111827] text-[#cbd5e1] text-[12px] font-medium hover:border-[#3d4d64] transition-colors"
            @click="handlePreview(mp.id, s.name)"
          >
            预览
          </button>
          <button
            v-if="props.agentId"
            type="button"
            :disabled="installing === `${mp.id}/${s.name}`"
            class="px-3.5 py-1.5 rounded-lg border border-[#3b82f6] bg-[rgba(59,130,246,0.12)] text-[#93c5fd] text-[12px] font-semibold hover:bg-[rgba(59,130,246,0.2)] transition-colors whitespace-nowrap"
            :class="installing === `${mp.id}/${s.name}` ? 'opacity-60 cursor-wait' : ''"
            @click="handleInstall(mp.id, s.name)"
          >
            {{ installing === `${mp.id}/${s.name}` ? '安装中…' : '安装到工作区' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ---------- preview modal ---------- -->
    <div
      v-if="previewing"
      class="fixed inset-0 z-[50] flex items-center justify-center bg-black/60"
      @click="previewing = null"
    >
      <div
        class="bg-[#1a2332] border border-[#2d3a4d] rounded-lg p-6 max-w-[720px] w-[90%] max-h-[80vh] overflow-y-auto shadow-[0_24px_80px_rgba(0,0,0,0.5)]"
        @click.stop
      >
        <div class="flex items-center mb-4">
          <h3 class="m-0 text-[14px] font-bold text-white flex-1">{{ previewing.name }}</h3>
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg border border-[#2d3a4d] bg-[#111827] text-[#cbd5e1] text-[12px] hover:border-[#3d4d64] transition-colors"
            @click="previewing = null"
          >
            关闭
          </button>
        </div>
        <div v-if="previewing.description" class="text-[12.5px] text-[#9ca3af] mb-3">
          {{ previewing.description }}
        </div>
        <pre
          class="bg-[#0a0e17] text-[#cbd5e1] p-3.5 rounded-lg text-[11.5px] leading-relaxed overflow-auto max-h-[50vh] whitespace-pre-wrap"
          >{{ previewing.markdown }}</pre
        >
        <div v-if="Object.keys(previewing.resources ?? {}).length > 0" class="mt-3.5">
          <div class="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider mb-2">
            资源
          </div>
          <div
            v-for="k in Object.keys(previewing.resources)"
            :key="k"
            class="font-mono text-[11.5px] text-[#cbd5e1] py-0.5"
          >
            {{ k }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
