// 智能任务看板两页共享的展示格式化函数

export function fmtTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

export function fmtDuration(ms: number | null | undefined): string {
  if (ms == null) return '—'
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${sec}s`
  return `${sec}s`
}

export function phaseLabel(p: number | null | undefined): string {
  if (p == null) return '—'
  const map: Record<number, string> = {
    1: '意图研判',
    2: '蓝方方案生成',
    3: '红方方案生成',
    4: '方案评估',
  }
  return map[p] ?? `阶段${p}`
}

export function statusBadge(s: string | null | undefined): { label: string; cls: string } {
  const map: Record<string, { label: string; cls: string }> = {
    RUNNING: { label: '运行中', cls: 'bg-[#0b1e2e] text-[#7fd4ff] border border-[#1d3a57]' },
    COMPLETED: { label: '已完成', cls: 'bg-[#0b2e1f] text-[#00ffc4] border border-[#1d5a3f]' },
    FAILED: { label: '失败', cls: 'bg-[#2e0b0b] text-[#ef4444] border border-[#5a1f1f]' },
    CANCELLED: { label: '已取消', cls: 'bg-[#0f1927] text-[#708aa6] border border-[#1e324f]' },
  }
  return (s && map[s]) || { label: s || '—', cls: 'bg-[#0f1927] text-[#708aa6] border border-[#1e324f]' }
}

export function stepTypeLabel(t: string | null | undefined): string {
  if (t === 'USER_INVOCATION') return '用户调用'
  if (t === 'SUBAGENT') return '子智能体'
  return t || '—'
}

export function resultTypeLabel(t: string | null | undefined): string {
  if (t === 'INTENT') return '意图研判'
  if (t === 'BLUE_PLAN') return '蓝方方案'
  if (t === 'RED_PLAN') return '红方方案'
  if (t === 'EVALUATION') return '方案评估'
  if (t === 'ORIGIN') return '本源事件'
  return t || '—'
}

export function prettyJson(json: string | null | undefined): string {
  if (!json) return '（空）'
  try {
    return JSON.stringify(JSON.parse(json), null, 2)
  } catch {
    return json
  }
}
