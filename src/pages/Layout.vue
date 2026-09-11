<template>
  <div class="h-screen w-screen flex flex-col">
      <div class="bg-gray-800 text-white px-4 p-3">
        <div class="flex items-center justify-between h-full">
          <div class="text-xl font-bold cursor-pointer" @click="$router.push('/')">云图威胁分析与态势研判系统</div>
          <div class="flex items-center space-x-4">
            <!-- <div class="cursor-pointer hover:text-sky-400" @click="$router.push('/agents')">
              智能体管理中心
            </div> -->
            <div class="cursor-pointer hover:text-sky-400" @click="$router.push('/agents-hub')">
              智能体中心
            </div>
            <div class="text-sky-500">战场 :中东·伊朗-以色列对峙</div>
            <div>当前时间 : {{ currentTime }}</div>
            <el-popover
              v-model:visible="menuOpen"
              trigger="manual"
              placement="bottom-end"
              :width="232"
              :show-arrow="false"
              popper-class="user-menu-popper"
            >
              <template #reference>
                <button
                  ref="menuRef"
                  type="button"
                  class="flex items-center gap-2.5 rounded-full pl-1.5 pr-3 py-1.5 cursor-pointer select-none border transition-colors"
                  :class="menuOpen ? 'bg-[#122036] border-[#2b5384]' : 'border-transparent hover:bg-[rgba(255,255,255,0.06)]'"
                  @click="menuOpen = !menuOpen"
                >
                  <span
                    class="w-8 h-8 rounded-full flex items-center justify-center text-[0.95rem] font-bold text-white flex-shrink-0"
                    :style="{
                      background: store.isAdmin
                        ? 'linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)'
                        : 'linear-gradient(135deg,#94a3b8 0%,#64748b 100%)',
                    }"
                  >
                    {{ avatarChar }}
                  </span>
                  <span class="text-sm font-semibold text-white">{{ username }}</span>
                  <span
                    class="text-[10px] text-[#708aa6] transition-transform duration-150"
                    :class="menuOpen && 'rotate-180'"
                  >▾</span>
                </button>
              </template>
              <div ref="menuContentRef">
                <div class="px-4 pt-3.5 pb-3 border-b border-[#142338]">
                  <div class="text-sm font-bold text-white leading-tight">{{ username }}</div>
                  <div class="text-xs mt-1" :class="store.isAdmin ? 'text-[#7fd4ff]' : 'text-[#708aa6]'">
                    {{ store.isAdmin ? '管理员' : '普通用户' }}
                  </div>
                </div>
                <button
                  type="button"
                  class="flex items-center gap-2.5 w-full px-4 py-3 text-left text-sm text-[#a3b8cc] hover:bg-[#122036] cursor-pointer border-none"
                  @click="goProfile"
                >
                  <span class="text-base">👤</span> 个人资料
                </button>
                <button
                  v-if="store.isAdmin"
                  type="button"
                  class="flex items-center gap-2.5 w-full px-4 py-3 text-left text-sm text-[#a3b8cc] hover:bg-[#122036] cursor-pointer border-none"
                  @click="goAdminUsers"
                >
                  <span class="text-base">🛡️</span> 用户管理
                </button>
                <div class="h-px bg-[#142338]"></div>
                <button
                  type="button"
                  class="flex items-center gap-2.5 w-full px-4 py-3 text-left text-sm text-[#ef4444] hover:bg-[rgba(239,68,68,0.08)] cursor-pointer border-none"
                  @click="doLogout"
                >
                  <span class="text-base">↩</span> 退出登录
                </button>
              </div>
            </el-popover>
          </div>
        </div>
      </div>

      <div class="flex-1 overflow-auto">
        <router-view />
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessageBox } from "element-plus";
import { useAgentHubStore } from "@/agents-hub/store";

const store = useAgentHubStore();
const router = useRouter();
const route = useRoute();
const username = computed(() => store.me?.username ?? "管理员");
const avatarChar = computed(() => (store.me?.username ?? "").charAt(0).toUpperCase() || "?");

const currentTime = ref(new Date().toLocaleString());
let timer: number;

// ---- 用户下拉框（el-popover manual 模式：全手动控制开合） ----
const menuOpen = ref(false);
const menuRef = ref<HTMLElement | null>(null);
const menuContentRef = ref<HTMLElement | null>(null);

// 路由切换时收起
watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false;
  },
);

// 点击卡片与触发按钮之外区域时收起（popover 内容 teleport 到 body，需同时检查两处）
function onDocMouseDown(e: MouseEvent) {
  if (!menuOpen.value) return;
  const t = e.target as Node;
  if (menuRef.value?.contains(t) || menuContentRef.value?.contains(t)) return;
  menuOpen.value = false;
}

function goProfile() {
  menuOpen.value = false;
  router.push({ name: "AgentHubProfile" });
}

function goAdminUsers() {
  menuOpen.value = false;
  router.push({ name: "AgentHubAdminUsers" });
}

async function doLogout() {
  menuOpen.value = false;
  try {
    await ElMessageBox.confirm("确定要退出登录吗？", "提示", {
      confirmButtonText: "退出",
      cancelButtonText: "取消",
      type: "warning",
    });
  } catch {
    return; // 取消 / ESC / 点遮罩
  }
  store.logout();
  router.push({ name: "Login" });
}

onMounted(() => {
  document.addEventListener("mousedown", onDocMouseDown);
  timer = window.setInterval(() => {
    currentTime.value = new Date().toLocaleString();
  }, 1000);
});

onUnmounted(() => {
  document.removeEventListener("mousedown", onDocMouseDown);
  clearInterval(timer);
});
</script>
