<template>
    <Transition name="fade">
        <div v-if="isOpen"
            class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
            @click.self="$emit('close')">
            <div
                class="relative w-full max-w-5xl bg-[#0b1220] border border-slate-800 rounded-xl shadow-2xl text-slate-100 flex flex-col max-h-[92vh]">

                <!-- Header -->
                <div
                    class="flex items-center justify-between px-6 py-4 border-b border-slate-800/60 bg-[#0e172a] rounded-t-xl">
                    <div class="flex flex-col space-y-1">
                        <h2 class="text-xl font-bold tracking-wide text-white flex items-center">
                            态势分析报告 <span class="text-slate-400 font-mono text-lg ml-2">#2026-0421-001</span>
                        </h2>
                        <div
                            class="flex items-center text-sky-400 text-xs font-semibold hover:text-sky-300 transition-colors cursor-pointer pl-0.5">
                            <span class="mr-1.5 text-sm">•</span>
                            <span>综合研判参谋</span>
                        </div>
                    </div>
                    <div class="flex items-center space-x-4">
                        <!-- 跳过演示按钮 -->
                        <button v-if="currentStep < 16" @click="skipAnimation"
                            class="text-[11px] text-sky-400 hover:text-sky-300 bg-sky-950/40 hover:bg-sky-950/60 px-2.5 py-1 rounded border border-sky-800/50 transition-colors font-sans flex items-center gap-1.5 animate-pulse">
                            <span>⚡ 跳过演示</span>
                        </button>
                        <span
                            class="text-xs text-slate-400 bg-slate-800/60 px-2.5 py-1 rounded border border-slate-700/50 font-mono">
                            7-12小时前
                        </span>
                        <button @click="$emit('close')"
                            class="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded transition-colors"
                            aria-label="Close">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Main Scrollable Body -->
                <div class="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#090d16]">

                    <!-- Top Summary Paragraph -->
                    <div class="space-y-4">
                        <p v-if="currentStep >= 1" class="text-slate-300 leading-relaxed text-sm pb-2 animate-fade-in">
                            <strong> 综合研判结论：</strong>基于多源融合 data（蓝方军事部署、外交谈判动态、多国撤侨信号），蓝方（美以）正在进行大规模联合作战准备，战争风险已进入临界状态。<br>
                            <strong v-if="currentStep >= 2" class="animate-fade-in block mt-2"> 主要迹象：</strong>
                        </p>

                        <ul v-if="currentStep >= 2" class="space-y-2.5 pl-4 text-sm text-slate-300 leading-relaxed">
                            <li v-if="currentStep >= 2" class="animate-fade-in flex items-start">
                                <span class="text-sky-400 mr-2 font-bold">•</span>
                                <span>美军在中东完成伊拉克战争以来最大规模兵力集结。截至2月24日，美国海军和空军已在以色列、约旦、沙特、地中海和阿拉伯海至少集结了280架战术飞机。</span>
                            </li>
                            <li v-if="currentStep >= 3" class="animate-fade-in flex items-start">
                                <span class="text-sky-400 mr-2 font-bold">•</span>
                                <span>美军在中东同时部署“福特”号和“林肯”号两艘航母。</span>
                            </li>
                            <li v-if="currentStep >= 4" class="animate-fade-in flex items-start">
                                <span class="text-sky-400 mr-2 font-bold">•</span>
                                <span>11架F-22已部署至以色列南部奥夫达空军基地，预计还有6架后续抵达。</span>
                            </li>
                            <li v-if="currentStep >= 5" class="animate-fade-in flex items-start">
                                <span class="text-sky-400 mr-2 font-bold">•</span>
                                <span>美军已在卡塔尔、约旦等地区国家部署30余架F-35战机、30余架F-16战机、20余架F-15战机。</span>
                            </li>
                            <li v-if="currentStep >= 6" class="animate-fade-in flex items-start">
                                <span class="text-sky-400 mr-2 font-bold">•</span>
                                <span>大约20架美军加油机于2月26日晚抵达以色列本·古里安机场。</span>
                            </li>
                            <li v-if="currentStep >= 7" class="animate-fade-in flex items-start">
                                <span class="text-sky-400 mr-2 font-bold">•</span>
                                <span>多国同步发布最高级别安全预警，启动在伊朗、以色列公民撤离计划。</span>
                            </li>
                            <li v-if="currentStep >= 8" class="animate-fade-in flex items-start">
                                <span class="text-sky-400 mr-2 font-bold">•</span>
                                <span>2月26日日内瓦第三轮间接谈判未能弥合根本分歧，美方要求伊朗拆除核设施，伊朗拒绝向国外转移浓缩铀。</span>
                            </li>
                        </ul>

                        <p v-if="currentStep >= 9" class="text-slate-300 leading-relaxed text-sm animate-fade-in">
                            <strong> 研判置信度：</strong>高。预计蓝方已具备在短期内发动大规模打击的军事能力。
                        </p>
                    </div>

                    <!-- 多agent独立分析摘要 -->
                    <div v-if="currentStep >= 9" class="space-y-3 animate-fade-in">
                        <h3 class="text-sm font-bold text-slate-200 tracking-wider">多agent独立分析摘要</h3>

                        <div class="space-y-3">
                            <!-- Card 1 -->
                            <div v-if="currentStep >= 10"
                                class="bg-[#131d30]/60 border border-slate-800/80 border-l-4 border-l-yellow-500 rounded-r-lg p-4 space-y-1.5 hover:bg-[#17253d]/70 transition-all duration-300 animate-fade-in">
                                <h4 class="text-sm font-bold text-yellow-500 flex items-center">
                                    <span class="mr-1.5 text-xs">●</span> 制空作战参谋
                                </h4>
                                <p class="text-xs text-slate-300 leading-relaxed">
                                    11架F-22已部署至以色列奥夫达空军基地，预计后续还有6架抵达；美军已在卡塔尔、约旦部署30余架F-35战机；约旦某基地已部署超过60架美军战机（F-35、F-15E、F-16），是通常部署数量的约3倍。
                                </p>
                            </div>

                            <!-- Card 2 -->
                            <div v-if="currentStep >= 11"
                                class="bg-[#131d30]/60 border border-slate-800/80 border-l-4 border-l-orange-500 rounded-r-lg p-4 space-y-1.5 hover:bg-[#17253d]/70 transition-all duration-300 animate-fade-in">
                                <h4 class="text-sm font-bold text-orange-500 flex items-center">
                                    <span class="mr-1.5 text-xs">●</span> 对地打击参谋
                                </h4>
                                <p class="text-xs text-slate-300 leading-relaxed">
                                    美军集结战机涵盖F-15E（70架）、F/A-18E/F（84架）等主力打击平台，约20架空中加油机已抵达以色列，解决了远程奔袭后勤瓶颈。**结论**：蓝方可对伊朗多个核设施实施多方向、多波次协同打击。
                                </p>
                            </div>

                            <!-- Card 3 -->
                            <div v-if="currentStep >= 12"
                                class="bg-[#131d30]/60 border border-slate-800/80 border-l-4 border-l-green-500 rounded-r-lg p-4 space-y-1.5 hover:bg-[#17253d]/70 transition-all duration-300 animate-fade-in">
                                <h4 class="text-sm font-bold text-green-500 flex items-center">
                                    <span class="mr-1.5 text-xs">●</span> 海军作战参谋
                                </h4>
                                <p class="text-xs text-slate-300 leading-relaxed">
                                    2月27日，“福特”号航母抵达以色列水域，预计将停靠海法港，与“林肯”号形成双航母打击群。美军上一次在中东部署“双航母”还是在2025年4月。**结论**：双航母部署是2013年以来罕见的强力部署，我方霍尔木兹海峡通道面临被封锁风险。
                                </p>
                            </div>

                            <!-- Card 4 -->
                            <div v-if="currentStep >= 13"
                                class="bg-[#131d30]/60 border border-slate-800/80 border-l-4 border-l-sky-500 rounded-r-lg p-4 space-y-1.5 hover:bg-[#17253d]/70 transition-all duration-300 animate-fade-in">
                                <h4 class="text-sm font-bold text-sky-500 flex items-center">
                                    <span class="mr-1.5 text-xs">●</span> 防空反导参谋
                                </h4>
                                <p class="text-xs text-slate-300 leading-relaxed">
                                    截至2月27日，美国、加拿大、英国、印度、德国、瑞典、法国、波兰、希腊、塞浦路斯、哈萨克等多国已同步发布最高级别旅行警告及撤离通知。美国驻以大使赫卡比明确要求“今天务必离开”。英国政府从伊朗暂时撤出使馆工作人员。中国驻以色列大使馆发布紧急通知，提醒在以中国公民非必要不外出，提前熟悉周边避弹设施位置。**结论**：撤侨信号大幅提升行动可信度，与军事部署形成交叉印证。
                                </p>
                            </div>

                            <!-- Card 5 -->
                            <div v-if="currentStep >= 14"
                                class="bg-[#131d30]/60 border border-slate-800/80 border-l-4 border-l-lime-500 rounded-r-lg p-4 space-y-1.5 hover:bg-[#17253d]/70 transition-all duration-300 animate-fade-in">
                                <h4 class="text-sm font-bold text-lime-500 flex items-center">
                                    <span class="mr-1.5 text-xs">●</span>态势简报生成Agent
                                </h4>
                                <p class="text-xs text-slate-300 leading-relaxed">
                                    2003年伊拉克战争前和2018年叙利亚打击前，美国均采取多重施压外交叠加大规模军事部署的策略。美军中央司令部司令布拉德·库珀上将26日向特朗普总统汇报了对伊军事行动选项。**结论**：历史战例表明，当军事准备达到“双航母+F-22/F-35前沿部署+多国同步撤侨”的临界水平时，军事行动概率远高于外交突破概率。
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- 研讨辩论过程 -->
                    <div v-if="currentStep >= 15" class="space-y-3 animate-fade-in">
                        <h3 class="text-sm font-bold text-slate-200 tracking-wider">研讨辩论过程</h3>

                        <!-- Accordion -->
                        <div class="border border-slate-800/80 rounded-lg overflow-hidden bg-[#0d1525]/85">
                            <div @click="isDebateExpanded = !isDebateExpanded"
                                class="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-800/40 transition-colors select-none">
                                <span class="text-sm font-semibold text-slate-100 flex items-center">
                                    议题1：当前异常态势是否构成明确的进攻前奏，还是蓝方在进行常态化威慑部署？
                                </span>
                                <svg xmlns="http://www.w3.org/2000/svg"
                                    class="h-5 w-5 text-slate-400 transform transition-transform duration-300"
                                    :class="{ 'rotate-180': !isDebateExpanded }" fill="none" viewBox="0 0 24 24"
                                    stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>

                            <Transition name="slide-fade">
                                <div v-show="isDebateExpanded"
                                    class="border-t border-slate-800/60 p-5 bg-[#080e1a]/95 space-y-4">
                                    <div class="border-l border-slate-750 pl-4 space-y-4 font-sans text-xs">
                                        <p class="text-slate-300 leading-relaxed animate-fade-in">
                                            <strong
                                                class="text-yellow-500 font-semibold font-sans">态势简报生成Agent：</strong>我必须指出一个历史事实——自2019年以来，美军在波斯湾地区出现类似规模的电子侦察和兵力集结异常共7次，其中5次在14天内转入了实际打击，1次转为长期对峙，1次为演习。历史上这类异常模式转化为实战的概率为71%。结合当前与“史诗狂怒”前72小时的异常模式相似度高达85%，我认为这不仅仅是威慑，而是真实的进攻前准备。建议立即进入深度分析。
                                        </p>
                                        <p v-if="currentStep >= 16" class="text-slate-300 leading-relaxed mt-4 animate-fade-in">
                                            <strong
                                                class="text-sky-400 font-semibold font-sans">防空反导分析师：</strong>我补充一个技术视角。伊方S-300的火控雷达开机时长增加了400%，这不是无的放矢。他们的雷达操作员显然探测到了异常——可能是EA-18G的电子侦察信号，也可能是P-8A的侧扫活动。伊方正在做防御性反应，这也暴露了他们的防空部署位置。如果蓝方确实在准备进攻，这些被采集的雷达参数将被用于首波电子压制。从技术角度，当前态势已进入“侦察-反侦察”的危险循环，极易擦枪走火。
                                        </p>
                                    </div>
                                </div>
                            </Transition>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div
                    class="px-6 py-3 border-t border-slate-800/60 bg-[#0e172a] text-right text-xs text-slate-500 font-mono rounded-b-xl">
                    CONFIDENTIAL // INTERNAL USE ONLY
                </div>
            </div>
        </div>
    </Transition>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';

