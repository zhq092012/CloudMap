<script setup lang="ts">
// ============================================================
// Ported from agentbuilder-main/frontend/src/pages/AgentCreatePage.tsx
// Three creation modes: blank scaffold / from template / describe with AI.
// ============================================================
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import * as api from '../api';
import type { AgentCreateRequest, AgentDraft, TemplateSummary } from '../types';
import TemplatePicker from './TemplatePicker.vue';
import AiDescribeForm from './AiDescribeForm.vue';

type Mode = 'blank' | 'template' | 'ai';

const CATEGORIES = [
  { value: 'simulation', label: '角色模拟型' },
  { value: 'functional', label: '功能型' },
  { value: 'scheduling', label: '调度型' },
];

const TAG_OPTIONS = [
  { value: 'red-side', label: '红方' },
  { value: 'blue-side', label: '蓝方' },
];

const router = useRouter();

const mode = ref<Mode>('blank');
const aiAvailable = ref(false);

// shared inputs
const name = ref('');
const description = ref('');
const workspacePath = ref('');
const sysPrompt = ref('');

// category / tags
const category = ref('');
const tags = ref<string[]>([]);

// template
const templateId = ref<string | null>(null);
const selectedTemplate = ref<TemplateSummary | null>(null);

// ai
const draft = ref<AgentDraft | null>(null);

const submitting = ref(false);
const err = ref<string | null>(null);

onMounted(async () => {
  try {
    const m = await api.me();
    aiAvailable.value = !!m.aiAvailable;
  } catch {
    aiAvailable.value = false;
  }
});

function setMode(m: Mode) {
  if (m === 'ai' && !aiAvailable.value) return;
  mode.value = m;
}

function handleTemplateSelect(id: string, t: TemplateSummary) {
  templateId.value = id;
  selectedTemplate.value = t;
}

function handleDraftChange(d: AgentDraft | null) {
  draft.value = d;
  if (d) {
    if (!name.value) name.value = d.name;
    if (!description.value && d.description) description.value = d.description;
    if (!sysPrompt.value && d.sysPrompt) sysPrompt.value = d.sysPrompt;
  }
}

function toggleTag(value: string) {
  const i = tags.value.indexOf(value);
  if (i >= 0) tags.value.splice(i, 1);
  else tags.value.push(value);
}

const canSubmit = computed(() => {
  if (submitting.value) return false;
  if (mode.value === 'template') return !!templateId.value && !!name.value.trim();
  if (mode.value === 'ai') return !!draft.value && !!name.value.trim();
  return !!name.value.trim();
});

async function handleSubmit() {
  if (!canSubmit.value) return;
  err.value = null;
  submitting.value = true;
  try {
    const req: AgentCreateRequest = {
      name: name.value.trim(),
      description: selectedTemplate.value?.description || description.value.trim() || undefined,
      sysPrompt: sysPrompt.value.trim() || undefined,
      workspacePath: workspacePath.value.trim() || undefined,
      templateId:
        mode.value === 'template' && selectedTemplate.value ? selectedTemplate.value.id : undefined,
      aiDraft: mode.value === 'ai' && draft.value ? draft.value : undefined,
      category: category.value || undefined,
      tags: tags.value.length > 0 ? tags.value : undefined,
    };
    const created = await api.createAgent(req);
    router.push({ name: 'AgentHubWorkspace', params: { id: created.id } });
  } catch (e: unknown) {
    err.value = e instanceof Error ? e.message : 'Failed to create';
  } finally {
    submitting.value = false;
  }
}

function cancel() {
  router.push({ name: 'AgentsHub' });
}

const inputClass =
  'w-full box-border px-[14px] py-[11px] bg-[#060c14] border border-[#1e324f] rounded-[9px] text-[#a3b8cc] text-[0.95rem] outline-none focus:border-[#2b5384] placeholder:text-[#526e8c]';
const labelClass = 'block text-[0.88rem] text-[#a3b8cc] mb-2 font-medium';
</script>

