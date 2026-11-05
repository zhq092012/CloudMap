<script setup lang="ts">
// ============================================================
// Ported from agentbuilder-main/frontend/src/components/SkillsWorkspacePanel.tsx
// Lists every workspace skill (marketplace-installed AND workspace-authored
// "custom" entries) so a refresh accurately reflects on-disk state. Each row
// carries an origin badge so users can tell at a glance which entries are local
// edits and which were pulled from a marketplace.
// ============================================================
import { ref, computed, watch, onMounted } from 'vue';
import * as api from '../api';
import type { WorkspaceSkillInfo, WorkspaceSkillDetail } from '../types';

const props = defineProps<{
  agentId: string;
  refreshKey?: number;
}>();

const emit = defineEmits<{
  (e: 'change'): void;
  (e: 'request-browse'): void;
}>();

const skills = ref<WorkspaceSkillInfo[]>([]);
const selectedDir = ref<string | null>(null);
const detail = ref<WorkspaceSkillDetail | null>(null);
const draft = ref('');
const dirty = ref(false);
const error = ref<string | null>(null);
const busy = ref(false);

const selectedSkill = computed(
  () => skills.value.find((s) => s.dirName === selectedDir.value) ?? null,
);
const resourceList = computed(() => {
  if (!detail.value || !detail.value.resources) return [];
  return Object.keys(detail.value.resources).sort();
});

async function refreshList() {
  if (!props.agentId) return;
  try {
    const list = await api.listWorkspaceSkills(props.agentId);
    skills.value = list;
    if (selectedDir.value && !list.some((s) => s.dirName === selectedDir.value)) {
      selectedDir.value = list.length > 0 ? list[0].dirName : null;
    } else if (!selectedDir.value && list.length > 0) {
      selectedDir.value = list[0].dirName;
    }
  } catch (e) {
    error.value = (e as Error).message;
  }
}

// Guards against a stale in-flight detail request overwriting a newer selection.
let loadSeq = 0;
async function loadDetail() {
  if (!selectedDir.value) {
    detail.value = null;
    draft.value = '';
    dirty.value = false;
    return;
  }
  const seq = ++loadSeq;
  try {
    const d = await api.getWorkspaceSkill(props.agentId, selectedDir.value);
    if (seq !== loadSeq) return;
    detail.value = d;
    draft.value = d.markdown;
    dirty.value = false;
  } catch (e) {
    if (seq !== loadSeq) return;
    error.value = (e as Error).message;
  }
}

watch(selectedDir, loadDetail);
watch(
  () => [props.agentId, props.refreshKey],
  () => refreshList(),
);
onMounted(refreshList);

function onDraftInput(value: string) {
  draft.value = value;
  dirty.value = value !== (detail.value?.markdown ?? '');
}

async function handleSave() {
  if (!selectedDir.value || !dirty.value) return;
  busy.value = true;
  error.value = null;
  try {
    await api.upsertWorkspaceSkill(props.agentId, selectedDir.value, draft.value);
    dirty.value = false;
    if (detail.value) detail.value = { ...detail.value, markdown: draft.value };
    await refreshList();
    emit('change');
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    busy.value = false;
  }
}

