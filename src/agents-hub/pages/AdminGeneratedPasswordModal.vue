<template>
  <div class="fixed inset-0 bg-[rgba(2,8,16,0.6)] flex items-center justify-center z-[200]">
    <div class="bg-[#1a2332] border border-[#2d3a4d] rounded-lg p-8 w-[min(480px,92vw)] shadow-[0_24px_60px_rgba(0,0,0,0.5)]">
      <h3 class="m-0 mb-[18px] text-[1.15rem] font-bold text-white">用户已创建 — {{ username }}</h3>
      <p class="text-[13px] text-[#9ca3af] mt-0 mb-[10px]">
        请将此临时密码分享给该用户。密码仅显示一次，之后无法找回。
      </p>
      <div class="bg-[#111827] border border-[#2d3a4d] rounded-lg p-[14px] mt-[14px]">
        <div class="font-mono text-[13px] text-[#10b981] font-bold tracking-[0.03em] break-all">{{ password }}</div>
        <button type="button" class="mt-[10px] px-4 py-[9px] bg-[#111827] text-[#cbd5e1] border border-[#3d4d64] rounded-md cursor-pointer text-[13px]" @click="copy">
          {{ copied ? '✓ 已复制' : copyFailed ? '复制失败，请手动选择' : '复制到剪贴板' }}
        </button>
      </div>
      <div class="flex justify-end mt-[18px]">
        <button type="button" class="px-[18px] py-[9px] rounded-md bg-[linear-gradient(135deg,#3b82f6_0%,#2563eb_100%)] text-white font-semibold text-[13px] cursor-pointer" @click="$emit('close')">
          完成
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{ username: string; password: string }>();
defineEmits<{ close: [] }>();

const copied = ref(false);
const copyFailed = ref(false);
async function copy() {
  try {
    await navigator.clipboard.writeText(props.password);
    copied.value = true;
    setTimeout(() => (copied.value = false), 2000);
    return;
  } catch {
    /* fall through to execCommand fallback */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = props.password;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    copied.value = true;
    setTimeout(() => (copied.value = false), 2000);
  } catch {
    copyFailed.value = true;
    setTimeout(() => (copyFailed.value = false), 2000);
  }
}
</script>
