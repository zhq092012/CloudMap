export interface DetailSection {
  title: string
  content: string
}

const KNOWN_SECTION_TITLES = new Set<string>([
  "任务目标",
  "力量编成",
  "行动路线",
  "武器效能",
  "侦察情报",
  "侦察需求",
  "情报缺口",
  "指挥时间",
  "规则限制",
  "风险应急",
  "指挥关系",
  "目标",
  "方向",
  "性质",
  "装备校验",
  "风险标记",
  "时空冲突检测结果",
  "判据逻辑校验报告",
  "风险评估报告",
  "综合评分依据",
  "情报核验",
  "证据链",
  "方案详情",
  "方案摘要",
])

const FALLBACK_SECTION_TITLE = "详情"

const GENERIC_HEADER_RE = /^([\u4e00-\u9fffA-Za-z0-9（）()]{1,12})[：:](.*)$/

/*
 * 兼容紧凑单行格式的 details：
 * 旧格式每个小节各占一行（"目标：...\n方向：..."），可直接按行识别标题；
 * 新格式会把多小节挤在一行（"目标：...；方向：...；性质：...。装备校验：...。风险标记：..."），
 * 导致只有行首的"目标"被识别、其余小节全部并入其内容。
 * 这里在「分隔符 + 已知小节标题 + 冒号」出现处（如 "；方向：" / "。风险标记："）拆行，
 * 两种格式即可统一按小节标题拆分为多个折叠卡。
 */
const INLINE_SECTION_SPLIT_RE = (() => {
  const alt = [...KNOWN_SECTION_TITLES]
    .sort((a, b) => b.length - a.length)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|")
  return new RegExp(`([;；。.、])\\s*((?:${alt})(?:（推断）|\\(inferred\\))?)\\s*([：:])`, "g")
})()

function splitInlineSections(text: string): string {
  return text.replace(INLINE_SECTION_SPLIT_RE, "\n$2$3")
}

function firstColonIndex(line: string): number {
  const fullWidth = line.indexOf("：")
  const ascii = line.indexOf(":")
  if (fullWidth === -1) return ascii
  if (ascii === -1) return fullWidth
  return Math.min(fullWidth, ascii)
}

function splitKey(line: string): { key: string; rest: string } | null {
  const idx = firstColonIndex(line)
  if (idx <= 0) return null
  const key = line.slice(0, idx).trim()
  const rest = line.slice(idx + 1).trim()
  if (!key) return null
  return { key, rest }
}

export function stripInferredSuffix(label: string): string {
  return label.replace(/（推断）$/, "").replace(/\(推断\)$/, "").trim()
}

export function parseDetailSections(detail: unknown): DetailSection[] {
  const normalized = typeof detail === "string" ? detail.replace(/\r\n?/g, "\n") : ""
  if (!normalized.trim()) return []

  const text = splitInlineSections(normalized)
  const lines = text.split("\n")

  const isKnownHeader = (line: string): boolean => {
    const kv = splitKey(line)
    return !!kv && KNOWN_SECTION_TITLES.has(stripInferredSuffix(kv.key))
  }

  const useKnownOnly = lines.some((l) => {
    const t = l.trim()
    return t.length > 0 && isKnownHeader(t)
  })

  const isGenericHeader = (line: string): boolean => {
    const m = line.match(GENERIC_HEADER_RE)
    if (!m) return false
    return /^[\u4e00-\u9fff]/.test(m[1])
  }

  const isHeader = (line: string): boolean => (useKnownOnly ? isKnownHeader : isGenericHeader)(line)

  const sections: DetailSection[] = []
  let current: DetailSection | null = null
  const preamble: string[] = []
  let headerFound = false

  const appendLine = (line: string) => {
    if (current) {
      current.content += (current.content ? "\n" : "") + line
    } else {
      preamble.push(line)
    }
  }

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) {
      appendLine("")
      continue
    }
    if (isHeader(line)) {
      headerFound = true
      const kv = splitKey(line)
      if (kv) {
        if (preamble.length > 0) {
          sections.push({ title: FALLBACK_SECTION_TITLE, content: preamble.join("\n") })
          preamble.length = 0
        }
        current = { title: stripInferredSuffix(kv.key), content: kv.rest }
        sections.push(current)
      }
    } else {
      appendLine(line)
    }
  }

  if (!headerFound) return []

  if (preamble.length > 0) {
    sections.push({ title: FALLBACK_SECTION_TITLE, content: preamble.join("\n") })
  }

  return sections
}
