// ============================================================
// Self-contained route definitions for the agents-hub subsystem.
// Merge these into cloudmap's main router (children of the Layout
// route). AgentsHub.vue is the entry point.
// ============================================================
import type { RouteRecordRaw } from 'vue-router';

export const agentHubRoutes: RouteRecordRaw[] = [
  {
    path: 'agents-hub',
    name: 'AgentsHub',
    component: () => import('./AgentsHub.vue'),
    meta: { title: '智能体中心', requiresAuth: false },
  },
  {
    path: 'agents-hub/new',
    name: 'AgentHubCreate',
    component: () => import('./pages/AgentCreatePage.vue'),
    meta: { title: '创建智能体', requiresAuth: false },
  },
  {
    path: 'agents-hub/profile',
    name: 'AgentHubProfile',
    component: () => import('./pages/ProfilePage.vue'),
    meta: { title: '个人资料', requiresAuth: false },
  },
  {
    path: 'agents-hub/marketplaces',
    name: 'AgentHubMarketplaces',
    component: () => import('./pages/MarketplacesPage.vue'),
    meta: { title: '技能市场', requiresAuth: false },
  },
  {
    path: 'agents-hub/task-board',
    name: 'AgentHubTaskBoard',
    component: () => import('./pages/TaskBoardPage.vue'),
    meta: { title: '智能任务看板', requiresAuth: false },
  },
  {
    path: 'agents-hub/task-board/:executionId',
    name: 'AgentHubTaskBoardDetail',
    component: () => import('./pages/TaskBoardDetailPage.vue'),
    meta: { title: '任务看板详情', requiresAuth: false },
  },
  {
    path: 'agents-hub/channels',
    name: 'AgentHubChannels',
    component: () => import('./pages/ChannelsHubPage.vue'),
    meta: { title: '渠道管理', requiresAuth: false },
  },
  {
    path: 'agents-hub/channels/:channelId',
    name: 'AgentHubChannelDetail',
    component: () => import('./pages/ChannelDetailPage.vue'),
    meta: { title: '渠道详情', requiresAuth: false },
  },
  {
    path: 'agents-hub/admin/users',
    name: 'AgentHubAdminUsers',
    component: () => import('./pages/AdminUsersPage.vue'),
    meta: { title: '用户管理', requiresAuth: true, requiresAdmin: true },
  },
  {
    path: 'agents-hub/agent/:id',
    name: 'AgentHubLayout',
    component: () => import('./AgentLayout.vue'),
    meta: { requiresAuth: false },
    children: [
      // { path: '', redirect: { name: 'AgentHubChat' } },
      {
        path: 'chat',
        name: 'AgentHubChat',
        component: () => import('./pages/AgentChatPage.vue'),
      },
      {
        path: 'workspace',
        name: 'AgentHubWorkspace',
        component: () => import('./pages/AgentWorkspacePage.vue'),
      },
      {
        path: 'skills',
        name: 'AgentHubSkills',
        component: () => import('./pages/AgentSkillsPage.vue'),
      },
      {
        path: 'tools',
        name: 'AgentHubTools',
        component: () => import('./pages/AgentToolsPage.vue'),
      },
      {
        path: 'subagents',
        name: 'AgentHubSubagents',
        component: () => import('./pages/AgentSubagentsPage.vue'),
      },
      {
        path: 'sessions',
        name: 'AgentHubSessions',
        component: () => import('./pages/AgentSessionsPage.vue'),
      },
      {
        path: 'sessions/:sessionKey',
        name: 'AgentHubSessionDetail',
        component: () => import('./pages/AgentSessionDetailPage.vue'),
      },
      {
        path: 'channels',
        name: 'AgentHubAgentChannels',
        component: () => import('./pages/AgentChannelsPage.vue'),
      },
      {
        path: 'activity',
        name: 'AgentHubActivity',
        component: () => import('./pages/AgentActivityPage.vue'),
      },
      {
        path: 'settings',
        name: 'AgentHubSettings',
        component: () => import('./pages/AgentSettingsPage.vue'),
      },
    ],
  },
];

export default agentHubRoutes;
