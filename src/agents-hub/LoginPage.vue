<template>
  <div class="hub-login">
    <div class="hub-login-glow"></div>

    <form class="hub-login-card" @submit.prevent="handleSubmit">
      <div class="hub-login-brand">
        <span class="hub-login-logo">⚙</span>
        <div class="hub-login-brand-text">
          <div class="hub-login-title">智能体中心</div>
          <div class="hub-login-sub">登录以继续使用 AgentScope</div>
        </div>
      </div>

      <div class="hub-login-divider"></div>

      <label class="hub-login-field">
        <span class="hub-login-label">用户名</span>
        <input v-model="username" type="text" autofocus autocomplete="username"
          placeholder="请输入用户名" class="hub-login-input" />
      </label>

      <label class="hub-login-field">
        <span class="hub-login-label">密码</span>
        <input v-model="password" type="password" autocomplete="current-password"
          placeholder="请输入密码" class="hub-login-input" />
      </label>

      <div v-if="error" class="hub-login-error">{{ error }}</div>

      <button type="submit" :disabled="loading" class="hub-login-submit">
        {{ loading ? '登录中…' : '登 录' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAgentHubStore } from './store';

const store = useAgentHubStore();
const username = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

async function handleSubmit() {
  error.value = '';
  loading.value = true;
  try {
    await store.login(username.value, password.value);
  } catch {
    error.value = '用户名或密码错误';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped lang="scss">
@use "./styles/tokens" as *;

.hub-login {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 24px;
  overflow: hidden;
  background:
    repeating-linear-gradient(0deg, rgba(45, 58, 77, 0.12) 0 1px, transparent 1px 52px),
    repeating-linear-gradient(90deg, rgba(45, 58, 77, 0.12) 0 1px, transparent 1px 52px),
    $bg-root;
}

.hub-login-glow {
  position: absolute;
  top: -140px;
  left: -100px;
  width: 420px;
  height: 420px;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%);
}

.hub-login-card {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 404px;
  max-width: 100%;
  padding: 30px 32px 26px;
  border: 1px solid $border;
  border-radius: 12px;
  background: rgba(17, 24, 39, 0.86);
  box-shadow:
    0 28px 80px rgba(0, 0, 0, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(10px);
}

.hub-login-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hub-login-logo {
  flex: none;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-lg;
  border: 1px solid $accent-line;
  color: #fff;
  font-size: 17px;
  line-height: 1;
  @include accent-gradient;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.32);
}

.hub-login-brand-text {
  min-width: 0;
}

.hub-login-title {
  font-size: 16px;
  font-weight: 700;
  line-height: 1.35;
  letter-spacing: -0.2px;
  color: $text;
}

.hub-login-sub {
  margin-top: 2px;
  font-size: 12px;
  line-height: 1.5;
  color: $text-3;
}

.hub-login-divider {
  height: 1px;
  margin: 2px 0 4px;
  background: linear-gradient(90deg, $accent-line 0%, rgba(45, 58, 77, 0.6) 45%, transparent 100%);
}

.hub-login-field {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.hub-login-label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: $text-2;
}

.hub-login-input {
  width: 100%;
  box-sizing: border-box;
  height: 38px;
  padding: 0 12px;
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

.hub-login-error {
  padding: 8px 10px;
  border: 1px solid $red-line;
  border-radius: $radius-md;
  background: $red-soft;
  font-size: 12px;
  line-height: 1.6;
  color: #fca5a5;
}

.hub-login-submit {
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

  &:disabled {
    opacity: 0.55;
    cursor: default;
    box-shadow: none;
  }
}
</style>
