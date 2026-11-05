<script setup lang="ts">
// ============================================================
// Ported from agentbuilder-main/frontend/src/components/AiDescribeForm.tsx
// Textarea + "用 AI 生成" button -> api.draftAgentWithAi(description).
// The resulting AgentDraft is emitted upward so the create form can
// prefill name / description / sysPrompt.
// ============================================================
import { ref, computed } from 'vue';
import * as api from '../api';
import type { AgentDraft } from '../types';

const props = defineProps<{
  available: boolean;
  draft: AgentDraft | null;
}>();

const emit = defineEmits<{
  (e: 'draft', d: AgentDraft | null): void;
}>();

const desc = ref('');
const busy = ref(false);
const err = ref<string | null>(null);

const canDraft = computed(() => !busy.value && !!desc.value.trim());

async function handleDraft() {
  if (!canDraft.value) return;
  busy.value = true;
  err.value = null;
  try {
    const d = await api.draftAgentWithAi(desc.value.trim());
    emit('draft', d);
  } catch (e: unknown) {
    err.value = e instanceof Error ? e.message : 'Drafting failed';
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <!-- AI unavailable -->
  <div
    v-if="!available"
    class="px-5 py-4 bg-[#253141] border border-[#2d3a4d] rounded-lg text-[#cbd5e1] text-[13px] leading-[1.6]"
  >
    AI 起草功能当前不可用。请配置模型（例如
    <code class="px-[5px] py-[1px] rounded bg-[#0a0e17] text-[#93c5fd] font-mono text-[12.5px]">
      DASHSCOPE_API_KEY
    </code>
    ）后重启服务。
  </div>

  <div v-else class="flex flex-col gap-[14px]">
    <textarea
      v-model="desc"
      class="w-full box-border px-[14px] py-3 bg-[#0a0e17] border border-[#2d3a4d] rounded-md text-[#cbd5e1] text-[13px] leading-[1.55] min-h-[130px] resize-y outline-none focus:border-[#3d4d64] placeholder:text-[#6b7280]"
      placeholder="描述你希望这个智能体做什么。例如：“一个研究助手，读取 /docs 目录并带引用地总结问题答案。”"
    />

    <button
      class="self-start px-[22px] py-[10px] rounded-md text-[13px] font-semibold border-none transition-colors"
      :class="
        canDraft
          ? 'bg-[linear-gradient(135deg,#3b82f6_0%,#2563eb_100%)] text-white cursor-pointer'
          : 'bg-[#253141] text-[#6b7280] cursor-not-allowed'
      "
      :disabled="!canDraft"
      @click="handleDraft"
    >
      {{ busy ? '生成中…' : props.draft ? '重新生成' : '用 AI 生成' }}
    </button>

    <div v-if="err" class="text-[#ef4444] text-[13px]">{{ err }}</div>

    <!-- Draft preview -->
    <div v-if="props.draft" class="bg-[#1a2332] border border-[#2d3a4d] rounded-lg px-5 py-[18px]">
      <span
        class="block text-[11.5px] font-bold uppercase tracking-[0.1em] text-[#6b7280] mb-[10px]"
      >
        Suggested agent
      </span>

      <div class="text-[13px] text-white font-semibold mb-[10px] leading-[1.55]">
        {{ props.draft.name }}
      </div>

      <div
        v-if="props.draft.description"
        class="text-[13px] text-[#cbd5e1] mb-[10px] leading-[1.55]"
      >
        {{ props.draft.description }}
      </div>

      <template v-if="props.draft.sysPrompt">
        <span
          class="block text-[11.5px] font-bold uppercase tracking-[0.1em] text-[#6b7280] mb-[10px]"
        >
          System prompt
        </span>
        <div
          class="text-[13px] text-[#cbd5e1] mb-[10px] leading-[1.55] whitespace-pre-wrap"
        >{{ props.draft.sysPrompt }}</div>
      </template>

      <template v-if="props.draft.suggestedTools && props.draft.suggestedTools.length > 0">
        <span
          class="block text-[11.5px] font-bold uppercase tracking-[0.1em] text-[#6b7280] mb-[10px]"
        >
          Tools
        </span>
        <div class="text-[13px] text-[#cbd5e1] leading-[1.55] mb-[10px]">
          {{ props.draft.suggestedTools.join(', ') }}
        </div>
      </template>

      <template v-if="props.draft.suggestedSkills && props.draft.suggestedSkills.length > 0">
        <span
          class="block text-[11.5px] font-bold uppercase tracking-[0.1em] text-[#6b7280] mb-[10px]"
        >
          Skills
        </span>
        <div
          v-for="s in props.draft.suggestedSkills"
          :key="s.name"
          class="text-[13px] text-[#cbd5e1] leading-[1.55]"
        >
          • {{ s.name }}
        </div>
        <div class="mb-[10px]"></div>
      </template>

      <template v-if="props.draft.suggestedSubagents && props.draft.suggestedSubagents.length > 0">
        <span
          class="block text-[11.5px] font-bold uppercase tracking-[0.1em] text-[#6b7280] mb-[10px]"
        >
          Subagents
        </span>
        <div
          v-for="s in props.draft.suggestedSubagents"
          :key="s.name"
          class="text-[13px] text-[#cbd5e1] leading-[1.55]"
        >
          • {{ s.name }}
        </div>
      </template>
    </div>
  </div>
</template>
