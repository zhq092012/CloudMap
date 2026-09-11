<template>
  <div
    class="min-h-screen flex items-center justify-center p-6"
    style="background: radial-gradient(circle at top left, rgba(0,243,255,0.10), transparent 30%), #060c14;"
  >
    <form
      class="w-[400px] flex flex-col gap-5 p-9 rounded-xl border border-[#1e324f] bg-[#0b131f]/80 shadow-2xl"
      style="box-shadow: 0 24px 80px rgba(0,0,0,0.5);"
      @submit.prevent="handleSubmit"
    >
      <div class="flex items-center justify-center gap-3 mb-1">
        <img src="/favicon.svg" alt="Logo" class="w-10 h-10" />
      </div>
      <div class="text-center">
        <div class="text-xl font-bold text-white tracking-tight">{{ siteName }}</div>
        <div class="text-sm text-[#708aa6] mt-1">登录以进入系统</div>
      </div>

      <div>
        <label class="block text-[#a3b8cc] text-sm font-medium mb-1.5">用户名</label>
        <input
          v-model="username"
          type="text"
          autofocus
          autocomplete="username"
          placeholder="请输入用户名"
          class="w-full bg-[#0c1624] border border-[#203554] rounded-lg px-3.5 py-2.5 text-white placeholder-[#526e8c] focus:outline-none focus:border-[#00f3ff]/60"
        />
      </div>
      <div>
        <label class="block text-[#a3b8cc] text-sm font-medium mb-1.5">密码</label>
        <input
          v-model="password"
          type="password"
          autocomplete="current-password"
          placeholder="请输入密码"
          class="w-full bg-[#0c1624] border border-[#203554] rounded-lg px-3.5 py-2.5 text-white placeholder-[#526e8c] focus:outline-none focus:border-[#00f3ff]/60"
        />
      </div>

      <div v-if="error" class="text-[#ef4444] text-sm text-center">{{ error }}</div>

      <button
        type="submit"
        :disabled="loading"
        class="w-full py-2.5 rounded-lg font-semibold text-white transition-all disabled:opacity-60"
        style="background: linear-gradient(135deg,#00f3ff 0%,#3b82f6 100%); box-shadow: 0 2px 6px rgba(0,243,255,0.35), inset 0 1px 0 rgba(255,255,255,0.18);"
      >
        {{ loading ? "登录中…" : "登录" }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAgentHubStore } from "@/agents-hub/store";

const store = useAgentHubStore();
const route = useRoute();
const router = useRouter();

const siteName = computed(
  () => import.meta.env.VITE_SITE_NAME || "云图威胁分析与态势研判系统",
);
const username = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);

async function handleSubmit() {
  error.value = "";
  loading.value = true;
  try {
    await store.login(username.value, password.value);
    const redirect = typeof route.query.redirect === "string" ? route.query.redirect : "";
    router.replace(redirect || "/");
  } catch {
    error.value = "用户名或密码错误";
  } finally {
    loading.value = false;
  }
}
</script>
