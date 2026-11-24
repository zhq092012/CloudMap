<!-- 态势图谱 -->
<template>
  <div class="graph-tip">
    <div class="graph-filter">
      <!-- 态势图谱过滤 -->
      <div class="graph-search-row">
        <input v-model="searchDraft" class="graph-search" type="text" placeholder="搜索标题 / 国家 / 主题…"
          @keyup.enter="applyGraphSearch" />
        <button class="graph-search-btn" type="button" @click="applyGraphSearch">搜索</button>
      </div>

      <!-- 态势图谱情感 -->
      <div class="graph-sentiment">
        <span v-for="opt in sentimentOptions" :key="opt.value" class="sentiment-chip"
          :class="{ active: homeStore.graphFilter.sentiment === opt.value }"
          @click="homeStore.graphFilter.sentiment = opt.value">{{ opt.label }}</span>
      </div>

      <!-- 态势图谱异常 -->
      <label class="graph-breaking">
        <input v-model="homeStore.graphFilter.onlyBreaking" type="checkbox" />
        <span>仅显示异常文章</span>
      </label>
    </div>

    <!-- 态势图谱图例 -->
    <div class="graph-legend">
      <!-- 态势图谱节点形状 -->
      <div class="legend-group">
        <div class="legend-title">节点形状</div>
        <div class="legend-item"><span class="shape shape-triangle"></span>国家聚合 / 同国家文章</div>
        <div class="legend-item"><span class="shape shape-diamond"></span>作者聚合 / 同作者文章</div>
        <div class="legend-item"><span class="shape shape-square"></span>独立文章</div>
      </div>
      <!-- 态势图谱节点颜色 -->
      <div class="legend-group">
        <div class="legend-title">节点颜色</div>
        <div class="legend-item"><span class="dot" style="background: #ef4444"></span>异常 / 消极</div>
        <div class="legend-item"><span class="dot" style="background: #94a3b8"></span>中立</div>
        <div class="legend-item"><span class="dot" style="background: #22c55e"></span>积极</div>
        <div class="legend-item"><span class="dot" style="background: #c1a465"></span>国家（金）</div>
        <div class="legend-item"><span class="dot" style="background: #a78bfa"></span>作者（紫）</div>
      </div>
      <!-- 态势图谱连线 -->
      <div class="legend-group">
        <div class="legend-title">连线</div>
        <div class="legend-item"><span class="line line-country"></span>国家关联</div>
        <div class="legend-item"><span class="line line-author"></span>作者关联</div>
        <div class="legend-item"><span class="line line-topic"></span>主题关联</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useHomeStore } from "@/store/modules/homeStore";

type GraphSentiment = "all" | "positive" | "negative" | "neutral";

const homeStore = useHomeStore();

const sentimentOptions: Array<{ label: string; value: GraphSentiment }> = [
  { label: "全部", value: "all" },
  { label: "消极", value: "negative" },
  { label: "中立", value: "neutral" },
  { label: "积极", value: "positive" },
];

/** 搜索草稿，确认后写入 store.graphFilter.search */
const searchDraft = ref(homeStore.graphFilter.search);

const applyGraphSearch = () => {
  homeStore.graphFilter.search = searchDraft.value.trim();
};
</script>

<style scoped lang="scss">
@use "./surveillanceLeftTokens.scss" as *;

.graph-tip {
  padding: 12px 14px;
  font-size: 12px;
  line-height: 1.7;
  color: #cbd5e1;
  background: rgba($panel, 0.72);
  border: 1px solid $border;
  border-radius: $radius-md;
  max-height: 100%;
  overflow-y: auto;
}

.graph-filter {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.graph-search-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.graph-search {
  flex: 1;
  min-width: 0;
  box-sizing: border-box;
  padding: 6px 10px;
  font-size: 12.5px;
  color: $text;
  background: $sunken;
  border: 1px solid $border;
  border-radius: $radius-md;
  outline: none;
  transition: border-color $ease, box-shadow $ease;

  &::placeholder {
    color: $text-3;
  }

  &:focus {
    border-color: rgba($accent, 0.6);
    box-shadow: 0 0 0 2px rgba($accent, 0.14);
  }
}

.graph-search-btn {
  flex-shrink: 0;
  height: 28px;
  padding: 0 14px;
  font-size: 12px;
  font-weight: 600;
  color: #ffffff;
  background: linear-gradient(135deg, $accent 0%, #2563eb 100%);
  border: 1px solid transparent;
  border-radius: $radius-md;
  cursor: pointer;
  user-select: none;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.28);
  transition: box-shadow $ease, filter $ease;

  &:hover {
    box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
  }

  &:active {
    filter: brightness(0.94);
  }
}

.graph-sentiment {
  display: flex;
  gap: 6px;
}

.sentiment-chip {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  padding: 0 6px;
  font-size: 12px;
  font-weight: 500;
  color: $text-2;
  background: $panel;
  border: 1px solid $border;
  border-radius: $radius-md;
  cursor: pointer;
  user-select: none;
  transition: background $ease, border-color $ease, color $ease;

  &:hover {
    border-color: $border-strong;
    color: $text;
  }

  &.active {
    background: rgba($accent, 0.16);
    border-color: rgba($accent, 0.45);
    color: $accent-text;
  }
}

.graph-breaking {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #cbd5e1;
  cursor: pointer;
  user-select: none;

  input {
    accent-color: $red;
    cursor: pointer;
  }
}

.graph-legend {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid $border;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.legend-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.legend-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: $text-3;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #cbd5e1;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  flex: none;
}

.shape {
  width: 12px;
  height: 12px;
  display: inline-block;
  flex: none;

  &.shape-triangle {
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-bottom: 11px solid #c1a465;
  }

  &.shape-diamond {
    width: 11px;
    height: 11px;
    background: #a78bfa;
    transform: rotate(45deg);
  }

  &.shape-square {
    width: 11px;
    height: 11px;
    background: #94a3b8;
  }
}

.line {
  width: 18px;
  height: 0;
  border-top: 2px solid;
  display: inline-block;
  flex: none;

  &.line-country {
    border-color: rgba(193, 164, 101, 0.6);
  }

  &.line-author {
    border-color: rgba(167, 139, 250, 0.6);
  }

  &.line-topic {
    border-top-style: dashed;
    border-color: rgba(59, 130, 246, 0.6);
  }
}
</style>