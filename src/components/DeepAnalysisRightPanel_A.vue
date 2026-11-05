<template>
  <div
    class="da-panel w-[400px] shrink-0 h-full font-sans">
    <div class="da-panel-title mb-4">
      蓝方作战方案画像详情
    </div>

    <div class="flex flex-col gap-2 mb-4">
      <button
        class="da-btn da-btn--primary da-btn--block"
        @click="generateOurPlan">
        我方防御方案生成
      </button>
      <!--div class="grid grid-cols-12 gap-2">
        <button
          class="da-btn col-span-5">
          重新生成
        </button>
        <button
          class="da-btn col-span-5">
          编辑方案
        </button>
        <button
          class="da-btn da-btn--sm col-span-2">
          <el-icon>
            <More />
          </el-icon>
        </button>
      </div-->
    </div>
    <!-- 选中节点信息卡片 -->
    <div v-if="
      store.selectedNode &&
      (store.selectedNode.type === 'Attack' ||
        store.selectedNode._type === 'Attack')
    " class="border border-[#3b82f6]/50 bg-[#1a2332]/80 rounded p-3 mb-4 shadow-lg animate-fade-in">
      <div class="flex items-center gap-2 mb-2">
        <span class="w-2 h-2 rounded-full bg-[#3b82f6] shrink-0"></span>
        <span class="text-[12px] text-[#3b82f6] font-semibold tracking-wider">当前选中 · 进攻方案节点</span>
      </div>
      <div class="text-[var(--text)] font-medium text-[13px] leading-relaxed tracking-wide cursor-pointer hover:text-[var(--accent-text)]"
        title="点击查看完整方案" @click="openDetailDialog(store.selectedNode)">
        {{
          store.selectedNode.text || store.selectedNode.title || "未命名节点"
        }}
      </div>
      <div class="flex items-center gap-4 mt-2 text-[11.5px] text-gray-400">
        <span>ID:
          <span class="text-gray-300 font-mono">{{
            store.selectedNode.id
          }}</span></span>
        <span v-if="store.selectedNode.itemId">关联项:
          <span class="text-gray-300 font-mono">{{
            store.selectedNode.itemId
          }}</span></span>
      </div>
    </div>
    <div v-if="store.selectedNode.summary" class="mb-4 p-3 bg-[#0f1622]/80 border border-[#3b82f6]/50 rounded-lg">
      <div class="flex items-center gap-1.5 text-gray-400 font-semibold mb-1.5 text-xs">
        <el-icon class="text-xs">
          <Document />
        </el-icon>
        <span>分析摘要</span>
      </div>
      <div class="text-gray-200 text-xs leading-relaxed font-sans tracking-wide pl-6">
        {{ store.selectedNode.summary }}
      </div>
    </div>
    <div class="border rounded p-3 mb-4 shadow-lg" :class="[
      store.selectedNode?.deleteStatus == '1'
        ? 'border-[#f59e0b]/40 bg-[#1f150a]/90'
        : 'border-[#1d4ed8]/60 bg-[#1a2332]/90'
    ]">
      <div class="flex flex-col mb-4">
        <div class="flex items-center gap-1.5 mb-2.5">
          <span class="text-xs text-[#10b981]/90 font-medium">方案置信度</span>
          <span class="text-[#10b981] font-bold font-mono text-sm glow-green">{{ nodeConfidenceText }}</span>
        </div>
        <div class="w-full h-2.5 bg-slate-800 rounded-sm mb-4 overflow-hidden">
          <div class="h-full bg-[#10b981] rounded-sm shadow-[0_0_8px_rgba(16,185,129,0.45)]" :style="{ width: (store.selectedNode?.confidence || 0) + '%' }"></div>
        </div>
        <div class="flex items-center gap-1.5 mb-1.5">
          <span class="text-xs text-gray-400 font-medium">状态</span>
          <span :class="[
            store.selectedNode?.deleteStatus == '1'
              ? 'text-[#f59e0b] glow-text-orange'
              : 'text-[#10b981] glow-text'
          ]" class="font-bold text-[13px]">
            {{ store.selectedNode?.deleteStatus == '1' ? '已剪枝' : '活跃' }}
          </span>
        </div>
      </div>
      <!-- 如果被剪枝，展示具体剪枝理由 -->
      <div v-if="store.selectedNode?.deleteStatus == '1'"
        class="mt-4 px-3 pb-3 pt-2 bg-[#f59e0b]/5 text-xs border-t border-[#f59e0b]/20">
        <div class="text-[#f59e0b] font-semibold mb-1 flex items-center gap-1">
          <el-icon>
            <Warning />
          </el-icon>
          <span>剪枝理由：</span>
        </div>
        <div class="text-gray-300 leading-relaxed font-sans pl-4">
          {{ store.selectedNode?.deleteReason || "未提供具体剪枝理由" }}
        </div>
      </div>
    </div>

    <!--
    <div class="border border-[#2d3a4d] bg-[#1a2332]/60 rounded p-3 mb-4 flex flex-col">
      <div class="text-xs font-semibold text-gray-300 mb-2.5 flex items-center gap-1.5">
        <span>动态趋势图</span>
      </div>

      <div
        class="w-full h-[180px] bg-[#0f1622] border border-slate-800 rounded relative flex items-center justify-center overflow-hidden bg-radial-grid">
        <div
          class="absolute inset-0 opacity-20 mix-blend-screen bg-[radial-gradient(#1e3a8a_1px,transparent_1px)] [background-size:12px_12px]">
        </div>
        <div class="absolute -left-10 top-0 w-44 h-full bg-blue-600/10 blur-2xl rounded-full"></div>
        <div class="absolute -right-10 top-0 w-44 h-full bg-red-600/10 blur-2xl rounded-full"></div>

        <span class="text-[11.5px] font-mono text-slate-600 tracking-widest uppercase z-10 pointer-events-none">
          Dynamic Hex-Grid Map Display
        </span>
      </div>

      <div class="flex justify-center items-center gap-2 mt-2.5">
        <button
          class="da-btn da-btn--sm">
          <el-icon>
            <DArrowLeft />
          </el-icon>
        </button>
        <button
          class="da-btn da-btn--sm text-[var(--green)]">
          <el-icon>
            <CaretRight />
          </el-icon>
        </button>
        <button
          class="da-btn da-btn--sm">
          <el-icon>
            <DArrowRight />
          </el-icon>
        </button>
      </div>
    </div>
    -->

    <!--
    <el-collapse v-model="activeNames" class="custom-inference-accordion">
      <el-collapse-item name="target">
        <template #title>
          <div class="collapse-header-content">
            <span>任务目标（推断）</span>
          </div>
        </template>
        <div class="collapse-body-content">
          <div class="space-y-3.5 mb-4 text-xs">
            <div>
              <div class="text-gray-400 font-medium mb-1">推断的作战目的：</div>
              <div class="text-gray-200 leading-relaxed tracking-wide pl-1">
                以最快速度瘫痪伊朗霍尔木兹海峡沿岸防空体系，消除S-300系统对联军的空中威胁，为后续行动创造条件。
              </div>
            </div>

            <div>
              <div class="text-gray-400 font-medium mb-1">推断方法：</div>
              <div class="text-gray-200 leading-relaxed tracking-wide pl-1">
                基于异常目标的观测位置 +
                蓝方条令中"压制防空体系"的标准目标选择逻辑
              </div>
            </div>
          </div>

          <div class="bg-[#0f1622] border border-[#2d3a4d] rounded p-3 shadow-inner">
            <div class="flex items-center justify-between mb-2.5">
              <span class="text-xs font-semibold text-gray-300 tracking-wider">目标分层</span>
              <button
                class="da-btn da-btn--sm">
                查看完整列表
              </button>
            </div>

            <div class="overflow-y-auto pr-1 max-h-[220px] custom-table-scrollbar">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="text-[12px] text-gray-400 font-medium border-b border-slate-800">
                    <th class="pb-1.5 font-normal w-16">层级</th>
                    <th class="pb-1.5 font-normal pl-2">目标</th>
                    <th class="pb-1.5 font-normal text-center w-12">优先级</th>
                    <th class="pb-1.5 font-normal text-right w-20">毁伤要求</th>
                  </tr>
                </thead>
                <tbody class="text-[12px] divide-y divide-slate-800/40 text-gray-300">
                  <tr>
                    <td class="py-2 text-gray-400">核心目标</td>
                    <td class="py-2 pl-2 font-medium text-[#d46d5c]">
                      海峡北岸S-300火控雷达站
                    </td>
                    <td class="py-2 text-center font-mono font-bold">P0</td>
                    <td class="py-2 text-right">摧毁</td>
                  </tr>
                  <tr>
                    <td class="py-2 text-gray-400">核心目标</td>
                    <td class="py-2 pl-2 font-medium text-[#d46d5c]">
                      格什姆岛防空通信枢纽
                    </td>
                    <td class="py-2 text-center font-mono font-bold">P0</td>
                    <td class="py-2 text-right">摧毁</td>
                  </tr>
                  <tr>
                    <td class="py-2 text-gray-400">优先目标</td>
                    <td class="py-2 pl-2 font-medium text-[#d46d5c]">
                      海峡南岸S-300发射阵地
                    </td>
                    <td class="py-2 text-center font-mono font-bold">P1</td>
                    <td class="py-2 text-right">压制或摧毁</td>
                  </tr>
                  <tr>
                    <td class="py-2 text-gray-400">优先目标</td>
                    <td class="py-2 pl-2 font-medium text-[#d46d5c]">
                      沿岸火控雷达站（3处）
                    </td>
                    <td class="py-2 text-center font-mono font-bold">P1</td>
                    <td class="py-2 text-right">压制</td>
                  </tr>
                  <tr>
                    <td class="py-2 text-gray-400">扩展目标</td>
                    <td class="py-2 pl-2 font-medium text-[#d46d5c]">
                      伊斯法罕核设施防空阵地
                    </td>
                    <td class="py-2 text-center font-mono font-bold">P2</td>
                    <td class="py-2 text-right">选择性打击</td>
                  </tr>
                  <tr>
                    <td class="py-2 text-gray-400">扩展目标</td>
                    <td class="py-2 pl-2 font-medium text-[#d46d5c]">
                      备用通信中继站
                    </td>
                    <td class="py-2 text-center font-mono font-bold">P2</td>
                    <td class="py-2 text-right">干扰</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </el-collapse-item>

      <el-collapse-item name="time">
        <template #title>
          <div class="collapse-header-content">
            <span>指挥时间（推断）</span>
          </div>
        </template>
        <div class="collapse-body-content">
          <div class="mb-4 text-xs">
            <div class="text-gray-400 font-medium mb-1.5">推断方法：</div>
            <ul class="space-y-1 pl-1 text-gray-200 leading-relaxed tracking-wide">
              <li class="flex items-start">
                <span class="mr-1.5 text-gray-500">·</span>
                <span>阶段节奏：基于"史诗狂怒"战例的行动骨架</span>
              </li>
              <li class="flex items-start">
                <span class="mr-1.5 text-gray-500">·</span>
                <span>时间窗口：基于武器系统作战半径+夜间条件+异常时序反推</span>
              </li>
              <li class="flex items-start">
                <span class="mr-1.5 text-gray-500">·</span>
                <span>D日预测窗口：2026-02-21至02-23（基于当前部署节奏+历史模式）</span>
              </li>
            </ul>
          </div>

          <div class="bg-[#0f1622] border border-[#2d3a4d] rounded p-3 shadow-inner">
            <div class="flex items-center justify-between mb-2.5">
              <span class="text-xs font-semibold text-gray-300 tracking-wider">推断的阶段划分</span>
              <button
                class="da-btn da-btn--sm">
                查看完整列表
              </button>
            </div>

            <div class="overflow-y-auto pr-1 max-h-[260px] custom-table-scrollbar">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="text-[12px] text-gray-400 font-medium border-b border-slate-800">
                    <th class="pb-2 font-normal w-20">阶段</th>
                    <th class="pb-2 font-normal w-24 pl-1">时间窗口</th>
                    <th class="pb-2 font-normal pl-2">关键行动</th>
                    <th class="pb-2 font-normal text-right w-14">置信度</th>
                  </tr>
                </thead>
                <tbody class="text-[12px] divide-y divide-slate-800/40 text-gray-300">
                  <tr>
                    <td class="py-2.5 font-medium leading-tight text-gray-200">
                      阶段0<br /><span class="text-gray-400 font-normal">准备期</span>
                    </td>
                    <td class="py-2.5 pl-1 font-mono text-gray-300">
                      D-72h ~ D-24h
                    </td>
                    <td class="py-2.5 pl-2 leading-normal text-gray-300">
                      编队集结+弹药油料就位（事件1/5已提供直接证据）
                    </td>
                    <td class="py-2.5 text-right font-mono font-bold text-[#10b981] glow-green">
                      92%
                    </td>
                  </tr>
                  <tr>
                    <td class="py-2.5 font-medium leading-tight text-gray-200">
                      阶段1<br /><span class="text-gray-400 font-normal">电子压制</span>
                    </td>
                    <td class="py-2.5 pl-1 font-mono text-gray-300">
                      D日约0200-0230
                    </td>
                    <td class="py-2.5 pl-2 leading-normal text-gray-300">
                      全频段电磁压制，瘫痪S-300火控雷达
                    </td>
                    <td class="py-2.5 text-right font-mono font-bold text-[#10b981] glow-green">
                      83%
                    </td>
                  </tr>
                  <tr>
                    <td class="py-2.5 font-medium leading-tight text-gray-200">
                      阶段2<br /><span class="text-gray-400 font-normal">精确打击</span>
                    </td>
                    <td class="py-2.5 pl-1 font-mono text-gray-300">
                      D日约0230-0300
                    </td>
                    <td class="py-2.5 pl-2 leading-normal text-gray-300">
                      隐身战机突入，打击核心+优先目标
                    </td>
                    <td class="py-2.5 text-right font-mono font-bold text-[#10b981] glow-green">
                      78%
                    </td>
                  </tr>
                  <tr>
                    <td class="py-2.5 font-medium leading-tight text-gray-200">
                      阶段3<br /><span class="text-gray-400 font-normal">扩大攻击</span>
                    </td>
                    <td class="py-2.5 pl-1 font-mono text-gray-300">
                      D日约0300-0430
                    </td>
                    <td class="py-2.5 pl-2 leading-normal text-gray-300">
                      扩大打击，清除加固目标+BDA评估
                    </td>
                    <td class="py-2.5 text-right font-mono font-bold text-[#10b981] glow-green">
                      68%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </el-collapse-item>

      <el-collapse-item name="forces">
        <template #title>
          <div class="collapse-header-content">
            <span>力量编成（推断）</span>
          </div>
        </template>
        <div class="collapse-body-content">
          <div class="border border-[#2d3a4d] bg-[#1a2332] rounded overflow-hidden">
            <div @click="toggleCategory('air')"
              class="flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-[#2d3a4d] transition-colors">
              <div class="flex items-center gap-2">
                <span class="text-[var(--text)] font-semibold text-[12.5px] tracking-wide">空中力量（4组编队）</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-gray-400 text-[12px]">综合置信度:
                  <span class="text-[#10b981] font-bold font-mono glow-green ml-0.5">83%</span></span>
                <el-icon class="text-gray-400 text-xs transition-transform duration-200"
                  :class="{ 'rotate-180': !categories.air }">
                  <CaretTop />
                </el-icon>
              </div>
            </div>

            <div v-show="categories.air" class="p-2 bg-[#0f1622] border-t border-[#2d3a4d] space-y-2">
              <div class="border border-[#2d3a4d] bg-[#16202e] rounded overflow-hidden">
                <div @click="toggleGroup('airElectronic')"
                  class="flex items-center justify-between px-2.5 py-2 cursor-pointer hover:bg-[#253141] transition-colors">
                  <div class="flex items-center gap-2 text-gray-200 font-medium">
                    <svg class="w-4 h-4 text-[#93c5fd]" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      stroke-width="2">
                      <circle cx="12" cy="12" r="9" opacity="0.3" fill="currentColor" />
                      <circle cx="12" cy="12" r="3" fill="currentColor" />
                      <circle cx="12" cy="6" r="1.5" fill="currentColor" />
                      <circle cx="7" cy="15" r="1.5" fill="currentColor" />
                      <circle cx="17" cy="15" r="1.5" fill="currentColor" />
                      <path d="M12 9v0M9.5 13.5v0M14.5 13.5v0" stroke-linecap="round" />
                    </svg>
                    <span>电子攻击机群</span>
                  </div>
                  <div class="flex items-center gap-2.5">
                    <span class="text-gray-400 text-[12px]">编组置信度:
                      <span class="text-[#10b981] font-bold font-mono glow-green ml-0.5">83%</span></span>
                    <el-icon class="text-gray-400 text-[11.5px] transition-transform duration-200"
                      :class="{ 'rotate-180': !groups.airElectronic }">
                      <CaretTop />
                    </el-icon>
                  </div>
                </div>

                <div v-show="groups.airElectronic"
                  class="divide-y divide-slate-800/60 bg-[#0b0f17] border-t border-[#2d3a4d]">
                  <div class="flex items-center justify-between px-3 py-2">
                    <div class="flex items-center gap-2.5">
                      <div
                        class="w-5 h-5 rounded-full bg-[#3b82f6]/20 border border-[#93c5fd]/40 flex items-center justify-center shrink-0">
                        <svg class="w-3 h-3 text-[#93c5fd]" viewBox="0 0 24 24" fill="currentColor">
                          <path
                            d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L14 19v-5.5l8 2.5z" />
                        </svg>
                      </div>
                      <span class="text-[#93c5fd] font-mono font-medium">EA-18G
                        <span class="text-gray-300 font-sans mx-0.5">× 3</span>
                        <span class="text-gray-400 text-[12px] font-sans">(乌代德)</span></span>
                    </div>
                    <span class="text-gray-400 text-[12px]">置信度:
                      <span class="text-[#10b981] font-mono font-bold ml-0.5">83%</span></span>
                  </div>
                  <div class="flex items-center justify-between px-3 py-2">
                    <div class="flex items-center gap-2.5">
                      <div
                        class="w-5 h-5 rounded-full bg-[#3b82f6]/20 border border-[#93c5fd]/40 flex items-center justify-center shrink-0">
                        <svg class="w-3 h-3 text-[#93c5fd]" viewBox="0 0 24 24" fill="currentColor">
                          <path
                            d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L14 19v-5.5l8 2.5z" />
                        </svg>
                      </div>
                      <span class="text-[var(--accent-text)]/90 font-mono font-medium">EC-130H
                        <span class="text-gray-300 font-sans mx-0.5">× 1</span>
                        <span class="text-gray-400 text-[12px] font-sans">(乌代德)</span></span>
                    </div>
                    <span class="text-gray-400 text-[12px]">置信度:
                      <span class="text-[#10b981] font-mono font-bold ml-0.5">83%</span></span>
                  </div>
                  <div class="flex items-center justify-between px-3 py-2">
                    <div class="flex items-center gap-2.5">
                      <div
                        class="w-5 h-5 rounded-full bg-[#3b82f6]/20 border border-[#93c5fd]/40 flex items-center justify-center shrink-0">
                        <svg class="w-3 h-3 text-[#93c5fd]" viewBox="0 0 24 24" fill="currentColor">
                          <path
                            d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L14 19v-5.5l8 2.5z" />
                        </svg>
                      </div>
                      <span class="text-[var(--accent-text)]/90 font-mono font-medium">F-16CJ
                        <span class="text-gray-300 font-sans mx-0.5">× 2</span>
                        <span class="text-gray-400 text-[12px] font-sans">(乌代德)</span></span>
                    </div>
                    <span class="text-gray-400 text-[12px]">置信度:
                      <span class="text-[#10b981] font-mono font-bold ml-0.5">83%</span></span>
                  </div>
                </div>
              </div>

              <div class="border border-[#2d3a4d] bg-[#16202e] rounded overflow-hidden opacity-85">
                <div class="flex items-center justify-between px-2.5 py-2 cursor-pointer hover:bg-[#253141]">
                  <div class="flex items-center gap-2 text-gray-300">
                    <el-icon class="text-[var(--accent-text)] text-sm">
                      <Opportunity />
                    </el-icon>
                    <span>隐身打击机群</span>
                  </div>
                  <div class="flex items-center gap-2.5">
                    <span class="text-gray-500 text-[12px]">编组置信度:
                      <span class="text-[#10b981]/80 font-mono font-bold">83%</span></span>
                    <el-icon class="text-gray-500 text-[11.5px]">
                      <CaretBottom />
                    </el-icon>
                  </div>
                </div>
              </div>

              <div class="border border-[#2d3a4d] bg-[#16202e] rounded overflow-hidden opacity-85">
                <div class="flex items-center justify-between px-2.5 py-2 cursor-pointer hover:bg-[#253141]">
                  <div class="flex items-center gap-2 text-gray-300">
                    <el-icon class="text-[var(--accent-text)] text-sm">
                      <Opportunity />
                    </el-icon>
                    <span>后续打击机群</span>
                  </div>
                  <div class="flex items-center gap-2.5">
                    <span class="text-gray-500 text-[12px]">编组置信度:
                      <span class="text-[#10b981]/80 font-mono font-bold">83%</span></span>
                    <el-icon class="text-gray-500 text-[11.5px]">
                      <CaretBottom />
                    </el-icon>
                  </div>
                </div>
              </div>

              <div class="border border-[#2d3a4d] bg-[#16202e] rounded overflow-hidden opacity-85">
                <div class="flex items-center justify-between px-2.5 py-2 cursor-pointer hover:bg-[#253141]">
                  <div class="flex items-center gap-2 text-gray-300">
                    <el-icon class="text-[var(--accent-text)] text-sm">
                      <Opportunity />
                    </el-icon>
                    <span>指挥保障机群</span>
                  </div>
                  <div class="flex items-center gap-2.5">
                    <span class="text-gray-500 text-[12px]">编组置信度:
                      <span class="text-[#10b981]/80 font-mono font-bold">83%</span></span>
                    <el-icon class="text-gray-500 text-[11.5px]">
                      <CaretBottom />
                    </el-icon>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-for="cat in remainingCategories" :key="cat.id"
            class="border border-[#2d3a4d] bg-[#1a2332] rounded flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-[#0f1622] transition-colors">
            <span class="text-gray-200 font-medium">{{ cat.name }}</span>
            <div class="flex items-center gap-3">
              <span class="text-gray-500 text-[12px]">综合置信度:
                <span class="text-[#10b981]/90 font-bold font-mono ml-0.5">{{
                  cat.confidence
                }}</span></span>
              <el-icon class="text-gray-500 text-[11.5px]">
                <CaretBottom />
              </el-icon>
            </div>
          </div>
        </div>
      </el-collapse-item>

      <el-collapse-item name="routes">
        <template #title>
          <div class="collapse-header-content">
            <span>行动路线（推断）</span>
          </div>
        </template>
        <div class="collapse-body-content">
          <div class="border border-[#2d3a4d] bg-[#1a2332] rounded overflow-hidden">
            <div @click="toggleGroup('airElectronic')"
              class="flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-[#2d3a4d] transition-colors">
              <div class="flex items-center gap-2.5 text-gray-200 font-medium">
                <div
                  class="w-5 h-5 rounded-full bg-[#3b82f6]/20 border border-[#93c5fd]/40 flex items-center justify-center shrink-0">
                  <svg class="w-3 h-3 text-[#93c5fd]" viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L14 19v-5.5l8 2.5z" />
                  </svg>
                </div>
                <span class="text-[var(--text)] font-semibold text-[12.5px] tracking-wide">电子攻击机群</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-gray-400 text-[12px]">综合置信度:
                  <span class="text-[#10b981] font-bold font-mono glow-green ml-0.5">83%</span></span>
                <el-icon class="text-gray-400 text-xs transition-transform duration-200"
                  :class="{ 'rotate-180': !groups.airElectronic }">
                  <CaretTop />
                </el-icon>
              </div>
            </div>

            <div v-show="groups.airElectronic"
              class="p-3 bg-[#0f1622] border-t border-[#2d3a4d] space-y-2 text-gray-300 leading-relaxed tracking-wide">
              <div class="flex items-start">
                <span class="text-gray-500 w-10 shrink-0 font-medium">方向:</span>
                <span class="text-gray-200 font-mono">乌代德基地 → 波斯湾中线 → 海峡西侧巡逻空域</span>
              </div>
              <div class="flex items-start">
                <span class="text-gray-500 w-10 shrink-0 font-medium">方式:</span>
                <span class="text-gray-200">
                  中空进入（FL250），在距岸约150km处展开，EA-18G全频段干扰开机后爬升至FL350，F-16CJ在干扰掩护下前出至80km发射反辐射导弹。脱离沿原航线高速返航。
                </span>
              </div>
              <div class="flex items-start">
                <span class="text-gray-500 w-10 shrink-0 font-medium">备选:</span>
                <span class="text-gray-200">若遭遇雷达锁定，下降至FL150并启动自卫干扰。</span>
              </div>
            </div>
          </div>

          <div
            class="border border-[#2d3a4d] bg-[#1a2332] rounded flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-[#0f1622] transition-colors">
            <div class="flex items-center gap-2.5 text-gray-300">
              <div
                class="w-5 h-5 rounded-full bg-[#3b82f6]/10 border border-[#93c5fd]/20 flex items-center justify-center shrink-0">
                <svg class="w-3 h-3 text-[#93c5fd]/80" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L14 19v-5.5l8 2.5z" />
                </svg>
              </div>
              <span class="font-medium">隐身打击机群</span>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-gray-500 text-[12px]">综合置信度:
                <span class="text-[#10b981]/90 font-bold font-mono ml-0.5">68%</span></span>
              <el-icon class="text-gray-500 text-[11.5px]">
                <CaretBottom />
              </el-icon>
            </div>
          </div>

          <div
            class="border border-[#2d3a4d] bg-[#1a2332] rounded flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-[#0f1622] transition-colors">
            <div class="flex items-center gap-2.5 text-gray-300">
              <div
                class="w-5 h-5 rounded-full bg-[#3b82f6]/10 border border-[#93c5fd]/20 flex items-center justify-center shrink-0">
                <svg class="w-3 h-3 text-[#93c5fd]/80" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L14 19v-5.5l8 2.5z" />
                </svg>
              </div>
              <span class="font-medium">后续打击机群</span>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-gray-500 text-[12px]">综合置信度:
                <span class="text-[#10b981]/90 font-bold font-mono ml-0.5">72%</span></span>
              <el-icon class="text-gray-500 text-[11.5px]">
                <CaretBottom />
              </el-icon>
            </div>
          </div>

          <div
            class="border border-[#2d3a4d] bg-[#1a2332] rounded flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-[#0f1622] transition-colors">
            <div class="flex items-center gap-2.5 text-gray-300">
              <div
                class="w-5 h-5 rounded-full bg-[#3b82f6]/10 border border-[#93c5fd]/20 flex items-center justify-center shrink-0">
                <svg class="w-3 h-3 text-[#93c5fd]/80" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  stroke-width="2">
                  <path d="M2 21h20M4 17l2-7h12l2 7H4zM9 10V6h2v4M13 10V4h2v6" stroke-linecap="round"
                    stroke-linejoin="round" />
                </svg>
              </div>
              <span class="font-medium">航母打击群</span>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-gray-500 text-[12px]">综合置信度:
                <span class="text-[#10b981]/90 font-bold font-mono ml-0.5">54%</span></span>
              <el-icon class="text-gray-500 text-[11.5px]">
                <CaretBottom />
              </el-icon>
            </div>
          </div>

          <div
            class="border border-[#2d3a4d] bg-[#1a2332] rounded flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-[#0f1622] transition-colors">
            <div class="flex items-center gap-2.5 text-gray-300">
              <div
                class="w-5 h-5 rounded-full bg-[#3b82f6]/10 border border-[#93c5fd]/20 flex items-center justify-center shrink-0">
                <svg class="w-3 h-3 text-[#93c5fd]/80" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  stroke-width="2">
                  <path d="M2 13h4M22 13h-4M6 13c0-3.3 2.7-6 6-6s6 2.7 6 6H6zM12 7V3h2" stroke-linecap="round" />
                  <circle cx="12" cy="13" r="2" />
                </svg>
              </div>
              <span class="font-medium">水下打击编队</span>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-gray-500 text-[12px]">综合置信度:
                <span class="text-[#10b981]/90 font-bold font-mono ml-0.5">54%</span></span>
              <el-icon class="text-gray-500 text-[11.5px]">
                <CaretBottom />
              </el-icon>
            </div>
          </div>

          <div
            class="border border-[#2d3a4d] bg-[#1a2332] rounded flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-[#0f1622] transition-colors">
            <div class="flex items-center gap-2.5 text-gray-300">
              <div
                class="w-5 h-5 rounded-full bg-[#3b82f6]/10 border border-[#93c5fd]/20 flex items-center justify-center shrink-0">
                <svg class="w-3 h-3 text-[#93c5fd]/80" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  stroke-width="2">
                  <path d="M2 13h4M22 13h-4M6 13c0-3.3 2.7-6 6-6s6 2.7 6 6H6zM12 7V3h2" stroke-linecap="round" />
                  <circle cx="12" cy="13" r="2" />
                </svg>
              </div>
              <span class="font-medium">反潜侦察编队</span>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-gray-500 text-[12px]">综合置信度:
                <span class="text-[#10b981]/90 font-bold font-mono ml-0.5">54%</span></span>
              <el-icon class="text-gray-500 text-[11.5px]">
                <CaretBottom />
              </el-icon>
            </div>
          </div>
        </div>
      </el-collapse-item>
      <el-collapse-item name="weapons">
        <template #title>
          <div class="collapse-header-content">
            <span>武器效能（推断）</span>
          </div>
        </template>
        <div class="collapse-body-content">
          <div class="text-gray-400 text-[12px] leading-relaxed mb-1 pl-0.5">
            以下为基于挂载异常和战例的主要打击武器推测，非完整挂载清单。
          </div>

          <div class="border border-[#2d3a4d] bg-[#1a2332] rounded overflow-hidden">
            <div @click="toggleGroup('airElectronic')"
              class="flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-[#2d3a4d] transition-colors">
              <span class="text-[var(--text)] font-semibold text-[12.5px] tracking-wide">反辐射/压制类</span>
              <div class="flex items-center gap-3">
                <span class="text-gray-400 text-[12px]">综合置信度:
                  <span class="text-[#10b981] font-bold font-mono glow-green ml-0.5">65%</span></span>
                <el-icon class="text-gray-400 text-xs transition-transform duration-200"
                  :class="{ 'rotate-180': !groups.suppression }">
                  <CaretBottom />
                </el-icon>
              </div>
            </div>

            <div v-show="groups.suppression"
              class="p-3 bg-[#0f1622] border-t border-[#2d3a4d] space-y-2.5 text-gray-300 leading-relaxed tracking-wide">
              <div>
                <span
                  class="text-[#93c5fd] font-medium cursor-pointer hover:underline">AARGM-ER反辐射导弹</span>：搭载EA-18G/F-16CJ，约10-15枚，用于摧毁S-300火控雷达，置信度高。
              </div>
              <div>
                <span class="text-[#93c5fd] font-medium cursor-pointer hover:underline">AGM-88E
                  AARGM</span>：搭载F-16CJ，约4-6枚，备用反辐射硬杀伤，置信度中。
              </div>
            </div>
          </div>

          <div
            class="border border-[#2d3a4d] bg-[#1a2332] rounded flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-[#0f1622] transition-colors">
            <span class="text-gray-200 font-medium">精确打击类</span>
            <div class="flex items-center gap-3">
              <span class="text-gray-500 text-[12px]">综合置信度:
                <span class="text-[#10b981]/90 font-bold font-mono ml-0.5">78%</span></span>
              <el-icon class="text-gray-500 text-[11.5px]">
                <CaretBottom />
              </el-icon>
            </div>
          </div>

          <div
            class="border border-[#2d3a4d] bg-[#1a2332] rounded flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-[#0f1622] transition-colors">
            <span class="text-gray-200 font-medium">自卫类</span>
            <div class="flex items-center gap-3">
              <span class="text-gray-500 text-[12px]">综合置信度:
                <span class="text-[#10b981]/90 font-bold font-mono ml-0.5">62%</span></span>
              <el-icon class="text-gray-500 text-[11.5px]">
                <CaretBottom />
              </el-icon>
            </div>
          </div>
        </div>
      </el-collapse-item>
      <el-collapse-item name="reconnaissance">
        <template #title>
          <div class="collapse-header-content">
            <span>侦察情报（推断）</span>
          </div>
        </template>
        <div class="collapse-body-content">
          <div class="text-gray-400 text-[12px] leading-relaxed pl-0.5">
            以下为基于力量组成和历史战例推测的蓝方在此行动中可能依赖的侦察情报
          </div>

          <div class="space-y-2.5">
            <div
              class="bg-[#0f1622] border border-[#2d3a4d] rounded p-3 space-y-1.5 shadow-md transition-all hover:border-slate-700">
              <div class="text-[var(--text)] font-semibold text-[12.5px] tracking-wide">
                S-300火控雷达连续信号采集
              </div>
              <div class="space-y-1 text-gray-300 leading-normal">
                <div class="flex items-start">
                  <span class="text-gray-500 w-28 shrink-0 font-medium">推断依据：</span>
                  <span class="text-gray-200">反辐射导弹需锁定雷达频段</span>
                </div>
                <div class="flex items-start">
                  <span class="text-gray-500 w-28 shrink-0 font-medium">我方可观测的现象：</span>
                  <span class="text-gray-200">
                    团A电子侦察活跃+事件4雷达开机<span class="text-[#10b981] font-medium ml-1 font-mono">（已观测到）</span>
                  </span>
                </div>
              </div>
            </div>

            <div
              class="bg-[#0f1622] border border-[#2d3a4d] rounded p-3 space-y-1.5 shadow-md transition-all hover:border-slate-700">
              <div class="text-[var(--text)] font-semibold text-[12.5px] tracking-wide">
                S-300阵地精确卫星成像
              </div>
              <div class="space-y-1 text-gray-300 leading-normal">
                <div class="flex items-start">
                  <span class="text-gray-500 w-28 shrink-0 font-medium">推断依据：</span>
                  <span class="text-gray-200">打击坐标需精确至米级</span>
                </div>
                <div class="flex items-start">
                  <span class="text-gray-500 w-28 shrink-0 font-medium">我方可观测的现象：</span>
                  <span class="text-gray-200">
                    侦察卫星过顶频次增加<span class="text-[var(--accent-text)] font-medium ml-1">（可观测）</span>
                  </span>
                </div>
              </div>
            </div>

            <div
              class="bg-[#0f1622] border border-[#2d3a4d] rounded p-3 space-y-1.5 shadow-md transition-all hover:border-slate-700">
              <div class="text-[var(--text)] font-semibold text-[12.5px] tracking-wide">
                格什姆岛通信枢纽信号定位
              </div>
              <div class="space-y-1 text-gray-300 leading-normal">
                <div class="flex items-start">
                  <span class="text-gray-500 w-28 shrink-0 font-medium">推断依据：</span>
                  <span class="text-gray-200">通信干扰需精确位置</span>
                </div>
                <div class="flex items-start">
                  <span class="text-gray-500 w-28 shrink-0 font-medium">我方可观测的现象：</span>
                  <span class="text-gray-200">
                    EC-130H转场<span class="text-[#10b981] font-medium ml-1 font-mono">（已观测到）</span>
                  </span>
                </div>
              </div>
            </div>

            <div
              class="bg-[#0f1622] border border-[#2d3a4d] rounded p-3 space-y-1.5 shadow-md transition-all hover:border-slate-700">
              <div class="text-[var(--text)] font-semibold text-[12.5px] tracking-wide">
                伊朗战机部署与出动能力
              </div>
              <div class="space-y-1 text-gray-300 leading-normal">
                <div class="flex items-start">
                  <span class="text-gray-500 w-28 shrink-0 font-medium">推断依据：</span>
                  <span class="text-gray-200">评估空中拦截风险</span>
                </div>
                <div class="flex items-start">
                  <span class="text-gray-500 w-28 shrink-0 font-medium">我方可观测的现象：</span>
                  <span class="text-gray-200">
                    P-8A侦察活动<span class="text-[#10b981] font-medium ml-1 font-mono">（已观测到）</span>
                  </span>
                </div>
              </div>
            </div>

            <div
              class="bg-[#0f1622] border border-[#2d3a4d] rounded p-3 space-y-1.5 shadow-md transition-all hover:border-slate-700">
              <div class="text-[var(--text)] font-semibold text-[12.5px] tracking-wide">
                伊朗领导层动向与决策信号
              </div>
              <div class="space-y-1 text-gray-300 leading-normal">
                <div class="flex items-start">
                  <span class="text-gray-500 w-28 shrink-0 font-medium">推断依据：</span>
                  <span class="text-gray-200">评估冲突升级风险</span>
                </div>
                <div class="flex items-start">
                  <span class="text-gray-500 w-28 shrink-0 font-medium">我方可观测的现象：</span>
                  <span class="text-gray-200">
                    开源情报+外交信号<span class="text-[var(--accent-text)] font-medium ml-1">（可采集）</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>
    -->
    <DetailSectionAccordion :detail="resultDataText?.details" append-suffix="（推断）" />

    <AnalysisNodeDetailDialog v-model:visible="detailDialogVisible" :node="detailDialogNode" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { More, Warning, Document } from "@element-plus/icons-vue";
