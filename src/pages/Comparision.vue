<script setup lang="ts"></script>

<template>
  <!-- 左中右布局 ，左侧panel，中间内容，右侧panel -->
  <div class="flex h-full">
    <ComparisonLeftPanel />
    <ComparisionMain class="flex-1" />
    <ComparisonRightPanel />
  </div>
</template>