<template>
  <div class="relative min-h-full flex flex-col items-center px-[40px] py-[36px]">
    <!-- 关闭按钮（右上角） -->
    <button @click="cancel" title="关闭并返回智能体中心"
      class="absolute top-[20px] right-[24px] w-9 h-9 rounded-lg border border-[#1e324f] text-[#708aa6] hover:text-white hover:border-[#2b5384] hover:bg-[#10243a] flex items-center justify-center text-lg leading-none transition-colors flex-shrink-0">
      ✕
    </button>

    <div class="w-full max-w-[880px]">
      <h1 class="m-0 mb-6 text-[1.6rem] font-bold text-white tracking-[-0.02em]">新建智能体</h1>

    <!-- Mode tabs -->
    <div class="flex gap-1 border-b border-[#1e324f] mb-7">
      <button
        class="bg-transparent border-none border-b-2 px-5 py-3 text-[0.95rem] cursor-pointer -mb-px"
        :class="
          mode === 'blank'
            ? 'text-white border-b-[#00f3ff] font-semibold'
            : 'text-[#708aa6] border-b-transparent font-medium hover:text-[#a3b8cc]'
        "
        @click="setMode('blank')"
      >
        空白模板
      </button>
      <button
        class="bg-transparent border-none border-b-2 px-5 py-3 text-[0.95rem] cursor-pointer -mb-px"
        :class="
          mode === 'template'
            ? 'text-white border-b-[#00f3ff] font-semibold'
            : 'text-[#708aa6] border-b-transparent font-medium hover:text-[#a3b8cc]'
        "
        @click="setMode('template')"
      >
        从模板创建
      </button>
      <button
        class="bg-transparent border-none border-b-2 px-5 py-3 text-[0.95rem] -mb-px"
        :class="[
          mode === 'ai'
            ? 'text-white border-b-[#00f3ff] font-semibold'
            : 'text-[#708aa6] border-b-transparent font-medium',
          aiAvailable ? 'cursor-pointer hover:text-[#a3b8cc]' : 'opacity-50 cursor-not-allowed',
        ]"
        :disabled="!aiAvailable"
        :title="aiAvailable ? '' : '配置 DashScope 后可用'"
        @click="setMode('ai')"
      >
        AI 描述生成
      </button>
    </div>

    <!-- Card -->
    <div class="bg-[#0f1927] border border-[#1e324f] rounded-[14px] px-[30px] py-7">
      <div v-if="mode === 'blank'" class="text-[0.88rem] text-[#708aa6] mb-5 leading-[1.55]">
        从干净的脚手架开始 —— AGENTS.md、tools.json 以及一个示例技能。
      </div>

      <template v-else-if="mode === 'template'">
        <div class="text-[0.88rem] text-[#708aa6] mb-5 leading-[1.55]">
          选择一个起始模板；下方仍可自定义身份信息。
        </div>
        <div class="mb-6">
          <TemplatePicker :selected="templateId" @select="handleTemplateSelect" />
        </div>
      </template>

      <template v-else-if="mode === 'ai'">
        <div class="text-[0.88rem] text-[#708aa6] mb-5 leading-[1.55]">
          描述你的需求，模型将建议名称、系统提示词、工具与技能。
        </div>
        <div class="mb-6">
          <AiDescribeForm :available="aiAvailable" :draft="draft" @draft="handleDraftChange" />
        </div>
      </template>

      <!-- Name -->
      <div class="mb-5">
        <label :class="labelClass">名称 *</label>
        <input v-model="name" :class="inputClass" placeholder="例如：研究助手" />
      </div>

      <!-- Description -->
      <div class="mb-5">
        <label :class="labelClass">描述</label>
        <input v-model="description" :class="inputClass" placeholder="展示在卡片与标签页上的简短说明" />
      </div>

      <!-- Workspace path -->
      <div class="mb-5">
        <label :class="labelClass">工作区路径</label>
        <input
          v-model="workspacePath"
          :class="inputClass"
          placeholder="~/.agentscope/builder/workspace/users/<userId>/agents/<agentId>"
        />
        <div class="text-[0.8rem] text-[#526e8c] mt-[6px] leading-[1.5]">
          留空则使用默认的按用户路径
          <code class="px-[5px] py-[1px] rounded bg-[#060c14] text-[#708aa6] font-mono text-[0.76rem]">
            ~/.agentscope/builder/workspace/users/&lt;userId&gt;/agents/&lt;agentId&gt;
          </code>
          。绝对路径按原样使用。仅在创建时可设置。
        </div>
      </div>

      <!-- System prompt (hidden in template mode) -->
      <div v-if="mode !== 'template'" class="mb-5">
        <label :class="labelClass">系统提示词</label>
        <textarea
          v-model="sysPrompt"
          class="w-full box-border px-[14px] py-3 bg-[#060c14] border border-[#1e324f] rounded-[9px] text-[#a3b8cc] text-[0.95rem] leading-[1.55] min-h-[130px] resize-y outline-none focus:border-[#2b5384] placeholder:text-[#526e8c]"
          placeholder="高层行为约定。创建后也可继续编辑 AGENTS.md。"
        />
      </div>

      <!-- Category / Tags -->
      <div class="mb-5">
        <div class="flex gap-4">
          <div class="flex-1">
            <label :class="labelClass">分类</label>
            <select v-model="category" :class="inputClass">
              <option value="">选择分类</option>
              <option v-for="c in CATEGORIES" :key="c.value" :value="c.value">{{ c.label }}</option>
            </select>
          </div>
        </div>

        <div class="mt-3">
          <label :class="labelClass">标签</label>
          <div class="flex gap-2 flex-wrap">
            <button
              v-for="opt in TAG_OPTIONS"
              :key="opt.value"
              class="px-4 py-2 rounded-[9px] text-[0.88rem] cursor-pointer border transition-colors"
              :class="
                tags.includes(opt.value)
                  ? 'bg-[#142338] border-[#2b5384] text-[#00f3ff] font-medium'
                  : 'bg-[#060c14] border-[#1e324f] text-[#708aa6] hover:border-[#2b5384]'
              "
              @click="toggleTag(opt.value)"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="mt-6 flex gap-3 items-center flex-wrap">
        <button
          class="px-6 py-[11px] rounded-[9px] text-[0.95rem] font-semibold border-none transition-colors"
          :class="
            canSubmit
              ? 'bg-[linear-gradient(135deg,#00f3ff_0%,#3b82f6_100%)] text-[#060c14] cursor-pointer'
              : 'bg-[#142338] text-[#526e8c] cursor-not-allowed'
          "
          :disabled="!canSubmit"
          @click="handleSubmit"
        >
          {{ submitting ? '创建中…' : '创建智能体' }}
        </button>

        <button
          class="px-5 py-[11px] rounded-[9px] bg-transparent border border-[#1e324f] text-[#a3b8cc] text-[0.92rem] font-medium cursor-pointer hover:border-[#2b5384]"
          @click="cancel"
        >
          取消
        </button>

        <span v-if="err" class="text-[#ef4444] text-[0.88rem]">{{ err }}</span>
      </div>
    </div>
    </div>
  </div>
</template>
