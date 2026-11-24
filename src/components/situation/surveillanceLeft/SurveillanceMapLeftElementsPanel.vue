<!-- 作战要素 -->
<template>
  <div class="layers">
    <div class="category-row">
      <!-- 设施分类 -->
      <div v-for="category in facilityTypeCategories" :key="category.id" class="category-label"
        :class="{ active: selectedCategory === category.id }" @click="selectedCategory = category.id">
        <span class="category-count">{{ categoryCount[category.id] || 0 }}</span>
        <span>{{ category.label }}</span>
      </div>
    </div>

    <!-- 设施类型 -->
    <div v-for="type in facilityTypes" :key="type.id" class="layer-item">
      <div class="layer-info">
        <span class="layer-icon" v-html="type.svgIcon"></span>
        <span class="layer-type-name">{{ FACILITY_TYPE_LABELS_ZH[type.id] || type.label }}</span>
      </div>
      <div class="layer-label">
        <span class="layer-count">{{ facilityCountByType[type.id] || 0 }}</span>
        <el-switch v-model="facilityVisibility[type.id]" active-color="#3b82f6" inactive-color="#9e9e9e" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useHomeStore } from "@/store/modules/homeStore";
import { FACILITY_TYPES, FACILITY_TYPE_LABELS_ZH } from "@/assets/facilities.js";

const homeStore = useHomeStore();
const facilityVisibility = homeStore.facilityTypeVisibility;
const facilities = computed(() => homeStore.getFacilities);

const facilityTypeCategories = [
  {
    id: "all",
    label: "全部",
    typeIds: FACILITY_TYPES.map((type) => type.id),
  },
  {
    id: "military",
    label: "军事设施",
    typeIds: ["military", "military_airport"],
  },
  {
    id: "civil",
    label: "民用设施",
    typeIds: ["satellite", "embassy", "data_center", "airport", "company", "port", "other"],
  },
  {
    id: "energy",
    label: "能源设施",
    typeIds: ["oil_gas", "nuclear", "pipeline", "dam"],
  },
];

const selectedCategory = ref("all");

const facilityTypes = computed(() => {
  const category = facilityTypeCategories.find((item) => item.id === selectedCategory.value);
  const validTypeIds = category ? category.typeIds : FACILITY_TYPES.map((type) => type.id);

  return FACILITY_TYPES.filter((type) => {
    if (!validTypeIds.includes(type.id)) return false;
    if (type.id === "other") {
      return facilities.value.some((facility) => !facility.type);
    }
    return facilities.value.some((facility) => facility.type === type.id);
  });
});

watch(
  selectedCategory,
  (categoryId) => {
    const category = facilityTypeCategories.find((item) => item.id === categoryId);
    const visibleTypeIds = category ? category.typeIds : FACILITY_TYPES.map((type) => type.id);

    Object.keys(facilityVisibility).forEach((typeId) => {
      facilityVisibility[typeId] = visibleTypeIds.includes(typeId);
    });
  },
  { immediate: true },
);

const facilityCountByType = computed(() => {
  const normalizeType = (type: string | null | undefined) => type || "other";
  return facilities.value.reduce<Record<string, number>>((acc, facility) => {
    const t = normalizeType(facility.type);
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});
});

const categoryCount = computed(() =>
  facilityTypeCategories.reduce<Record<string, number>>((acc, category) => {
    acc[category.id] = category.typeIds.reduce<number>(
      (sum, typeId) => sum + (facilityCountByType.value[typeId] || 0),
      0,
    );
    return acc;
  }, {}),
);
</script>

<style scoped lang="scss">
@use "./surveillanceLeftTokens.scss" as *;

.layers {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  overflow-y: auto;
  padding-right: 4px;
}

.category-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding-bottom: 10px;
  border-bottom: 1px solid $border;
}

.category-label {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 5px 0;
  min-height: 40px;
  font-size: 12px;
  color: $text-2;
  background: $panel;
  border: 1px solid $border;
  border-radius: $radius-md;
  cursor: pointer;
  transition: background $ease, border-color $ease, color $ease;

  &:hover {
    border-color: $border-strong;
    color: $text;
  }

  &.active {
    color: $accent-text;
    background: rgba($accent, 0.16);
    border-color: rgba($accent, 0.45);

    .category-count {
      color: $accent-text;
    }
  }
}

.category-count {
  color: $text;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}

.layer-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 6px 8px;
  border: 1px solid $border;
  border-radius: $radius-md;
  background: $panel;
  font-size: 12.5px;
  color: $text;
  transition: border-color $ease;

  &:hover {
    border-color: $border-strong;
  }
}

.layer-info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.layer-type-name {
  font-size: 13px;
}

.layer-icon {
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  :deep(svg) {
    width: 100%;
    height: 100%;
  }
}

.layer-label {
  display: flex;
  align-items: center;
  gap: 20px;
}

.layer-count {
  color: $text-2;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
</style>