<script setup lang="ts">
// ============================================================
// Ported from agentbuilder-main/frontend/src/components/TemplatePicker.tsx
// Lists starter templates and emits the picked one. Additionally loads
// the full TemplateDetail (api.getTemplate) for the active card so the
// user can see which files the scaffold will write.
// ============================================================
import { ref, onMounted, watch } from 'vue';
import * as api from '../api';
import type { TemplateSummary, TemplateDetail } from '../types';

const props = defineProps<{
  selected: string | null;
}>();

const emit = defineEmits<{
  (e: 'select', id: string, template: TemplateSummary): void;
}>();

const list = ref<TemplateSummary[]>([]);
const loading = ref(false);
const err = ref<string | null>(null);

const detail = ref<TemplateDetail | null>(null);
const detailLoading = ref(false);
const detailErr = ref<string | null>(null);

onMounted(async () => {
  loading.value = true;
  err.value = null;
  try {
    list.value = await api.listTemplates();
  } catch (e: unknown) {
    err.value = e instanceof Error ? e.message : 'Failed';
  } finally {
    loading.value = false;
  }
});

async function loadDetail(id: string) {
  detail.value = null;
  detailErr.value = null;
  detailLoading.value = true;
  try {
    detail.value = await api.getTemplate(id);
  } catch (e: unknown) {
    detailErr.value = e instanceof Error ? e.message : 'Failed to load template';
  } finally {
    detailLoading.value = false;
  }
}

watch(
  () => props.selected,
  (id) => {
    if (id) loadDetail(id);
    else {
      detail.value = null;
      detailErr.value = null;
    }
  },
  { immediate: true },
);

function pick(t: TemplateSummary) {
  emit('select', t.id, t);
}
</script>

<template>
  <!-- Load error -->
  <div v-if="err" class="text-[#ef4444] text-[13px]">{{ err }}</div>

  <!-- Loading -->
  <div v-else-if="loading" class="text-[#9ca3af] text-[12.5px] py-3">Loading templates…</div>

  <!-- Empty -->
  <div v-else-if="list.length === 0" class="text-[#6b7280] text-[12px] py-3">
    No templates available.
  </div>

  <!-- List -->
  <div v-else class="flex flex-col gap-3">
    <div
      v-for="t in list"
      :key="t.id"
      class="rounded-lg px-[18px] py-4 cursor-pointer transition-colors duration-150 border"
      :class="
        selected === t.id
          ? 'border-[#3d4d64] bg-[#1a2332] shadow-[0_0_0_3px_rgba(59,130,246,0.10)]'
          : 'border-[#2d3a4d] bg-[#111827] hover:border-[#3d4d64]'
      "
      @click="pick(t)"
    >
      <div class="flex items-center gap-[10px] mb-2 flex-wrap">
        <span
          class="text-[13.5px] font-semibold"
          :class="selected === t.id ? 'text-[#93c5fd]' : 'text-white'"
        >
          {{ t.name }}
        </span>
        <span
          v-for="tag in t.tags"
          :key="tag"
          class="px-[9px] py-[2px] rounded-full text-[11px] font-medium bg-[#253141] text-[#9ca3af] border border-[#2d3a4d]"
        >
          {{ tag }}
        </span>
      </div>

      <div class="text-[13px] text-[#9ca3af] mb-[10px] leading-[1.5]">{{ t.description }}</div>

      <div
        v-if="t.agentsMdPreview"
        class="bg-[#0a0e17] border border-[#2d3a4d] rounded-lg px-3 py-[10px] text-[#6b7280] text-[12px] leading-[1.5] font-mono whitespace-pre-wrap max-h-[140px] overflow-hidden"
      >{{ t.agentsMdPreview.slice(0, 380) }}</div>

      <!-- Files included in the selected template -->
      <div v-if="selected === t.id" class="mt-3 pt-3 border-t border-[#2d3a4d]">
        <div v-if="detailLoading" class="text-[12px] text-[#6b7280]">Loading files…</div>
        <div v-else-if="detailErr" class="text-[12px] text-[#ef4444]">{{ detailErr }}</div>
        <div v-else-if="detail">
          <span
            class="block text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#6b7280] mb-2"
          >
            Files ({{ detail.files.length }})
          </span>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="f in detail.files"
              :key="f.path"
              class="px-[9px] py-[3px] rounded-md text-[11px] font-mono bg-[#253141] text-[#cbd5e1] border border-[#2d3a4d]"
            >
              {{ f.path }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
