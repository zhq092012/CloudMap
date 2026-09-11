<script setup lang="ts">
import { ref, computed } from 'vue';
import * as api from '../api';
import type {
  MarketplaceSummary,
  MarketplaceType,
  MarketplaceWriteRequest,
  TestConnectionResult,
} from '../types';

interface FieldDef {
  key: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  secret?: boolean;
  hint?: string;
}

const TYPE_FIELDS: Record<MarketplaceType, FieldDef[]> = {
  git: [
    {
      key: 'remoteUrl',
      label: 'Remote URL',
      placeholder: 'https://github.com/org/skills.git',
      required: true,
      hint: 'HTTPS or SSH; auth uses your system git credentials.',
    },
    { key: 'branch', label: 'Branch', placeholder: 'main (optional)' },
    {
      key: 'skillsRoot',
      label: 'Skills root',
      placeholder: 'skills (default)',
      hint: 'Subdirectory inside the repo that contains skill folders. Leave blank to use "skills/" (or repo root if absent).',
    },
  ],
  nacos: [
    { key: 'serverAddr', label: 'Server', placeholder: 'nacos.example.com:8848', required: true },
    {
      key: 'namespaceId',
      label: 'Namespace',
      placeholder: 'public (optional)',
      hint: 'Defaults to "public" if omitted.',
    },
    { key: 'username', label: 'Username', placeholder: 'optional' },
    { key: 'password', label: 'Password', placeholder: 'optional', secret: true },
    { key: 'accessKey', label: 'Access Key', placeholder: 'optional' },
    { key: 'secretKey', label: 'Secret Key', placeholder: 'optional', secret: true },
  ],
};

const props = defineProps<{
  mode: 'create' | 'edit';
  initial?: MarketplaceSummary;
}>();
const emit = defineEmits<{
  (e: 'saved', req: MarketplaceWriteRequest): void;
  (e: 'close'): void;
}>();

const isEdit = computed(() => props.mode === 'edit');
const id = ref(props.initial?.id ?? '');
const type = ref<MarketplaceType>(((props.initial?.type as MarketplaceType) ?? 'git') as MarketplaceType);

const initialProps = computed<Record<string, string>>(() => {
  const out: Record<string, string> = {};
  if (props.initial?.properties) {
    for (const [k, v] of Object.entries(props.initial.properties)) {
      out[k] = stringOrEmpty(v);
    }
  }
  return out;
});
const props_ = ref<Record<string, string>>(initialProps.value);

const saving = ref(false);
const testing = ref(false);
const testResult = ref<TestConnectionResult | null>(null);
const error = ref<string | null>(null);

const fields = computed(() => TYPE_FIELDS[type.value]);

function stringOrEmpty(v: unknown): string {
  return typeof v === 'string' ? v : v == null ? '' : String(v);
}

function buildRequest(): MarketplaceWriteRequest {
  const trimmedProps: Record<string, unknown> = {};
  for (const f of fields.value) {
    const raw = props_.value[f.key];
    if (raw == null) continue;
    const trimmed = raw.trim();
    if (trimmed !== '') trimmedProps[f.key] = trimmed;
  }
  return { id: id.value.trim(), type: type.value, properties: trimmedProps };
}

function validate(req: MarketplaceWriteRequest): string | null {
  if (!req.id) return 'ID is required.';
  if (!/^[A-Za-z0-9._-]+$/.test(req.id)) {
    return 'ID may only contain letters, digits, dots, underscores, and hyphens.';
  }
  for (const f of fields.value) {
    if (f.required && !req.properties[f.key]) {
      return `${f.label} is required.`;
    }
  }
  return null;
}

async function handleTest() {
  error.value = null;
  testResult.value = null;
  const req = buildRequest();
  const v = validate(req);
  if (v) {
    error.value = v;
    return;
  }
  testing.value = true;
  try {
    const r = isEdit.value ? await api.testMarketplaceExisting(req.id) : await api.testMarketplaceTransient(req);
    testResult.value = r;
  } catch (e) {
    testResult.value = { ok: false, message: (e as Error).message };
  } finally {
    testing.value = false;
  }
}

