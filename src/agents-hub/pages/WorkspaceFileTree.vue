<template>
  <div class="w-[264px] flex-shrink-0 border-r border-[#2d3a4d] bg-[#111827] flex flex-col min-h-0">
    <div
      class="px-3.5 py-3.5 border-b border-[#2d3a4d] flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-wider text-[#9ca3af]">
      <span class="flex-1">Files</span>
      <button type="button" @click="emit('refresh')"
        class="bg-[#1a2332] border border-[#2d3a4d] text-[#cbd5e1] rounded-md px-2 py-1 hover:bg-[#253141] text-[11.5px] leading-none">
        ↻ refresh
      </button>
    </div>

    <div v-if="hiddenCount > 0"
      class="px-3.5 py-1.5 border-b border-[#2d3a4d] flex items-center justify-between text-[11.5px] text-[#9ca3af]">
      <span>{{ showHidden ? `${hiddenCount} hidden shown` : `${hiddenCount} hidden` }}</span>
      <button type="button" @click="showHidden = !showHidden"
        class="text-[#93c5fd] hover:underline">{{ showHidden ? 'hide' : 'show all' }}</button>
    </div>

    <div class="flex-1 overflow-y-auto p-1.5">
      <div v-if="visibleNodes.length === 0" class="p-3.5 text-[#9ca3af] text-[12.5px]">Empty workspace.</div>
      <NodeView v-for="n in visibleNodes" :key="n.path" :node="n" :depth="0" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineComponent, h, watch } from 'vue';
import type { PropType } from 'vue';
import type { FileNode } from '../types';

const props = defineProps<{
  nodes: FileNode[];
  selectedPath?: string | null;
  refreshKey?: number;
}>();
const emit = defineEmits<{
  (e: 'file-selected', path: string): void;
  (e: 'refresh'): void;
}>();

const expanded = ref<Set<string>>(new Set());
const showHidden = ref(false);

// Hide internal bookkeeping (dotfiles/dotdirs and install-meta sidecar) by default.
const INTERNAL_BASENAMES = new Set(['_install.meta.json']);
function isHiddenName(name: string): boolean {
  return name.startsWith('.') || INTERNAL_BASENAMES.has(name);
}
function filterTree(nodes: FileNode[]): FileNode[] {
  const out: FileNode[] = [];
  for (const n of nodes) {
    if (isHiddenName(n.name)) continue;
    if (n.type === 'dir' && n.children) out.push({ ...n, children: filterTree(n.children) });
    else out.push(n);
  }
  return out;
}
function countHidden(nodes: FileNode[]): number {
  let c = 0;
  for (const n of nodes) {
    if (isHiddenName(n.name)) {
      c += 1;
      if (n.type === 'dir' && n.children) c += countHidden(n.children);
    } else if (n.type === 'dir' && n.children) {
      c += countHidden(n.children);
    }
  }
  return c;
}

const visibleNodes = computed(() => (showHidden.value ? props.nodes : filterTree(props.nodes)));
const hiddenCount = computed(() => countHidden(props.nodes));

function toggle(path: string) {
  const next = new Set(expanded.value);
  if (next.has(path)) next.delete(path);
  else next.add(path);
  expanded.value = next;
}

// Recursive node renderer. Defined with h() so it needs no runtime template compiler.
const NodeView: ReturnType<typeof defineComponent> = defineComponent({
  name: 'NodeView',
  props: {
    node: { type: Object as PropType<FileNode>, required: true },
    depth: { type: Number, default: 0 },
  },
  setup(np) {
    const isDir = computed(() => np.node.type === 'dir');
    return () => {
      const open = expanded.value.has(np.node.path);
      const active = props.selectedPath === np.node.path;
      const dimmed = isHiddenName(np.node.name);
      const onClick = (e: MouseEvent) => {
        e.stopPropagation();
        if (isDir.value) toggle(np.node.path);
        else emit('file-selected', np.node.path);
      };
      const row = h(
        'div',
        {
          class: [
            'flex items-center gap-2 px-2.5 py-1.5 rounded-md cursor-pointer select-none text-[#cbd5e1]',
            active ? 'bg-[#253141] text-white' : 'hover:bg-[#1a2332]',
            dimmed ? 'opacity-60 italic' : '',
          ],
          style: { paddingLeft: `${8 + np.depth * 12}px` },
          onClick,
          title: np.node.path,
        },
        [
          h('span', {
            class: 'w-3 flex-shrink-0 text-[10px] leading-none text-[#6b7280]',
          }, isDir.value ? (open ? '▾' : '▸') : ''),
          h(
            'svg',
            {
              width: 13,
              height: 13,
              viewBox: '0 0 24 24',
              fill: 'none',
              stroke: 'currentColor',
              'stroke-width': 1.7,
              'stroke-linecap': 'round',
              'stroke-linejoin': 'round',
              style: {
                flex: 'none',
                color: isDir.value ? '#93c5fd' : '#9ca3af',
                opacity: dimmed ? 0.55 : 1,
              },
              innerHTML: isDir.value
                ? '<path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h4l2 2.5h7A1.5 1.5 0 0 1 19 10v7.5A1.5 1.5 0 0 1 17.5 19h-13A1.5 1.5 0 0 1 3 17.5z" />'
                : '<path d="M13.5 3.5H7A1.5 1.5 0 0 0 5.5 5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8.5z" /><path d="M13.5 3.5v5h5" />',
            },
          ),
          h('span', { class: 'truncate' }, np.node.name),
        ],
      );
      const kids =
        isDir.value && open && np.node.children
          ? np.node.children.map((c) => h(NodeView, { key: c.path, node: c, depth: np.depth + 1 }))
          : [];
      return h('div', null, [row, ...kids]);
    };
  },
});

// Expand all top-level dirs by default on first load.
watch(
  () => props.nodes,
  (list) => {
    if (expanded.value.size === 0) {
      const next = new Set(expanded.value);
      for (const n of list) if (n.type === 'dir') next.add(n.path);
      expanded.value = next;
    }
  },
  { immediate: true },
);
</script>