import { useAnalysisStore } from "@/store/modules/analysisStore";
import { useAgentStore } from "@/store/modules/agentStore";
import DetailSectionAccordion from "@/components/DetailSectionAccordion.vue";
import AnalysisNodeDetailDialog from "@/components/analysisNodeDetailDialog.vue";

/* 点击方案名 → 完整方案弹窗（与画布节点名点击同一组件） */
const detailDialogVisible = ref(false);
const detailDialogNode = ref<any>(null);

function openDetailDialog(node: any) {
  const t = node?.type;
  if (t !== "Attack" && t !== "Defense" && t !== "Evaluation") return;
  detailDialogNode.value = node;
  detailDialogVisible.value = true;
}
const store = useAnalysisStore();
const agentStore = useAgentStore();

// 选中节点的 nodeData / confidence 展示用计算属性
const normalizeObjectLikeValue = (value: unknown): unknown => {
  if (value == null) return value;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return value;

    try {
      const parsed = JSON.parse(trimmed);
      return normalizeObjectLikeValue(parsed);
    } catch {
      return value;
    }
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeObjectLikeValue(item));
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, any>).map(([key, item]) => [
        key,
        key === "details" ? normalizeObjectLikeValue(item) : normalizeObjectLikeValue(item),
      ])
    );
  }

  return value;
};

