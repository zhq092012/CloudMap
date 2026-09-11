<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
    <div
      class="bg-[#0b131f] border border-[#1a2b42] rounded-lg w-full max-w-xl p-6 text-[#a3b8cc] shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
      <div class="flex justify-between items-center pb-4 border-b border-[#142338] mb-4">
        <h3 class="text-white font-medium text-base flex items-center gap-2">
          <div class="w-1.5 h-3.5 bg-[#00f3ff] rounded-sm"></div>
          {{ isEdit ? "编辑智能体配置" : "注册新智能体" }}
        </h3>
        <button @click="handleClose" class="text-[#526e8c] hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4 text-xs">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-[#708aa6] mb-1.5">唯一标识编码 (name) *</label>
            <input v-model="form.name" type="text" required :disabled="isEdit"
              class="w-full bg-[#0c1624] border border-[#203554] rounded px-3 py-2 text-white focus:outline-none focus:border-[#00f3ff]/60"
              placeholder="例如: sentiment_analyzer" />
          </div>
          <div>
            <label class="block text-[#708aa6] mb-1.5">显示名称 (displayName) *</label>
            <input v-model="form.displayName" type="text" required
              class="w-full bg-[#0c1624] border border-[#203554] rounded px-3 py-2 text-white focus:outline-none focus:border-[#00f3ff]/60"
              placeholder="例如: 情感极性研判智能体" />
          </div>
        </div>

        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="block text-[#708aa6] mb-1.5">智能体类型 *</label>
            <select v-model="form.agentType"
              class="w-full bg-[#0c1624] border border-[#203554] rounded px-3 py-2 text-white focus:outline-none focus:border-[#00f3ff]/60 cursor-pointer">
              <option value="角色模拟型">角色模拟型</option>
              <option value="功能型">功能型</option>
              <option value="调度型">调度型</option>
            </select>
          </div>
          <div>
            <label class="block text-[#708aa6] mb-1.5">所属领域分类 *</label>
            <select v-model="form.category"
              class="w-full bg-[#0c1624] border border-[#203554] rounded px-3 py-2 text-white focus:outline-none focus:border-[#00f3ff]/60 cursor-pointer">
              <option value="军事">军事</option>
              <option value="地缘">地缘</option>
              <option value="经济">经济</option>
              <option value="社会">社会</option>
              <option value="情报">情报</option>
            </select>
          </div>
          <div>
            <label class="block text-[#708aa6] mb-1.5">底层驱动模型 *</label>
            <select v-model="form.modelName"
              class="w-full bg-[#0c1624] border border-[#203554] rounded px-3 py-2 text-white focus:outline-none focus:border-[#00f3ff]/60 cursor-pointer">
              <option value="KIMI2.5">KIMI2.5</option>
              <option value="Qwen4">Qwen4</option>
              <option value="DeepSeekV4">DeepSeekV4</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-[#708aa6] mb-1.5">职责描述 (description) *</label>
          <textarea v-model="form.description" rows="2" required
            class="w-full bg-[#0c1624] border border-[#203554] rounded px-3 py-2 text-white focus:outline-none focus:border-[#00f3ff]/60 resize-none leading-relaxed"
            placeholder="简述该 Agent 的多维数据分析职责..."></textarea>
        </div>

        <div>
          <label class="block text-[#708aa6] mb-1.5">技能模块 (多个技能请用英文逗号 ',' 分隔) *</label>
          <input v-model="skillsText" type="text" required
            class="w-full bg-[#0c1624] border border-[#203554] rounded px-3 py-2 text-white focus:outline-none focus:border-[#00f3ff]/60"
            placeholder="例如: fake-detection, text-mining, scoring" />
        </div>

        <div>
          <label class="block text-[#708aa6] mb-1.5">运行配置参数 (configJson - 标精 JSON 格式)</label>
          <textarea v-model="form.configJson" rows="3"
            class="w-full bg-[#0c1624] border border-[#203554] rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-[#00f3ff]/60 resize-none"
            placeholder="{}"></textarea>
        </div>

        <div class="flex items-center gap-2 pt-1">
          <input v-model="form.enabled" type="checkbox" id="enabled-switch"
            class="w-4 h-4 rounded bg-[#0c1624] border-[#203554] text-[#00f3ff] focus:ring-0 cursor-pointer" />
          <label for="enabled-switch" class="text-[#a3b8cc] cursor-pointer select-none">注册后默认进入“启用”运行状态</label>
        </div>

        <div class="flex justify-end gap-2 pt-4 border-t border-[#142338] mt-5">
          <button type="button" @click="handleClose"
            class="bg-[#0f1b2d] hover:bg-[#16273f] border border-[#1e3452] px-4 py-1.5 rounded text-[#708aa6] hover:text-white transition-colors">
            取消
          </button>
          <button type="submit"
            class="bg-[#11233b] hover:bg-[#183254] border border-[#203a5e] text-[#00f3ff] px-4 py-1.5 rounded transition-colors font-medium shadow-[0_0_10px_rgba(0,243,255,0.1)]">
            保存配置
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import type { AgentDefinition } from "@/types/agent";

const props = defineProps<{
  isOpen: boolean;
  initialData: AgentDefinition | null;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "submit", data: Partial<AgentDefinition>): void;
}>();

const isEdit = ref(false);
const skillsText = ref("");

const initForm = () => ({
  id: 0,
  name: "",
  displayName: "",
  description: "",
  agentType: "角色模拟型",
  category: "军事",
  modelName: "KIMI2.5",
  skillNames: [] as string[],
  configJson: "{}",
  enabled: true,
  createdAt: "",
  updatedAt: "",
});

const form = ref(initForm());

watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      if (props.initialData) {
        isEdit.value = true;
        form.value = { ...props.initialData };
        skillsText.value = props.initialData.skillNames
          ? props.initialData.skillNames.join(", ")
          : "";
      } else {
        isEdit.value = false;
        form.value = initForm();
        skillsText.value = "";
      }
    }
  },
);

const handleClose = () => emit("close");

const handleSubmit = () => {
  // 1. 数组转化
  form.value.skillNames = skillsText.value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  // 2. 格式校验校验
  try {
    if (form.value.configJson) {
      JSON.parse(form.value.configJson);
    }
  } catch (e) {
    alert("⚠️ 运行参数不符合标准的 JSON 语法规范，请修改后保存！");
    return;
  }

  emit("submit", form.value);
};
</script>
