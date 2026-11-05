<template>
  <div class="fixed inset-0 bg-[rgba(2,8,16,0.6)] flex items-center justify-center z-[200]" @click="$emit('close')">
    <div class="bg-[#1a2332] border border-[#2d3a4d] rounded-lg p-8 w-[min(480px,92vw)] shadow-[0_24px_60px_rgba(0,0,0,0.5)]" @click.stop>
      <h3 class="m-0 mb-[18px] text-[1.15rem] font-bold text-white">重置密码 — {{ user.username }}</h3>
      <label class="block text-[13px] font-medium text-[#cbd5e1] mb-1.5">新密码</label>
      <input v-model="pwd" type="password" autofocus
        class="w-full box-border px-[14px] py-[10px] bg-[#0a0e17] border border-[#3d4d64] rounded-md text-[#cbd5e1] text-[13px] mb-3.5 outline-none focus:border-[#3b82f6]" />
      <p v-if="err" class="text-[#ef4444] text-[13px] my-1.5">{{ err }}</p>
      <div class="flex gap-[10px] justify-end">
        <button type="button" :disabled="submitting" @click="$emit('close')"
          class="px-4 py-[9px] bg-[#111827] text-[#cbd5e1] border border-[#3d4d64] rounded-md cursor-pointer text-[13px] disabled:opacity-50">
          取消
        </button>
        <button type="button" :disabled="submitting" @click="submit"
          class="px-[18px] py-[9px] rounded-md bg-[linear-gradient(135deg,#3b82f6_0%,#2563eb_100%)] text-white font-semibold text-[13px] cursor-pointer disabled:opacity-50">
          {{ submitting ? '保存中…' : '重置密码' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { resetPassword } from '../api';
import type { AdminUserView } from '../types';

const props = defineProps<{ user: AdminUserView }>();
const emit = defineEmits<{
  close: [];
  done: [];
}>();

const pwd = ref('');
const err = ref<string | null>(null);
const submitting = ref(false);

async function submit() {
  err.value = null;
  if (pwd.value.length < 6) {
    err.value = '密码长度至少 6 位';
    return;
  }
  submitting.value = true;
  try {
    await resetPassword(props.user.userId, pwd.value);
    emit('done');
  } catch (e: unknown) {
    err.value = e instanceof Error ? e.message : '操作失败';
  } finally {
    submitting.value = false;
  }
}
</script>