const resultDataText = computed<Record<string, any>>(() => {
  const nd = store.selectedNode?.nodeData;
  if (nd == null) return {};

  try {
    const obj = typeof nd === "string" ? JSON.parse(nd) : nd;
    const normalized = normalizeObjectLikeValue(obj);
    if (normalized && typeof normalized === "object" && !Array.isArray(normalized)) {
      return normalized as Record<string, any>;
    }
    return { value: normalized };
  } catch {
    return { value: typeof nd === "string" ? nd : String(nd) };
  }
});
const nodeConfidenceText = computed(() => {
  const c = store.selectedNode?.confidence;
  if (c == null || !Number.isFinite(Number(c))) return "N/A";
  return Math.round(Number(c)) + "%";
});

// 控制哪些面板默认展开，留空则默认全部收起
// const activeNames = ref<string[]>([]);
const generateOurPlan = async () => {
  const selectedAttacks = store.rawNodes.filter(
    (n: any) => n.type === "Attack" && n._selected
  ).map((n: any) => n.id)
  const attackIds = selectedAttacks.length > 0 ? selectedAttacks : [store.selectedNode?.id]
  if (!attackIds[0]) return
  agentStore.setCurrentTaskType("红方方案")
  await store.proceedToRedPlan(attackIds)
}
// 矩阵子项数据结构
const matrixData = [
  { label: "任务目标", value: 85 },
  { label: "指挥时间", value: 76 },
  { label: "力量编成", value: 74 },
  { label: "行动路线", value: 65 },
  { label: "武器效能", value: 58 },
  { label: "情报缺口", value: 52 },
];

