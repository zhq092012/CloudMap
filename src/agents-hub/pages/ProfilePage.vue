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
  <div class="min-h-screen bg-[#060c14] text-[#a3b8cc] px-[40px] py-[36px] max-w-[760px]">
    <h2 class="text-white font-bold text-2xl mb-7 tracking-tight">个人资料</h2>

    <p v-if="loadErr" class="text-[#ef4444] text-sm mt-2">{{ loadErr }}</p>
    <p v-else-if="loading" class="text-[#708aa6] text-sm mt-2">加载中…</p>

    <!-- Account -->
    <div class="bg-[#0f1927] border border-[#1e324f] rounded-xl p-6 mb-5">
      <span class="block text-[#708aa6] uppercase tracking-[0.1em] text-xs font-bold mb-4">账户</span>
      <template v-if="profile">
        <div class="flex items-center gap-3.5 mb-3">
          <span class="w-[120px] shrink-0 text-[#708aa6] text-sm">用户名</span>
          <span class="text-[#a3b8cc] text-[0.95rem] font-semibold">{{ profile.username }}</span>
        </div>
        <div class="flex items-center gap-3.5 mb-3">
          <span class="w-[120px] shrink-0 text-[#708aa6] text-sm">用户 ID</span>
          <span class="font-mono text-[0.88rem] text-[#526e8c]">{{ profile.userId }}</span>
        </div>
        <div class="flex items-center gap-3.5 mb-3">
          <span class="w-[120px] shrink-0 text-[#708aa6] text-sm">角色</span>
          <span class="flex flex-wrap gap-2">
            <span
              v-for="r in profile.roles"
              :key="r"
              class="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border"
              :class="r === 'admin'
                ? 'bg-[#0b131f] border-[#2b5384] text-[#00f3ff]'
                : 'bg-[#0b131f] border-[#1e324f] text-[#708aa6]'"
            >{{ r }}</span>
          </span>
        </div>
      </template>
    </div>

    <!-- Change Password -->
    <div class="bg-[#0f1927] border border-[#1e324f] rounded-xl p-6 mb-5">
      <span class="block text-[#708aa6] uppercase tracking-[0.1em] text-xs font-bold mb-4">修改密码</span>
      <div class="grid grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-[#a3b8cc] mb-2">当前密码</label>
          <input
            v-model="curPwd"
            type="password"
            class="w-full box-border px-3.5 py-2.5 bg-[#0b131f] border border-[#1e324f] rounded-lg text-[#a3b8cc] text-sm focus:outline-none focus:border-[#2b5384]"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-[#a3b8cc] mb-2">新密码</label>
          <input
            v-model="newPwd"
            type="password"
            placeholder="至少 6 个字符"
            class="w-full box-border px-3.5 py-2.5 bg-[#0b131f] border border-[#1e324f] rounded-lg text-[#a3b8cc] text-sm focus:outline-none focus:border-[#2b5384]"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-[#a3b8cc] mb-2">确认密码</label>
          <input
            v-model="conPwd"
            type="password"
            class="w-full box-border px-3.5 py-2.5 bg-[#0b131f] border border-[#1e324f] rounded-lg text-[#a3b8cc] text-sm focus:outline-none focus:border-[#2b5384]"
          />
        </div>
      </div>

      <p v-if="pwdErr" class="text-[#ef4444] text-sm mt-2.5">{{ pwdErr }}</p>
      <p v-if="pwdOk" class="text-[#00ffc4] text-sm mt-2.5">密码修改成功！</p>

      <button
        :disabled="pwdLoading"
        @click="handleChangePwd"
        class="mt-4 px-6 py-2.5 rounded-lg text-white text-sm font-semibold cursor-pointer disabled:opacity-50"
        style="background:linear-gradient(135deg,#3b82f6 0%,#00f3ff 100%);box-shadow:0 2px 6px rgba(0,243,255,0.25)"
      >
        {{ pwdLoading ? '更新中…' : '更新密码' }}
      </button>
    </div>

    <!-- Logout -->
    <button
      @click="handleLogout"
      class="px-6 py-2.5 rounded-lg text-sm font-semibold border border-[#ef4444] text-[#ef4444] cursor-pointer hover:bg-[#ef4444] hover:text-white transition-colors"
    >
      退出登录
    </button>
  </div>
</template>
