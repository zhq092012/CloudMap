<template>
  <div class="h-screen w-screen flex flex-col">
    <nav class="top-nav">
      <div class="nav-logo" @click="$router.push('/')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
        云图
      </div>

      <!-- 5 个页签：跳转地址在 script 的 navItems[].path 里补 -->
      <div class="nav-tabs">
        <div
          v-for="item in navItems"
          :key="item.key"
          class="nav-tab"
          :class="activeNav === item.key && 'active'"
          @click="goNav(item)"
        >
          {{ item.label }}
        </div>
      </div>

      <div class="nav-actions">
        <button class="btn-icon" type="button" title="全屏" @click="toggleFullscreen">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M8 3H5a2 2 0 0 0-2 2v3" />
            <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
            <path d="M3 16v3a2 2 0 0 0 2 2h3" />
            <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
          </svg>
        </button>
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
              :class="menuOpen ? 'bg-[#1a2332] border-[#3d4d64]' : 'border-transparent hover:bg-[rgba(59,130,246,0.1)]'"
              @click="menuOpen = !menuOpen"
            >
              <span
                class="w-8 h-8 rounded-full flex items-center justify-center text-[0.95rem] font-bold text-white flex-shrink-0"
                :style="{
                  background: store.isAdmin
                    ? 'linear-gradient(135deg,#3b82f6 0%,#2563eb 100%)'
                    : 'linear-gradient(135deg,#64748b 0%,#475569 100%)',
                }"
              >
                {{ avatarChar }}
              </span>
              <span class="text-sm font-semibold text-white">{{ username }}</span>
              <span
                class="text-[10px] text-[#9ca3af] transition-transform duration-150"
                :class="menuOpen && 'rotate-180'"
              >▾</span>
            </button>
          </template>
          <div ref="menuContentRef">
            <div class="px-4 pt-3.5 pb-3 border-b border-[#253141]">
              <div class="text-sm font-bold text-white leading-tight">{{ username }}</div>
              <div class="text-xs mt-1" :class="store.isAdmin ? 'text-[#93c5fd]' : 'text-[#9ca3af]'">
                {{ store.isAdmin ? '管理员' : '普通用户' }}
              </div>
            </div>
            <button
              type="button"
              class="flex items-center gap-2.5 w-full px-4 py-3 text-left text-sm text-[#cbd5e1] hover:bg-[rgba(59,130,246,0.12)] cursor-pointer border-none"
              @click="goProfile"
            >
              <span class="text-base">👤</span> 个人资料
            </button>
            <button
              v-if="store.isAdmin"
              type="button"
              class="flex items-center gap-2.5 w-full px-4 py-3 text-left text-sm text-[#cbd5e1] hover:bg-[rgba(59,130,246,0.12)] cursor-pointer border-none"
              @click="goAdminUsers"
            >
              <span class="text-base">🛡️</span> 用户管理
            </button>
            <div class="h-px bg-[#253141]"></div>
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
    </nav>

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


// ---- 顶部导航（对齐 xxx 项目 top-nav 的 5 个页签） ----
interface NavItem {
  key: string;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { key: "surveillance", label: "态势监控", path: "/" },
  { key: "anomaly", label: "异常征候", path: "/anomaly" },
  { key: "analysis", label: "深度分析", path: "/deepanalysis" },
  { key: "agents", label: "智能体中心", path: "/agents-hub" },
  { key: "knowledge", label: "知识库", path: "/knowledge" },
  // { key: "settings", label: "设置", path: "" },
];

const activeNav = ref("surveillance");

function goNav(item: NavItem) {
  activeNav.value = item.key;
  if (!item.path) return; // 地址未配置：先只切高亮
  router.push(item.path);
}

// 直接改地址进出页面时让高亮跟着路由走（nav 配置了 path 之后才生效）
// 先精确匹配；子路由（如 /agents-hub/new、/agents-hub/agent/:id/chat）回落到所属页签
watch(
  () => route.path,
  (p) => {
    const hit =
      navItems.find((n) => n.path === p) ??
      navItems.find((n) => n.path && n.path !== "/" && p.startsWith(n.path + "/"));
    if (hit) activeNav.value = hit.key;
  },
  { immediate: true },
);

function toggleFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    document.documentElement.requestFullscreen();
  }
}

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
});

onUnmounted(() => {
  document.removeEventListener("mousedown", onDocMouseDown);
});
</script>

<style scoped lang="scss">
/* 配色 token 与智能体中心一致：石墨底 + 蓝主色 + 低饱和中性文本 */
$bg-secondary: #111827;
$border-color: #2d3a4d;
$border-strong: #3d4d64;
$text-primary: #e5e7eb;
$text-secondary: #9ca3af;
$accent-blue: #3b82f6;
$accent-text: #93c5fd;

$spacing-xs: 4px;
$spacing-sm: 8px;
$spacing-md: 16px;
$spacing-lg: 24px;
$spacing-xl: 32px;

$radius-md: 6px;
$transition-fast: 0.15s ease;

.top-nav {
  height: 60px;
  background: $bg-secondary;
  border-bottom: 1px solid $border-color;
  display: flex;
  align-items: center;
  padding: 0 $spacing-lg;
  flex-shrink: 0;
  position: relative;
  z-index: 100;

  // 底边 1px 蓝色渐变高光
  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, $accent-blue, transparent);
    opacity: 0.5;
  }

  // ---- 左侧 logo ----
  .nav-logo {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    font-weight: 600;
    font-size: 17px;
    letter-spacing: -0.2px;
    color: $text-primary;
    margin-right: $spacing-xl;
    cursor: pointer;
    user-select: none;

    svg {
      width: 26px;
      height: 26px;
      color: $accent-blue;
    }
  }

  // ---- 中部页签 ----
  .nav-tabs {
    display: flex;
    gap: $spacing-xs;
    flex: 1; // 撑开剩余空间，把 .nav-actions 顶到最右
  }

  .nav-tab {
    padding: $spacing-sm $spacing-md;
    border-radius: $radius-md;
    color: $text-secondary;
    cursor: pointer;
    transition: all $transition-fast;
    font-size: 13px;
    font-weight: 500;
    position: relative;
    border: 1px solid transparent;

    &:hover {
      color: $text-primary;
      background: rgba($accent-blue, 0.06);
      border-color: rgba($accent-blue, 0.2);
    }

    &.active {
      color: $accent-text;
      background: rgba($accent-blue, 0.16);
      border-color: rgba($accent-blue, 0.45);

      // 页签底部高亮条
      &::after {
        content: "";
        position: absolute;
        bottom: -1px;
        left: 50%;
        transform: translateX(-50%);
        width: 40%;
        height: 2px;
        background: $accent-blue;
        border-radius: 2px 2px 0 0;
      }
    }
  }

  // ---- 右侧操作区（el-popover 是最后一个子元素，天然贴最右）----
  .nav-actions {
    display: flex;
    align-items: center;
    gap: $spacing-md;
  }

  .nav-stat {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    color: $text-secondary;
    font-size: 12px;
  }

  .btn-icon {
    width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-md;
    color: $text-secondary;
    cursor: pointer;
    transition: all $transition-fast;
    border: 1px solid $border-color;
    background: transparent;
    padding: 0;

    &:hover {
      color: $accent-text;
      border-color: $border-strong;
      background: rgba($accent-blue, 0.1);
    }
  }
}
</style>
