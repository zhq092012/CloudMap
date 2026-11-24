<template>
  <div class="asrp-deep">
    <header class="asrp-deep__hero">
      <span class="asrp-deep__badge" :class="`asrp-deep__badge--${content.levelTone}`">{{
        content.levelLabel
      }}</span>
      <h3 class="asrp-deep__title">{{ content.title }}</h3>
    </header>

    <section class="asrp-card">
      <dl class="asrp-kv">
        <div v-for="(row, idx) in content.meta" :key="idx" class="asrp-kv__row">
          <dt>{{ row.label }}</dt>
          <dd>{{ row.value }}</dd>
        </div>
      </dl>
    </section>

    <section class="asrp-card">
      <h4 class="asrp-section-title">综合研判</h4>
      <p class="asrp-deep__narrative">{{ content.narrative }}</p>
    </section>

    <section class="asrp-card">
      <h4 class="asrp-section-title">可能成因（置信度）</h4>
      <div class="asrp-causes">
        <div v-for="(c, idx) in content.causes" :key="idx" class="asrp-cause">
          <div class="asrp-cause__meta">
            <span>{{ idx + 1 }}. {{ c.label }}</span>
            <span class="asrp-mono">{{ c.confidence }}%</span>
          </div>
          <div class="asrp-bar-track">
            <div
              class="asrp-bar-fill"
              :class="`asrp-bar-fill--${c.tone}`"
              :style="{ width: `${c.confidence}%` }"
            />
          </div>
        </div>
      </div>
    </section>

    <section class="asrp-card">
      <h4 class="asrp-section-title">关联证据</h4>
      <ul class="asrp-evidence">
        <li v-for="(ev, idx) in content.evidences" :key="idx">
          <span class="asrp-evidence__title">{{ ev.title }}</span>
          <span class="asrp-evidence__detail">{{ ev.detail }}</span>
        </li>
      </ul>
    </section>

    <section class="asrp-card asrp-card--accent">
      <h4 class="asrp-section-title">智能建议</h4>
      <p class="asrp-deep__recommend">{{ content.recommendation }}</p>
      <button type="button" class="asrp-btn asrp-btn--primary">{{ content.actionLabel }}</button>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { AnomalyDeepJudgmentView } from "@/types/anomalySignsRightPanel";

defineProps<{
  /** 深度研判视图模型 */
  content: AnomalyDeepJudgmentView;
}>();
</script>

<style scoped lang="scss">
.asrp-deep {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.asrp-deep__hero {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.asrp-deep__badge {
  align-self: flex-start;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 700;
  border-radius: 4px;

  &--danger {
    color: #fecaca;
    background: rgba(239, 68, 68, 0.2);
    border: 1px solid rgba(248, 113, 113, 0.45);
  }

  &--warn {
    color: #fde68a;
    background: rgba(245, 158, 11, 0.15);
    border: 1px solid rgba(251, 191, 36, 0.4);
  }

  &--info {
    color: #bfdbfe;
    background: rgba(59, 130, 246, 0.15);
    border: 1px solid rgba(96, 165, 250, 0.4);
  }
}

.asrp-deep__title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.35;
  color: #e5e7eb;
}

.asrp-card {
  padding: 10px;
  background: #1a2332;
  border: 1px solid #2d3a4d;
  border-radius: 6px;

  &--accent {
    border-color: rgba(59, 130, 246, 0.35);
    background: linear-gradient(180deg, rgba(30, 41, 59, 0.9), rgba(17, 24, 39, 0.95));
  }
}

.asrp-section-title {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 600;
  color: #cbd5e1;
}

.asrp-kv {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 12px;
  margin: 0;

  &__row {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;

    dt {
      margin: 0;
      font-size: 10.5px;
      color: #6b7280;
    }

    dd {
      margin: 0;
      font-size: 11.5px;
      font-family: ui-monospace, monospace;
      color: #e5e7eb;
      word-break: break-word;
    }
  }
}

.asrp-deep__narrative,
.asrp-deep__recommend {
  margin: 0;
  font-size: 12px;
  line-height: 1.65;
  color: #9ca3af;
}

.asrp-causes {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.asrp-cause__meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 3px;
  font-size: 11.5px;
  color: #9ca3af;
}

.asrp-bar-track {
  width: 100%;
  height: 4px;
  overflow: hidden;
  background: #111827;
  border-radius: 999px;
}

.asrp-bar-fill {
  height: 100%;
  border-radius: 999px;

  &--danger {
    background: #ef4444;
  }

  &--warn {
    background: #f59e0b;
  }

  &--info {
    background: #3b82f6;
  }

  &--muted {
    background: #6b7280;
  }
}

.asrp-mono {
  font-family: ui-monospace, monospace;
}

.asrp-evidence {
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    padding: 6px 0;
    border-bottom: 1px solid rgba(45, 58, 77, 0.6);

    &:last-child {
      border-bottom: none;
    }
  }
}

.asrp-evidence__title {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #93c5fd;
}

.asrp-evidence__detail {
  display: block;
  margin-top: 2px;
  font-size: 11.5px;
  line-height: 1.5;
  color: #9ca3af;
}

.asrp-btn {
  width: 100%;
  margin-top: 10px;
  padding: 7px 10px;
  font-size: 12px;
  font-weight: 600;
  color: #e5e7eb;
  background: rgba(59, 130, 246, 0.35);
  border: 1px solid rgba(59, 130, 246, 0.65);
  border-radius: 6px;
  cursor: pointer;

  &:hover {
    background: rgba(59, 130, 246, 0.5);
  }
}
</style>