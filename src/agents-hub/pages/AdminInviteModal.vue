<template>
  <div class="fixed inset-0 bg-[rgba(2,8,16,0.6)] flex items-center justify-center z-[200]" @click="$emit('close')">
    <div class="bg-[#0f1927] border border-[#1e324f] rounded-[14px] p-8 w-[min(480px,92vw)] shadow-[0_24px_60px_rgba(0,0,0,0.5)]" @click.stop>
      <h3 class="m-0 mb-[18px] text-[1.15rem] font-bold text-white">创建用户</h3>
      <label class="block text-[0.88rem] font-medium text-[#a3b8cc] mb-1.5">用户名</label>
      <input v-model="username" autofocus
        class="w-full box-border px-[14px] py-[10px] bg-[#060c14] border border-[#2b5384] rounded-[9px] text-[#a3b8cc] text-[0.92rem] mb-3.5 outline-none focus:border-[#00f3ff]" />
      <label class="block text-[0.88rem] font-medium text-[#a3b8cc] mb-1.5">
        初始密码 <span class="text-[#526e8c] font-normal">（可选 — 留空则自动生成）</span>
      </label>
      <input v-model="password" type="password"
        class="w-full box-border px-[14px] py-[10px] bg-[#060c14] border border-[#2b5384] rounded-[9px] text-[#a3b8cc] text-[0.92rem] mb-3.5 outline-none focus:border-[#00f3ff]" />
      <label class="flex items-center gap-2 text-[0.92rem] text-[#a3b8cc] mb-[18px] cursor-pointer">
        <input type="checkbox" v-model="adminRole" class="accent-[#00f3ff]" />
        授予 <strong class="text-white">admin</strong> 角色
      </label>
      <p v-if="err" class="text-[#ef4444] text-[0.88rem] my-1.5">{{ err }}</p>
      <div class="flex gap-[10px] justify-end">
        <button type="button" :disabled="submitting" @click="$emit('close')"
          class="px-4 py-[9px] bg-[#0b131f] text-[#a3b8cc] border border-[#2b5384] rounded-[9px] cursor-pointer text-[0.9rem] disabled:opacity-50">
          取消
        </button>
        <button type="button" :disabled="submitting" @click="submit"
          class="px-[18px] py-[9px] rounded-[9px] bg-[linear-gradient(135deg,#00f3ff_0%,#3b82f6_100%)] text-[#060c14] font-semibold text-[0.9rem] cursor-pointer disabled:opacity-50">
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
