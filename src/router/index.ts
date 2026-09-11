import { createRouter, createWebHistory } from "vue-router";
import { agentHubRoutes } from "@/agents-hub/router";
import { useAgentHubStore } from "@/agents-hub/store";

const routes = [
  {
    path: "/login",
    name: "Login",
    component: () => import("@/pages/Login.vue"),
  },
  {
    path: "/",
    name: "Layout",
    component: () => import("@/pages/Layout.vue"),
    children: [
      {
        path: "",
        name: "Home",
        component: () => import("@/pages/Home.vue"),
      },
      {
        path: "deepanalysis",
        name: "DeepAnalysis",
        component: () => import("@/pages/DeepAnalysis.vue"),
      },
      {
        path: "agents",
        name: "AgentsManage",
        component: () => import("@/pages/AgentsManage.vue"),
      },
      {
        path: "agentDetail",
        name: "AgentDetail",
        component: () => import("@/pages/AgentDetail.vue"),
      },
      // ----- agents-hub (ported from agentbuilder-main) -----
      ...agentHubRoutes,
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  const store = useAgentHubStore();

  // 登录页：未登录放行；已登录（或 token 待校验）回首页
  if (to.name === "Login") {
    if (!store.isAuthed) return true;
    if (!store.me) await store.probe();
    return "/";
  }

  // 未登录：强制去登录页并携带原始路径
  if (!store.isAuthed) {
    return { name: "Login", query: { redirect: to.fullPath } };
  }

  // 有 token 但本会话未校验（刷新后 me 为空）：校验一次
  if (!store.me) {
    const ok = await store.probe();
    if (!ok) {
      store.clearToken();
      return { name: "Login", query: { redirect: to.fullPath } };
    }
  }

  // 管理员路由（agents-hub 的 admin/users 等已带 meta.requiresAdmin）
  if (to.meta.requiresAdmin && !store.isAdmin) {
    return "/";
  }

  return true;
});

export default router;