async function handleSave() {
  error.value = null;
  const req = buildRequest();
  const v = validate(req);
  if (v) {
    error.value = v;
    return;
  }
  saving.value = true;
  try {
    if (isEdit.value) {
      await api.updateMarketplace(req.id, req);
    } else {
      await api.createMarketplace(req);
    }
    emit('saved', req);
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60" @click="emit('close')">
    <div
      class="bg-[#0f1927] border border-[#1e324f] rounded-xl p-6 w-[90%] max-w-[560px] max-h-[85vh] overflow-y-auto shadow-2xl"
      @click.stop
    >
      <h3 class="m-0 mb-4 text-[1.05rem] font-bold text-white">
        {{ isEdit ? 'Edit marketplace' : 'Add marketplace' }}
      </h3>

      <div class="flex flex-col gap-3.5">
        <div>
          <label class="block mb-1 text-[0.78rem] font-semibold uppercase tracking-wider text-[#708aa6]"
            >ID</label
          >
          <input
            type="text"
            v-model="id"
            :disabled="isEdit"
            placeholder="team-skills-git"
            class="w-full px-2.5 py-2 bg-[#0b131f] border border-[#1e324f] rounded-lg text-sm text-[#a3b8cc] placeholder-[#526e8c] focus:outline-none focus:border-[#2b5384] disabled:bg-[#0b131f]/50 disabled:text-[#526e8c]"
          />
          <div v-if="!isEdit" class="text-[0.75rem] text-[#526e8c] mt-1">
            Stable identifier. Cannot be changed after creation.
          </div>
        </div>

        <div>
          <label class="block mb-1 text-[0.78rem] font-semibold uppercase tracking-wider text-[#708aa6]"
            >Type</label
          >
          <select
            v-model="type"
            :disabled="isEdit"
            class="w-full px-2.5 py-2 bg-[#0b131f] border border-[#1e324f] rounded-lg text-sm text-[#a3b8cc] focus:outline-none focus:border-[#2b5384] disabled:bg-[#0b131f]/50 disabled:text-[#526e8c]"
          >
            <option value="git">git</option>
            <option value="nacos">nacos</option>
          </select>
        </div>

        <div v-for="f in fields" :key="f.key">
          <label class="block mb-1 text-[0.78rem] font-semibold uppercase tracking-wider text-[#708aa6]">
            {{ f.label }}<span v-if="f.required" class="text-[#ef4444] ml-1">*</span>
          </label>
          <input
            :type="f.secret ? 'password' : 'text'"
            v-model="props_[f.key]"
            :placeholder="f.placeholder"
            autocomplete="off"
            class="w-full px-2.5 py-2 bg-[#0b131f] border border-[#1e324f] rounded-lg text-sm text-[#a3b8cc] placeholder-[#526e8c] focus:outline-none focus:border-[#2b5384]"
          />
          <div v-if="f.hint" class="text-[0.75rem] text-[#526e8c] mt-1">{{ f.hint }}</div>
          <div
            v-if="f.secret && isEdit"
            class="text-[0.75rem] text-[#526e8c] mt-1"
          >
            Leave blank to keep the previously saved value (current value is never shown).
          </div>
        </div>

        <div
          v-if="testResult"
          class="p-2.5 rounded-lg text-[0.85rem]"
          :class="
            testResult.ok
              ? 'bg-[#00ffc4]/10 border border-[#00ffc4]/40 text-[#00ffc4]'
              : 'bg-[#ef4444]/10 border border-[#ef4444]/40 text-[#ef4444]'
          "
        >
          {{ testResult.ok ? '✓' : '✗' }}
          {{ testResult.message ?? (testResult.ok ? 'OK' : 'Failed') }}
          <span v-if="testResult.ok && typeof testResult.skillCount === 'number'" class="ml-1.5">
            ({{ testResult.skillCount }} skills)
          </span>
        </div>

        <div
          v-if="error"
          class="p-2.5 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/40 text-[#ef4444] text-[0.85rem]"
        >
          {{ error }}
        </div>
      </div>

      <div class="flex justify-between items-center mt-5 gap-2">
        <button
          :disabled="testing || saving"
          class="px-4 py-2 rounded-lg border border-[#1e324f] bg-[#0b131f] text-[#a3b8cc] text-[0.88rem] font-medium cursor-pointer hover:border-[#2b5384] disabled:opacity-50"
          @click="handleTest"
        >
          {{ testing ? 'Testing…' : 'Test connection' }}
        </button>
        <div class="flex gap-2">
          <button
            :disabled="saving"
            class="px-4 py-2 rounded-lg border border-[#1e324f] bg-[#0b131f] text-[#a3b8cc] text-[0.88rem] font-medium cursor-pointer hover:border-[#2b5384] disabled:opacity-50"
            @click="emit('close')"
          >
            Cancel
          </button>
          <button
            :disabled="saving || testing"
            class="px-4 py-2 rounded-lg border border-[#3b82f6] bg-[#3b82f6] text-white text-[0.88rem] font-semibold cursor-pointer hover:bg-[#2b5384] disabled:opacity-60"
            @click="handleSave"
          >
            {{ saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