async function handleDelete() {
  if (!selectedDir.value) return;
  // Phrase the confirmation by origin so users understand the local impact:
  // marketplace skills get the "卸载" language they're used to, custom skills
  // are framed as a delete.
  const isMarketplace = selectedSkill.value?.origin === 'marketplace';
  const verb = isMarketplace ? '卸载' : '删除';
  if (!window.confirm(`${verb}技能 “${selectedDir.value}”？将移除整个目录。`)) return;
  busy.value = true;
  error.value = null;
  try {
    await api.deleteWorkspaceSkill(props.agentId, selectedDir.value);
    selectedDir.value = null;
    await refreshList();
    emit('change');
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="flex h-full min-h-0 bg-[#0a0e17]">
    <!-- ---------- sidebar: installed skills ---------- -->
    <div class="w-[320px] flex-shrink-0 border-r border-[#2d3a4d] bg-[#111827] flex flex-col min-h-0">
      <div class="px-4 py-3.5 border-b border-[#2d3a4d] flex items-center justify-between gap-2">
        <span class="text-[12.5px] font-semibold text-white">
          已安装技能 ({{ skills.length }})
        </span>
        <button
          type="button"
          :disabled="busy"
          class="px-3.5 py-1.5 rounded-lg border border-[#3d4d64] bg-[#1a2332] text-[#93c5fd] text-[12.5px] font-semibold hover:bg-[#253141] disabled:opacity-50 transition-colors"
          @click="emit('request-browse')"
        >
          + 安装
        </button>
      </div>

      <div class="flex-1 min-h-0 overflow-y-auto">
        <div v-if="skills.length === 0" class="p-4 text-[12.5px] text-[#6b7280]">
          <div class="font-semibold text-[#cbd5e1] mb-1.5">还没有技能。</div>
          点击 <b class="text-[#cbd5e1]">+ 安装</b> 从技能市场拉取，或通过工作区文件树手动编写
          <code class="text-[#93c5fd]">workspace/skills/&lt;name&gt;/SKILL.md</code>
          —— 两者都会显示在这里。
        </div>

        <div
          v-for="s in skills"
          :key="s.dirName"
          class="px-4 py-2.5 border-b border-[#2d3a4d] border-l-[3px] cursor-pointer transition-colors"
          :class="
            selectedDir === s.dirName
              ? 'bg-[#253141] border-l-[#3b82f6]'
              : 'border-l-transparent hover:bg-[#1a2332]'
          "
          @click="selectedDir = s.dirName"
        >
          <div class="flex items-center gap-2">
            <div class="text-[13px] font-semibold text-white flex-1 min-w-0 truncate">
              {{ s.name || s.dirName }}
            </div>
            <!-- Origin badge. The same visual slot is reused regardless of origin so
                 list items stay aligned. -->
            <span
              v-if="s.marketplace?.repoType"
              :title="s.marketplace.repoLocation"
              class="inline-flex items-center gap-1 px-[7px] py-px rounded-full text-[0.68rem] font-bold uppercase tracking-wider bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/40"
            >
              {{ s.marketplace.repoType }}
            </span>
            <span
              v-else
              title="在此工作区中编写"
              class="inline-flex items-center gap-1 px-[7px] py-px rounded-full text-[0.68rem] font-bold uppercase tracking-wider bg-[#3b82f6]/10 text-[#93c5fd] border border-[#3d4d64]"
            >
              custom
            </span>
          </div>

          <div
            v-if="s.description"
            class="text-[11.5px] text-[#9ca3af] mt-1 leading-relaxed line-clamp-2"
          >
            {{ s.description }}
          </div>

          <div class="mt-1.5 flex gap-2 text-[10.5px] text-[#6b7280]">
            <span>{{ (s.sizeBytes / 1024).toFixed(1) }} KB</span>
            <span v-if="s.resourceCount > 0">{{ s.resourceCount }} 个资源</span>
            <span v-if="s.hasReferences">references/</span>
            <span v-if="s.hasScripts">scripts/</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ---------- detail: SKILL.md editor ---------- -->
    <div class="flex-1 flex flex-col min-w-0 min-h-0 bg-[#0a0e17]">
      <div v-if="!selectedDir" class="p-6 text-[#6b7280] text-[12.5px]">选择一个技能以查看或编辑。</div>
      <div v-else-if="!detail" class="p-6 text-[#6b7280] text-[12.5px]">加载中…</div>

      <template v-else>
        <div class="px-[18px] py-3 border-b border-[#2d3a4d] bg-[#111827] flex items-center gap-2.5">
          <span class="text-[13px] font-semibold text-white">{{ selectedDir }}/SKILL.md</span>

          <span
            v-if="selectedSkill?.marketplace"
            class="text-[11.5px] text-[#9ca3af]"
            :title="`安装来源 ${selectedSkill.marketplace.repoType}: ${selectedSkill.marketplace.repoLocation}`"
          >
            · 来自 <b class="text-[#cbd5e1]">{{ selectedSkill.marketplace.repoType }}</b>
            <template
              v-if="
                selectedSkill.marketplace.originalName &&
                selectedSkill.marketplace.originalName !== selectedDir
              "
            >
              （原名：{{ selectedSkill.marketplace.originalName }}）
            </template>
          </span>
          <span
            v-else-if="selectedSkill"
            class="text-[11.5px] text-[#9ca3af]"
            title="直接在此工作区中编写（无市场来源）"
          >
            · <b class="text-[#cbd5e1]">custom</b>
          </span>

          <span class="flex-1"></span>
          <span v-if="dirty" class="text-[11.5px] text-[#f59e0b]">未保存</span>

          <button
            type="button"
            :disabled="!dirty || busy"
            class="px-3.5 py-1.5 rounded-lg text-[12.5px] font-semibold border transition-colors"
            :class="
              dirty && !busy
                ? 'border-[#3b82f6] bg-[rgba(59,130,246,0.12)] text-[#93c5fd] hover:bg-[rgba(59,130,246,0.2)]'
                : 'border-[#2d3a4d] bg-[#1a2332] text-[#6b7280] cursor-not-allowed'
            "
            @click="handleSave"
          >
            保存
          </button>
          <button
            type="button"
            :disabled="busy"
            class="px-3.5 py-1.5 rounded-lg text-[12.5px] font-semibold border border-[#ef4444]/50 bg-[#ef4444]/10 text-[#ef4444] hover:bg-[#ef4444]/20 disabled:opacity-50 transition-colors"
            @click="handleDelete"
          >
            {{ selectedSkill?.origin === 'marketplace' ? '卸载' : '删除' }}
          </button>
        </div>

        <textarea
          :value="draft"
          spellcheck="false"
          class="flex-1 min-h-0 p-4 font-mono text-[12.5px] leading-relaxed bg-[#111827] text-[#cbd5e1] border-none outline-none resize-none"
          @input="onDraftInput(($event.target as HTMLTextAreaElement).value)"
        ></textarea>

        <div
          v-if="resourceList.length > 0"
          class="border-t border-[#2d3a4d] bg-[#1a2332] px-4 py-2.5 max-h-[140px] overflow-y-auto"
        >
          <div class="text-[11px] font-semibold text-[#9ca3af] mb-1.5 uppercase tracking-wider">
            资源 ({{ resourceList.length }})
          </div>
          <div v-for="r in resourceList" :key="r" class="font-mono text-[12px] text-[#cbd5e1] py-0.5">
            {{ r }}
          </div>
        </div>
      </template>

      <div
        v-if="error"
        class="px-4 py-2 text-[12.5px] text-[#ef4444] bg-[#ef4444]/10 border-t border-[#ef4444]/40"
      >
        {{ error }}
      </div>
    </div>
  </div>
</template>
