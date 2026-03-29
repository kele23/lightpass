<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { useRouteParams } from '@vueuse/router';
import { useRouter } from 'vue-router';
import { usePS } from '../composable/usePS.ts';
import { useScore } from '../composable/useScore.ts';
import { useGlobalScore } from '../composable/useGlobalScore.ts';
import { useTakes } from '../composable/useTakes.ts';
import { useRunners } from '../composable/useRunners.ts';
import { PS, TakeType } from '../interfaces/db.ts';
import { Score, GlobalScore } from '../interfaces/score.ts';
import { _t } from '../services/dictionary.ts';
import { diff, onlyTimeMs } from '../utils/formats.ts';
import { calculateScore } from '../utils/score.ts';
import raceBg from '../assets/mtb_background.png';

const psParam = useRouteParams('ps');
const router = useRouter();
const { pss } = usePS();
const { takes } = useTakes();
const { runners } = useRunners();

const selectedPS = ref<PS>();
const isGlobal = computed(() => !psParam.value);

// Data sources
const { score: psScore } = useScore(selectedPS);
const { score: globalScore } = useGlobalScore();

const currentScore = computed(() => (isGlobal.value ? globalScore.value : psScore.value));

function formatResult(runner?: { diff?: number; end?: number } | null) {
  if (runner?.diff) return diff(runner.diff);
  if (runner?.end) return onlyTimeMs(runner.end);
  return '---';
}

// Latest Arrivals Feed (Adaptive)
const latestArrivals = computed(() => {
  let filteredTakes = takes.value.filter((t) => t.type === TakeType.end);
  if (!isGlobal.value && selectedPS.value) {
    filteredTakes = filteredTakes.filter((t) => t.ps === selectedPS.value?._id);
  }

  return filteredTakes
    .slice(-12)
    .reverse()
    .map((t) => {
      const runner = runners.value.find((r) => r._id === t.runner);
      return {
        ...t,
        runnerName: runner?.name || _t('Unknown'),
        runnerNumber: runner?.number || '??',
        psName: pss.value.find((p) => p._id === t.ps)?.name || '---',
      };
    });
});

// Carousel Logic (Adaptive)
const currentSlideIndex = ref(0);

interface Slide {
  type: 'category' | 'ps';
  title: string;
  data: (Score | GlobalScore)[];
}

const slides = computed<Slide[]>(() => {
  const result: Slide[] = [];

  // 1. Category Slides (Rankings filtered by category)
  const categories = [...new Set(runners.value.map((r) => r.category))].filter(Boolean);
  categories.forEach((cat) => {
    const catScore = currentScore.value.filter((s) => s.category === cat);
    if (catScore.length > 0) {
      result.push({
        type: 'category',
        title: `${_t('Category')}: ${cat}`,
        data: catScore.slice(0, 8),
      });
    }
  });

  // 2. PS Slides (Only show in Global mode)
  if (isGlobal.value) {
    pss.value.forEach((ps) => {
      const score = calculateScore(ps, takes.value, runners.value);
      const completedScore = score.filter((s) => s.diff);
      if (completedScore.length > 0) {
        result.push({
          type: 'ps',
          title: `${_t('Stage')}: ${ps.name}`,
          data: completedScore.slice(0, 8),
        });
      }
    });
  }

  return result;
});

const currentSlide = computed(() => slides.value[currentSlideIndex.value]);

let carouselInterval: ReturnType<typeof setInterval> | null = null;
function startCarousel() {
  if (carouselInterval) clearInterval(carouselInterval);
  carouselInterval = setInterval(() => {
    if (slides.value.length === 0) return;
    currentSlideIndex.value = (currentSlideIndex.value + 1) % slides.value.length;
  }, 10000); // 10 seconds per slide
}

// Sound logic
let audioCtx: AudioContext | null = null;
function playBeep() {
  if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();

  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.5);
  gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 0.5);
}

// Arrival highlighting
const lastArrivalCount = ref(0);
const showArrivalAlert = ref(false);
const lastArrival = ref<{ name: string; diff?: number } | null>(null);