const props = defineProps<{
    isOpen: boolean;
}>();

const emit = defineEmits<{
    (e: 'close'): void;
}>();

const isDebateExpanded = ref(true);
const currentStep = ref(0);
let timerId: any = null;

const startAnimation = () => {
    stopAnimation();
    currentStep.value = 0;
    timerId = setInterval(() => {
        if (currentStep.value < 16) {
            currentStep.value++;
        } else {
            stopAnimation();
        }
    }, 450); // 每步停顿 450ms，保持舒适的阅读速度
};

const stopAnimation = () => {
    if (timerId) {
        clearInterval(timerId);
        timerId = null;
    }
};

const skipAnimation = () => {
    stopAnimation();
    currentStep.value = 16;
};

watch(() => props.isOpen, (newVal) => {
    if (newVal) {
        startAnimation();
    } else {
        stopAnimation();
    }
}, { immediate: true });

onUnmounted(() => {
    stopAnimation();
});
</script>

<style scoped>
/* 渐变过渡动画 */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

/* 抽屉式收起展开动画 */
.slide-fade-enter-active {
    transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
    transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
    transform: translateY(-10px);
    opacity: 0;
}

/* 美化内部滚动条 */
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: #090d16;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #1e293b;
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #334155;
}

/* 动态渐进淡入动画 */
.animate-fade-in {
    animation: fadeIn 0.4s ease-out forwards;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(6px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>