<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useAgentHubStore } from '../store';
import * as api from '../api';
import type {
  MarketplaceSummary,
  MarketplaceWriteRequest,
  MarketSkillBrief,
  MarketSkillDetail,
} from '../types';
import MarketplaceEditorDialog from './MarketplaceEditorDialog.vue';

const store = useAgentHubStore();
const isAdmin = computed(() => store.isAdmin);

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
const editorMode = ref<'create' | 'edit' | null>(null);
const editorInitial = ref<MarketplaceSummary | undefined>(undefined);
const refreshTick = ref(0);

async function loadMarketplaces() {
  try {
    const list = await api.listMarketplaces();
    marketplaces.value = list;
    topError.value = null;
    if (list.length > 0 && openId.value == null) openId.value = list[0].id;
  } catch (e) {
    topError.value = (e as Error).message;
  }
}

async function ensureLoaded(id: string, force = false) {
  const st = mpState.value[id];
  if (!force && (st?.loaded || st?.loading)) return;
  mpState.value = { ...mpState.value, [id]: { loading: true, loaded: false, error: null, skills: [] } };
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
watch(refreshTick, loadMarketplaces);
onMounted(loadMarketplaces);

function describeLocation(mp: MarketplaceSummary): string {
  const props = mp.properties ?? {};
  if (mp.type === 'git') {
    const remote = typeof props.remoteUrl === 'string' ? props.remoteUrl : '';
    const branch = typeof props.branch === 'string' && props.branch ? `#${props.branch}` : '';
    return remote ? `${remote}${branch}` : '(no remote URL)';
  }
  if (mp.type === 'nacos') {
    const addr = typeof props.serverAddr === 'string' ? props.serverAddr : '';
    const ns =
      typeof props.namespaceId === 'string' && props.namespaceId ? props.namespaceId : 'public';
    return addr ? `${addr} / ${ns}` : '(no server)';
  }
  return '';
}

function badgeClass(type: string): string {
  if (type.toLowerCase() === 'git')
    return 'bg-[#fbbf24]/10 text-[#fbbf24] border border-[#fbbf24]/40';
  if (type.toLowerCase() === 'nacos')
    return 'bg-[#00ffc4]/10 text-[#00ffc4] border border-[#00ffc4]/40';
  return 'bg-[#526e8c]/10 text-[#a3b8cc] border border-[#1e324f]';
}

async function handlePreview(marketplaceId: string, skillName: string) {
  try {
    previewing.value = await api.getMarketplaceSkill(marketplaceId, skillName);
  } catch (e) {
    window.alert(`Preview failed: ${(e as Error).message}`);
  }
}

async function handleSave(req: MarketplaceWriteRequest) {
  if (editorMode.value === 'edit') {
    await api.updateMarketplace(req.id, req);
  } else {
    await api.createMarketplace(req);
  }
  editorMode.value = null;
  editorInitial.value = undefined;
  mpState.value = (() => {
    const next = { ...mpState.value };
    delete next[req.id];
    return next;
  })();
  openId.value = req.id;
  refreshTick.value += 1;
}

async function handleDelete(id: string) {
  if (!window.confirm(`Delete marketplace "${id}"? Installed skills are not affected.`)) return;
  try {
    await api.deleteMarketplace(id);
    if (openId.value === id) openId.value = null;
    mpState.value = (() => {
      const next = { ...mpState.value };
      delete next[id];
      return next;
    })();
    refreshTick.value += 1;
  } catch (e) {
    window.alert(`Delete failed: ${(e as Error).message}`);
  }
}
</script>

<template>
  <div class="flex flex-col h-full bg-[#060c14]">
    <div class="px-9 py-8 border-b border-[#142338]">
      <h1 class="m-0 text-2xl font-bold text-white tracking-tight">My Marketplaces</h1>
      <p class="mt-2 text-[#708aa6] text-sm leading-relaxed max-w-[720px]">
        Marketplaces are <strong class="text-[#a3b8cc]">per-user</strong> sources of skills that you
        can install into any of your agents. Add a git repository, a Nacos config, or any other
        supported source, then browse what they expose.
      </p>
    </div>

    <div class="flex-1 min-h-0 overflow-hidden">
      <div class="p-[18px] flex flex-col gap-3.5 h-full overflow-y-auto bg-[#060c14]">
        <div class="flex items-center gap-2.5">
          <div class="flex-1 text-[0.78rem] text-[#708aa6]">
            Marketplaces are shared across all agents on this host.
          </div>
          <button
            v-if="isAdmin"
            class="px-3.5 py-2 rounded-lg border border-[#3b82f6] bg-[#3b82f6] text-white text-[0.85rem] font-semibold cursor-pointer hover:bg-[#2b5384]"
            @click="editorMode = 'create'; editorInitial = undefined"
          >
            + Add Marketplace
          </button>
        </div>

        <div
          v-if="topError"
          class="p-3 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/40 text-[#ef4444] text-[0.85rem]"
        >
          {{ topError }}
        </div>

        <div
          v-if="!topError && marketplaces.length === 0"
          class="p-[18px] bg-[#0f1927] border border-dashed border-[#1e324f] rounded-xl text-[#708aa6] text-[0.9rem]"
        >
          <div class="font-semibold mb-1.5 text-white">No marketplaces configured.</div>
          Click <strong class="text-[#a3b8cc]">+ Add Marketplace</strong> to register a git
          repository or Nacos namespace and start browsing its skills.
        </div>

        <div
          v-for="mp in marketplaces"
          :key="mp.id"
          class="bg-[#0f1927] border border-[#1e324f] rounded-xl overflow-hidden"
        >
          <div
            class="p-[14px] px-[18px] flex items-center gap-3 cursor-pointer"
            :class="openId === mp.id ? 'bg-[#0b131f] border-b border-[#1e324f]' : ''"
            @click="openId = openId === mp.id ? null : mp.id"
          >
            <span
              class="px-2.5 py-0.5 rounded-full text-[0.72rem] font-bold uppercase tracking-wider"
              :class="badgeClass(mp.type)"
            >
              {{ mp.type }}
            </span>
            <div class="min-w-0 flex-1">
              <div
                class="text-[0.9rem] font-semibold text-white truncate"
                :title="mp.id"
              >
                {{ mp.id }}
              </div>
              <div
                class="text-[0.75rem] text-[#526e8c] mt-0.5 truncate"
                :title="describeLocation(mp)"
              >
                {{ describeLocation(mp) }}
                <template v-if="mpState[mp.id]?.loaded">
                  · {{ mpState[mp.id].skills.length }} skills</template
                >
              </div>
            </div>
            <button
              v-if="isAdmin"
              title="Edit"
              class="bg-transparent border-none p-1.5 text-[0.95rem] cursor-pointer text-[#708aa6] rounded-md hover:text-[#00f3ff]"
              @click.stop="editorMode = 'edit'; editorInitial = mp"
            >
              ⚙
            </button>
            <button
              v-if="isAdmin"
              title="Delete"
              class="bg-transparent border-none p-1.5 text-[0.95rem] cursor-pointer text-[#ef4444] rounded-md hover:bg-[#ef4444]/10"
              @click.stop="handleDelete(mp.id)"
            >
              🗑
            </button>
            <span class="text-[#526e8c] text-[0.85rem]">{{ openId === mp.id ? '▼' : '▶' }}</span>
          </div>

          <div v-if="openId === mp.id">
            <div v-if="mpState[mp.id]?.loading" class="p-4 text-[#526e8c] text-[0.85rem]">
              Loading skills…
            </div>
            <div
              v-else-if="mpState[mp.id]?.error"
              class="p-3 text-[#ef4444] text-[0.85rem] bg-[#ef4444]/10"
            >
              {{ mpState[mp.id].error }}
            </div>
            <div
              v-else-if="mpState[mp.id]?.loaded && mpState[mp.id].skills.length === 0"
              class="p-4 text-[#526e8c] text-[0.85rem]"
            >
              No skills found in this marketplace.
            </div>

            <div
              v-for="s in mpState[mp.id]?.skills"
              :key="s.name"
              class="p-[10px] px-[18px] border-t border-[#142338] flex items-center gap-3"
            >
              <div class="min-w-0 flex-1">
                <div class="text-[0.9rem] font-semibold text-white">
                  {{ s.name
                  }}<span
                    v-if="s.version"
                    class="ml-2 text-[0.72rem] text-[#526e8c] font-medium"
                    >v{{ s.version }}</span
                  >
                </div>
                <div
                  v-if="s.description"
                  class="text-[0.8rem] text-[#708aa6] mt-1 leading-relaxed"
                >
                  {{ s.description }}
                </div>
              </div>
              <button
                class="px-3 py-1.5 rounded-lg border border-[#1e324f] bg-[#0b131f] text-[#a3b8cc] text-[0.82rem] font-medium cursor-pointer hover:border-[#2b5384]"
                @click="handlePreview(mp.id, s.name)"
              >
                Preview
              </button>
            </div>
          </div>
        </div>

        <div
          v-if="previewing"
          class="fixed inset-0 z-[50] flex items-center justify-center bg-black/60"
          @click="previewing = null"
        >
          <div
            class="bg-[#0f1927] border border-[#1e324f] rounded-xl p-6 max-w-[720px] w-[90%] max-h-[80vh] overflow-y-auto shadow-2xl"
            @click.stop
          >
            <div class="flex items-center mb-4">
              <h3 class="m-0 text-[1.05rem] font-bold text-white flex-1">{{ previewing.name }}</h3>
              <button
                class="px-3 py-1.5 rounded-lg border border-[#1e324f] bg-[#0b131f] text-[#a3b8cc] text-[0.82rem] cursor-pointer hover:border-[#2b5384]"
                @click="previewing = null"
              >
                Close
              </button>
            </div>
            <div v-if="previewing.description" class="text-[0.85rem] text-[#708aa6] mb-3">
              {{ previewing.description }}
            </div>
            <pre
              class="bg-[#060c14] text-[#a3b8cc] p-3.5 rounded-lg text-[0.78rem] leading-relaxed overflow-auto max-h-[50vh] whitespace-pre-wrap"
              >{{ previewing.markdown }}</pre
            >
            <div v-if="Object.keys(previewing.resources ?? {}).length > 0" class="mt-3.5">
              <div
                class="text-[0.75rem] font-bold text-[#708aa6] uppercase tracking-wider mb-2"
              >
                Resources
              </div>
              <div
                v-for="k in Object.keys(previewing.resources)"
                :key="k"
                class="font-mono text-[0.78rem] text-[#a3b8cc] py-0.5"
              >
                {{ k }}
              </div>
            </div>
          </div>
        </div>

        <MarketplaceEditorDialog
          v-if="editorMode"
          :mode="editorMode"
          :initial="editorInitial"
          @saved="handleSave"
          @close="editorMode = null; editorInitial = undefined"
        />
      </div>
    </div>
  </div>
</template>