watch(
  () => takes.value.filter((t) => t.type === TakeType.end).length,
  (newCount) => {
    if (newCount > lastArrivalCount.value && lastArrivalCount.value !== 0) {
      const latest = takes.value.filter((t) => t.type === TakeType.end).slice(-1)[0];

      // Only alert if relevant to current filter
      if (!isGlobal.value && selectedPS.value && latest.ps !== selectedPS.value._id) return;

      const runner = runners.value.find((r) => r._id === latest.runner);
      if (runner) {
        lastArrival.value = {
          name: runner.name,
          diff: currentScore.value.find((s) => s.number === runner.number)?.diff,
        };
        playBeep();
        showArrivalAlert.value = true;
        setTimeout(() => {
          showArrivalAlert.value = false;
        }, 5000);
      }
    }
    lastArrivalCount.value = newCount;
  },
);

// Fullscreen
const rootElement = ref<HTMLElement | null>(null);
const isFullscreen = ref(false);
function toggleFullscreen() {
  if (!rootElement.value) return;
  if (!document.fullscreenElement) rootElement.value.requestFullscreen().catch(() => {});
  else document.exitFullscreen();
}
function handleFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement;
}

watch(
  [pss, psParam],
  () => {
    selectedPS.value = psParam.value ? pss.value.find((p) => p._id == psParam.value) : undefined;
  },
  { immediate: true },
);

onMounted(() => {
  startCarousel();
  lastArrivalCount.value = takes.value.filter((t) => t.type === TakeType.end).length;
  document.addEventListener('fullscreenchange', handleFullscreenChange);
});

onUnmounted(() => {
  if (carouselInterval) clearInterval(carouselInterval);
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
});
</script>

