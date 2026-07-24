/**
 * 组装 shader 片段。
 *
 * 该函数是纯字符串拼接工具，和 Vite 的 `?raw` 导入兼容：
 * 你可以在构建时导入多个字符串片段，再按顺序组合成最终 shader。
 */
export function composeShaderChunks(chunks: Array<string | undefined | null>): string {
  return chunks.filter((chunk): chunk is string => typeof chunk === "string" && chunk.trim().length > 0).join("\n");
}
