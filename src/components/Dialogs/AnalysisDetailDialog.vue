<template>
  <div
    class="w-full h-[650px] bg-[#090d16]/95 text-slate-200 border border-slate-800/80 rounded-lg shadow-2xl flex font-sans select-none overflow-hidden relative backdrop-blur-md animate-fade-in"
  >
    <!-- Left Sidebar: Report List -->
    <div class="w-80 border-r border-slate-800/80 flex flex-col shrink-0 bg-[#0c1220]/60">
      <div class="p-4 border-b border-slate-800/80 shrink-0">
        <h3 class="text-sm font-bold tracking-wide text-slate-200 flex items-center gap-2">
          <el-icon class="text-blue-400 text-base"><Management /></el-icon>
          异常研判报告列表
        </h3>
        <!-- Search & Filters -->
        <div class="mt-3">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索报告标题或摘要..."
            class="w-full bg-[#151b2e] border border-slate-800 text-xs px-2.5 py-1.5 rounded text-slate-200 focus:outline-none focus:border-blue-500/80 transition-colors placeholder:text-slate-600"
          />
        </div>
      </div>

      <!-- Report List Container -->
      <div class="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
        <div
          v-for="rep in filteredParentReports"
          :key="rep.id"
          @click="selectParentReport(rep)"
          :class="[
            'p-3 rounded border transition-all cursor-pointer relative group',
            selectedParentReport?.id === rep.id
              ? 'bg-[#152039] border-blue-500/60 shadow-lg shadow-blue-950/20'
              : 'bg-[#0f1526]/80 border-slate-800/60 hover:bg-[#11192e] hover:border-slate-700/80'
          ]"
        >
          <!-- Selected indicator bar -->
          <div
            v-if="selectedParentReport?.id === rep.id"
            class="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l"
          ></div>

          <div class="flex justify-between items-start gap-1.5 mb-1.5">
            <span
              :class="[
                'text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0',
                rep.threatLevel === '高'
                  ? 'bg-red-950/80 text-red-400 border border-red-500/20'
                  : 'bg-amber-950/80 text-amber-400 border border-amber-500/20'
              ]"
            >
              {{ rep.threatLevel }}威胁
            </span>
            <span class="text-[9px] text-slate-500 font-mono">{{ formatDate(rep.createdAt) }}</span>
          </div>

          <h4 class="text-xs font-semibold text-slate-200 leading-snug line-clamp-2 mb-1.5 group-hover:text-blue-400 transition-colors">
            {{ rep.title }}
          </h4>
          <p class="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
            {{ rep.summary }}
          </p>
        </div>

        <!-- Empty State in List -->
        <div v-if="filteredParentReports.length === 0" class="text-center py-10 text-slate-500 text-xs">
          暂无匹配的研判报告
        </div>
      </div>
    </div>

    <!-- Right Content: Selected Report Detail -->
    <div class="flex-1 flex flex-col min-w-0 bg-[#090d16]/30">
      <div v-if="selectedParentReport" class="flex-1 flex flex-col min-h-0">
        <!-- Detail Header -->
        <div class="p-4 border-b border-slate-800/80 shrink-0 bg-[#0c1220]/40">
          <div class="flex justify-between items-start gap-4 mb-2">
            <h2 class="text-base font-bold text-slate-100 leading-snug">
              {{ selectedParentReport.title }}
            </h2>
            <div class="flex items-center gap-1.5 shrink-0">
              <span class="text-[10px] bg-[#141a2e] border border-slate-700/60 text-slate-400 px-2 py-0.5 rounded font-mono">
                ID: #{{ selectedParentReport.id }}
              </span>
              <span
                :class="[
                  'text-[10px] border px-2 py-0.5 rounded font-semibold',
                  selectedParentReport.status === 'GENERATED'
                    ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-400'
                    : 'bg-blue-950/60 border-blue-500/30 text-blue-400'
                ]"
              >
                {{ selectedParentReport.status === 'GENERATED' ? '已研判' : '草稿' }}
              </span>
            </div>
          </div>

          <!-- Metadata Grid -->
          <div class="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-400">
            <div class="flex items-center gap-1">
              <span class="text-slate-600">发布时间:</span>
              <span class="text-slate-300 font-mono">{{ formatFullDate(selectedParentReport.createdAt) }}</span>
            </div>
            <div class="flex items-center gap-1">
              <span class="text-slate-600">置信度:</span>
              <span class="text-emerald-400 font-bold font-mono">
                {{ parsedAnalysis.intent_judgment?.confidence || 75 }}%
              </span>
            </div>
            <div class="flex items-center gap-1">
              <span class="text-slate-600">风险等级:</span>
              <span
                :class="[
                  'font-bold',
                  selectedParentReport.threatLevel === '高' ? 'text-red-400' : 'text-amber-400'
                ]"
              >
                {{ selectedParentReport.threatLevel }}
              </span>
            </div>
          </div>
        </div>

        <!-- Detail Tabs Navigation -->
        <div class="flex border-b border-slate-800/80 px-4 shrink-0 bg-[#0a0f1b]">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            @click="activeTab = tab.value"
            :class="[
              'px-4 py-2.5 text-xs font-semibold tracking-wider border-b-2 transition-all mr-2 relative',
              activeTab === tab.value
                ? 'border-blue-500 text-blue-400 bg-blue-950/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
            ]"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- Detail Scrollable Body -->
        <div class="flex-1 overflow-y-auto p-4 custom-scrollbar min-h-0 space-y-4">
          <!-- Tab 1: Comprehensive Analysis -->
          <div v-if="activeTab === 'analysis'" class="space-y-4">
            <!-- Summary banner -->
            <div class="bg-[#10182b] border-l-2 border-blue-500 p-3.5 rounded-r shadow-inner">
              <div class="text-blue-400 text-xs font-bold mb-1.5 flex items-center gap-1">
                <span>✦</span> AI 作战参谋综合研判
              </div>
              <p class="text-xs text-slate-300 leading-relaxed font-sans font-medium">
                {{ selectedParentReport.summary }}
              </p>
            </div>

            <!-- Primary Intent -->
            <div class="bg-[#121624]/60 border border-slate-800 p-3.5 rounded">
              <h3 class="text-slate-200 font-bold text-xs border-b border-slate-800 pb-2 mb-2 flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                核心战略意图
              </h3>
              <p class="text-xs text-slate-300 leading-relaxed font-sans">
                {{ parsedAnalysis.intent_judgment?.primary_intent }}
              </p>
            </div>

            <!-- Detailed Analysis -->
            <div class="bg-[#121624]/60 border border-slate-800 p-3.5 rounded">
              <h3 class="text-slate-200 font-bold text-xs border-b border-slate-800 pb-2 mb-2 flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                深度推演解析
              </h3>
              <p class="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                {{ parsedAnalysis.intent_judgment?.detailed_analysis }}
              </p>
            </div>

            <!-- Recommendations -->
            <div class="bg-[#1e1712]/60 border border-amber-600/20 p-3.5 rounded-r border-l-2 border-l-amber-500">
              <h3 class="text-amber-500 font-bold text-xs mb-2 flex items-center gap-1.5">
                ⚡ 应对与防范建议
              </h3>
              <p class="text-xs text-slate-300 leading-relaxed font-sans">
                {{ parsedAnalysis.recommendation }}
              </p>
            </div>
          </div>

          <!-- Tab 2: Intent Dimensions (Sub-reports) -->
          <div v-if="activeTab === 'dimensions'" class="space-y-4">
            <div class="text-slate-400 text-xs font-semibold mb-1">
              基于大模型多 Agent 生成的意图维度剖析
            </div>

            <!-- Grid of Dimensions -->
            <div class="grid grid-cols-1 gap-3">
              <div
                v-for="child in getChildReports(selectedParentReport.id)"
                :key="child.id"
                :class="[
                  'border rounded p-3.5 shadow-sm transition-all',
                  child.intentType === 'military'
                    ? 'bg-[#1c1214]/40 border-red-950/60'
                    : child.intentType === 'economic'
                    ? 'bg-[#0e1c15]/40 border-emerald-950/60'
                    : 'bg-[#0f172a]/40 border-blue-950/60'
                ]"
              >
                <div class="flex justify-between items-center border-b border-slate-800/80 pb-2 mb-2">
                  <div class="flex items-center gap-2">
                    <span
                      :class="[
                        'w-2 h-2 rounded-full',
                        child.intentType === 'military'
                          ? 'bg-red-500'
                          : child.intentType === 'economic'
                          ? 'bg-emerald-500'
                          : 'bg-blue-500'
                      ]"
                    ></span>
                    <span
                      :class="[
                        'text-xs font-bold tracking-wide uppercase',
                        child.intentType === 'military'
                          ? 'text-red-400'
                          : child.intentType === 'economic'
                          ? 'text-emerald-400'
                          : 'text-blue-400'
                      ]"
                    >
                      {{ getDimensionName(child.intentType) }}维度
                    </span>
                  </div>
                  <span class="text-[10px] text-slate-500 font-mono">子项 ID: #{{ child.id }}</span>
                </div>
                <p class="text-xs text-slate-300 leading-relaxed font-sans">
                  {{ child.summary }}
                </p>
              </div>

              <!-- Fallback to parent fields if no children found -->
              <div
                v-if="getChildReports(selectedParentReport.id).length === 0"
                class="space-y-3"
              >
                <!-- Political Intent -->
                <div v-if="parsedAnalysis.intent_judgment?.political_intent" class="bg-[#0f172a]/40 border border-blue-950/60 rounded p-3.5">
                  <div class="text-blue-400 text-xs font-bold mb-1.5 flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span> 政治维度
                  </div>
                  <p class="text-xs text-slate-300 leading-relaxed font-sans">
                    {{ parsedAnalysis.intent_judgment.political_intent }}
                  </p>
                </div>
                <!-- Economic Intent -->
                <div v-if="parsedAnalysis.intent_judgment?.economic_intent" class="bg-[#0e1c15]/40 border border-emerald-950/60 rounded p-3.5">
                  <div class="text-emerald-400 text-xs font-bold mb-1.5 flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> 经济维度
                  </div>
                  <p class="text-xs text-slate-300 leading-relaxed font-sans">
                    {{ parsedAnalysis.intent_judgment.economic_intent }}
                  </p>
                </div>
                <!-- Military Intent -->
                <div v-if="parsedAnalysis.intent_judgment?.military_intent" class="bg-[#1c1214]/40 border border-red-950/60 rounded p-3.5">
                  <div class="text-red-400 text-xs font-bold mb-1.5 flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span> 军事维度
                  </div>
                  <p class="text-xs text-slate-300 leading-relaxed font-sans">
                    {{ parsedAnalysis.intent_judgment.military_intent }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Tab 3: Verification & Publisher -->
          <div v-if="activeTab === 'verification'" class="space-y-4">
            <!-- Cross Verification Status -->
            <div class="bg-[#101929] border border-slate-800 p-3.5 rounded flex items-center justify-between">
              <span class="text-xs text-slate-400 font-medium">信息交叉核验验证状态:</span>
              <span
                :class="[
                  'text-xs font-bold px-2.5 py-1 rounded border',
                  parsedAnalysis.verification?.cross_reference_status === '部分验证'
                    ? 'bg-blue-950/60 border-blue-500/20 text-blue-400'
                    : parsedAnalysis.verification?.cross_reference_status === '已验证'
                    ? 'bg-emerald-950/60 border-emerald-500/20 text-emerald-400'
                    : 'bg-amber-950/60 border-amber-500/20 text-amber-400'
                ]"
              >
                {{ parsedAnalysis.verification?.cross_reference_status || '未验证' }}
              </span>
            </div>

            <!-- Supporting vs Contradicting Sources -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Supporting sources -->
              <div class="bg-[#0e1c15]/20 border border-emerald-950/60 p-3.5 rounded">
                <h4 class="text-emerald-400 font-bold text-xs mb-2 flex items-center gap-1.5">
                  <el-icon class="text-emerald-500"><CircleCheck /></el-icon>
                  支撑性/可信度增强来源
                </h4>
                <ul
                  v-if="parsedAnalysis.verification?.supporting_sources?.length"
                  class="space-y-2 list-none text-slate-300 text-xs pl-1"
                >
                  <li
                    v-for="(source, idx) in parsedAnalysis.verification.supporting_sources"
                    :key="idx"
                    class="flex items-start gap-1.5 leading-relaxed"
                  >
                    <span class="text-emerald-500 mt-1 shrink-0 scale-75">●</span>
                    <span>{{ source }}</span>
                  </li>
                </ul>
                <div v-else class="text-slate-500 text-xs">暂无支撑性信源数据</div>
              </div>

              <!-- Contradicting sources -->
              <div class="bg-[#1c1214]/20 border border-red-950/60 p-3.5 rounded">
                <h4 class="text-red-400 font-bold text-xs mb-2 flex items-center gap-1.5">
                  <el-icon class="text-red-500"><CircleClose /></el-icon>
                  矛盾性/不确定性信源
                </h4>
                <ul
                  v-if="parsedAnalysis.verification?.contradicting_sources?.length"
                  class="space-y-2 list-none text-slate-300 text-xs pl-1"
                >
                  <li
                    v-for="(source, idx) in parsedAnalysis.verification.contradicting_sources"
                    :key="idx"
                    class="flex items-start gap-1.5 leading-relaxed"
                  >
                    <span class="text-red-500 mt-1 shrink-0 scale-75">●</span>
                    <span>{{ source }}</span>
                  </li>
                </ul>
                <div v-else class="text-slate-500 text-xs">无明确对立/否定性信源</div>
              </div>
            </div>

            <!-- Publisher Analysis -->
            <div
              v-if="parsedAnalysis.publisher_analysis"
              class="bg-[#121624]/60 border border-slate-800 p-3.5 rounded space-y-3"
            >
              <h3 class="text-slate-200 font-bold text-xs border-b border-slate-800 pb-2 mb-1 flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                发布方评估与行为偏离分析
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <span class="text-slate-500">发布方身份特征:</span>
                  <p class="text-slate-300 mt-1 leading-relaxed">{{ parsedAnalysis.publisher_analysis.identity }}</p>
                </div>
                <div>
                  <span class="text-slate-500">信誉评定:</span>
                  <div class="mt-1">
                    <span
                      :class="[
                        'text-[10px] font-bold px-2 py-0.5 rounded border',
                        parsedAnalysis.publisher_analysis.credibility === '高'
                          ? 'bg-emerald-950/60 border-emerald-500/20 text-emerald-400'
                          : parsedAnalysis.publisher_analysis.credibility === '中'
                          ? 'bg-amber-950/60 border-amber-500/20 text-amber-400'
                          : 'bg-red-950/60 border-red-500/20 text-red-400'
                      ]"
                    >
                      {{ parsedAnalysis.publisher_analysis.credibility }}信度
                    </span>
                  </div>
                </div>
              </div>

              <div class="text-xs border-t border-slate-800/80 pt-2.5">
                <span class="text-slate-500">历史新闻/情报操弄行为:</span>
                <p class="text-slate-300 mt-1 leading-relaxed">{{ parsedAnalysis.publisher_analysis.historical_behavior }}</p>
              </div>

              <!-- Suspicious Indicators -->
              <div
                v-if="parsedAnalysis.publisher_analysis.suspicious_indicators?.length"
                class="text-xs border-t border-slate-800/80 pt-2.5"
              >
                <span class="text-slate-500 block mb-1.5">可疑情报操纵指征:</span>
                <div class="space-y-1.5">
                  <div
                    v-for="(indicator, idx) in parsedAnalysis.publisher_analysis.suspicious_indicators"
                    :key="idx"
                    class="bg-[#1c1815] border border-amber-600/20 px-2.5 py-1.5 rounded text-slate-300 flex items-start gap-2"
                  >
                    <el-icon class="text-amber-500 mt-0.5"><Warning /></el-icon>
                    <span>{{ indicator }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Tab 4: Harm Assessment & Related Events -->
          <div v-if="activeTab === 'impact'" class="space-y-4">
            <!-- Harm assessment details -->
            <div
              v-if="parsedAnalysis.harm_assessment"
              class="bg-[#121624]/60 border border-slate-800 p-3.5 rounded space-y-4"
            >
              <h3 class="text-slate-200 font-bold text-xs border-b border-slate-800 pb-2 flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                地缘政治及安全危害评估
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <span class="text-slate-500">危害严重程度:</span>
                  <div class="mt-1">
                    <span
                      :class="[
                        'text-[10px] font-bold px-2 py-0.5 rounded border',
                        parsedAnalysis.harm_assessment.severity === '严重'
                          ? 'bg-red-950 border-red-500/20 text-red-400'
                          : 'bg-amber-950 border-amber-500/20 text-amber-400'
                      ]"
                    >
                      {{ parsedAnalysis.harm_assessment.severity }}
                    </span>
                  </div>
                </div>
                <div>
                  <span class="text-slate-500">波及/受影响领域:</span>
                  <p class="text-slate-300 mt-1 leading-relaxed">{{ parsedAnalysis.harm_assessment.affected_scope }}</p>
                </div>
              </div>

              <div class="text-xs border-t border-slate-800/80 pt-3">
                <span class="text-slate-500 font-semibold block mb-1">短期直接影响:</span>
                <p class="text-slate-300 leading-relaxed">{{ parsedAnalysis.harm_assessment.short_term }}</p>
              </div>

              <div class="text-xs border-t border-slate-800/80 pt-3">
                <span class="text-slate-500 font-semibold block mb-1">长期战术及战略影响:</span>
                <p class="text-slate-300 leading-relaxed">{{ parsedAnalysis.harm_assessment.long_term }}</p>
              </div>
            </div>

            <!-- Related Events -->
            <div
              v-if="parsedAnalysis.related_events?.length"
              class="bg-[#121624]/60 border border-slate-800 p-3.5 rounded"
            >
              <h3 class="text-slate-200 font-bold text-xs border-b border-slate-800 pb-2 mb-3 flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                关联的战场/外围情报事件
              </h3>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="(event, idx) in parsedAnalysis.related_events"
                  :key="idx"
                  class="px-2.5 py-1 bg-[#161c2e] hover:bg-[#1f2842] text-blue-300 border border-slate-800 hover:border-blue-500/40 rounded-sm text-xs transition-colors cursor-default"
                >
                  {{ event }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs">
        <el-icon class="text-3xl mb-2 text-slate-600 animate-pulse"><Search /></el-icon>
        请在左侧选择一份异常态势报告以查看详细信息
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { getTaskReports } from '@/api/agents-api';
import type { IntelligenceReport } from '@/types/agent';
import {
  Management,
  CircleCheck,
  CircleClose,
  Warning,
  Search
} from '@element-plus/icons-vue';

// Fallback high-fidelity data in case API returns empty or fails
const fallbackReports: IntelligenceReport[] = [
  {
    id: 1,
    taskId: 1,
    sourceNodeId: 16,
    itemId: 11,
    seq: 1,
    title: "伊朗披露备忘录细节：全面停止军事行动、解冻资产、解除海运，后续再谈核问题",
    summary: "战略信息释放与舆论施压",
    threatLevel: "高",
    intentType: "parent",
    parentReportId: null,
    createdAt: "2026-06-24T13:52:45.707055",
    status: "GENERATED",
    analysisJson: JSON.stringify({
      seq: 1,
      url: "",
      title: "伊朗披露备忘录细节：全面停止军事行动、解冻资产、解除海运，后续再谈核问题",
      verification: {
        supporting_sources: [
          "新华社作为权威媒体的报道增加了信息的一定可信度",
          "伊朗谈判团队负责人的身份使其披露具有一定内部信息来源的可信性"
        ],
        contradicting_sources: [
          "美方尚未发布任何确认信息",
          "伊朗官方明确表示尚未作出最终决定",
          "缺乏第三方独立来源的交叉印证"
        ],
        cross_reference_status: "未验证"
      },
      recommendation: "建议持续跟踪美方对此消息的官方回应，关注伊朗最终是否签署备忘录。同时监测石油市场反应、中东地区军事动态以及国际社会对此事的立场表态。需警惕信息可能被用于舆论操控的可能性，在美方确认前不宜过度解读。重点关注核问题延后处理对国际核不扩散体系的长期影响。",
      related_events: [
        "美伊军事冲突升级事件",
        "美国对伊朗制裁政策变化",
        "伊朗核计划进展与国际原子能机构核查",
        "黎巴嫩局势与真主党相关动态",
        "中东石油供应与全球能源市场波动",
        "中国在中东的外交斡旋活动"
      ],
      harm_assessment: {
        severity: "严重",
        long_term: "若备忘录最终达成，将标志着美伊关系的重大转折，可能重塑中东地缘政治格局。伊朗通过分阶段方案可能成功解除部分制裁并实现经济复苏，但核问题的延后处理可能埋下长期隐患。战争赔偿要求若被纳入协议，将开创冲突后赔偿的先例，对国际关系产生深远影响。反之，若谈判破裂，美伊对抗可能进入新阶段，区域安全形势进一步恶化",
        short_term: "短期内，此信息的广泛传播可能导致市场对美伊关系缓和的预期上升，影响石油价格和区域安全情绪。若美方否认或拒绝接受这些条件，可能引发局势再度紧张。同时，伊朗通过此举在国际舆论中塑造'理性谈判方'形象，可能影响其他国家对伊朗制裁的态度",
        affected_scope: "全球能源市场、中东地区安全、美国外交政策、伊朗经济复苏、国际核不扩散体系"
      },
      intent_judgment: {
        confidence: 75,
        primary_intent: "战略信息释放与舆论施压",
        economic_intent: "伊朗的经济诉求极为明确且层次分明：第一阶段要求解冻部分被冻结资产、暂停部分制裁，为石油销售创造条件；第二阶段要求解除海运限制，恢复海上贸易；最终阶段要求取消一级和二级制裁并进行战争赔偿。这反映出伊朗遭受制裁后经济严重受损 of 现实困境，以及试图通过分阶段解除制裁实现经济复苏的战略意图。特别值得注意的是，伊朗将石油销售恢复置于优先位置，说明能源出口是其经济命脉。要求战争赔偿是伊朗极为罕见的强硬经济诉求，可能成为后续谈判的重大障碍",
        military_intent: "伊朗要求'全面停止针对伊朗和黎巴嫩的军事行动'，表明当前冲突可能已扩展至黎巴嫩方向（可能涉及真主党等代理人力量）。要求'防止任何新的军事行动'并要求美方提供安全保障，反映出伊朗对军事安全的深切担忧。将核问题推迟到后续阶段谈判，军事上意味着伊朗可能在核设施保护方面仍有军事准备，不愿在安全保障未落实前放弃核谈判筹码。整体来看，伊朗试图通过外交手段终止军事冲突，但保留核问题作为长期战略威慑工具",
        political_intent: "伊朗通过披露备忘录细节，向国际社会释放'愿意和平解决争端'的信号，同时在谈判中占据道德高地。将核问题置于后续阶段，显示伊朗试图将军事停火与核问题解绑，避免在核问题上过早做出让步。要求美方提供'防止再次出现紧张局势'的保证，实质是要求美国承诺不再对伊朗采取军事行动，这是伊朗的核心政治诉求。选择在新华社等中国官方媒体发布，意在争取中国等大国对伊朗立场的支持，在地缘政治上形成对美国的压力",
        detailed_analysis: "该信息反映了美伊冲突后双方可能进入谈判阶段的重大动态。从伊朗单方面披露的备忘录细节来看，伊朗提出了一个五阶段的和解框架：停火与安全保障→资产解冻与制裁暂停→海运解除→核问题谈判→全面解除制裁与赔偿。这一框架的巧妙之处在于：（1）将军事停火置于首位，满足双方当前最紧迫的需求；（2）将核问题后置，避免在核问题上过早让步；（3）通过分阶段解除制裁，既满足伊朗经济复苏的迫切需求，又给美方提供逐步兑现的路线图；（4）将战争赔偿纳入最终阶段，保留了长期施压的筹码。然而，伊朗官方明确表示'尚未作出最终决定'，这暗示披露本身可能就是谈判策略的一部分——通过向国际社会展示伊朗的'合理条件'，对美方形成舆论压力，同时试探国际反应。新华社的发布时机选择也值得注意，可能反映了中国在中东局势中的某种战略考量。需要警惕的是，此类单方面披露的细节可能与最终协议存在差异，甚至可能是谈判中的虚晃一枪。"
      },
      overall_risk_level: "高",
      publisher_analysis: {
        identity: "新华社（Xinhua News Agency）作为发布方，转引伊朗法尔斯通讯社（Fars News Agency）报道。法尔斯通讯社是伊朗亲伊斯兰革命卫队背景的半官方媒体，战略顾问迈赫迪·穆罕默迪为伊朗谈判团队核心成员",
        credibility: "中",
        historical_behavior: "新华社作为中国官方通讯社，在国际新闻报道上通常较为审慎，但此次选择发布伊朗单方面披露的备忘录细节，本身即具有外交信号意义。法尔斯通讯社历史上多次发布伊朗政府立场性报道，倾向于呈现对伊朗有利的叙事框架",
        suspicious_indicators: [
          "信息源为伊朗单方面披露，美方尚未公开确认或否认",
          "法尔斯通讯社具有亲革命卫队背景，可能存在选择性披露",
          "伊朗官方明确表示'尚未作出最终决定'，细节可能被用作谈判筹码或舆论施压工具",
          "新华社在敏感时段发布此消息，可能反映中方对局势走向的某种预期或立场"
        ]
      }
    })
  },
  {
    id: 2,
    taskId: 1,
    sourceNodeId: 16,
    itemId: 11,
    seq: 2,
    title: "伊朗披露备忘录细节：全面停止军事行动、解冻资产、解除海运，后续再谈核问题 - political",
    summary: "伊朗通过披露备忘录细节，向国际社会释放'愿意和平解决争端'的信号，同时在谈判中占据道德高地。将核问题置于后续阶段，显示伊朗试图将军事停火与核问题解绑，避免在核问题上过早做出让步。要求美方提供'防止再次出现紧张局势'的保证，实质是要求美国承诺不再对伊朗采取军事行动，这是伊朗的核心政治诉求。选择在新华社等中国官方媒体发布，意在争取中国等大国对伊朗立场的支持，在地缘政治上形成对美国的压力",
    threatLevel: "高",
    intentType: "political",
    parentReportId: 1,
    createdAt: "2026-06-24T13:52:45.710863",
    status: "DRAFT",
    analysisJson: "{}"
  },
  {
    id: 3,
    taskId: 1,
    sourceNodeId: 16,
    itemId: 11,
    seq: 3,
    title: "伊朗披露备忘录细节：全面停止军事行动、解冻资产、解除海运，后续再谈核问题 - economic",
    summary: "伊朗的经济诉求极为明确且层次分明：第一阶段要求解冻部分被冻结资产、暂停部分制裁，为石油销售创造条件；第二阶段要求解除海运限制，恢复海上贸易；最终阶段要求取消一级和二级制裁并进行战争赔偿。这反映出伊朗遭受制裁后经济严重受损的现实困境，以及试图通过分阶段解除制裁实现经济复苏的战略意图。特别值得注意的是，伊朗将石油销售恢复置于优先位置，说明能源出口是其经济命脉。要求战争赔偿是伊朗极为罕见的强硬经济诉求，可能成为后续谈判的重大障碍",
    threatLevel: "高",
    intentType: "economic",
    parentReportId: 1,
    createdAt: "2026-06-24T13:52:45.714034",
    status: "DRAFT",
    analysisJson: "{}"
  },
  {
    id: 4,
    taskId: 1,
    sourceNodeId: 16,
    itemId: 11,
    seq: 4,
    title: "伊朗披露备忘录细节：全面停止军事行动、解冻资产、解除海运，后续再谈核问题 - military",
    summary: "伊朗要求'全面停止针对伊朗 and 黎巴嫩的军事行动'，表明当前冲突可能已扩展至黎巴嫩方向（可能涉及真主党等代理人力量）。要求'防止任何新的军事行动'并要求美方提供安全保障，反映出伊朗对军事安全的深切担忧。将核问题推迟到后续阶段谈判，军事上意味着伊朗可能在核设施保护方面仍有军事准备，不愿在安全保障未落实前放弃核谈判筹码。整体来看，伊朗试图通过外交手段终止军事冲突，但保留核问题作为长期战略威慑工具",
    threatLevel: "高",
    intentType: "military",
    parentReportId: 1,
    createdAt: "2026-06-24T13:52:45.716843",
    status: "DRAFT",
    analysisJson: "{}"
  },
  {
    id: 13,
    taskId: 1,
    sourceNodeId: 41,
    itemId: 11,
    seq: 1,
    title: "伊朗披露备忘录细节：全面停止军事行动、解冻资产、解除海运，后续再谈核问题",
    summary: "战略误导与舆论操控",
    threatLevel: "中",
    intentType: "parent",
    parentReportId: null,
    createdAt: "2026-06-24T20:07:42.97229",
    status: "DRAFT",
    analysisJson: JSON.stringify({
      seq: 1,
      url: "",
      title: "伊朗披露备忘录细节：全面停止军事行动、解冻资产、解除海运，后续再谈核问题",
      verification: {
        supporting_sources: ["新华社电文", "伊朗法尔斯通讯社报道"],
        contradicting_sources: [],
        cross_reference_status: "未验证"
      },
      recommendation: "建议等待美方或第三方独立信源（如路透社、美联社）的确认报道；密切监测波斯湾海域军事动态及伊朗港口货物吞吐量变化；关注伊朗国内强硬派对该‘备忘录’的反应，以判断其真实性和政治可行性。",
      related_events: [
        "美伊在德黑兰或其他中立场地的秘密谈判",
        "美国对伊朗石油出口的海上封锁行动",
        "以色列对伊朗核设施或地区代理人的军事打击",
        "联合国安理会关于伊朗制裁的决议讨论"
      ],
      harm_assessment: {
        severity: "中等",
        long_term: "若谈判破裂，伊朗先前的‘让步’姿态可能被解读为软弱，削弱其长期威慑力；若成功，则可能重塑中东地缘政治格局，影响美国在该地区的战略信誉。",
        short_term: "可能引发市场短暂乐观情绪，导致油价波动；若被误读为‘协议已达成’，可能导致各国调整对伊政策，产生误判。",
        affected_scope: "中东地区、国际能源市场、美伊关系、核不扩散体系"
      },
      intent_judgment: {
        confidence: 75,
        primary_intent: "战略误导与舆论操控",
        economic_intent: "伊朗核心诉求是解除经济制裁，特别是恢复石油出口和国际海运贸易。通过强调‘解冻资产’和‘解除海运限制’，伊朗意在缓解因制裁导致的经济困境，吸引国际资本和贸易伙伴重返伊朗市场。同时，将‘战争赔偿’纳入最终阶段，为未来可能的索赔预留法律和政治基础，增加美国的经济负担。",
        military_intent: "伊朗要求‘全面停止针对伊朗和黎巴嫩的军事行动’，表明其当前军事压力巨大，可能正面临美以联合打击或海上封锁。通过提出‘安全保障’和‘防止新军事行动’，伊朗试图获得事实上的停火协议，而非正式和平条约，以便保留军事反击能力。此举也是向地区代理人（如真主党、胡塞武装）传递信号，要求其在冲突中保持克制或获得支持。",
        political_intent: "伊朗试图通过披露‘备忘录细节’塑造其作为理性谈判方的形象，同时向国内民众和国际社会展示其争取到的‘重大让步’（如停火、解冻资产），以巩固政权合法性。将核问题置于后续阶段，表明伊朗坚持‘先解除制裁、后限制核活动’的策略，避免在军事压力下过早妥协。此举也旨在分化美伊强硬派，向欧洲及中东国家传递‘和平可期’的信号，争取外交空间。",
        detailed_analysis: "该信息反映出伊朗在美伊军事冲突背景下，试图通过外交手段缓解军事压力、恢复经济活力的战略意图。伊朗将谈判内容分为多个阶段，优先解决军事和经济问题，将敏感的核问题后置，这是一种典型的‘分步走’策略，旨在最大化自身利益并最小化立即妥协的成本。然而，由于缺乏美方确认，该‘备忘录’可能仅为伊朗单方面提出的方案或谈判筹码，而非已达成的协议。其披露行为本身即是舆论战的一部分，旨在影响国内民意和国际观感。"
      },
      overall_risk_level: "中",
      publisher_analysis: {
        identity: "新华社（中国官方通讯社），引用伊朗法尔斯通讯社（伊朗官方媒体）及伊朗谈判团队负责人迈赫迪·穆罕默迪",
        credibility: "高",
        historical_behavior: "新华社作为国家通讯社，报道通常经过严格审核，反映中国官方立场或客观事实；法尔斯通讯社是伊朗强硬派背景媒体，常发布有利于伊朗立场的信息。",
        suspicious_indicators: [
          "信息源单一，主要依赖伊朗方面披露，缺乏美方独立确认",
          "报道时间点敏感，可能服务于特定外交或舆论节奏"
        ]
      }
    })
  },
  {
    id: 14,
    taskId: 1,
    sourceNodeId: 41,
    itemId: 11,
    seq: 2,
    title: "伊朗披露备忘录细节：全面停止军事行动、解冻资产、解除海运，后续再谈核问题 - political",
    summary: "伊朗试图通过披露‘备忘录细节’塑造其作为理性谈判方的形象，同时向国内民众和国际社会展示其争取到的‘重大让步’（如停火、解冻资产），以巩固政权合法性。将核问题置于后续阶段，表明伊朗坚持‘先解除制裁、后限制核活动’的策略，避免在军事压力下过早妥协。此举也旨在分化美伊强硬派，向欧洲及中东国家传递‘和平可期’的信号，争取外交空间。",
    threatLevel: "中",
    intentType: "political",
    parentReportId: 13,
    createdAt: "2026-06-24T20:07:42.977436",
    status: "DRAFT",
    analysisJson: "{}"
  },
  {
    id: 15,
    taskId: 1,
    sourceNodeId: 41,
    itemId: 11,
    seq: 3,
    title: "伊朗披露备忘录细节：全面停止军事行动、解冻资产、解除海运，后续再谈核问题 - economic",
    summary: "伊朗核心诉求是解除经济制裁，特别是恢复石油出口和国际海运贸易。通过强调‘解冻资产’和‘解除海运限制’，伊朗意在缓解因制裁导致的经济困境，吸引国际资本和贸易伙伴重返伊朗市场。同时，将‘战争赔偿’纳入最终阶段，为未来可能的索赔预留法律和政治基础，增加美国的经济负担。",
    threatLevel: "中",
    intentType: "economic",
    parentReportId: 13,
    createdAt: "2026-06-24T20:07:42.981056",
    status: "DRAFT",
    analysisJson: "{}"
  },
  {
    id: 16,
    taskId: 1,
    sourceNodeId: 41,
    itemId: 11,
    seq: 4,
    title: "伊朗披露备忘录细节：全面停止军事行动、解冻资产、解除海运，后续再谈核问题 - military",
    summary: "伊朗要求‘全面停止针对伊朗和黎巴嫩的军事行动’，表明其当前军事压力巨大，可能正面临美以联合打击或海上封锁。通过提出‘安全保障’和‘防止新军事行动’，伊朗试图获得事实上的停火协议，而非正式和平条约，以便保留军事反击能力。此举也是向地区代理人（如真主党、胡塞武装）传递信号，要求其在冲突中保持克制或获得支持。",
    threatLevel: "中",
    intentType: "military",
    parentReportId: 13,
    createdAt: "2026-06-24T20:07:42.984985",
    status: "DRAFT",
    analysisJson: "{}"
  },
  {
    id: 9,
    taskId: 1,
    sourceNodeId: 42,
    itemId: 13,
    seq: 1,
    title: "巴基斯坦总理：伊朗将重开霍尔木兹海峡 美国将解除海上封锁",
    summary: "信号释放与外交斡旋",
    threatLevel: "中",
    intentType: "parent",
    parentReportId: null,
    createdAt: "2026-06-24T20:07:04.920215",
    status: "DRAFT",
    analysisJson: JSON.stringify({
      seq: 1,
      url: "",
      title: "巴基斯坦总理：伊朗将重开霍尔木兹海峡 美国将解除海上封锁",
      verification: {
        supporting_sources: ["央视新闻官方报道", "巴基斯坦总理公开声明"],
        contradicting_sources: ["缺乏美国官方或伊朗官方直接确认"],
        cross_reference_status: "部分验证"
      },
      recommendation: "持续监控美伊双方官方声明及霍尔木兹海峡通航情况，关注伊朗核问题谈判进展，评估能源市场波动风险。建议加强与巴基斯坦等调解国的沟通，了解斡旋细节。同时，做好应对冲突可能再次升级的预案。",
      related_events: [
        "美伊海上军事对峙",
        "霍尔木兹海峡航运中断危机",
        "伊朗核问题谈判",
        "美国对伊朗经济制裁",
        "中东地区国家调解努力"
      ],
      harm_assessment: {
        severity: "中等",
        long_term: "若美伊无法达成持久协议，冲突可能再次升级。伊朗可能在经济压力缓解后重新采取强硬立场。长期来看，中东地缘政治格局可能因巴基斯坦等国的调停角色而发生变化。",
        short_term: "全球能源市场可能因海峡重开而稳定，油价波动风险降低。地区紧张局势短期内可能缓解。",
        affected_scope: "全球能源市场、中东地区安全、美伊双边关系、巴基斯坦地区影响力"
      },
      intent_judgment: {
        confidence: 82,
        primary_intent: "信号释放与外交斡旋",
        economic_intent: "霍尔木兹海峡是全球最重要的石油运输通道之一，每日承载约2100万桶原油运输。伊朗重开海峡、美国解除封锁将直接稳定全球能源市场，降低油价波动风险。对美国而言，解除封锁意味着石油进口成本降低，有助于抑制通胀。对伊朗而言，解除封锁可恢复石油出口，缓解经济制裁带来的困境。此外，此举可能为后续伊朗核问题谈判创造更有利的经济环境。",
        military_intent: "美国解除海上封锁表明其军事施压策略取得阶段性成果，可能从直接军事威慑转向外交解决。伊朗重开海峡可能是其在军事对峙中寻求喘息之机的策略性退让，而非真正放弃对抗立场。双方可能通过巴基斯坦斡旋达成临时停火或缓解协议，但长期军事对峙的根源问题（如伊朗核计划、地区影响力争夺）仍未解决。需密切关注双方后续军事部署动态。",
        political_intent: "巴基斯坦试图在中东地缘政治中提升自身地位，通过促成美伊之间的停火或缓和协议，展示其作为地区调停者的影响力。此举也可能反映巴基斯坦希望在美伊之间保持平衡外交，避免过度倒向任何一方。同时，伊朗重开霍尔木兹海峡可能是其对外释放缓和信号，以换取美国解除海上封锁，从而缓解国内经济压力。",
        detailed_analysis: "此信息反映出美伊冲突可能进入缓和阶段。巴基斯坦作为调停方的介入，表明中东地区国家不愿看到冲突持续升级，尤其是能源通道中断对全球经济的影响。伊朗同意重开霍尔木兹海峡，可能是迫于经济压力和军事威慑的双重作用。美国解除封锁则表明其战略目标（恢复航运自由）已部分实现。然而，需警惕这只是临时性缓和，双方可能在后续谈判中重新出现分歧。"
      },
      overall_risk_level: "中",
      publisher_analysis: {
        identity: "巴基斯坦政府/总理办公室，通过央视新闻报道",
        credibility: "高",
        historical_behavior: "巴基斯坦作为伊朗和海湾国家之间的关键调解国，历史上多次在中东冲突中扮演斡旋角色。央视新闻作为国家媒体，报道来源可靠。",
        suspicious_indicators: []
      }
    })
  },
  {
    id: 10,
    taskId: 1,
    sourceNodeId: 42,
    itemId: 13,
    seq: 2,
    title: "巴基斯坦总理：伊朗将重开霍尔木兹海峡 美国将解除海上封锁 - political",
    summary: "巴基斯坦试图在中东地缘政治中提升自身地位，通过促成美伊之间的停火或缓和协议，展示其作为地区调停者的影响力。此举也可能反映巴基斯坦希望在美伊之间保持平衡外交，避免过度倒向任何一方。同时，伊朗重开霍尔木兹海峡可能是其对外释放缓和信号，以换取美国解除海上封锁，从而缓解国内经济压力。",
    threatLevel: "中",
    intentType: "political",
    parentReportId: 9,
    createdAt: "2026-06-24T20:07:04.927156",
    status: "DRAFT",
    analysisJson: "{}"
  },
  {
    id: 11,
    taskId: 1,
    sourceNodeId: 42,
    itemId: 13,
    seq: 3,
    title: "巴基斯坦总理：伊朗将重开霍尔木兹海峡 美国将解除海上封锁 - economic",
    summary: "霍尔木兹海峡是全球最重要的石油运输通道之一，每日承载约2100万桶原油运输。伊朗重开海峡、美国解除封锁将直接稳定全球能源市场，降低油价波动风险。对美国而言，解除封锁意味着石油进口成本降低，有助于抑制通胀。对伊朗而言，解除封锁可恢复石油出口，缓解经济制裁带来的困境。此外，此举可能为后续伊朗核问题谈判创造更有利的经济环境。",
    threatLevel: "中",
    intentType: "economic",
    parentReportId: 9,
    createdAt: "2026-06-24T20:07:04.930013",
    status: "DRAFT",
    analysisJson: "{}"
  },
  {
    id: 12,
    taskId: 1,
    sourceNodeId: 42,
    itemId: 13,
    seq: 4,
    title: "巴基斯坦总理：伊朗将重开霍尔木兹海峡 美国将解除海上封锁 - military",
    summary: "美国解除海上封锁表明其军事施压策略取得阶段性成果，可能从直接军事威慑转向外交解决。伊朗重开海峡可能是其在军事对峙中寻求喘息之机的策略性退让，而非真正放弃对抗立场。双方可能通过巴基斯坦斡旋达成临时停火或缓和协议，但长期军事对峙的根源问题（如伊朗核计划、地区影响力争夺）仍未解决。需密切关注双方后续军事部署动态。",
    threatLevel: "中",
    intentType: "military",
    parentReportId: 9,
    createdAt: "2026-06-24T20:07:04.93219",
    status: "DRAFT",
    analysisJson: "{}"
  }
];

// Reactive states
const reports = ref<IntelligenceReport[]>([]);
const searchQuery = ref('');
const activeTab = ref('analysis');
const selectedParentReport = ref<IntelligenceReport | null>(null);

const tabs = [
  { label: '综合研判', value: 'analysis' },
  { label: '意图维度', value: 'dimensions' },
  { label: '信源验证', value: 'verification' },
  { label: '影响评估', value: 'impact' }
];

// Helper formatting functions
const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${m}-${d} ${h}:${min}`;
};

const formatFullDate = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}:${s}`;
};

