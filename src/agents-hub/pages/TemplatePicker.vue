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
  <div v-if="err" class="text-[#ef4444] text-[0.9rem]">{{ err }}</div>

  <!-- Loading -->
  <div v-else-if="loading" class="text-[#708aa6] text-[0.85rem] py-3">Loading templates…</div>

  <!-- Empty -->
  <div v-else-if="list.length === 0" class="text-[#526e8c] text-[0.82rem] py-3">
    No templates available.
  </div>

  <!-- List -->
  <div v-else class="flex flex-col gap-3">
    <div
      v-for="t in list"
      :key="t.id"
      class="rounded-xl px-[18px] py-4 cursor-pointer transition-colors duration-150 border"
      :class="
        selected === t.id
          ? 'border-[#2b5384] bg-[#0f1927] shadow-[0_0_0_3px_rgba(0,243,255,0.10)]'
          : 'border-[#1e324f] bg-[#0b131f] hover:border-[#2b5384]'
      "
      @click="pick(t)"
    >
      <div class="flex items-center gap-[10px] mb-2 flex-wrap">
        <span
          class="text-[1rem] font-semibold"
          :class="selected === t.id ? 'text-[#00f3ff]' : 'text-white'"
        >
          {{ t.name }}
        </span>
        <span
          v-for="tag in t.tags"
          :key="tag"
          class="px-[9px] py-[2px] rounded-full text-[0.74rem] font-medium bg-[#142338] text-[#708aa6] border border-[#1e324f]"
        >
          {{ tag }}
        </span>
      </div>

      <div class="text-[0.9rem] text-[#708aa6] mb-[10px] leading-[1.5]">{{ t.description }}</div>

      <div
        v-if="t.agentsMdPreview"
        class="bg-[#060c14] border border-[#142338] rounded-lg px-3 py-[10px] text-[#526e8c] text-[0.82rem] leading-[1.5] font-mono whitespace-pre-wrap max-h-[140px] overflow-hidden"
      >{{ t.agentsMdPreview.slice(0, 380) }}</div>

      <!-- Files included in the selected template -->
      <div v-if="selected === t.id" class="mt-3 pt-3 border-t border-[#142338]">
        <div v-if="detailLoading" class="text-[0.8rem] text-[#526e8c]">Loading files…</div>
        <div v-else-if="detailErr" class="text-[0.8rem] text-[#ef4444]">{{ detailErr }}</div>
        <div v-else-if="detail">
          <span
            class="block text-[0.72rem] font-bold uppercase tracking-[0.1em] text-[#526e8c] mb-2"
          >
            Files ({{ detail.files.length }})
          </span>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="f in detail.files"
              :key="f.path"
              class="px-[9px] py-[3px] rounded-md text-[0.76rem] font-mono bg-[#142338] text-[#a3b8cc] border border-[#1e324f]"
            >
              {{ f.path }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
