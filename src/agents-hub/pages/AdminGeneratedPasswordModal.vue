<template>
  <div class="fixed inset-0 bg-[rgba(2,8,16,0.6)] flex items-center justify-center z-[200]">
    <div class="bg-[#0f1927] border border-[#1e324f] rounded-[14px] p-8 w-[min(480px,92vw)] shadow-[0_24px_60px_rgba(0,0,0,0.5)]">
      <h3 class="m-0 mb-[18px] text-[1.15rem] font-bold text-white">用户已创建 — {{ username }}</h3>
      <p class="text-[0.92rem] text-[#708aa6] mt-0 mb-[10px]">
        请将此临时密码分享给该用户。密码仅显示一次，之后无法找回。
      </p>
      <div class="bg-[#0b131f] border border-[#1e324f] rounded-[10px] p-[14px] mt-[14px]">
        <div class="font-mono text-[0.95rem] text-[#00ffc4] font-bold tracking-[0.03em] break-all">{{ password }}</div>
        <button type="button" class="mt-[10px] px-4 py-[9px] bg-[#0b131f] text-[#a3b8cc] border border-[#2b5384] rounded-[9px] cursor-pointer text-[0.9rem]" @click="copy">
          {{ copied ? '✓ 已复制' : copyFailed ? '复制失败，请手动选择' : '复制到剪贴板' }}
        </button>
      </div>
      <div class="flex justify-end mt-[18px]">
        <button type="button" class="px-[18px] py-[9px] rounded-[9px] bg-[linear-gradient(135deg,#00f3ff_0%,#3b82f6_100%)] text-[#060c14] font-semibold text-[0.9rem] cursor-pointer" @click="$emit('close')">
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
