<template>
  <div class="login-page">
    <div class="login-glow login-glow--a"></div>
    <div class="login-glow login-glow--b"></div>

    <form class="login-card" @submit.prevent="handleSubmit">
      <div class="login-brand">
        <img src="/favicon.svg" alt="Logo" class="login-logo" />
        <div class="login-brand-text">
          <div class="login-title">{{ siteName }}</div>
          <div class="login-sub">登录以进入系统</div>
        </div>
      </div>

      <div class="login-divider"></div>

      <label class="login-field">
        <span class="login-label">用户名</span>
        <span class="login-input-wrap">
          <svg class="login-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="8" r="3.4" />
            <path d="M5 20c0-3.5 3.2-5.8 7-5.8s7 2.3 7 5.8" />
          </svg>
          <input
            v-model="username"
            type="text"
            autofocus
            autocomplete="username"
            placeholder="请输入用户名"
            class="login-input"
          />
        </span>
      </label>

      <label class="login-field">
        <span class="login-label">密码</span>
        <span class="login-input-wrap">
          <svg class="login-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
            <path d="M8.2 10.5V8a3.8 3.8 0 0 1 7.6 0v2.5" />
          </svg>
          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            placeholder="请输入密码"
            class="login-input"
          />
        </span>
      </label>

      <div v-if="error" class="login-error">{{ error }}</div>

      <button type="submit" :disabled="loading" class="login-submit">
        {{ loading ? "登录中…" : "登 录" }}
      </button>

      <div class="login-foot">安全接入 · 传输加密 · 操作留痕</div>
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

<style scoped lang="scss">
@use "../agents-hub/styles/tokens" as *;

.login-page {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(10, 14, 23, 0) 55%, rgba(10, 14, 23, 0.9) 100%),
    repeating-linear-gradient(0deg, rgba(45, 58, 77, 0.13) 0 1px, transparent 1px 52px),
    repeating-linear-gradient(90deg, rgba(45, 58, 77, 0.13) 0 1px, transparent 1px 52px),
    $bg-root;
}

/* 两团柔光，纯装饰 */
.login-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;

  &--a {
    top: -160px;
    left: -120px;
    width: 460px;
    height: 460px;
    background: radial-gradient(circle, rgba(59, 130, 246, 0.22) 0%, transparent 70%);
  }

  &--b {
    right: -140px;
    bottom: -180px;
    width: 520px;
    height: 520px;
    background: radial-gradient(circle, rgba(6, 182, 212, 0.14) 0%, transparent 70%);
  }
}

.login-card {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 404px;
  max-width: 100%;
  padding: 32px 34px 26px;
  border: 1px solid $border;
  border-radius: 12px;
  background: rgba(17, 24, 39, 0.86);
  box-shadow:
    0 28px 80px rgba(0, 0, 0, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(10px);
}

/* ---- 品牌 ---- */
.login-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.login-logo {
  flex: none;
  width: 38px;
  height: 38px;
  padding: 6px;
  border-radius: $radius-lg;
  border: 1px solid $accent-line;
  background: $accent-soft;
  box-sizing: border-box;
}

.login-brand-text {
  min-width: 0;
}

.login-title {
  font-size: 16px;
  font-weight: 700;
  line-height: 1.35;
  letter-spacing: -0.2px;
  color: $text;
}

.login-sub {
  margin-top: 2px;
  font-size: 12px;
  line-height: 1.5;
  color: $text-3;
}

.login-divider {
  height: 1px;
  margin: 2px 0 4px;
  background: linear-gradient(90deg, $accent-line 0%, rgba(45, 58, 77, 0.6) 45%, transparent 100%);
}

/* ---- 表单 ---- */
.login-field {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.login-label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: $text-2;
}

.login-input-wrap {
  position: relative;
  display: block;
}

.login-input-icon {
  position: absolute;
  top: 50%;
  left: 11px;
  width: 15px;
  height: 15px;
  transform: translateY(-50%);
  color: $text-3;
  pointer-events: none;
}

.login-input {
  width: 100%;
  box-sizing: border-box;
  height: 38px;
  padding: 0 12px 0 34px;
  border: 1px solid $border;
  border-radius: $radius-md;
  background: $bg-root;
  color: $text;
  font-size: 13px;
  outline: none;
  transition: border-color $ease, box-shadow $ease, background $ease;

  &::placeholder {
    color: $text-4;
  }

  &:hover {
    border-color: $border-strong;
  }

  &:focus {
    border-color: $accent-line;
    background: rgba(10, 14, 23, 0.9);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
  }
}

.login-error {
  padding: 8px 10px;
  border: 1px solid $red-line;
  border-radius: $radius-md;
  background: $red-soft;
  font-size: 12px;
  line-height: 1.6;
  color: #fca5a5;
}

.login-submit {
  height: 40px;
  margin-top: 4px;
  border: 1px solid transparent;
  border-radius: $radius-md;
  color: #fff;
  font-size: 13.5px;
  font-weight: 600;
  letter-spacing: 0.1em;
  cursor: pointer;
  @include accent-gradient;
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.16);
  transition: box-shadow $ease, opacity $ease;

  &:hover:not(:disabled) {
    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.16);
  }

  &:active:not(:disabled) {
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.35);
  }

  &:disabled {
    opacity: 0.55;
    cursor: default;
    box-shadow: none;
  }
}

.login-foot {
  margin-top: 2px;
  text-align: center;
  font-size: 11px;
  letter-spacing: 0.04em;
  color: $text-4;
}
</style>
