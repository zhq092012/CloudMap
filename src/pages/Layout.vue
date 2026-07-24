<template>
  <div class="h-screen w-screen">
    <el-container class="h-full">
      <!-- Master Header -->
      <el-header class="bg-gray-800 text-white px-4">
        <div class="flex items-center justify-between h-full">
          <div class="text-xl font-bold">云图威胁分析与态势研判系统</div>
          <div class="flex items-center space-x-4">
            <div class="cursor-pointer hover:text-sky-400" @click="$router.push('/agents')">
              智能体管理中心
            </div>
            <div class="text-sky-500">战场 :中东·伊朗-以色列对峙</div>
            <div>当前时间 : {{ currentTime }}</div>
            <el-avatar :size="20" src="/avatar.png"></el-avatar>
            <span>管理员</span>
          </div>
        </div>
      </el-header>

      <!-- Main Container containing Breadcrumbs and View -->
      <el-main class="p-0 !flex !flex-col !overflow-hidden bg-[#070b14]">
        
        <!-- Premium Dynamic Breadcrumb Navigation Bar -->
        <div class="bg-[#0b101d] border-b border-slate-800/80 px-6 py-2 flex items-center justify-between select-none text-[11px] font-mono tracking-wider shrink-0 text-slate-400">
          <div class="flex items-center space-x-2">
            <template v-for="(item, index) in breadcrumbs" :key="item.path">
              <!-- Separator -->
              <span v-if="index > 0" class="text-slate-600 px-0.5">/</span>
              
              <!-- First level indicator icon (Home) -->
              <svg v-if="index === 0" class="w-3.5 h-3.5 text-slate-500 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>

              <!-- Link / Clickable Page Name -->
              <span v-if="item.clickable" @click="navigateTo(item.path)"
                class="hover:text-sky-400 cursor-pointer font-medium transition-colors duration-200 py-1 px-1.5 rounded hover:bg-slate-800/40">
                {{ item.name }}
              </span>

              <!-- Active Page Name -->
              <span v-else class="text-sky-400 font-semibold px-1.5">
                {{ item.name }}
              </span>
            </template>
          </div>

          <!-- Pulsing Status Badge -->
          <div class="flex items-center space-x-1.5 text-slate-500 scale-95 origin-right">
            <span class="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Agent 推导内核在线</span>
          </div>
        </div>

        <!-- Master View Container with correct height resolving context -->
        <div class="flex-1 flex flex-col min-h-0 relative">
          <router-view />
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();
const currentTime = ref(new Date().toLocaleString());
let timer: number;

interface BreadcrumbItem {
  name: string;
  path: string;
  clickable: boolean;
}

const breadcrumbs = computed<BreadcrumbItem[]>(() => {
  const path = route.path;
  const list: BreadcrumbItem[] = [
    { name: "态势大屏", path: "/", clickable: path !== "/" }
  ];

  if (path === "/warningcenter") {
    list.push({ name: "异常告警中心", path: "/warningcenter", clickable: false });
  } else if (path === "/deepanalysis") {
    list.push({ name: "异常告警中心", path: "/warningcenter", clickable: true });
    list.push({ name: "云脑多Agent并行推导", path: "/deepanalysis", clickable: false });
  } else if (path === "/comparison") {
    list.push({ name: "异常告警中心", path: "/warningcenter", clickable: true });
    list.push({ name: "云脑多Agent并行推导", path: "/deepanalysis", clickable: true });
    list.push({ name: "态势对比分析", path: "/comparison", clickable: false });
  } else if (path === "/agents") {
    list.push({ name: "智能体管理中心", path: "/agents", clickable: false });
  } else if (path === "/agentDetail") {
    list.push({ name: "智能体管理中心", path: "/agents", clickable: true });
    list.push({ name: "智能体详情", path: "/agentDetail", clickable: false });
  } else if (path === "/agentsdashboard") {
    list.push({ name: "智能体管理中心", path: "/agents", clickable: true });
    list.push({ name: "智能体任务看板", path: "/agentsdashboard", clickable: false });
  } else if (path === "/agentTaskEdit") {
    list.push({ name: "智能体管理中心", path: "/agents", clickable: true });
    list.push({ name: "编辑智能体任务", path: "/agentTaskEdit", clickable: false });
  }

  return list;
});

const navigateTo = (path: string) => {
  router.push(path);
};

onMounted(() => {
  timer = window.setInterval(() => {
    currentTime.value = new Date().toLocaleString();
  }, 1000);
});

onUnmounted(() => {
  clearInterval(timer);
});
</script>