// 控制一、二级面板的本地交互状态
// const categories = ref<{ air: boolean }>({ air: true });
// const groups = ref<{
//   airElectronic: boolean;
//   suppression?: boolean;
// }>({ airElectronic: true });
//
// const toggleCategory = (key: "air") => {
//   categories.value[key] = !categories.value[key];
// };
// const toggleGroup = (key: "airElectronic") => {
//   groups.value[key] = !groups.value[key];
// };

// 渲染其它闭合的底层矩阵数据
// const remainingCategories = [
//   { id: "sea", name: "海上力量（4组编队）", confidence: "76%" },
//   { id: "electro", name: "电磁力量（1组编队）", confidence: "55%" },
//   { id: "space", name: "天基力量（1组编队）", confidence: "80%" },
//   { id: "cyber", name: "网络力量（3组编队）", confidence: "35%" },
//   { id: "army", name: "陆军力量（2组编队）", confidence: "38%" },
//   { id: "rocket", name: "火箭军力量（1单位要素）", confidence: "40%" },
// ];
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 荧光绿文字微发光 */
.glow-green {
  text-shadow: 0 0 6px rgba(34, 197, 94, 0.6);
}

/* 穿透定制 Element Plus 折叠面板样式以融合军工UI */
:deep(.custom-tactical-collapse) {
  border: none !important;
  background-color: transparent !important;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

:deep(.custom-tactical-collapse .el-collapse-item) {
  border: 1px solid #2d3a4d !important;
  background-color: #1a2332 !important;
  border-radius: 4px;
  overflow: hidden;
}

:deep(.custom-tactical-collapse .el-collapse-item__header) {
  background-color: #1a2332 !important;
  color: #e5e7eb !important;
  border-bottom: none !important;
  height: 38px !important;
  padding: 0 12px !important;
  font-size: 12px !important;
  font-weight: 600 !important;
}

:deep(.custom-tactical-collapse .el-collapse-item__wrap) {
  background-color: transparent !important;
  border-bottom: none !important;
}

:deep(.custom-tactical-collapse .el-collapse-item__content) {
  padding: 0 !important;
}

/* 隐藏或微调原生滚动条 */
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #111827;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #2d3a4d;
  border-radius: 3px;
}

