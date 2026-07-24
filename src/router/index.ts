import { createRouter, createWebHistory } from "vue-router";

const routes = [
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
        path: "warningcenter",
        name: "WarningCenter",
        component: () => import("@/pages/WarningListCenter.vue"),
      },
      {
        path: "deepanalysis",
        name: "DeepAnalysis",
        component: () => import("@/pages/DeepAnalysis.vue"),
      },
      {
        path: "comparison",
        name: "Comparison",
        component: () => import("@/pages/Comparision.vue"),
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
      {
        path: "agentsdashboard",
        name: "AgentsDashboard",
        component: () => import("@/pages/AgentTaskDashboard.vue"),
      },
      {
        path: "agentTaskEdit",
        name: "AgentTaskEdit",
        component: () => import("@/pages/AgentTaskEdit.vue"),
      },
    
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
