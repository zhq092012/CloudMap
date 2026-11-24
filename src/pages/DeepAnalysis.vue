<script setup lang="ts">
import { onMounted, ref } from "vue";
import CollapsibleSidePanel from "@/components/layout/CollapsibleSidePanel.vue";
import { useRoute } from "vue-router";
import { ElMessageBox } from "element-plus";
import { useAnalysisStore } from "@/store/modules/analysisStore";
import { useHomeStore } from "@/store/modules/homeStore";
import { listIncompleteWorkflows } from "@/api/deep-analysis";
import DeepAnalysisWorkspace from "@/components/deepAnalysis/DeepAnalysisWorkspace.vue";
import DeepAnalysisCloudBrainPanel from "@/components/deepAnalysis/DeepAnalysisCloudBrainPanel.vue";
/** 最右侧云脑栏收起态 */
const cloudBrainCollapsed = ref(false);

const store = useAnalysisStore();
const homeStore = useHomeStore();
const route = useRoute();

onMounted(async () => {
  let queryIds: string[] | undefined;
  if (route.query.from === "homepage" && route.query.ids) {
    queryIds = String(route.query.ids).split(",");
  }
  await store.restoreByAnomalies(queryIds);

  // 直接点击顶部「深度分析」tab 进入（未从异常证候携带异常跳转）时，
  // 若按异常未能恢复出画布内容，把最近更新的未完成工作流实例载入画布，
  // 保证该入口展示的是最新 workflow 实例。
  if (queryIds === undefined && store.rawNodes.length === 0) {
    await store.restoreExistingWorkflow();
  }

  // 左侧「深度分析栏」列表（data-mark="深度分析栏列表"）数据源已改为
  // GET /api/v1/agent-flows/workflows/incomplete（未完成工作流）。
  // 因此只有在「没有任何待分析事件」且「没有可载入的未完成流程」时才提示去异常征候挑选。
  if ((homeStore.analysisList || []).length === 0) {
    const incomplete = await listIncompleteWorkflows().catch(() => []);
    if ((incomplete || []).length === 0) {
      ElMessageBox.alert(
        "当前没有未完成的深度分析流程，也没有待分析事件。请先前往「异常征候」页面，在列表中选择需要深度分析的项目并点击「加入深度分析」，再回到本页继续。",
        "暂无深度分析项目",
        {
          type: "warning",
          confirmButtonText: "知道了",
          customClass: "deep-analysis-empty-alert",
        },
      ).catch(() => {
        /* 关闭不视为异常 */
      });
    }
  }
});
</script>

<template>
  <!-- 左：步骤条 + 分析栏 | 图谱 | 分析面板；右：云脑智能分析 -->
  <div class="da-page">
    <DeepAnalysisWorkspace />
    <CollapsibleSidePanel
      v-model:collapsed="cloudBrainCollapsed"
      side="right"
      layout="flex"
      :width="272"
      label="云脑"
      aria-label="云脑智能分析"
    >
      <DeepAnalysisCloudBrainPanel />
    </CollapsibleSidePanel>
  </div>
</template>

<style scoped lang="scss">
.da-page {
  display: flex;
  height: 100%;
  min-height: 0;
}
</style>

<style lang="scss">
/* 「深度分析栏为空」提示框：跟随面板深色皮肤（弹窗 teleport 到 body，故用非 scoped + 唯一类名） */
.deep-analysis-empty-alert {
  background: #1a2332 !important;
  border: 1px solid #2d3a4d !important;
  border-radius: 8px !important;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.55) !important;

  .el-message-box__title {
    color: #93c5fd;
    font-weight: 700;
  }

  .el-message-box__content {
    color: #cbd5e1;
    font-size: 13px;
    line-height: 1.7;
  }

  .el-message-box__headerbtn:hover .el-message-box__close {
    color: #93c5fd;
  }

  .el-message-box__close {
    color: #9ca3af;
  }

  .el-message-box__btns .el-button {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    border-color: transparent;
    color: #ffffff;
    font-weight: 600;

    &:hover {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      border-color: transparent;
      color: #ffffff;
    }
  }
}
</style>