/* ==========================================================================
   深度穿透复刻：暗黑军事风独立竖向折叠面板
   ========================================================================== */

/* 移除全局折叠面板的自带边框与背景 */
:deep(.custom-inference-accordion) {
  border: none !important;
  background-color: transparent !important;
  display: flex;
  flex-direction: column;
  gap: 6px;
  /* 强制每一个 item 之间产生竖向间隔 */
}

/* 每一个独立的竖向框体 */
:deep(.custom-inference-accordion .el-collapse-item) {
  background-color: #1a2332 !important;
  /* 灰黑蓝色头部背景 */
  border: 1px solid #2d3a4d !important;
  /* 低调内敛的科技线框 */
  border-radius: 4px;
  overflow: hidden;
}

/* 折叠面板头部样式 */
:deep(.custom-inference-accordion .el-collapse-item__header) {
  background-color: #1a2332 !important;
  color: #ffffff !important;
  height: 42px !important;
  /* 适中的竖向高度槽 */
  line-height: 42px !important;
  padding: 0 16px !important;
  border-bottom: none !important;
  /* 收起时移除下边框 */
  font-size: 13px !important;
  font-weight: 500;
  letter-spacing: 0.05em;
  transition: background-color 0.2s ease;
}

:deep(.custom-inference-accordion .el-collapse-item__header:hover) {
  background-color: #161d2d !important;
  /* 鼠标悬停微亮反馈 */
}

/* 右侧原生箭头样式微调 */
:deep(.custom-inference-accordion .el-collapse-item__arrow) {
  color: #9ca3af !important;
  /* 浅灰蓝色箭头 */
  font-size: 13px;
}

/* 展开后的内容包裹层 */
:deep(.custom-inference-accordion .el-collapse-item__wrap) {
  background-color: #0a0e17 !important;
  /* 展开后的内容区背景比头部更深 */
  border-bottom: none !important;
}

/* 核心内容样式类 */
.collapse-header-content {
  display: flex;
  align-items: center;
  width: 100%;
}

.collapse-body-content {
  padding: 12px 16px;
  font-size: 12px;
  color: #9ca3af;
  line-height: 1.6;
  border-top: 1px solid #161f30;
  /* 展开后，内容与头部的虚隔线 */
}

/* 完美适配内嵌表格的精致窄边滚动条 */
.custom-table-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-table-scrollbar::-webkit-scrollbar-track {
  background: #1a2332;
  border-radius: 2px;
}

.custom-table-scrollbar::-webkit-scrollbar-thumb {
  background: #2e394e;
  border-radius: 2px;
}

.custom-table-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #3d4b66;
}
</style>
