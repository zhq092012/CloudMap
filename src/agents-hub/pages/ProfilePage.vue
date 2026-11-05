<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import * as api from '../api';
import { useAgentHubStore } from '../store';
import type { UserProfile } from '../types';

const router = useRouter();
const store = useAgentHubStore();

// ---- profile (read from store.me, refresh via api.getProfile) ----
const profile = ref<UserProfile | null>(
  store.me ? { userId: store.me.userId, username: store.me.username, roles: store.me.roles } : null,
);
const loading = ref(false);
const loadErr = ref<string | null>(null);

// ---- change password ----
const curPwd = ref('');
const newPwd = ref('');
const conPwd = ref('');
const pwdLoading = ref(false);
const pwdErr = ref<string | null>(null);
const pwdOk = ref(false);

onMounted(async () => {
  loading.value = true;
  loadErr.value = null;
  try {
    profile.value = await api.getProfile();
  } catch (e: unknown) {
    loadErr.value = e instanceof Error ? e.message : '出错了';
  } finally {
    loading.value = false;
  }
});

async function handleChangePwd() {
  pwdErr.value = null;
  pwdOk.value = false;
  if (newPwd.value.length < 6) {
    pwdErr.value = '密码至少 6 个字符';
    return;
  }
  if (newPwd.value !== conPwd.value) {
    pwdErr.value = '两次输入的密码不一致';
    return;
  }
  pwdLoading.value = true;
  try {
    await api.changePassword(curPwd.value, newPwd.value);
    pwdOk.value = true;
    curPwd.value = '';
    newPwd.value = '';
    conPwd.value = '';
  } catch (e: unknown) {
    pwdErr.value = e instanceof Error ? e.message : '出错了';
  } finally {
    pwdLoading.value = false;
  }
}

function handleLogout() {
  store.logout();
  router.push({ name: 'Login' });
}
</script>

<template>
  <div class="min-h-screen bg-[#0a0e17] text-[#cbd5e1] px-[40px] py-[36px] max-w-[760px]">
    <h2 class="text-white font-bold text-[19px] mb-7 tracking-tight">个人资料</h2>

    <p v-if="loadErr" class="text-[#ef4444] text-[12.5px] mt-2">{{ loadErr }}</p>
    <p v-else-if="loading" class="text-[#9ca3af] text-[12.5px] mt-2">加载中…</p>

    <!-- Account -->
    <div class="bg-[#1a2332] border border-[#2d3a4d] rounded-lg p-6 mb-5">
      <span class="block text-[#9ca3af] uppercase tracking-[0.1em] text-[11.5px] font-bold mb-4">账户</span>
      <template v-if="profile">
        <div class="flex items-center gap-3.5 mb-3">
          <span class="w-[120px] shrink-0 text-[#9ca3af] text-[12.5px]">用户名</span>
          <span class="text-[#cbd5e1] text-[13px] font-semibold">{{ profile.username }}</span>
        </div>
        <div class="flex items-center gap-3.5 mb-3">
          <span class="w-[120px] shrink-0 text-[#9ca3af] text-[12.5px]">用户 ID</span>
          <span class="font-mono text-[13px] text-[#6b7280]">{{ profile.userId }}</span>
        </div>
        <div class="flex items-center gap-3.5 mb-3">
          <span class="w-[120px] shrink-0 text-[#9ca3af] text-[12.5px]">角色</span>
          <span class="flex flex-wrap gap-2">
            <span
              v-for="r in profile.roles"
              :key="r"
              class="inline-block px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold border"
              :class="r === 'admin'
                ? 'bg-[#111827] border-[#3d4d64] text-[#93c5fd]'
                : 'bg-[#111827] border-[#2d3a4d] text-[#9ca3af]'"
            >{{ r }}</span>
          </span>
        </div>
      </template>
    </div>

    <!-- Change Password -->
    <div class="bg-[#1a2332] border border-[#2d3a4d] rounded-lg p-6 mb-5">
      <span class="block text-[#9ca3af] uppercase tracking-[0.1em] text-[11.5px] font-bold mb-4">修改密码</span>
      <div class="grid grid-cols-3 gap-4">
        <div>
          <label class="block text-[12.5px] font-medium text-[#cbd5e1] mb-2">当前密码</label>
          <input
            v-model="curPwd"
            type="password"
            class="w-full box-border px-3.5 py-2.5 bg-[#111827] border border-[#2d3a4d] rounded-lg text-[#cbd5e1] text-[12.5px] focus:outline-none focus:border-[#3d4d64]"
          />
        </div>
        <div>
          <label class="block text-[12.5px] font-medium text-[#cbd5e1] mb-2">新密码</label>
          <input
            v-model="newPwd"
            type="password"
            placeholder="至少 6 个字符"
            class="w-full box-border px-3.5 py-2.5 bg-[#111827] border border-[#2d3a4d] rounded-lg text-[#cbd5e1] text-[12.5px] focus:outline-none focus:border-[#3d4d64]"
          />
        </div>
        <div>
          <label class="block text-[12.5px] font-medium text-[#cbd5e1] mb-2">确认密码</label>
          <input
            v-model="conPwd"
            type="password"
            class="w-full box-border px-3.5 py-2.5 bg-[#111827] border border-[#2d3a4d] rounded-lg text-[#cbd5e1] text-[12.5px] focus:outline-none focus:border-[#3d4d64]"
          />
        </div>
      </div>

      <p v-if="pwdErr" class="text-[#ef4444] text-[12.5px] mt-2.5">{{ pwdErr }}</p>
      <p v-if="pwdOk" class="text-[#10b981] text-[12.5px] mt-2.5">密码修改成功！</p>

      <button
        :disabled="pwdLoading"
        @click="handleChangePwd"
        class="mt-4 px-6 py-2.5 rounded-lg text-white text-[12.5px] font-semibold cursor-pointer disabled:opacity-50"
        style="background:linear-gradient(135deg,#3b82f6 0%,#2563eb 100%);box-shadow:0 2px 6px rgba(59,130,246,0.25)"
      >
        {{ pwdLoading ? '更新中…' : '更新密码' }}
      </button>
    </div>

    <!-- Logout -->
    <button
      @click="handleLogout"
      class="px-6 py-2.5 rounded-lg text-[12.5px] font-semibold border border-[#ef4444] text-[#ef4444] cursor-pointer hover:bg-[#ef4444] hover:text-white transition-colors"
    >
      退出登录
    </button>
  </div>
</template>