<template>
  <div ref="rootElement" class="relative h-screen w-screen overflow-hidden font-sans text-white" data-theme="dark">
    <!-- Background -->
    <div
      class="animate-slow-zoom absolute inset-0 scale-110 bg-cover bg-center bg-no-repeat transition-transform duration-[30s]"
      :style="{ backgroundImage: `url(${raceBg})` }"
    ></div>
    <div class="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90"></div>

    <!-- Header -->
    <div class="relative z-10 flex w-full items-center justify-between p-6 pb-2">
      <div class="flex items-center gap-6">
        <button class="btn btn-ghost btn-circle bg-white/10 backdrop-blur-md hover:bg-white/20" @click="router.back()">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div class="flex flex-col">
          <h1 class="text-5xl leading-none font-black tracking-tighter uppercase italic drop-shadow-2xl">
            {{ isGlobal ? _t('Global Dashboard') : `${_t('Dashboard')} - ${selectedPS?.name}` }}
          </h1>
          <div class="bg-primary mt-2 h-1 w-32 rounded-full"></div>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <div class="mr-4 flex flex-col items-end">
          <div class="text-xs font-bold tracking-widest uppercase opacity-50">Status</div>
          <div class="flex items-center gap-2">
            <span class="relative flex h-3 w-3">
              <span class="bg-error absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"></span>
              <span class="bg-error relative inline-flex h-3 w-3 rounded-full"></span>
            </span>
            <span class="text-error animate-pulse text-lg font-black tracking-tighter uppercase italic"
              >Live Engine</span
            >
          </div>
        </div>
        <button class="btn btn-primary btn-sm shadow-primary/40 rounded-full px-6 shadow-lg" @click="toggleFullscreen">
          {{ isFullscreen ? _t('Exit') : _t('Fullscreen') }}
        </button>
      </div>
    </div>

    <!-- MAIN DASHBOARD -->
    <div class="relative z-10 flex h-[calc(100%-100px)] w-full gap-6 p-6">
      <!-- LEFT: LATEST ARRIVALS (40%) -->
      <div class="flex w-[40%] flex-col gap-4">
        <div class="flex items-center justify-between px-4">
          <h2 class="text-primary text-2xl font-black tracking-tight uppercase italic">{{ _t('Latest Arrivals') }}</h2>
          <span class="badge badge-primary badge-sm font-bold uppercase">{{ latestArrivals.length }} feed</span>
        </div>
        <div
          class="flex-grow overflow-hidden rounded-3xl border border-white/10 bg-black/40 shadow-2xl backdrop-blur-xl"
        >
          <div class="custom-scrollbar h-full overflow-y-auto px-4 py-2">
            <transition-group name="list" tag="div">
              <div
                v-for="arrival in latestArrivals"
                :key="arrival._id"
                class="mb-3 flex items-center gap-4 rounded-2xl border border-white/5 bg-white/5 p-4 transition-all hover:bg-white/10"
              >
                <div
                  class="bg-primary flex h-14 w-14 shrink-0 rotate-3 items-center justify-center rounded-xl shadow-lg"
                >
                  <span class="text-2xl font-black italic">{{ arrival.runnerNumber }}</span>
                </div>
                <div class="flex flex-grow flex-col">
                  <span class="truncate text-xl leading-none font-black uppercase">{{ arrival.runnerName }}</span>
                  <span class="mt-1 text-[10px] font-bold tracking-widest uppercase opacity-40">{{
                    arrival.psName
                  }}</span>
                </div>
                <div class="text-right">
                  <div class="text-primary font-mono text-xl font-bold">{{ onlyTimeMs(arrival.time) }}</div>
                  <div class="text-[10px] font-bold uppercase opacity-30">
                    {{ new Date(arrival.time).toLocaleTimeString() }}
                  </div>
                </div>
              </div>
            </transition-group>
            <div
              v-if="latestArrivals.length === 0"
              class="flex h-full items-center justify-center font-black text-white/10 uppercase italic"
            >
              {{ _t('Waiting for times') }}...
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT: RANKINGS (60%) -->
      <div class="flex w-[60%] flex-col gap-6">
        <!-- TOP: ABSOLUTE RANKING -->
        <div class="flex h-[55%] flex-col gap-3">
          <div class="flex items-center justify-between px-4">
            <h2 class="text-warning text-2xl font-black tracking-tight uppercase italic">{{ _t('Standings') }}</h2>
            <div class="from-warning/50 mx-4 h-1 flex-grow rounded-full bg-gradient-to-r to-transparent"></div>
          </div>
          <div
            class="border-warning/10 flex-grow overflow-hidden rounded-3xl border bg-black/60 shadow-2xl backdrop-blur-2xl"
          >
            <div
              class="bg-warning/10 grid grid-cols-6 border-b border-white/10 px-6 py-3 text-[10px] font-black tracking-[0.2em] uppercase italic opacity-80"
            >
              <div class="col-span-1">RANK</div>
              <div class="col-span-1">NUM</div>
              <div class="col-span-3">RUNNER</div>
              <div class="col-span-1 text-right">TIME</div>
            </div>
            <div class="h-full overflow-x-hidden overflow-y-hidden">
              <div class="divide-y divide-white/5">
                <div
                  v-for="(runner, index) in currentScore.slice(0, 8)"
                  :key="runner.number"
                  class="grid grid-cols-6 items-center px-6 py-3 transition-colors hover:bg-white/5"
                >
                  <div
                    class="col-span-1 text-2xl font-black italic"
                    :class="index < 3 ? 'text-warning' : 'text-white/40'"
                  >
                    {{ (index + 1).toString().padStart(2, '0') }}
                  </div>
                  <div class="col-span-1 font-mono text-lg font-bold opacity-40">{{ runner.number }}</div>
                  <div class="col-span-3 flex flex-col">
                    <span class="text-lg leading-tight font-black uppercase">{{ runner.name }}</span>
                    <span class="text-[10px] font-bold tracking-widest uppercase opacity-30">{{
                      runner.category
                    }}</span>
                  </div>
                  <div class="text-warning col-span-1 text-right font-mono text-xl font-black">
                    {{ formatResult(runner) }}
                  </div>
                </div>
              </div>
              <div
                v-if="currentScore.filter((s) => s.diff).length === 0"
                class="flex h-64 items-center justify-center font-black text-white/10 uppercase italic"
              >
                {{ _t('No results yet') }}
              </div>
            </div>
          </div>
        </div>

        <!-- BOTTOM: CAROUSEL (CATEGORIES & PS) -->
        <div class="flex h-[45%] flex-col gap-3">
          <div class="flex items-center justify-between px-4">
            <h2 class="text-2xl font-black tracking-tight text-white uppercase italic transition-all duration-500">
              {{ currentSlide?.title || _t('Category Rankings') }}
            </h2>
            <div class="flex gap-1">
              <div
                v-for="(_, i) in slides"
                :key="i"
                class="h-1 w-4 rounded-full transition-all duration-300"
                :class="i === currentSlideIndex ? 'bg-primary w-8' : 'bg-white/10'"
              ></div>
            </div>
          </div>
          <div
            class="relative flex-grow overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl"
          >
            <transition name="slide-fade" mode="out-in">
              <div :key="currentSlideIndex" class="flex h-full flex-col p-4">
                <div v-if="currentSlide" class="divide-y divide-white/5 overflow-hidden">
                  <div
                    v-for="(runner, index) in currentSlide.data.slice(0, 4)"
                    :key="runner.number"
                    class="grid grid-cols-6 items-center px-2 py-2"
                  >
                    <div class="text-primary/60 col-span-1 text-xl font-black italic">#{{ index + 1 }}</div>
                    <div class="col-span-5 flex items-center justify-between">
                      <span class="mr-4 truncate text-lg font-black uppercase">{{ runner.name }}</span>
                      <span class="font-mono text-lg font-bold">{{ formatResult(runner) }}</span>
                    </div>
                  </div>
                </div>
                <div v-else class="flex h-full items-center justify-center font-black text-white/20 uppercase italic">
                  {{ _t('Preparing Standings') }}...
                </div>
              </div>
            </transition>
          </div>
        </div>
      </div>
    </div>

    <!-- Arrival Alert Overlay -->
    <transition
      enter-active-class="transform transition ease-out duration-500"
      enter-from-class="translate-y-full opacity-0 scale-50"
      enter-to-class="translate-y-0 opacity-100 scale-100"
      leave-active-class="transition ease-in duration-300"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-125"
    >
      <div
        v-if="showArrivalAlert"
        class="pointer-events-none fixed bottom-12 left-1/2 z-50 w-full max-w-xl -translate-x-1/2"
      >
        <div class="bg-primary rounded-3xl p-1 shadow-[0_0_100px_rgba(var(--p),0.5)]">
          <div
            class="flex items-center justify-between rounded-[1.4rem] border border-white/20 bg-black/80 p-6 backdrop-blur-2xl"
          >
            <div class="flex items-center gap-6">
              <div class="bg-primary rotate-3 rounded-2xl p-4 text-white shadow-lg">
                <span class="text-4xl font-black italic">NEW</span>
              </div>
              <div class="flex flex-col">
                <div class="text-primary text-[10px] font-bold tracking-[0.3em] uppercase">Nuovo Arrivo</div>
                <div class="text-4xl font-black tracking-tighter uppercase italic">{{ lastArrival?.name }}</div>
              </div>
            </div>
            <div class="text-right">
              <div class="font-mono text-5xl font-black italic">{{ formatResult(lastArrival) }}</div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');

.font-sans {
  font-family:
    'Inter',
    system-ui,
    -apple-system,
    sans-serif;
}

@keyframes slow-zoom {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}
.animate-slow-zoom {
  animation: slow-zoom 45s infinite ease-in-out;
}

::-webkit-scrollbar {
  display: none;
}
.custom-scrollbar::-webkit-scrollbar {
  display: block;
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

/* Transitions */
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.slide-fade-enter-active {
  transition: all 0.5s ease-out;
}
.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}
.slide-fade-enter-from {
  transform: translateX(20px);
  opacity: 0;
}
.slide-fade-leave-to {
  transform: translateX(-20px);
  opacity: 0;
}
</style>
