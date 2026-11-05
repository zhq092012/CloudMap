<template>
  <div class="fixed inset-0 bg-[rgba(2,8,16,0.6)] flex items-center justify-center z-[200]" @click="$emit('close')">
    <div class="bg-[#1a2332] border border-[#2d3a4d] rounded-lg p-8 w-[min(480px,92vw)] shadow-[0_24px_60px_rgba(0,0,0,0.5)]" @click.stop>
      <h3 class="m-0 mb-[18px] text-[1.15rem] font-bold text-white">创建用户</h3>
      <label class="block text-[13px] font-medium text-[#cbd5e1] mb-1.5">用户名</label>
      <input v-model="username" autofocus
        class="w-full box-border px-[14px] py-[10px] bg-[#0a0e17] border border-[#3d4d64] rounded-md text-[#cbd5e1] text-[13px] mb-3.5 outline-none focus:border-[#3b82f6]" />
      <label class="block text-[13px] font-medium text-[#cbd5e1] mb-1.5">
        初始密码 <span class="text-[#6b7280] font-normal">（可选 — 留空则自动生成）</span>
      </label>
      <input v-model="password" type="password"
        class="w-full box-border px-[14px] py-[10px] bg-[#0a0e17] border border-[#3d4d64] rounded-md text-[#cbd5e1] text-[13px] mb-3.5 outline-none focus:border-[#3b82f6]" />
      <label class="flex items-center gap-2 text-[13px] text-[#cbd5e1] mb-[18px] cursor-pointer">
        <input type="checkbox" v-model="adminRole" class="accent-[#3b82f6]" />
        授予 <strong class="text-white">admin</strong> 角色
      </label>
      <p v-if="err" class="text-[#ef4444] text-[13px] my-1.5">{{ err }}</p>
      <div class="flex gap-[10px] justify-end">
        <button type="button" :disabled="submitting" @click="$emit('close')"
          class="px-4 py-[9px] bg-[#111827] text-[#cbd5e1] border border-[#3d4d64] rounded-md cursor-pointer text-[13px] disabled:opacity-50">
          取消
        </button>
        <button type="button" :disabled="submitting" @click="submit"
          class="px-[18px] py-[9px] rounded-md bg-[linear-gradient(135deg,#3b82f6_0%,#2563eb_100%)] text-white font-semibold text-[13px] cursor-pointer disabled:opacity-50">
          {{ submitting ? '创建中…' : '创建用户' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { createUser } from '../api';
import type { CreateUserResponse } from '../types';

const emit = defineEmits<{
  close: [];
  created: [res: CreateUserResponse];
}>();

const username = ref('');
const password = ref('');
const adminRole = ref(false);
const err = ref<string | null>(null);
const submitting = ref(false);

async function submit() {
  err.value = null;
  const u = username.value.trim();
  if (!u) {
    err.value = '用户名不能为空';
    return;
  }
  submitting.value = true;
  try {
    const roles = adminRole.value ? ['user', 'admin'] : ['user'];
    const res = await createUser({
      username: u,
      initialPassword: password.value.trim() ? password.value.trim() : undefined,
      roles,
    });
    emit('created', res);
  } catch (e: unknown) {
    err.value = e instanceof Error ? e.message : '创建失败';
  } finally {
    submitting.value = false;
  }
}
</script>
