<template>
  <!-- 非 admin 提示 -->
  <div v-if="!admin" class="min-h-[60vh] flex items-center justify-center">
    <div class="bg-[#1a2332] border border-[#2d3a4d] rounded-lg px-10 py-12 text-center">
      <p class="text-[#cbd5e1] text-[13px]">无权限</p>
    </div>
  </div>

  <div v-else class="px-[40px] py-[36px] max-w-[1000px] mx-auto">
    <div class="flex items-end justify-between mb-6">
      <div>
        <h2 class="m-0 text-[22px] font-bold text-white tracking-[-0.02em]">用户管理</h2>
        <p class="mt-1 mb-7 text-[13px] text-[#9ca3af]">邀请团队成员并管理其角色。</p>
      </div>
      <button
        type="button"
        class="px-[18px] py-[10px] rounded-md bg-[linear-gradient(135deg,#3b82f6_0%,#2563eb_100%)] text-white font-semibold text-[13px] cursor-pointer border-none"
        @click="showInvite = true"
      >
        + 创建用户
      </button>
    </div>

    <p v-if="loadErr" class="text-[#ef4444] text-[13px] mb-4">{{ loadErr }}</p>

    <div class="bg-[#1a2332] border border-[#2d3a4d] rounded-lg overflow-hidden">
      <table class="w-full border-collapse">
        <thead>
          <tr>
            <th class="text-left px-5 py-[14px] bg-[#111827] text-[11.5px] font-bold uppercase tracking-[0.08em] text-[#9ca3af] border-b border-[#2d3a4d]">
              用户名
            </th>
            <th class="text-left px-5 py-[14px] bg-[#111827] text-[11.5px] font-bold uppercase tracking-[0.08em] text-[#9ca3af] border-b border-[#2d3a4d]">
              用户 ID
            </th>
            <th class="text-left px-5 py-[14px] bg-[#111827] text-[11.5px] font-bold uppercase tracking-[0.08em] text-[#9ca3af] border-b border-[#2d3a4d]">
              角色
            </th>
            <th class="text-right px-5 py-[14px] bg-[#111827] text-[11.5px] font-bold uppercase tracking-[0.08em] text-[#9ca3af] border-b border-[#2d3a4d]">
              操作
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.userId">
            <td class="px-5 py-4 text-[13px] text-white font-semibold border-b border-[#2d3a4d]">{{ u.username }}</td>
            <td class="px-5 py-4 text-[12.5px] text-[#9ca3af] font-mono border-b border-[#2d3a4d]">{{ u.userId }}</td>
            <td class="px-5 py-4 border-b border-[#2d3a4d]">
              <span
                v-for="role in u.roles"
                :key="role"
                class="inline-block px-[10px] py-[3px] rounded-full text-[11px] font-semibold mr-1.5"
                :class="
                  role === 'admin'
                    ? 'bg-[rgba(59,130,246,0.12)] text-[#93c5fd] border border-[#3d4d64]'
                    : 'bg-[#253141] text-[#9ca3af] border border-[#2d3a4d]'
                "
              >
                {{ role }}
              </span>
            </td>
            <td class="px-5 py-4 text-right border-b border-[#2d3a4d]">
              <button
                type="button"
                class="px-[12px] py-[6px] rounded-md border border-[#3d4d64] bg-[#111827] text-[#cbd5e1] text-[12px] font-medium cursor-pointer mr-2"
                @click="toggleAdmin(u)"
              >
                {{ u.roles.includes('admin') ? '取消管理员' : '提升为管理员' }}
              </button>
              <button
                type="button"
                class="px-[12px] py-[6px] rounded-md border border-[#3d4d64] bg-[#111827] text-[#cbd5e1] text-[12px] font-medium cursor-pointer mr-2"
                @click="resetTarget = u"
              >
                重置密码
              </button>
              <button
                type="button"
                class="px-[12px] py-[6px] rounded-md border border-[#ef4444] bg-[#111827] text-[#ef4444] text-[12px] font-medium cursor-pointer"
                @click="doDelete(u)"
              >
                删除
              </button>
            </td>
          </tr>
          <tr v-if="users.length === 0 && !loadErr">
            <td colspan="4" class="px-5 py-4 text-center text-[#6b7280] border-b border-[#2d3a4d]">暂无用户。</td>
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
