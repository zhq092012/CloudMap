const HEADING_RE = /^#{1,4}\s/
const OVERVIEW_HEADING_RE = /^#{1,4}\s+.*全局总览/

/**
 * 从简报 Markdown 正文中提取「全局总览」小节：
 * 1. 找首个匹配 /^#{1,4}\s+.*全局总览/ 的标题行；
 * 2. 取标题之后直到下一个 /^#{1,4}\s/ 标题行(或文件末尾)的内容；
 * 3. 无该标题 → 取第一个非空、非标题、非 "---"、且不在标题之后的段落(到空行为止)；
 * 4. 均无 → 返回空字符串。
 */
export function extractOverview(content: string): string {
  if (!content) return ""
  const lines = content.split(/\r?\n/)
  const overviewHeadingIdx = lines.findIndex((l) => OVERVIEW_HEADING_RE.test(l))
  if (overviewHeadingIdx >= 0) {
    const block: string[] = []
    for (let i = overviewHeadingIdx + 1; i < lines.length; i++) {
      if (HEADING_RE.test(lines[i])) break
      block.push(lines[i])
    }
    return block.join("\n").replace(/\n{3,}/g, "\n\n").trim()
  }
  const isHeading = (l: string) => HEADING_RE.test(l)
  const isHr = (l: string) => l.trim() === "---"
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.trim() === "" || isHeading(line) || isHr(line)) continue
    const prev = lines[i - 1]
    if (prev && prev.trim() !== "" && isHeading(prev)) continue
    const block = [line]
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].trim() === "" || isHeading(lines[j]) || isHr(lines[j])) break
      block.push(lines[j])
    }
    return block.join(" ").trim()
  }
  return ""
}
