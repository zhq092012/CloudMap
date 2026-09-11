<template>
  <!-- 非 admin 提示 -->
  <div v-if="!admin" class="min-h-[60vh] flex items-center justify-center">
    <div class="bg-[#0f1927] border border-[#1e324f] rounded-[14px] px-10 py-12 text-center">
      <p class="text-[#a3b8cc] text-[0.95rem]">无权限</p>
    </div>
  </div>

  <div v-else class="px-[40px] py-[36px] max-w-[1000px] mx-auto">
    <div class="flex items-end justify-between mb-6">
      <div>
        <h2 class="m-0 text-[1.6rem] font-bold text-white tracking-[-0.02em]">用户管理</h2>
        <p class="mt-1 mb-7 text-[0.92rem] text-[#708aa6]">邀请团队成员并管理其角色。</p>
      </div>
      <button
        type="button"
        class="px-[18px] py-[10px] rounded-[9px] bg-[linear-gradient(135deg,#00f3ff_0%,#3b82f6_100%)] text-[#060c14] font-semibold text-[0.92rem] cursor-pointer border-none"
        @click="showInvite = true"
      >
        + 创建用户
      </button>
    </div>

    <p v-if="loadErr" class="text-[#ef4444] text-[0.88rem] mb-4">{{ loadErr }}</p>

    <div class="bg-[#0f1927] border border-[#1e324f] rounded-[14px] overflow-hidden">
      <table class="w-full border-collapse">
        <thead>
          <tr>
            <th class="text-left px-5 py-[14px] bg-[#0b131f] text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[#708aa6] border-b border-[#1e324f]">
              用户名
            </th>
            <th class="text-left px-5 py-[14px] bg-[#0b131f] text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[#708aa6] border-b border-[#1e324f]">
              用户 ID
            </th>
            <th class="text-left px-5 py-[14px] bg-[#0b131f] text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[#708aa6] border-b border-[#1e324f]">
              角色
            </th>
            <th class="text-right px-5 py-[14px] bg-[#0b131f] text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[#708aa6] border-b border-[#1e324f]">
              操作
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.userId">
            <td class="px-5 py-4 text-[0.92rem] text-white font-semibold border-b border-[#142338]">{{ u.username }}</td>
            <td class="px-5 py-4 text-[0.85rem] text-[#708aa6] font-mono border-b border-[#142338]">{{ u.userId }}</td>
            <td class="px-5 py-4 border-b border-[#142338]">
              <span
                v-for="role in u.roles"
                :key="role"
                class="inline-block px-[10px] py-[3px] rounded-full text-[0.76rem] font-semibold mr-1.5"
                :class="
                  role === 'admin'
                    ? 'bg-[#0b2a3a] text-[#00f3ff] border border-[#2b5384]'
                    : 'bg-[#142338] text-[#708aa6] border border-[#1e324f]'
                "
              >
                {{ role }}
              </span>
            </td>
            <td class="px-5 py-4 text-right border-b border-[#142338]">
              <button
                type="button"
                class="px-[12px] py-[6px] rounded-[7px] border border-[#2b5384] bg-[#0b131f] text-[#a3b8cc] text-[0.82rem] font-medium cursor-pointer mr-2"
                @click="toggleAdmin(u)"
              >
                {{ u.roles.includes('admin') ? '取消管理员' : '提升为管理员' }}
              </button>
              <button
                type="button"
                class="px-[12px] py-[6px] rounded-[7px] border border-[#2b5384] bg-[#0b131f] text-[#a3b8cc] text-[0.82rem] font-medium cursor-pointer mr-2"
                @click="resetTarget = u"
              >
                重置密码
              </button>
              <button
                type="button"
                class="px-[12px] py-[6px] rounded-[7px] border border-[#ef4444] bg-[#0b131f] text-[#ef4444] text-[0.82rem] font-medium cursor-pointer"
                @click="doDelete(u)"
              >
                删除
              </button>
            </td>
          </tr>
          <tr v-if="users.length === 0 && !loadErr">
            <td colspan="4" class="px-5 py-4 text-center text-[#526e8c] border-b border-[#142338]">暂无用户。</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 创建用户弹窗 -->
    <AdminInviteModal
      v-if="showInvite"
      @close="showInvite = false"
      @created="onCreated"
    />

    <!-- 生成密码展示弹窗 -->
    <AdminGeneratedPasswordModal
      v-if="generated"
      :username="generated.username"
      :password="generated.password"
      @close="generated = null"
    />

    <!-- 重置密码弹窗 -->
    <AdminResetPasswordModal
      v-if="resetTarget"
      :user="resetTarget"
      @close="resetTarget = null"
      @done="onResetDone"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAgentHubStore } from '../store';
import * as api from '../api';
import type { AdminUserView, CreateUserResponse } from '../types';
import AdminInviteModal from './AdminInviteModal.vue';
import AdminGeneratedPasswordModal from './AdminGeneratedPasswordModal.vue';
import AdminResetPasswordModal from './AdminResetPasswordModal.vue';

const store = useAgentHubStore();
const admin = computed(() => store.isAdmin);

const users = ref<AdminUserView[]>([]);
const loadErr = ref<string | null>(null);
const showInvite = ref(false);
const generated = ref<{ username: string; password: string } | null>(null);
const resetTarget = ref<AdminUserView | null>(null);

async function refresh() {
  try {
    users.value = await api.listUsers();
  } catch (e: unknown) {
    loadErr.value = e instanceof Error ? e.message : '加载失败';
  }
}

onMounted(async () => {
  if (!store.me) await store.probe();
  if (store.isAdmin) refresh();
});

function onCreated(res: CreateUserResponse) {
  showInvite.value = false;
  void refresh();
  if (res.generatedPassword) {
    generated.value = { username: res.user.username, password: res.generatedPassword };
  }
}

function onResetDone() {
  resetTarget.value = null;
}

function toggleAdmin(u: AdminUserView) {
  const hasAdmin = u.roles.includes('admin');
  const next = hasAdmin ? u.roles.filter((r) => r !== 'admin') : [...u.roles, 'admin'];
  if (!next.includes('user')) next.push('user');
  api.updateRoles(u.userId, next).then(refresh).catch((e: unknown) => alert(e instanceof Error ? e.message : '操作失败'));
}

function doDelete(u: AdminUserView) {
  if (!confirm(`确定删除用户 "${u.username}"？\n\n将撤销该用户在所有智能体上的共享授权，工作区文件不会被删除。`)) return;
  api.deleteUser(u.userId).then(refresh).catch((e: unknown) => alert(e instanceof Error ? e.message : '操作失败'));
}
</script>
