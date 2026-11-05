<template>
  <!-- modal dialog: new / edit a subagent -->
  <div
    class="fixed inset-0 z-[60] flex items-center justify-center bg-[#0a0e17]/70"
    @click.self="emit('close')"
  >
    <div
      class="flex flex-col w-[min(480px,92vw)] max-h-[80vh] rounded-lg overflow-hidden border border-[#3d4d64] bg-[#111827] shadow-[0_24px_80px_rgba(0,0,0,0.5)]"
    >
      <div class="flex items-center gap-3 px-5 py-3.5 border-b border-[#2d3a4d]">
        <div class="text-[13.5px] font-semibold text-white">
          {{ isNew ? '新增子智能体' : `编辑：${form.name}` }}
        </div>
        <span class="flex-1"></span>
        <button type="button" @click="emit('close')"
          class="px-3 py-1.5 rounded-lg border border-[#2d3a4d] bg-[#1a2332] text-[#cbd5e1] text-[12.5px] font-semibold hover:bg-[#253141]">取消</button>
      </div>

      <div class="flex-1 min-h-0 overflow-y-auto px-5 py-4">
        <div class="mb-3.5">
          <label class="block text-[12.5px] font-medium text-[#cbd5e1] mb-1.5">名称 *</label>
          <input
            class="w-full box-border px-3 py-2.5 rounded-lg bg-[#1a2332] border border-[#2d3a4d] text-[#cbd5e1] text-[12.5px] focus:outline-none focus:border-[#3d4d64]"
            :value="form.name" @input="form.name = ($event.target as HTMLInputElement).value"
            :disabled="!isNew" placeholder="例如 code-reviewer"
          />
        </div>

        <div class="mb-3.5">
          <label class="block text-[12.5px] font-medium text-[#cbd5e1] mb-1.5">描述 *</label>
          <input
            class="w-full box-border px-3 py-2.5 rounded-lg bg-[#1a2332] border border-[#2d3a4d] text-[#cbd5e1] text-[12.5px] focus:outline-none focus:border-[#3d4d64]"
            :value="form.description" @input="form.description = ($event.target as HTMLInputElement).value"
            placeholder="该子智能体的职责 —— 编排器据此决定何时委派"
          />
        </div>

        <div class="flex gap-3 mb-3.5">
          <div class="flex-1">
            <label class="block text-[12.5px] font-medium text-[#cbd5e1] mb-1.5">模型</label>
            <input
              class="w-full box-border px-3 py-2.5 rounded-lg bg-[#1a2332] border border-[#2d3a4d] text-[#cbd5e1] text-[12.5px] focus:outline-none focus:border-[#3d4d64]"
              :value="form.model" @input="form.model = ($event.target as HTMLInputElement).value"
              placeholder="例如 qwen3-max（留空则继承）"
            />
          </div>
          <div class="flex-1">
            <label class="block text-[12.5px] font-medium text-[#cbd5e1] mb-1.5">最大迭代次数</label>
            <input
              type="number"
              class="w-full box-border px-3 py-2.5 rounded-lg bg-[#1a2332] border border-[#2d3a4d] text-[#cbd5e1] text-[12.5px] focus:outline-none focus:border-[#3d4d64]"
              :value="form.maxIters" @input="form.maxIters = ($event.target as HTMLInputElement).value"
              placeholder="10"
            />
          </div>
        </div>

        <div class="mb-3.5">
          <label class="block text-[12.5px] font-medium text-[#cbd5e1] mb-1.5">工具（逗号分隔）</label>
          <input
            class="w-full box-border px-3 py-2.5 rounded-lg bg-[#1a2332] border border-[#2d3a4d] text-[#cbd5e1] text-[12.5px] focus:outline-none focus:border-[#3d4d64]"
            :value="form.tools" @input="form.tools = ($event.target as HTMLInputElement).value"
            placeholder="例如 read_file, grep_files, edit_file"
          />
        </div>

        <div class="mb-3.5">
          <label class="block text-[12.5px] font-medium text-[#cbd5e1] mb-1.5">工作区模式</label>
          <div class="flex gap-4 items-center">
            <label class="flex items-center gap-1.5 text-[12.5px] text-[#cbd5e1] cursor-pointer">
              <input type="radio" :checked="form.workspaceMode === 'isolated'" @change="form.workspaceMode = 'isolated'" /> 独立
            </label>
            <label class="flex items-center gap-1.5 text-[12.5px] text-[#cbd5e1] cursor-pointer">
              <input type="radio" :checked="form.workspaceMode === 'shared'" @change="form.workspaceMode = 'shared'" /> 共享（与父级）
            </label>
          </div>
        </div>

        <div v-if="form.workspaceMode === 'isolated'" class="mb-3.5">
          <label class="block text-[12.5px] font-medium text-[#cbd5e1] mb-1.5">工作区路径（可选）</label>
          <input
            class="w-full box-border px-3 py-2.5 rounded-lg bg-[#1a2332] border border-[#2d3a4d] text-[#cbd5e1] text-[12.5px] focus:outline-none focus:border-[#3d4d64]"
            :value="form.workspacePath" @input="form.workspacePath = ($event.target as HTMLInputElement).value"
            placeholder="留空自动创建"
          />
        </div>

        <div class="mb-3.5">
          <label class="block text-[12.5px] font-medium text-[#cbd5e1] mb-1.5">系统提示词（内联正文）</label>
          <textarea
            class="w-full box-border px-3 py-2.5 rounded-lg bg-[#1a2332] border border-[#2d3a4d] text-[#cbd5e1] text-[12.5px] leading-relaxed min-h-[100px] resize-y focus:outline-none focus:border-[#3d4d64]"
            :value="form.inlineBody" @input="form.inlineBody = ($event.target as HTMLTextAreaElement).value"
            placeholder="该子智能体的可选系统提示词。设置了工作区路径时不生效。"
          ></textarea>
        </div>

        <div v-if="formErr" class="text-[12.5px] text-[#ef4444] mt-4">{{ formErr }}</div>
        <div v-else-if="formOk" class="text-[12.5px] text-[#10b981] mt-4">已保存</div>
      </div>

      <div class="flex gap-2.5 px-5 py-4 border-t border-[#2d3a4d]">
        <button type="button" @click="handleSave" :disabled="saving"
          class="px-5 py-2 rounded-lg font-semibold text-white text-[12.5px] transition-all disabled:opacity-50"
          style="background: linear-gradient(135deg,#3b82f6 0%,#2563eb 100%); box-shadow: 0 2px 6px rgba(59,130,246,0.35);">
          {{ saving ? '保存中…' : '保存' }}
        </button>
        <button v-if="!isNew" type="button" @click="handleDelete"
          class="px-4 py-2 rounded-lg border border-[#ef4444] text-[#ef4444] text-[12.5px] font-semibold hover:bg-[#ef4444]/10">删除</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import * as api from '../api';
