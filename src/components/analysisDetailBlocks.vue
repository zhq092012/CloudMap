<template>
  <div class="detail-blocks text-xs">
    <template v-for="(b, i) in blocks" :key="i">
      <div v-if="b.heading" class="mb-2.5" :class="{ 'mt-0': i === 0, 'mt-2.5': i > 0 }">
        <div :class="['flex items-center gap-1.5 text-[13px] font-bold leading-snug', headingClass]">
          <span :class="['w-1 h-3.5 rounded-sm inline-block shrink-0', barClass]"></span>
          <span class="break-words">{{ b.heading }}</span>
        </div>
        <div
          class="mt-1 pl-3 border-l border-slate-700/70 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap break-words"
        >
          {{ b.text }}
        </div>
      </div>
      <div v-else class="mb-2.5 text-xs text-slate-400 leading-relaxed whitespace-pre-wrap break-words">
        {{ b.text }}
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

/* 方案/报告 details 纯文本 → 小节结构化渲染：
   匹配「短标签：内容」行（标签 ≤12 字符、不含标点/数字开头）为子标题；
   其后无标题的续行并入上一小节内容，其余独立成段。 */
interface Block {
  heading?: string;
  text: string;
}

const props = withDefaults(defineProps<{ text?: string; accent?: "sky" | "red" }>(), {
  text: "",
  accent: "sky",
});

const HEADING_RE = /^\s*([^\n：:，,。；;、！？!?（）]{2,12})\s*[：:]([\s\S]*)$/;

function splitBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  for (const raw of (text || "").split(/\r?\n/)) {
    const line = raw.replace(/\s+$/, "");
    if (!line.trim()) continue;
    const m = line.match(HEADING_RE);
    if (m && !/^\d/.test(m[1])) {
      blocks.push({ heading: m[1], text: m[2].trim() });
    } else {
      const last = blocks[blocks.length - 1];
      if (last) {
        last.text += (last.text ? "\n" : "") + line.trim();
      } else {
        blocks.push({ text: line.trim() });
      }
    }
  }
  return blocks;
}

const blocks = computed(() => splitBlocks(props.text || ""));
const headingClass = computed(() => (props.accent === "red" ? "text-red-300" : "text-sky-300"));
const barClass = computed(() => (props.accent === "red" ? "bg-red-500/70" : "bg-sky-500/70"));
</script>
