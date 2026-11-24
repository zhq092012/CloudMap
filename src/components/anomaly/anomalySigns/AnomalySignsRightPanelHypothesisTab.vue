<template>
  <div class="asrp-hyp">
    <p class="asrp-hyp__context">
      <span class="asrp-hyp__context-label">关联事件</span>
      {{ panel.contextTitle }}
    </p>

    <article
      v-for="step in panel.steps"
      :key="step.code"
      class="asrp-hyp-step"
      :class="`asrp-hyp-step--${step.status}`"
    >
      <header class="asrp-hyp-step__head">
        <span class="asrp-hyp-step__code">{{ step.code }}</span>
        <span class="asrp-hyp-step__title">{{ step.title }}</span>
        <span class="asrp-hyp-step__status">{{ statusLabel(step.status) }}</span>
      </header>
      <p class="asrp-hyp-step__logic">{{ step.logic }}</p>
      <dl class="asrp-hyp-step__result">
        <dt>验证结果</dt>
        <dd>{{ step.resultSummary }}</dd>
      </dl>
      <p class="asrp-hyp-step__source">
        <span>数据源</span> {{ step.dataSource }}
      </p>
    </article>

    <section class="asrp-card asrp-card--accent">
      <h4 class="asrp-section-title">智能建议</h4>
      <p class="asrp-hyp__recommend">{{ panel.recommendation }}</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { AnomalyHypothesisPanelView, AnomalyHypothesisStatus } from "@/types/anomalySignsRightPanel";

defineProps<{
  /** 假设验证视图模型 */
  panel: AnomalyHypothesisPanelView;
}>();

function statusLabel(status: AnomalyHypothesisStatus): string {
  switch (status) {
    case "verified":
      return "已验证";
    case "rejected":
      return "已证伪";
    case "running":
      return "验证中";
    default:
      return "待验证";
  }
}
</script>

<style scoped lang="scss">
.asrp-hyp {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.asrp-hyp__context {
  margin: 0;
  padding: 8px 10px;
  font-size: 11.5px;
  line-height: 1.5;
  color: #9ca3af;
  background: rgba(17, 24, 39, 0.55);
  border: 1px solid #2d3a4d;
  border-radius: 6px;
}

.asrp-hyp__context-label {
  margin-right: 6px;
  font-weight: 600;
  color: #6b7280;
}

.asrp-hyp-step {
  padding: 10px;
  background: #1a2332;
  border: 1px solid #2d3a4d;
  border-radius: 6px;
  border-left-width: 3px;

  &--verified {
    border-left-color: #22c55e;
  }

  &--rejected {
    border-left-color: #f87171;
  }

  &--running {
    border-left-color: #60a5fa;
  }

  &--pending {
    border-left-color: #6b7280;
  }

  &__head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
  }

  &__code {
    font-size: 11px;
    font-weight: 700;
    font-family: ui-monospace, monospace;
    color: #93c5fd;
  }

  &__title {
    flex: 1;
    min-width: 120px;
    font-size: 12.5px;
    font-weight: 600;
    color: #e5e7eb;
  }

  &__status {
    padding: 1px 6px;
    font-size: 10.5px;
    font-weight: 600;
    color: #cbd5e1;
    background: rgba(17, 24, 39, 0.8);
    border: 1px solid #374151;
    border-radius: 4px;
  }

  &__logic {
    margin: 0 0 8px;
    font-size: 11.5px;
    line-height: 1.55;
    color: #9ca3af;
  }

  &__result {
    margin: 0 0 6px;

    dt {
      margin: 0 0 2px;
      font-size: 10.5px;
      color: #6b7280;
    }

    dd {
      margin: 0;
      font-size: 11.5px;
      line-height: 1.5;
      color: #e5e7eb;
    }
  }

  &__source {
    margin: 0;
    font-size: 10.5px;
    color: #6b7280;

    span {
      margin-right: 4px;
      color: #4b5563;
    }
  }
}

.asrp-card {
  padding: 10px;
  border-radius: 6px;

  &--accent {
    border: 1px solid rgba(59, 130, 246, 0.35);
    background: linear-gradient(180deg, rgba(30, 41, 59, 0.9), rgba(17, 24, 39, 0.95));
  }
}

.asrp-section-title {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 600;
  color: #cbd5e1;
}

.asrp-hyp__recommend {
  margin: 0;
  font-size: 12px;
  line-height: 1.65;
  color: #9ca3af;
}
</style>