const getDimensionName = (type: string) => {
  const map: Record<string, string> = {
    political: '政治',
    economic: '经济',
    military: '军事'
  };
  return map[type] || type;
};

// Filtered and processed computed values
const parentReports = computed(() => {
  return reports.value.filter(r => r.parentReportId === null || r.intentType === 'parent');
});

const filteredParentReports = computed(() => {
  if (!searchQuery.value.trim()) {
    return parentReports.value;
  }
  const q = searchQuery.value.toLowerCase();
  return parentReports.value.filter(r =>
    r.title.toLowerCase().includes(q) ||
    r.summary.toLowerCase().includes(q)
  );
});

const getChildReports = (parentId: number) => {
  return reports.value.filter(r => r.parentReportId === parentId);
};

const parsedAnalysis = computed(() => {
  if (!selectedParentReport.value) return {};
  try {
    return JSON.parse(selectedParentReport.value.analysisJson);
  } catch (e) {
    console.error("Error parsing analysisJson", e);
    return {};
  }
});

const selectParentReport = (rep: IntelligenceReport) => {
  selectedParentReport.value = rep;
  activeTab.value = 'analysis'; // reset tab on change
};

// Load reports data
onMounted(async () => {
  try {
    // Attempt to load reports for taskId 1 (which matches current mock schema)
    const data = await getTaskReports(1);
    if (data && data.length > 0) {
      reports.value = data;
    } else {
      reports.value = fallbackReports;
    }
  } catch (err) {
    console.warn("Failed to fetch task reports, using fallback mock data:", err);
    reports.value = fallbackReports;
  }

  // Pre-select first parent report
  if (parentReports.value.length > 0) {
    selectedParentReport.value = parentReports.value[0];
  }
});
</script>

<style scoped>
/* 完美的微细滚动条 */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #182235;
  border-radius: 2px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #253552;
}

/* line-clamp configuration for clean titles/summaries */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Subtle transitions */
.transition-all {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Glow text for high priority indicators */
.glow-text {
  text-shadow: 0 0 8px rgba(56, 189, 248, 0.4);
}

/* Animation for loading dialog */
.animate-fade-in {
  animation: fadeIn 0.25s ease-out forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