import type { SubagentInfo, SubagentUpsertRequest } from '../types';

const props = defineProps<{
  agentId: string;
  subagent?: SubagentInfo | null;
}>();
const emit = defineEmits<{
  (e: 'saved'): void;
  (e: 'close'): void;
}>();

const isNew = computed(() => !props.subagent);

interface FormState {
  name: string;
  description: string;
  model: string;
  maxIters: string;
  tools: string;
  workspaceMode: 'isolated' | 'shared';
  workspacePath: string;
  inlineBody: string;
}
function emptyForm(): FormState {
  return { name: '', description: '', model: '', maxIters: '', tools: '', workspaceMode: 'isolated', workspacePath: '', inlineBody: '' };
}

const form = ref<FormState>(emptyForm());
const saving = ref(false);
const formErr = ref<string | null>(null);
const formOk = ref(false);

async function loadExisting() {
  if (!props.subagent) {
    form.value = emptyForm();
    return;
  }
  const info = props.subagent;
  let body = '';
  if (info.hasInlineBody) {
    try {
      const md = await api.readFile(props.agentId, `subagents/${info.name}.md`);
      const endIdx = md.indexOf('---', 3);
      body = endIdx >= 0 ? md.substring(endIdx + 3).trim() : '';
    } catch {
      // ignore read errors
    }
  }
  form.value = {
    name: info.name,
    description: info.description,
    model: info.model ?? '',
    maxIters: info.maxIters != null ? String(info.maxIters) : '',
    tools: info.tools?.join(', ') ?? '',
    workspaceMode: info.workspaceMode,
    workspacePath: info.workspacePath ?? '',
    inlineBody: body,
  };
}

onMounted(loadExisting);
watch(() => props.subagent, loadExisting);

async function handleSave() {
  if (!form.value.description.trim()) {
    formErr.value = 'Description is required';
    return;
  }
  const nameVal = form.value.name.trim();
  if (!nameVal) {
    formErr.value = 'Name is required';
    return;
  }
  saving.value = true;
  formErr.value = null;
  formOk.value = false;
  try {
    const req: SubagentUpsertRequest = {
      description: form.value.description.trim(),
      model: form.value.model.trim() || undefined,
      maxIters: form.value.maxIters.trim() ? parseInt(form.value.maxIters, 10) : undefined,
      tools: form.value.tools.trim()
        ? form.value.tools.split(',').map((t) => t.trim()).filter(Boolean)
        : undefined,
      workspaceMode: form.value.workspaceMode,
      workspacePath: form.value.workspacePath.trim() || undefined,
      inlineBody: form.value.inlineBody.trim() || undefined,
    };
    await api.upsertSubagent(props.agentId, nameVal, req);
    formOk.value = true;
    emit('saved');
  } catch (e) {
    formErr.value = e instanceof Error ? e.message : 'Save failed';
  } finally {
    saving.value = false;
  }
}

async function handleDelete() {
  if (!props.subagent) return;
  if (!window.confirm(`Delete subagent "${props.subagent.name}"?`)) return;
  try {
    await api.deleteSubagent(props.agentId, props.subagent.name);
    emit('saved');
    emit('close');
  } catch (e) {
    formErr.value = e instanceof Error ? e.message : 'Delete failed';
  }
}
</script>
