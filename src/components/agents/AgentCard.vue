<template>
  <div
    :class="[
      'bg-[#0f1927]/90 border rounded p-4 text-[#a3b8cc] flex flex-col justify-between transition-all duration-300 relative group',
      agent.stance === 'RED'
        ? 'border-[#ef4444]/60 hover:border-[#ef4444] hover:shadow-[0_0_15px_rgba(239,68,68,0.15)]'
        : agent.stance === 'BLUE'
          ? 'border-[#3b82f6]/60 hover:border-[#3b82f6] hover:shadow-[0_0_15px_rgba(59,130,246,0.15)]'
          : 'border-[#1e324f] hover:border-[#00f3ff]/50 hover:shadow-[0_0_15px_rgba(0,243,255,0.1)]',
    ]"
  >
    <div
      :class="[
        'absolute top-0 left-0 w-2 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity',
        agent.stance === 'RED' ? 'bg-[#ef4444]' : agent.stance === 'BLUE' ? 'bg-[#3b82f6]' : 'bg-[#00f3ff]',
      ]"
    ></div>
    <div
      :class="[
        'absolute top-0 left-0 w-[1px] h-2 opacity-0 group-hover:opacity-100 transition-opacity',
        agent.stance === 'RED' ? 'bg-[#ef4444]' : agent.stance === 'BLUE' ? 'bg-[#3b82f6]' : 'bg-[#00f3ff]',
      ]"
    ></div>

    <div>
      <div class="flex justify-between items-start mb-3 gap-4">
        <div class="flex items-start gap-2.5 flex-1 min-w-0">
          <div
            :class="[
              'w-8 h-8 rounded flex items-center justify-center shrink-0 mt-0.5 border',
              agent.stance === 'RED'
                ? 'border-[#ef4444]/30 bg-[#2a1320] shadow-[inset_0_0_6px_rgba(239,68,68,0.2)]'
                : agent.stance === 'BLUE'
                  ? 'border-[#3b82f6]/30 bg-[#131f37] shadow-[inset_0_0_6px_rgba(59,130,246,0.2)]'
                  : 'border-[#00f3ff]/30 bg-[#132337] shadow-[inset_0_0_6px_rgba(0,243,255,0.2)]',
            ]"
          >
            <svg
              :class="[
                'w-4 h-4',
                agent.stance === 'RED' ? 'text-[#ef4444]' : agent.stance === 'BLUE' ? 'text-[#3b82f6]' : 'text-[#00f3ff]',
              ]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
          </div>

          <div class="min-w-0 flex-1">
            <h3
              class="text-white font-medium text-sm tracking-wide truncate"
              :title="agent.displayName || agent.name"
            >
              {{ agent.displayName || agent.name }}
            </h3>
            <div class="flex flex-wrap gap-1 mt-1">
              <span
                v-for="tag in agent.skillNames"
                :key="tag"
                class="text-[10px] bg-[#16273d] border border-[#223957] px-1.5 py-0.5 rounded text-[#708aa6] whitespace-nowrap"
              >
                {{ tag }}
              </span>
            </div>
          </div>
        </div>

        <div
          @click.stop="$emit('toggle-status', agent.id)"
          title="点击切换运行状态"
          :class="[
            agent.enabled
              ? 'text-[#00ffc4] hover:bg-[#00ffc4]/10 border-[#00ffc4]/20'
              : 'text-[#708aa6] hover:bg-slate-800 border-[#203554]',
            'flex items-center gap-1.5 text-xs font-medium shrink-0 whitespace-nowrap pt-0.5 border rounded-full px-2 py-0.5 cursor-pointer transition-all',
          ]"
        >
          <span
            :class="[
              agent.enabled
                ? 'bg-[#00ffc4] animate-pulse shadow-[0_0_8px_#00ffc4]'
                : 'bg-[#526e8c]',
              'w-1.5 h-1.5 rounded-full',
            ]"
          ></span>
          {{ agent.enabled ? "运行中" : "离线中" }}
        </div>
      </div>

      <p class="text-xs text-[#708aa6] line-clamp-2 mb-4 leading-relaxed h-9">
        {{ agent.description }}
      </p>
    </div>

    <div
      class="flex justify-between items-end pt-3 border-t border-[#1a2b42] text-xs text-[#526e8c]"
    >
      <div class="flex flex-col gap-0.5">
        <div>
          驱动引擎:
          <span class="text-[#a3b8cc] font-sans ml-1">{{
            agent.modelName
          }}</span>
        </div>
        <div class="text-[10px]">
          标识码:
          <span class="text-[#526e8c] font-mono ml-1">{{ agent.name }}</span>
        </div>
      </div>

      <div class="flex gap-1">
        <button
          @click.stop="$emit('edit', agent)"
          class="border border-[#203a5e] hover:border-[#00f3ff] text-[#708aa6] hover:text-[#00f3ff] px-2 py-1 text-[11px] rounded transition-all"
        >
          编辑
        </button>
        <button
          @click.stop="$emit('delete', agent.id)"
          class="border border-[#341d26] hover:border-[#ef4444] text-[#70525d] hover:text-[#ef4444] px-2 py-1 text-[11px] rounded transition-all"
        >
          删除
        </button>
        <button
          @click="$emit('view-detail', agent)"
          class="bg-[#16273d] hover:bg-[#00f3ff]/10 border border-[#2c4261] hover:border-[#00f3ff] text-[#a3b8cc] hover:text-white px-2 py-1 text-[11px] rounded transition-all shadow-sm"
        >
          详情
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AgentDefinition } from "@/types/agent";

defineProps<{ agent: AgentDefinition }>();

defineEmits<{
  (e: "view-detail", agent: AgentDefinition): void;
  (e: "edit", agent: AgentDefinition): void;
  (e: "delete", id: number | string): void;
  (e: "toggle-status", id: number | string): void;
}>();
</script>
