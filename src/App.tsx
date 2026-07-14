import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3,
  Bot,
  Boxes,
  CalendarDays,
  ClipboardCheck,
  Coins,
  FlaskConical,
  Lightbulb,
  History,
  MessageSquareText,
  PackageSearch,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Store,
  SlidersHorizontal,
  UserRoundCog,
  TrendingUp,
  Upload,
} from 'lucide-react';
import itemMoonCake from './assets/item-moon-cake.svg';
import itemSpiritTea from './assets/item-spirit-tea.svg';
import itemPaperLantern from './assets/item-paper-lantern.svg';
import itemFoxMask from './assets/item-fox-mask.svg';
import itemRainBell from './assets/item-rain-bell.svg';
import npcAqing from './assets/npc-aqing.svg';
import npcFoxBoy from './assets/npc-fox-boy.svg';
import npcRainScholar from './assets/npc-rain-scholar.svg';
import eventFog from './assets/event-fog.svg';
import eventLanternOut from './assets/event-lantern-out.svg';
import eventMysteriousOrder from './assets/event-mysterious-order.svg';

type ProductId = 'moonCake' | 'spiritTea' | 'paperLantern' | 'foxMask' | 'rainBell';
type Tab = 'game' | 'ops' | 'agent' | 'config';
type NpcId = 'aqing' | 'umbrellaGranny' | 'foxBoy' | 'nightWatch' | 'lanternSmith';

type Product = {
  id: ProductId;
  name: string;
  cost: number;
  price: number;
  stock: number;
  charm: number;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare';
  description: string;
};

type Npc = {
  id: NpcId;
  name: string;
  role: string;
  baseMood: string;
  budget: number;
  favorite: ProductId;
  dislikes: ProductId[];
  memoryHook: string;
  quote: string;
  avatar: string;
  portrait: string;
};

type MysteryEventId = 'nightFog' | 'lanternOut' | 'mysteriousOrder';

type MysteryEvent = {
  id: MysteryEventId;
  title: string;
  description: string;
  effect: string;
  tag: string;
  illustration: string;
};

type NpcMemory = {
  affinity: number;
  visits: number;
  lastBought?: string;
  lastFeedback: string;
  mood: string;
};

type RelationshipQuest = {
  id: 'lanternPromise';
  npcId: 'lanternSmith';
  title: string;
  description: string;
  progress: number;
  target: number;
  status: 'active' | 'completed';
  reward: string;
};

type AchievementId = 'firstSale' | 'lanternBond' | 'trustedRegular' | 'steadyNight';

type Achievement = {
  id: AchievementId;
  title: string;
  description: string;
  reward: string;
  status: 'locked' | 'unlocked';
  unlockedAtDay?: number;
};

type EventChoiceId = 'fogLamp' | 'saveOil' | 'newWick' | 'borrowDark' | 'acceptOrder' | 'declineOrder';

type EventChoiceOption = {
  id: EventChoiceId;
  title: string;
  description: string;
  effect: string;
  coinsDelta: number;
  reputationDelta: number;
  satisfactionDelta: number;
};

type EventChoiceRecord = {
  day: number;
  eventId: MysteryEventId;
  optionId: EventChoiceId;
  title: string;
  effect: string;
};

type DailyGoal = {
  day: number;
  title: string;
  description: string;
  reward: number;
  checks: Array<{
    label: string;
    current: number;
    target: number;
    unit: string;
  }>;
};

type ReputationBranch = {
  tier: 'low' | 'steady' | 'high';
  title: string;
  description: string;
  effect: string;
  progress: number;
};

type ProductComboId = 'warmLightSet' | 'rainPatrolSet' | 'festivalRumorSet';

type ProductCombo = {
  id: ProductComboId;
  title: string;
  description: string;
  products: ProductId[];
  effect: string;
  charmBonus: Partial<Record<ProductId, number>>;
  saleBonus: Partial<Record<ProductId, number>>;
  riskWeight: number;
  eventBias: Partial<Record<MysteryEventId, number>>;
};

type RumorForecast = {
  heat: number;
  title: string;
  description: string;
  nextEvent: MysteryEvent;
  eventScores: Array<{
    id: MysteryEventId;
    title: string;
    score: number;
  }>;
};

type AgentTrace = {
  day: number;
  npcName: string;
  tools: string[];
  decision: string;
  guardrail: string;
};

type TuningSuggestion = {
  key: string;
  before: string | number;
  after: string | number;
  reason: string;
};

type ActivityConfigDraft = {
  activityId: string;
  target: string;
  segment: string;
  trigger: string;
  bonus: string;
  tuning: TuningSuggestion[];
  expectedImpact: {
    conversionLift: string;
    retentionScore: number;
  };
  guardrail: string;
};

type LiveOpsConfig = {
  version: string;
  status: 'draft' | 'approved' | 'applied' | 'rolled_back';
  activity: ActivityConfigDraft;
  appliedAt?: string;
  rollbackFrom?: string;
};

type ConfigValidation = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

type GameEvent = {
  day: number;
  type: 'buy_stock' | 'npc_visit' | 'sale' | 'missed_sale' | 'npc_memory' | 'mystery_event' | 'event_choice' | 'daily_goal' | 'reputation_branch' | 'product_combo' | 'rumor_heat' | 'relationship_quest' | 'achievement' | 'config_apply' | 'config_rollback' | 'day_end' | 'reset';
  label: string;
  value: number;
};

type GameState = {
  day: number;
  coins: number;
  reputation: number;
  satisfaction: number;
  products: Product[];
  events: GameEvent[];
  visits: number;
  sales: number;
  revenue: number;
  currentNpcIndex: number;
  lastMessage: string;
  npcMemories: Record<NpcId, NpcMemory>;
  agentTraces: AgentTrace[];
  activeConfig: LiveOpsConfig;
  configHistory: LiveOpsConfig[];
  activeMysteryEvent: MysteryEvent;
  eventChoices: EventChoiceRecord[];
  relationshipQuest: RelationshipQuest;
  achievements: Achievement[];
  completed: boolean;
};

type LocalSaveMeta = {
  savedAt?: string;
  status: 'ready' | 'saved' | 'unavailable' | 'error';
  message: string;
};

type SavedGamePayload = {
  version: string;
  savedAt: string;
  game: GameState;
};

type SaveSlot = {
  id: string;
  title: string;
  savedAt: string;
  day: number;
  visits: number;
  sales: number;
  coins: number;
  game: GameState;
};

type DemoSnapshotPayload = {
  schema: 'second-game-demo-snapshot';
  version: string;
  exportedAt: string;
  game: GameState;
};

const LOCAL_SAVE_KEY = 'second-game.local-save.v1';
const LOCAL_SAVE_SLOTS_KEY = 'second-game.local-save-slots.v1';
const LOCAL_SAVE_VERSION = 'local-save-0.1.0';
const MAX_SAVE_SLOTS = 3;

const assetMap = {
  moonCake: itemMoonCake,
  spiritTea: itemSpiritTea,
  paperLantern: itemPaperLantern,
  foxMask: itemFoxMask,
  rainBell: itemRainBell,
  aqing: npcAqing,
  foxBoy: npcFoxBoy,
  rainScholar: npcRainScholar,
  nightFog: eventFog,
  lanternOut: eventLanternOut,
  mysteriousOrder: eventMysteriousOrder,
};

const initialProducts: Product[] = [
  { id: 'moonCake', name: '月影糕', cost: 6, price: 12, stock: 2, charm: 2, icon: assetMap.moonCake, rarity: 'common', description: '甜味稳心，适合疲惫的夜行人。' },
  { id: 'spiritTea', name: '醒魂茶', cost: 8, price: 16, stock: 1, charm: 3, icon: assetMap.spiritTea, rarity: 'uncommon', description: '雾夜提神，能安抚紧张顾客。' },
  { id: 'paperLantern', name: '纸灯笼', cost: 5, price: 11, stock: 2, charm: 1, icon: assetMap.paperLantern, rarity: 'common', description: '暖光小物，灯纸匠最看重手艺。' },
  { id: 'foxMask', name: '狐面具', cost: 10, price: 22, stock: 1, charm: 4, icon: assetMap.foxMask, rarity: 'rare', description: '节庆稀货，利润高但更挑顾客。' },
  { id: 'rainBell', name: '雨铃', cost: 7, price: 15, stock: 1, charm: 2, icon: assetMap.rainBell, rarity: 'uncommon', description: '雨声清脆，能引来老街常客。' },
];

const npcs: Npc[] = [
  {
    id: 'aqing',
    name: '阿青',
    role: '赶夜路的学生',
    baseMood: '紧张',
    budget: 16,
    favorite: 'spiritTea',
    dislikes: ['foxMask'],
    memoryHook: '会记住老板有没有在雾夜里帮他稳住心神。',
    quote: '我总觉得身后有人，来杯能醒神的东西吧。',
    avatar: '青',
    portrait: assetMap.aqing,
  },
  {
    id: 'umbrellaGranny',
    name: '灰伞婆婆',
    role: '雨巷常客',
    baseMood: '挑剔',
    budget: 14,
    favorite: 'rainBell',
    dislikes: ['paperLantern'],
    memoryHook: '会记住摊主是否尊重她对铃声的讲究。',
    quote: '铃声要清，不然夜里的路会走偏。',
    avatar: '伞',
    portrait: assetMap.rainScholar,
  },
  {
    id: 'foxBoy',
    name: '狐面少年',
    role: '节庆演员',
    baseMood: '兴奋',
    budget: 26,
    favorite: 'foxMask',
    dislikes: ['moonCake'],
    memoryHook: '会记住摊主有没有理解他的表演欲。',
    quote: '老板，有没有戴上就不像自己的面具？',
    avatar: '狐',
    portrait: assetMap.foxBoy,
  },
  {
    id: 'nightWatch',
    name: '巡夜人',
    role: '街口守夜者',
    baseMood: '疲惫',
    budget: 18,
    favorite: 'moonCake',
    dislikes: ['rainBell'],
    memoryHook: '会记住摊主是否给过他能撑过长夜的东西。',
    quote: '今晚雾重，甜一点的东西能稳住心。',
    avatar: '巡',
    portrait: assetMap.rainScholar,
  },
  {
    id: 'lanternSmith',
    name: '灯纸匠',
    role: '手艺人',
    baseMood: '温和',
    budget: 15,
    favorite: 'paperLantern',
    dislikes: ['spiritTea'],
    memoryHook: '会记住摊主是否懂灯纸和手艺的价值。',
    quote: '好灯不怕风，怕的是没人点它。',
    avatar: '灯',
    portrait: assetMap.aqing,
  },
];

const mysteryEvents: MysteryEvent[] = [
  {
    id: 'nightFog',
    title: '夜雾压街',
    description: '雾气让顾客更谨慎，只有命中偏好的商品最容易成交。',
    effect: '所有顾客预算 -2；命中偏好时额外满意 +2。',
    tag: '风险',
    illustration: assetMap.nightFog,
  },
  {
    id: 'lanternOut',
    title: '纸灯将熄',
    description: '灯火忽明忽暗，纸灯笼和醒魂茶会变得更有吸引力。',
    effect: '纸灯笼、醒魂茶魅力临时 +2。',
    tag: '机会',
    illustration: assetMap.lanternOut,
  },
  {
    id: 'mysteriousOrder',
    title: '神秘订单',
    description: '有人留下没有署名的订单，高魅力商品会得到额外打赏。',
    effect: '出售魅力 3 以上商品时额外 +4 铜钱。',
    tag: '奖励',
    illustration: assetMap.mysteriousOrder,
  },
];

const dailyGoalDefinitions = [
  {
    day: 1,
    title: '雾夜开张',
    description: '完成 2 次接待，赚到 25 枚铜钱。',
    reward: 8,
  },
  {
    day: 2,
    title: '稳住街坊',
    description: '满意度保持 62 以上，并完成 3 次接待。',
    reward: 10,
  },
  {
    day: 3,
    title: '试营业收官',
    description: '卖出至少 4 件商品，声望达到 12。',
    reward: 12,
  },
];

const productCombos: ProductCombo[] = [
  {
    id: 'warmLightSet',
    title: '暖灯茶点',
    description: '纸灯笼和醒魂茶同时有货时，雾夜顾客更安心。',
    products: ['paperLantern', 'spiritTea'],
    effect: '醒魂茶、纸灯笼魅力 +1；卖出醒魂茶额外满意 +2。',
    charmBonus: { paperLantern: 1, spiritTea: 1 },
    saleBonus: { spiritTea: 2 },
    riskWeight: -6,
    eventBias: { lanternOut: 12, nightFog: -8 },
  },
  {
    id: 'rainPatrolSet',
    title: '巡夜口粮',
    description: '月影糕和雨铃同时备货时，守夜人更容易相信摊主。',
    products: ['moonCake', 'rainBell'],
    effect: '月影糕、雨铃魅力 +1；卖出月影糕额外声望 +1。',
    charmBonus: { moonCake: 1, rainBell: 1 },
    saleBonus: { moonCake: 1 },
    riskWeight: -4,
    eventBias: { nightFog: -6, lanternOut: 6 },
  },
  {
    id: 'festivalRumorSet',
    title: '灯下面具传闻',
    description: '纸灯笼和狐面具同时摆出时，稀有商品更像一条怪谈线索。',
    products: ['paperLantern', 'foxMask'],
    effect: '狐面具魅力 +1；卖出狐面具额外 +3 铜钱。',
    charmBonus: { foxMask: 1 },
    saleBonus: { foxMask: 3 },
    riskWeight: 18,
    eventBias: { mysteriousOrder: 24, nightFog: 8 },
  },
];

const initialRelationshipQuest: RelationshipQuest = {
  id: 'lanternPromise',
  npcId: 'lanternSmith',
  title: '灯纸匠的旧灯约',
  description: '灯纸匠想确认摊主是否真懂灯纸。向他卖出 2 次纸灯笼，解锁纸灯笼补货折扣。',
  progress: 0,
  target: 2,
  status: 'active',
  reward: '纸灯笼补货成本 -2',
};

const initialAchievements: Achievement[] = [
  {
    id: 'firstSale',
    title: '第一盏灯亮',
    description: '完成第一笔成交，让夜市摊真正开张。',
    reward: '成就记录进入运营漏斗',
    status: 'locked',
  },
  {
    id: 'lanternBond',
    title: '旧灯约兑现',
    description: '完成灯纸匠关系线，解锁纸灯笼补货折扣。',
    reward: '剧情成长反馈',
    status: 'locked',
  },
  {
    id: 'trustedRegular',
    title: '回头客信任',
    description: '任意 NPC 好感达到 6，证明推荐策略被记住。',
    reward: '稀有顾客运营标签',
    status: 'locked',
  },
  {
    id: 'steadyNight',
    title: '稳摊一夜',
    description: '某一天接待至少 2 人且没有流失。',
    reward: '低流失经营样本',
    status: 'locked',
  },
];

const initialNpcMemories: Record<NpcId, NpcMemory> = {
  aqing: { affinity: 0, visits: 0, mood: '紧张', lastFeedback: '还没有和摊主真正打过交道。' },
  umbrellaGranny: { affinity: 0, visits: 0, mood: '挑剔', lastFeedback: '还在观察这家摊子的规矩。' },
  foxBoy: { affinity: 0, visits: 0, mood: '兴奋', lastFeedback: '想看看摊主懂不懂节庆。' },
  nightWatch: { affinity: 0, visits: 0, mood: '疲惫', lastFeedback: '只希望今晚别再白跑一趟。' },
  lanternSmith: { affinity: 0, visits: 0, mood: '温和', lastFeedback: '愿意给新摊主一点耐心。' },
};

const baselineActivity: ActivityConfigDraft = {
  activityId: 'baseline-night-market',
  target: '保持基础经营循环稳定',
  segment: 'all_players',
  trigger: 'new_game_start',
  bonus: '无额外补贴',
  tuning: [
    {
      key: 'preferred_item_restock_priority',
      before: 'manual',
      after: 'normal',
      reason: '基础版本使用手动补货。',
    },
  ],
  expectedImpact: {
    conversionLift: 'baseline',
    retentionScore: 0,
  },
  guardrail: '基线配置不改变局内数值。',
};

const baselineConfig: LiveOpsConfig = {
  version: 'baseline-0.0.0',
  status: 'applied',
  activity: baselineActivity,
  appliedAt: 'game_start',
};

const makeInitialState = (): GameState => ({
  day: 1,
  coins: 56,
  reputation: 5,
  satisfaction: 66,
  products: initialProducts,
  events: [
    { day: 1, type: 'reset', label: '新摊开张', value: 0 },
    { day: 1, type: 'mystery_event', label: mysteryEvents[0].title, value: 1 },
  ],
  visits: 0,
  sales: 0,
  revenue: 0,
  currentNpcIndex: 0,
  lastMessage: '夜市刚亮灯。先补一点货，再接待第一位客人。',
  npcMemories: initialNpcMemories,
  agentTraces: [],
  activeConfig: baselineConfig,
  configHistory: [baselineConfig],
  activeMysteryEvent: mysteryEvents[0],
  eventChoices: [],
  relationshipQuest: initialRelationshipQuest,
  achievements: initialAchievements,
  completed: false,
});

function isGameState(value: unknown): value is GameState {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<GameState>;

  return (
    typeof candidate.day === 'number' &&
    typeof candidate.coins === 'number' &&
    typeof candidate.reputation === 'number' &&
    Array.isArray(candidate.products) &&
    Array.isArray(candidate.events) &&
    Array.isArray(candidate.agentTraces) &&
    Array.isArray(candidate.eventChoices) &&
    Boolean(candidate.activeMysteryEvent) &&
    Boolean(candidate.relationshipQuest) &&
    Array.isArray(candidate.achievements)
  );
}

function loadSavedGame(): { game: GameState; savedAt: string } | undefined {
  if (typeof window === 'undefined') return undefined;

  try {
    const raw = window.localStorage.getItem(LOCAL_SAVE_KEY);
    if (!raw) return undefined;
    const payload = JSON.parse(raw) as Partial<SavedGamePayload>;

    if (payload.version !== LOCAL_SAVE_VERSION || !payload.savedAt || !isGameState(payload.game)) {
      window.localStorage.removeItem(LOCAL_SAVE_KEY);
      return undefined;
    }

    return { game: payload.game, savedAt: payload.savedAt };
  } catch {
    window.localStorage.removeItem(LOCAL_SAVE_KEY);
    return undefined;
  }
}

function persistGameLocally(game: GameState) {
  if (typeof window === 'undefined') return undefined;
  const savedAt = new Date().toLocaleString('zh-CN');
  const payload: SavedGamePayload = {
    version: LOCAL_SAVE_VERSION,
    savedAt,
    game,
  };

  window.localStorage.setItem(LOCAL_SAVE_KEY, JSON.stringify(payload));
  return savedAt;
}

function readSaveSlots(): SaveSlot[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(LOCAL_SAVE_SLOTS_KEY);
    if (!raw) return [];
    const slots = JSON.parse(raw) as Partial<SaveSlot>[];
    if (!Array.isArray(slots)) return [];

    return slots
      .filter((slot): slot is SaveSlot =>
        typeof slot.id === 'string' &&
        typeof slot.title === 'string' &&
        typeof slot.savedAt === 'string' &&
        typeof slot.day === 'number' &&
        typeof slot.visits === 'number' &&
        typeof slot.sales === 'number' &&
        typeof slot.coins === 'number' &&
        isGameState(slot.game),
      )
      .slice(0, MAX_SAVE_SLOTS);
  } catch {
    window.localStorage.removeItem(LOCAL_SAVE_SLOTS_KEY);
    return [];
  }
}

function persistSaveSlots(slots: SaveSlot[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOCAL_SAVE_SLOTS_KEY, JSON.stringify(slots.slice(0, MAX_SAVE_SLOTS)));
}

function createSaveSlot(game: GameState): SaveSlot {
  const savedAt = new Date().toLocaleString('zh-CN');
  return {
    id: `slot-${Date.now()}`,
    title: `Day ${game.day} · ${game.sales} 单成交`,
    savedAt,
    day: game.day,
    visits: game.visits,
    sales: game.sales,
    coins: game.coins,
    game,
  };
}

function readImportedGameSnapshot(text: string) {
  const payload = JSON.parse(text) as Partial<DemoSnapshotPayload & SavedGamePayload>;

  if (
    payload.schema === 'second-game-demo-snapshot' &&
    payload.version === LOCAL_SAVE_VERSION &&
    payload.exportedAt &&
    isGameState(payload.game)
  ) {
    return { game: payload.game, sourceTime: payload.exportedAt };
  }

  if (payload.version === LOCAL_SAVE_VERSION && payload.savedAt && isGameState(payload.game)) {
    return { game: payload.game, sourceTime: payload.savedAt };
  }

  return undefined;
}

function exportGameSnapshot(game: GameState, metrics: ReturnType<typeof buildMetrics>, report: ReturnType<typeof buildAgentReport>) {
  if (typeof document === 'undefined') return;

  const exportedAt = new Date().toISOString();
  const snapshot = {
    schema: 'second-game-demo-snapshot',
    version: LOCAL_SAVE_VERSION,
    exportedAt,
    game,
    metrics: {
      conversion: metrics.conversion,
      averageRevenue: metrics.averageRevenue,
      missed: metrics.missed,
      goalCompletion: metrics.goalCompletion,
      activeProductCombos: metrics.activeProductCombos.map((combo) => combo.title),
      rumorForecast: {
        heat: metrics.rumorForecast.heat,
        nextEvent: metrics.rumorForecast.nextEvent.title,
        scores: metrics.rumorForecast.eventScores,
      },
    },
    agentReport: {
      summary: report.summary,
      evidence: report.evidence,
      risk: report.risk,
      action: report.action,
      tuningSuggestions: report.tuningSuggestions,
      configDraft: report.configDraft,
    },
  };
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `night-market-snapshot-day-${game.day}-${exportedAt.slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

const formatSigned = (value: number) => (value > 0 ? `+${value}` : `${value}`);

function appendEvent(state: GameState, event: GameEvent): GameState {
  return { ...state, events: [...state.events, event] };
}

function getDayRevenue(state: GameState, day: number) {
  return state.events
    .filter((event) => event.day === day && event.type === 'sale')
    .reduce((sum, event) => sum + event.value, 0);
}

function getDayVisits(state: GameState, day: number) {
  return state.events.filter((event) => event.day === day && event.type === 'npc_visit').length;
}

function getDaySales(state: GameState, day: number) {
  return state.events.filter((event) => event.day === day && event.type === 'sale').length;
}

function buildDailyGoal(state: GameState, day = state.day): DailyGoal {
  const definition = dailyGoalDefinitions[Math.max(0, Math.min(dailyGoalDefinitions.length - 1, day - 1))];
  const dayRevenue = getDayRevenue(state, day);
  const dayVisits = getDayVisits(state, day);

  if (day === 1) {
    return {
      ...definition,
      checks: [
        { label: '接待', current: dayVisits, target: 2, unit: '人' },
        { label: '收入', current: dayRevenue, target: 25, unit: '铜钱' },
      ],
    };
  }

  if (day === 2) {
    return {
      ...definition,
      checks: [
        { label: '满意度', current: Math.round(state.satisfaction), target: 62, unit: '%' },
        { label: '接待', current: dayVisits, target: 3, unit: '人' },
      ],
    };
  }

  return {
    ...definition,
    checks: [
      { label: '销量', current: state.sales, target: 4, unit: '件' },
      { label: '声望', current: state.reputation, target: 12, unit: '' },
    ],
  };
}

function getDailyGoalProgress(goal: DailyGoal) {
  const progress = goal.checks.reduce((sum, check) => sum + Math.min(1, check.current / check.target), 0) / goal.checks.length;
  return Math.min(100, Math.round(progress * 100));
}

function isDailyGoalCompleted(goal: DailyGoal) {
  return goal.checks.every((check) => check.current >= check.target);
}

function getReputationBranch(reputation: number): ReputationBranch {
  if (reputation <= 3) {
    return {
      tier: 'low',
      title: '巡夜调查',
      description: '街口开始怀疑摊位规矩，顾客出手更谨慎。',
      effect: '所有顾客预算 -1；未成交额外声望 -1。',
      progress: Math.max(0, Math.round((reputation / 4) * 100)),
    };
  }

  if (reputation >= 12) {
    return {
      tier: 'high',
      title: '灯影贵客',
      description: '摊位名声传开，稀有顾客更愿意靠近。',
      effect: '狐面少年更容易到访；稀有商品魅力 +1。',
      progress: 100,
    };
  }

  return {
    tier: 'steady',
    title: '街坊观望',
    description: '夜市还在观察这家新摊，声望稳定但尚未形成传闻。',
    effect: '声望达到 12 会吸引稀有顾客；跌到 3 会触发调查压力。',
    progress: Math.min(100, Math.round((reputation / 12) * 100)),
  };
}

function getNpcForReputation(state: GameState, branch = getReputationBranch(state.reputation), forecast = getRumorForecast(state)) {
  if (forecast.heat >= 68 && state.currentNpcIndex % 2 === 0) {
    return npcs.find((npc) => npc.id === 'foxBoy') ?? npcs[state.currentNpcIndex % npcs.length];
  }

  if (branch.tier === 'high' && state.currentNpcIndex % 3 === 0) {
    return npcs.find((npc) => npc.id === 'foxBoy') ?? npcs[state.currentNpcIndex % npcs.length];
  }

  if (branch.tier === 'low' && state.currentNpcIndex % 2 === 0) {
    return npcs.find((npc) => npc.id === 'nightWatch') ?? npcs[state.currentNpcIndex % npcs.length];
  }

  return npcs[state.currentNpcIndex % npcs.length];
}

function getActiveProductCombos(products: Product[]) {
  return productCombos.filter((combo) =>
    combo.products.every((productId) => products.some((product) => product.id === productId && product.stock > 0)),
  );
}

function getProductComboCharmBonus(product: Product, combos: ProductCombo[]) {
  return combos.reduce((sum, combo) => sum + (combo.charmBonus[product.id] ?? 0), 0);
}

function getProductComboSaleBonus(product: Product, combos: ProductCombo[]) {
  return combos.reduce((sum, combo) => sum + (combo.saleBonus[product.id] ?? 0), 0);
}

function getProductComboLabelsForProduct(product: Product, combos: ProductCombo[]) {
  return combos.filter((combo) => combo.products.includes(product.id)).map((combo) => combo.title);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getRumorForecast(state: GameState, targetDay = state.day + 1): RumorForecast {
  const activeCombos = getActiveProductCombos(state.products);
  const rareStock = state.products.filter((product) => product.rarity === 'rare' && product.stock > 0).length;
  const heat = clamp(
    Math.round(
      38 +
        activeCombos.reduce((sum, combo) => sum + combo.riskWeight, 0) +
        rareStock * 7 +
        (state.reputation >= 12 ? 8 : 0) +
        (state.satisfaction < 55 ? 8 : 0) -
        (state.satisfaction >= 78 ? 4 : 0),
    ),
    0,
    100,
  );
  const scheduledIndex = Math.max(0, targetDay - 1) % mysteryEvents.length;
  const eventScores = mysteryEvents.map((event, index) => {
    const scheduleBias = index === scheduledIndex ? 26 : 10;
    const comboBias = activeCombos.reduce((sum, combo) => sum + (combo.eventBias[event.id] ?? 0), 0);
    const heatBias =
      event.id === 'mysteriousOrder'
        ? Math.round(heat / 4)
        : event.id === 'nightFog'
          ? Math.round((60 - heat) / 6)
          : Math.round((50 - Math.abs(heat - 45)) / 8);

    return {
      id: event.id,
      title: event.title,
      score: Math.max(0, scheduleBias + comboBias + heatBias),
    };
  });
  const nextEventScore = eventScores.reduce((best, item) => (item.score > best.score ? item : best), eventScores[0]);
  const nextEvent = mysteryEvents.find((event) => event.id === nextEventScore.id) ?? mysteryEvents[scheduledIndex];
  const title = heat >= 70 ? '传闻沸腾' : heat >= 45 ? '怪谈升温' : '灯火安稳';
  const description =
    heat >= 70
      ? '稀有货和传闻正在吸引更危险也更高价值的机会。'
      : heat >= 45
        ? '夜市传闻开始扩散，下一日事件更容易被商品组合牵引。'
        : '摊位气氛稳定，暖灯和口粮组合正在压低怪谈风险。';

  return { heat, title, description, nextEvent, eventScores };
}

function getEventChoiceForDay(state: GameState, event = state.activeMysteryEvent) {
  return state.eventChoices.find((choice) => choice.day === state.day && choice.eventId === event.id);
}

function getEventChoiceOptions(event: MysteryEvent): EventChoiceOption[] {
  if (event.id === 'nightFog') {
    return [
      {
        id: 'fogLamp',
        title: '点亮引路灯',
        description: '花 6 铜钱驱散摊前夜雾，让顾客预算不再被压低。',
        effect: '本日夜雾预算惩罚失效。',
        coinsDelta: -6,
        reputationDelta: 0,
        satisfactionDelta: 0,
      },
      {
        id: 'saveOil',
        title: '省下灯油',
        description: '保留铜钱但让顾客继续在雾里犹豫。',
        effect: '+2 铜钱，满意度 -2。',
        coinsDelta: 2,
        reputationDelta: 0,
        satisfactionDelta: -2,
      },
    ];
  }

  if (event.id === 'lanternOut') {
    return [
      {
        id: 'newWick',
        title: '换新灯芯',
        description: '花 5 铜钱让灯火重新稳定，强化纸灯笼和醒魂茶吸引力。',
        effect: '纸灯笼、醒魂茶魅力额外 +1。',
        coinsDelta: -5,
        reputationDelta: 0,
        satisfactionDelta: 0,
      },
      {
        id: 'borrowDark',
        title: '借暗卖面',
        description: '顺着昏暗灯火推销狐面具，但街坊会觉得摊主有些投机。',
        effect: '狐面具魅力 +2，声望 -1。',
        coinsDelta: 0,
        reputationDelta: -1,
        satisfactionDelta: 0,
      },
    ];
  }

  return [
    {
      id: 'acceptOrder',
      title: '接下神秘订单',
      description: '先收 5 铜钱订金，赌今晚高魅力商品能被看中。',
      effect: '高魅力商品打赏提高到 +7；未成交额外满意度 -2。',
      coinsDelta: 5,
      reputationDelta: 0,
      satisfactionDelta: 0,
    },
    {
      id: 'declineOrder',
      title: '婉拒无名订单',
      description: '不冒险接来路不明的订单，街坊会记住摊主谨慎。',
      effect: '声望 +1，神秘订单维持普通打赏。',
      coinsDelta: 0,
      reputationDelta: 1,
      satisfactionDelta: 0,
    },
  ];
}

function hasSteadyNight(state: GameState) {
  return state.events
    .filter((event) => event.type === 'day_end')
    .some((event) => {
      const day = event.day;
      const visits = state.events.filter((item) => item.day === day && item.type === 'npc_visit').length;
      const missed = state.events.filter((item) => item.day === day && item.type === 'missed_sale').length;
      return visits >= 2 && missed === 0;
    });
}

function getSteadyNightDay(state: GameState) {
  return state.events
    .filter((event) => event.type === 'day_end')
    .map((event) => event.day)
    .find((day) => {
      const visits = state.events.filter((item) => item.day === day && item.type === 'npc_visit').length;
      const missed = state.events.filter((item) => item.day === day && item.type === 'missed_sale').length;
      return visits >= 2 && missed === 0;
    });
}

function getAchievementProgress(achievement: Achievement, state: GameState) {
  if (achievement.status === 'unlocked') return 100;

  if (achievement.id === 'firstSale') return Math.min(100, state.sales * 100);
  if (achievement.id === 'lanternBond') {
    return Math.round((state.relationshipQuest.progress / state.relationshipQuest.target) * 100);
  }
  if (achievement.id === 'trustedRegular') {
    const bestAffinity = Math.max(...Object.values(state.npcMemories).map((memory) => memory.affinity));
    return Math.min(100, Math.round((bestAffinity / 6) * 100));
  }

  const dayVisits = state.events.filter((event) => event.day === state.day && event.type === 'npc_visit').length;
  const dayMissed = state.events.filter((event) => event.day === state.day && event.type === 'missed_sale').length;
  return dayMissed > 0 ? 0 : Math.min(100, Math.round((dayVisits / 2) * 100));
}

function evaluateAchievements(state: GameState): GameState {
  const unlockedIds = new Set(state.achievements.filter((achievement) => achievement.status === 'unlocked').map((achievement) => achievement.id));
  const shouldUnlock: Record<AchievementId, boolean> = {
    firstSale: state.sales >= 1,
    lanternBond: state.relationshipQuest.status === 'completed',
    trustedRegular: Object.values(state.npcMemories).some((memory) => memory.affinity >= 6),
    steadyNight: hasSteadyNight(state),
  };

  let nextState = state;
  initialAchievements.forEach((definition) => {
    if (unlockedIds.has(definition.id) || !shouldUnlock[definition.id]) return;

    const unlockedAtDay = definition.id === 'steadyNight' ? getSteadyNightDay(nextState) ?? state.day : state.day;
    nextState = {
      ...nextState,
      achievements: nextState.achievements.map((achievement) =>
        achievement.id === definition.id
          ? { ...achievement, status: 'unlocked', unlockedAtDay }
          : achievement,
      ),
      lastMessage: `${nextState.lastMessage} 成就解锁：${definition.title}。`,
    };
    nextState = appendEvent(nextState, { day: unlockedAtDay, type: 'achievement', label: definition.title, value: 1 });
  });

  return nextState;
}

function getConfigTuning(config: LiveOpsConfig, key: string) {
  return config.activity.tuning.find((item) => item.key === key)?.after;
}

function getRelationshipRestockDiscount(product: Product, quest: RelationshipQuest) {
  return quest.status === 'completed' && product.id === 'paperLantern' ? 2 : 0;
}

function getRestockCost(product: Product, activeConfig: LiveOpsConfig, quest?: RelationshipQuest) {
  const priority = getConfigTuning(activeConfig, 'preferred_item_restock_priority');
  const isPreferred = npcs.some((npc) => npc.favorite === product.id);
  const relationshipDiscount = quest ? getRelationshipRestockDiscount(product, quest) : 0;
  const configDiscount = priority === 'high' && isPreferred ? 1 : 0;

  return Math.max(1, product.cost - configDiscount - relationshipDiscount);
}

function getFirstPurchaseSubsidy(activeConfig: LiveOpsConfig, sales: number) {
  const subsidy = Number(getConfigTuning(activeConfig, 'first_purchase_subsidy') ?? 0);
  return sales === 0 && Number.isFinite(subsidy) ? subsidy : 0;
}

function getEffectiveBudget(npc: Npc, event: MysteryEvent, choice?: EventChoiceRecord, branch?: ReputationBranch) {
  const reputationPenalty = branch?.tier === 'low' ? 1 : 0;

  if (event.id === 'nightFog' && choice?.optionId !== 'fogLamp') {
    return Math.max(6, npc.budget - 2 - reputationPenalty);
  }

  return Math.max(6, npc.budget - reputationPenalty);
}

function getEffectiveCharm(product: Product, event: MysteryEvent, choice?: EventChoiceRecord, branch?: ReputationBranch, combos: ProductCombo[] = []) {
  const reputationBonus = branch?.tier === 'high' && product.rarity === 'rare' ? 1 : 0;
  const comboBonus = getProductComboCharmBonus(product, combos);

  if (event.id === 'lanternOut' && (product.id === 'paperLantern' || product.id === 'spiritTea')) {
    return product.charm + (choice?.optionId === 'newWick' ? 3 : 2) + reputationBonus + comboBonus;
  }

  if (event.id === 'lanternOut' && choice?.optionId === 'borrowDark' && product.id === 'foxMask') {
    return product.charm + 2 + reputationBonus + comboBonus;
  }

  return product.charm + reputationBonus + comboBonus;
}

function getMysterySaleBonus(product: Product, event: MysteryEvent, choice?: EventChoiceRecord) {
  if (event.id !== 'mysteriousOrder' || product.charm < 3) return 0;

  return choice?.optionId === 'acceptOrder' ? 7 : 4;
}

function validateActivityConfig(draft: ActivityConfigDraft): ConfigValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!draft.activityId.trim()) errors.push('activityId 不能为空。');
  if (!draft.target.trim()) errors.push('target 不能为空。');
  if (!draft.segment.trim()) errors.push('segment 不能为空。');
  if (!draft.trigger.trim()) errors.push('trigger 不能为空。');
  if (!draft.guardrail.includes('人工确认')) errors.push('guardrail 必须明确人工确认。');
  if (!Array.isArray(draft.tuning) || draft.tuning.length === 0) errors.push('至少需要 1 条 tuning 建议。');

  draft.tuning.forEach((item) => {
    if (!item.key.trim()) errors.push('tuning.key 不能为空。');
    if (item.after === '') errors.push(`${item.key} 的 after 不能为空。`);
  });

  if (!draft.expectedImpact.conversionLift) warnings.push('缺少转化预期说明。');
  if (draft.expectedImpact.retentionScore < 0 || draft.expectedImpact.retentionScore > 100) {
    warnings.push('留存评分应在 0 到 100 之间。');
  }

  return { valid: errors.length === 0, errors, warnings };
}

function createConfigFromDraft(draft: ActivityConfigDraft, status: LiveOpsConfig['status']): LiveOpsConfig {
  return {
    version: `${draft.activityId}-${status}`,
    status,
    activity: draft,
    appliedAt: status === 'applied' ? new Date().toLocaleString('zh-CN') : undefined,
  };
}

function chooseProductForNpc(npc: Npc, memory: NpcMemory, products: Product[], event: MysteryEvent, choice?: EventChoiceRecord, branch?: ReputationBranch, combos: ProductCombo[] = []) {
  const budget = getEffectiveBudget(npc, event, choice, branch);
  const favorite = products.find((item) => item.id === npc.favorite);
  const fallback = products
    .filter((item) => item.stock > 0 && item.price <= budget && !npc.dislikes.includes(item.id))
    .sort((a, b) => getEffectiveCharm(b, event, choice, branch, combos) + b.price / 10 - (getEffectiveCharm(a, event, choice, branch, combos) + a.price / 10))[0];
  const forgivingFallback = products
    .filter((item) => item.stock > 0 && item.price <= budget)
    .sort((a, b) => getEffectiveCharm(b, event, choice, branch, combos) - getEffectiveCharm(a, event, choice, branch, combos))[0];
  const trustsOwner = memory.affinity >= 4;

  if (favorite && favorite.stock > 0 && favorite.price <= budget) {
    return { chosen: favorite, reason: event.id === 'nightFog' ? '雾夜中命中偏好商品' : '命中偏好商品' };
  }

  if (fallback) {
    return {
      chosen: fallback,
      reason: trustsOwner ? '基于历史好感接受替代推荐' : event.id === 'lanternOut' ? '灯火将熄时选择临时高魅力商品' : '选择预算内高魅力替代品',
    };
  }

  if (trustsOwner && forgivingFallback) {
    return { chosen: forgivingFallback, reason: '因过往好感接受一次不完美推荐' };
  }

  return { chosen: undefined, reason: branch?.tier === 'low' ? '巡夜调查压低预算，库存或偏好不足导致无法成交' : event.id === 'nightFog' ? '夜雾压低预算，库存或偏好不足导致无法成交' : '库存、价格或厌恶偏好导致无法成交' };
}

function buildNpcDialogue(npc: Npc, memory: NpcMemory, product: Product | undefined, liked: boolean, reason: string) {
  if (!product) {
    return `${npc.name}看了看摊位：${memory.visits > 0 ? `上次我记得你说过，${memory.lastFeedback}` : npc.quote} 可今晚还是没有合适的。`;
  }

  if (memory.visits > 0 && liked) {
    return `${npc.name}认出了摊主：还记得我吧？${memory.lastFeedback} 这次的${product.name}正合适。`;
  }

  if (liked) {
    return `${npc.name}低声说：${npc.quote} 这份${product.name}来得正好。`;
  }

  return `${npc.name}想了想：${reason}，那就先试试${product.name}。`;
}

function nextMood(baseMood: string, affinity: number, sold: boolean) {
  if (!sold) return affinity > 0 ? '失望' : '疏离';
  if (affinity >= 6) return '信任';
  if (affinity >= 3) return '熟络';
  return baseMood;
}

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('game');
  const [initialSavedAt] = useState(() => loadSavedGame()?.savedAt);
  const [game, setGame] = useState<GameState>(() => loadSavedGame()?.game ?? makeInitialState());
  const [saveSlots, setSaveSlots] = useState<SaveSlot[]>(() => readSaveSlots());
  const localSaveNoticeRef = useRef<string | undefined>(undefined);
  const [localSaveMeta, setLocalSaveMeta] = useState<LocalSaveMeta>(() => ({
    savedAt: initialSavedAt,
    status: initialSavedAt ? 'saved' : 'ready',
    message: initialSavedAt ? `已加载本地存档：${initialSavedAt}` : '本地自动存档待写入。',
  }));

  const currentReputationBranch = getReputationBranch(game.reputation);
  const rumorForecast = getRumorForecast(game);
  const currentNpc = getNpcForReputation(game, currentReputationBranch, rumorForecast);
  const currentMemory = game.npcMemories[currentNpc.id];
  const currentEvent = game.activeMysteryEvent;
  const currentEventChoice = getEventChoiceForDay(game, currentEvent);
  const currentBudget = getEffectiveBudget(currentNpc, currentEvent, currentEventChoice, currentReputationBranch);
  const currentDailyGoal = buildDailyGoal(game);
  const currentDailyGoalProgress = getDailyGoalProgress(currentDailyGoal);
  const activeProductCombos = getActiveProductCombos(game.products);
  const metrics = useMemo(() => buildMetrics(game), [game]);
  const report = useMemo(() => buildAgentReport(game, metrics), [game, metrics]);

  useEffect(() => {
    try {
      const savedAt = persistGameLocally(game);
      const notice = localSaveNoticeRef.current;
      localSaveNoticeRef.current = undefined;
      if (!savedAt) {
        setLocalSaveMeta({ status: 'unavailable', message: '当前环境不支持本地存档。' });
        return;
      }

      setLocalSaveMeta({ savedAt, status: 'saved', message: notice ?? `已自动存档：${savedAt}` });
    } catch {
      setLocalSaveMeta({ status: 'error', message: '本地存档写入失败，请导出演示快照备份。' });
    }
  }, [game]);

  const buyStock = (productId: ProductId) => {
    setGame((state) => {
      if (state.completed) return state;
      const product = state.products.find((item) => item.id === productId);
      const restockCost = product ? getRestockCost(product, state.activeConfig, state.relationshipQuest) : 0;
      if (!product || state.coins < restockCost) {
        return { ...state, lastMessage: '铜钱不够，今晚只能精打细算。' };
      }

      const nextProducts = state.products.map((item) =>
        item.id === productId ? { ...item, stock: item.stock + 1 } : item,
      );

      return appendEvent(
        {
          ...state,
          coins: state.coins - restockCost,
          products: nextProducts,
          lastMessage: `补进 1 件${product.name}，成本 ${restockCost}。${restockCost < product.cost ? '当前配置或关系奖励降低了补货成本。' : ''}`,
        },
        { day: state.day, type: 'buy_stock', label: product.name, value: -restockCost },
      );
    });
  };

  const applyEventChoice = (optionId: EventChoiceId) => {
    setGame((state) => {
      if (state.completed) return state;
      const activeEvent = state.activeMysteryEvent;
      if (getEventChoiceForDay(state, activeEvent)) {
        return { ...state, lastMessage: '今晚已经做过事件抉择，摊主不能反复改口。' };
      }

      const option = getEventChoiceOptions(activeEvent).find((item) => item.id === optionId);
      if (!option) return state;
      if (state.coins + option.coinsDelta < 0) {
        return { ...state, lastMessage: '铜钱不够，承担不起这个抉择。' };
      }

      const record: EventChoiceRecord = {
        day: state.day,
        eventId: activeEvent.id,
        optionId: option.id,
        title: option.title,
        effect: option.effect,
      };
      const nextState = {
        ...state,
        coins: state.coins + option.coinsDelta,
        reputation: Math.max(0, state.reputation + option.reputationDelta),
        satisfaction: Math.max(0, Math.min(100, state.satisfaction + option.satisfactionDelta)),
        eventChoices: [...state.eventChoices, record],
        lastMessage: `经营抉择：${option.title}。${option.effect}`,
      };

      return appendEvent(nextState, {
        day: state.day,
        type: 'event_choice',
        label: option.title,
        value: option.coinsDelta + option.reputationDelta + option.satisfactionDelta,
      });
    });
  };

  const exportSnapshot = () => {
    exportGameSnapshot(game, metrics, report);
    setLocalSaveMeta((meta) => ({
      ...meta,
      message: '已生成本地演示快照 JSON。',
    }));
  };

  const saveCurrentSlot = () => {
    const nextSlots = [createSaveSlot(game), ...saveSlots].slice(0, MAX_SAVE_SLOTS);
    persistSaveSlots(nextSlots);
    setSaveSlots(nextSlots);
    setLocalSaveMeta((meta) => ({
      ...meta,
      status: 'saved',
      message: `已保存演示槽位：${nextSlots[0].title}。`,
    }));
  };

  const loadSaveSlot = (slot: SaveSlot) => {
    localSaveNoticeRef.current = `已读取演示槽位：${slot.title}，保存于 ${slot.savedAt}。`;
    setGame({
      ...slot.game,
      lastMessage: `已读取演示槽位：${slot.title}。`,
    });
  };

  const deleteSaveSlot = (slotId: string) => {
    const nextSlots = saveSlots.filter((slot) => slot.id !== slotId);
    persistSaveSlots(nextSlots);
    setSaveSlots(nextSlots);
    setLocalSaveMeta((meta) => ({
      ...meta,
      message: '已删除一个本地演示槽位。',
    }));
  };

  const importSnapshot = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;

    try {
      const imported = readImportedGameSnapshot(await file.text());
      if (!imported) {
        setLocalSaveMeta((meta) => ({
          ...meta,
          status: 'error',
          message: '快照导入失败：文件不是当前版本的演示快照。',
        }));
        return;
      }

      localSaveNoticeRef.current = `已导入演示快照：Day ${imported.game.day}，来源 ${imported.sourceTime}。`;
      setGame({
        ...imported.game,
        lastMessage: `已从演示快照恢复 Day ${imported.game.day} 的夜市进度。`,
      });
    } catch {
      setLocalSaveMeta((meta) => ({
        ...meta,
        status: 'error',
        message: '快照导入失败：JSON 解析错误或文件已损坏。',
      }));
    }
  };

  const serveNpc = () => {
    setGame((state) => {
      if (state.completed) return state;
      const reputationBranch = getReputationBranch(state.reputation);
      const rumorForecast = getRumorForecast(state);
      const npc = getNpcForReputation(state, reputationBranch, rumorForecast);
      const memory = state.npcMemories[npc.id];
      const activeEvent = state.activeMysteryEvent;
      const activeChoice = getEventChoiceForDay(state, activeEvent);
      const activeCombos = getActiveProductCombos(state.products);
      const effectiveBudget = getEffectiveBudget(npc, activeEvent, activeChoice, reputationBranch);
      const { chosen, reason } = chooseProductForNpc(npc, memory, state.products, activeEvent, activeChoice, reputationBranch, activeCombos);

      const visitedBase = {
        ...state,
        visits: state.visits + 1,
        currentNpcIndex: state.currentNpcIndex + 1,
      };
      const withVisit = appendEvent(visitedBase, { day: state.day, type: 'npc_visit', label: npc.name, value: 1 });
      const visited = reputationBranch.tier === 'steady'
        ? withVisit
        : appendEvent(withVisit, { day: state.day, type: 'reputation_branch', label: reputationBranch.title, value: state.reputation });

      if (!chosen) {
        const branchReputationPenalty = reputationBranch.tier === 'low' ? 1 : 0;
        const nextMemory: NpcMemory = {
          ...memory,
          visits: memory.visits + 1,
          affinity: Math.max(-3, memory.affinity - 2),
          mood: nextMood(npc.baseMood, memory.affinity - 2, false),
          lastFeedback: '这次没有买到合适的东西，开始怀疑摊主是否懂他的需求。',
        };
        const dialogue = buildNpcDialogue(npc, memory, undefined, false, reason);
        const trace: AgentTrace = {
          day: state.day,
          npcName: npc.name,
          tools: [
            `read_inventory: ${state.products.map((item) => `${item.name}x${item.stock}`).join(', ')}`,
            `read_prices: ${state.products.map((item) => `${item.name}:${item.price}`).join(', ')}`,
            `read_mystery_event: ${activeEvent.title}, effective_budget=${effectiveBudget}`,
            `read_event_choice: ${activeChoice ? `${activeChoice.title}, effect=${activeChoice.effect}` : 'none'}`,
            `read_reputation_branch: ${reputationBranch.title}, tier=${reputationBranch.tier}, effect=${reputationBranch.effect}`,
            `read_product_combos: ${activeCombos.length ? activeCombos.map((combo) => combo.title).join(', ') : 'none'}`,
            `read_rumor_forecast: heat=${rumorForecast.heat}, next=${rumorForecast.nextEvent.title}`,
            `read_npc_memory: visits=${memory.visits}, affinity=${memory.affinity}, mood=${memory.mood}`,
            `read_daily_goal: ${buildDailyGoal(state).title}, progress=${getDailyGoalProgress(buildDailyGoal(state))}%`,
          ],
          decision: reason,
          guardrail: '规则系统只允许扣减满意度和声望，Agent 对话不能直接改写关键数值。',
        };
        return appendEvent(
          {
            ...visited,
            satisfaction: Math.max(0, visited.satisfaction - 6 - (activeChoice?.optionId === 'acceptOrder' ? 2 : 0)),
            reputation: Math.max(0, visited.reputation - 1 - branchReputationPenalty),
            npcMemories: { ...visited.npcMemories, [npc.id]: nextMemory },
            agentTraces: [...visited.agentTraces, trace],
            lastMessage: `${dialogue} 满意度 -${activeChoice?.optionId === 'acceptOrder' ? 8 : 6}，声望 -${1 + branchReputationPenalty}。${branchReputationPenalty ? '巡夜调查放大了流失影响。' : ''}${activeChoice?.optionId === 'acceptOrder' ? '神秘订单催促失败，额外满意度 -2。' : ''}`,
          },
          { day: state.day, type: 'missed_sale', label: npc.name, value: -1 },
        );
      }

      const liked = chosen.id === npc.favorite;
      const eventSatisfactionBonus = activeEvent.id === 'nightFog' && liked ? 2 : 0;
      const satisfactionDelta = (liked ? 8 : 3) + eventSatisfactionBonus;
      const reputationDelta = liked ? 3 : 1;
      const subsidy = getFirstPurchaseSubsidy(state.activeConfig, state.sales);
      const eventBonus = getMysterySaleBonus(chosen, activeEvent, activeChoice);
      const comboBonus = getProductComboSaleBonus(chosen, activeCombos);
      const comboLabels = getProductComboLabelsForProduct(chosen, activeCombos);
      const affinityDelta = liked ? 3 : npc.dislikes.includes(chosen.id) ? -1 : 1;
      const nextAffinity = Math.max(-3, Math.min(10, memory.affinity + affinityDelta));
      const dialogue = buildNpcDialogue(npc, memory, chosen, liked, reason);
      const progressesRelationship =
        state.relationshipQuest.status === 'active' &&
        npc.id === state.relationshipQuest.npcId &&
        chosen.id === 'paperLantern';
      const relationshipProgress = progressesRelationship
        ? Math.min(state.relationshipQuest.target, state.relationshipQuest.progress + 1)
        : state.relationshipQuest.progress;
      const relationshipCompleted =
        state.relationshipQuest.status === 'active' && relationshipProgress >= state.relationshipQuest.target;
      const nextRelationshipQuest: RelationshipQuest = {
        ...state.relationshipQuest,
        progress: relationshipProgress,
        status: relationshipCompleted ? 'completed' : state.relationshipQuest.status,
      };
      const nextMemory: NpcMemory = {
        affinity: nextAffinity,
        visits: memory.visits + 1,
        lastBought: chosen.name,
        lastFeedback: relationshipCompleted
          ? '旧灯约已经兑现，他愿意把灯纸进货门路介绍给摊主。'
          : liked
            ? `上次买到${chosen.name}，觉得摊主抓住了自己的偏好。`
            : `上次接受了${chosen.name}，但仍希望下次能看到更贴合自己的东西。`,
        mood: nextMood(npc.baseMood, nextAffinity, true),
      };
      const trace: AgentTrace = {
        day: state.day,
        npcName: npc.name,
        tools: [
          `read_inventory: ${state.products.map((item) => `${item.name}x${item.stock}`).join(', ')}`,
          `read_prices: ${state.products.map((item) => `${item.name}:${item.price}`).join(', ')}`,
            `read_mystery_event: ${activeEvent.title}, effect=${activeEvent.effect}`,
          `read_event_choice: ${activeChoice ? `${activeChoice.title}, effect=${activeChoice.effect}` : 'none'}`,
          `read_reputation_branch: ${reputationBranch.title}, tier=${reputationBranch.tier}, effect=${reputationBranch.effect}`,
          `read_product_combos: ${activeCombos.length ? activeCombos.map((combo) => combo.title).join(', ') : 'none'}`,
          `read_rumor_forecast: heat=${rumorForecast.heat}, next=${rumorForecast.nextEvent.title}`,
          `read_npc_memory: visits=${memory.visits}, affinity=${memory.affinity}, mood=${memory.mood}`,
          `read_relationship_quest: ${state.relationshipQuest.title}, progress=${relationshipProgress}/${state.relationshipQuest.target}, status=${nextRelationshipQuest.status}`,
          `read_daily_goal: ${buildDailyGoal(state).title}, progress=${getDailyGoalProgress(buildDailyGoal(state))}%`,
        ],
        decision: relationshipCompleted
          ? `${reason}，推荐 ${chosen.name}，并完成 ${state.relationshipQuest.title}`
          : `${reason}，推荐 ${chosen.name}`,
        guardrail: '购买结果由库存、预算、偏好和规则校验确认，Agent 只生成解释和推荐理由。',
      };
      const nextProducts = visited.products.map((item) =>
        item.id === chosen.id ? { ...item, stock: item.stock - 1 } : item,
      );

      const sold = appendEvent(
        {
          ...visited,
          coins: visited.coins + chosen.price + subsidy + eventBonus + (chosen.id === 'foxMask' ? comboBonus : 0),
          reputation: visited.reputation + reputationDelta + (chosen.id === 'moonCake' ? comboBonus : 0),
          satisfaction: Math.min(100, visited.satisfaction + satisfactionDelta + (chosen.id === 'spiritTea' ? comboBonus : 0)),
          products: nextProducts,
          sales: visited.sales + 1,
          revenue: visited.revenue + chosen.price + subsidy + eventBonus + (chosen.id === 'foxMask' ? comboBonus : 0),
          npcMemories: { ...visited.npcMemories, [npc.id]: nextMemory },
          agentTraces: [...visited.agentTraces, trace],
          relationshipQuest: nextRelationshipQuest,
          lastMessage: `${dialogue} 满意度 ${formatSigned(satisfactionDelta + (chosen.id === 'spiritTea' ? comboBonus : 0))}，声望 ${formatSigned(reputationDelta + (chosen.id === 'moonCake' ? comboBonus : 0))}，好感 ${formatSigned(affinityDelta)}。${reputationBranch.tier === 'high' && chosen.rarity === 'rare' ? '灯影贵客传闻让稀有商品更有吸引力。' : ''}${comboBonus ? `${comboLabels.join('、')} 组合触发，${chosen.id === 'foxMask' ? `额外 +${comboBonus} 铜钱。` : chosen.id === 'moonCake' ? `额外声望 +${comboBonus}。` : `额外满意 +${comboBonus}。`}` : ''}${subsidy ? `活动补贴 +${subsidy} 铜钱。` : ''}${eventBonus ? `${activeEvent.title} 打赏 +${eventBonus} 铜钱。` : ''}${relationshipCompleted ? `${state.relationshipQuest.title} 完成，${state.relationshipQuest.reward}。` : progressesRelationship ? `${state.relationshipQuest.title} 进度 ${relationshipProgress}/${state.relationshipQuest.target}。` : ''}`,
        },
        { day: state.day, type: 'sale', label: chosen.name, value: chosen.price + subsidy + eventBonus + (chosen.id === 'foxMask' ? comboBonus : 0) },
      );

      const withComboEvent = comboBonus
        ? appendEvent(sold, { day: state.day, type: 'product_combo', label: comboLabels.join('、'), value: comboBonus })
        : sold;

      const remembered = appendEvent(withComboEvent, { day: state.day, type: 'npc_memory', label: `${npc.name} 好感`, value: affinityDelta });

      const withRelationshipEvent = progressesRelationship
        ? appendEvent(remembered, {
            day: state.day,
            type: 'relationship_quest',
            label: relationshipCompleted ? `${state.relationshipQuest.title} 完成` : `${state.relationshipQuest.title} 推进`,
            value: relationshipProgress,
          })
        : remembered;

      return evaluateAchievements(withRelationshipEvent);
    });
  };

  const endDay = () => {
    setGame((state) => {
      if (state.completed) return state;
      const dailyGoal = buildDailyGoal(state);
      const dailyGoalProgress = getDailyGoalProgress(dailyGoal);
      const dailyGoalCompleted = isDailyGoalCompleted(dailyGoal);
      const goalBonus = dailyGoalCompleted ? dailyGoal.reward : 0;
      const nextDay = state.day + 1;
      const completed = nextDay > 3;
      const restockPressure = state.products.filter((item) => item.stock === 0).length;
      const goalSatisfactionDelta = dailyGoalCompleted ? Math.round(goalBonus / 2) : -4;
      const nextSatisfaction = Math.max(0, Math.min(100, state.satisfaction + goalSatisfactionDelta - restockPressure * 2));
      const nextRumorForecast = getRumorForecast(state, nextDay);
      const nextMysteryEvent = nextRumorForecast.nextEvent;
      const goalResultMessage = dailyGoalCompleted
        ? `${dailyGoal.title}达成，奖励 ${goalBonus} 铜钱。`
        : `${dailyGoal.title}未达成，进度 ${dailyGoalProgress}%，满意度 -4。`;

      const endedState = appendEvent(
        {
          ...state,
          day: completed ? state.day : nextDay,
          coins: state.coins + goalBonus,
          satisfaction: nextSatisfaction,
          activeMysteryEvent: completed ? state.activeMysteryEvent : nextMysteryEvent,
          completed,
          lastMessage: completed
            ? `三天试营业结束。${goalResultMessage} 总收入 ${state.revenue}，接待 ${state.visits} 人，声望 ${state.reputation}。`
            : `第 ${state.day} 天收摊，${goalResultMessage} 怪谈热度 ${nextRumorForecast.heat}，第 ${nextDay} 天事件倾向：${nextMysteryEvent.title}。目标：${dailyGoalDefinitions[nextDay - 1].title}：${dailyGoalDefinitions[nextDay - 1].description}`,
        },
        { day: state.day, type: 'day_end', label: completed ? '试营业结束' : `进入第 ${nextDay} 天`, value: goalBonus },
      );

      const withGoalEvent = appendEvent(endedState, {
        day: state.day,
        type: 'daily_goal',
        label: dailyGoalCompleted ? `${dailyGoal.title} 达成` : `${dailyGoal.title} 未达成`,
        value: dailyGoalCompleted ? dailyGoalProgress : -dailyGoalProgress,
      });

      const withRumorEvent = appendEvent(withGoalEvent, {
        day: state.day,
        type: 'rumor_heat',
        label: completed ? '试营业结束' : `${nextMysteryEvent.title} 倾向`,
        value: nextRumorForecast.heat,
      });

      const withNextEvent = completed
        ? withRumorEvent
        : appendEvent(withRumorEvent, { day: nextDay, type: 'mystery_event', label: nextMysteryEvent.title, value: 1 });

      return evaluateAchievements(withNextEvent);
    });
  };

  const resetGame = () => setGame(makeInitialState());

  const applyConfigDraft = () => {
    setGame((state) => {
      const validation = validateActivityConfig(report.configDraft);
      if (!validation.valid) {
        return {
          ...state,
          lastMessage: `配置校验失败：${validation.errors.join(' ')}`,
        };
      }

      const appliedConfig = createConfigFromDraft(report.configDraft, 'applied');
      const nextState = {
        ...state,
        activeConfig: appliedConfig,
        configHistory: [...state.configHistory, appliedConfig],
        lastMessage: `活动配置 ${report.configDraft.activityId} 已人工确认并应用。`,
      };

      return appendEvent(nextState, { day: state.day, type: 'config_apply', label: report.configDraft.activityId, value: 1 });
    });
  };

  const rollbackConfig = () => {
    setGame((state) => {
      if (state.configHistory.length <= 1) {
        return { ...state, lastMessage: '当前已经是基线配置，无需回滚。' };
      }

      const previousConfig = state.configHistory[state.configHistory.length - 2];
      const rollbackRecord: LiveOpsConfig = {
        ...previousConfig,
        status: 'rolled_back',
        rollbackFrom: state.activeConfig.version,
        appliedAt: new Date().toLocaleString('zh-CN'),
      };
      const nextState = {
        ...state,
        activeConfig: previousConfig,
        configHistory: [...state.configHistory, rollbackRecord],
        lastMessage: `已从 ${state.activeConfig.version} 回滚到 ${previousConfig.version}。`,
      };

      return appendEvent(nextState, { day: state.day, type: 'config_rollback', label: previousConfig.version, value: -1 });
    });
  };

  return (
    <main className="app-shell">
      <section className="topbar">
        <div>
          <p className="eyebrow">AI LiveOps Game Lab</p>
          <h1>夜市怪谈摊主</h1>
        </div>
        <nav className="tabs" aria-label="主视图">
          <button className={activeTab === 'game' ? 'active' : ''} onClick={() => setActiveTab('game')}>
            <Store size={18} />
            游戏
          </button>
          <button className={activeTab === 'ops' ? 'active' : ''} onClick={() => setActiveTab('ops')}>
            <BarChart3 size={18} />
            运营
          </button>
          <button className={activeTab === 'agent' ? 'active' : ''} onClick={() => setActiveTab('agent')}>
            <Bot size={18} />
            Agent
          </button>
          <button className={activeTab === 'config' ? 'active' : ''} onClick={() => setActiveTab('config')}>
            <Boxes size={18} />
            配置
          </button>
        </nav>
      </section>

      {activeTab === 'game' && (
        <section className="game-layout">
          <div className="night-scene">
            <div className="scene-vignette" />
            <div className="mystery-card">
              <img src={currentEvent.illustration} alt={`${currentEvent.title}插图`} />
              <div>
                <span>{currentEvent.tag}</span>
                <strong>{currentEvent.title}</strong>
                <p>{currentEvent.description}</p>
                <small>{currentEvent.effect}</small>
              </div>
            </div>
            <div className="scene-goods-row">
              {game.products.map((product) => (
                <div key={product.id} className={`scene-good rarity-${product.rarity}`}>
                  <img src={product.icon} alt="" />
                  <small>{product.stock}</small>
                </div>
              ))}
            </div>
          </div>

          <aside className="play-panel">
            <div className="stat-grid">
              <Stat icon={<CalendarDays size={18} />} label="天数" value={`${game.day}/3`} />
              <Stat icon={<Coins size={18} />} label="铜钱" value={game.coins} />
              <Stat icon={<Sparkles size={18} />} label="声望" value={game.reputation} />
              <Stat icon={<TrendingUp size={18} />} label="满意度" value={`${Math.round(game.satisfaction)}%`} />
            </div>

            <div className={`reputation-branch-card ${currentReputationBranch.tier}`}>
              <div>
                <Sparkles size={18} />
                <span>声望分支</span>
                <b>{currentReputationBranch.tier === 'high' ? '高声望' : currentReputationBranch.tier === 'low' ? '低声望' : '观望中'}</b>
              </div>
              <strong>{currentReputationBranch.title}</strong>
              <p>{currentReputationBranch.description}</p>
              <div className="reputation-track">
                <i style={{ width: `${currentReputationBranch.progress}%` }} />
              </div>
              <small>{currentReputationBranch.effect}</small>
            </div>

            <div className="product-combo-card">
              <div>
                <Boxes size={18} />
                <span>商品组合</span>
                <b>{activeProductCombos.length} 组激活</b>
              </div>
              {productCombos.map((combo) => {
                const active = activeProductCombos.some((item) => item.id === combo.id);
                const missingProducts = combo.products
                  .filter((productId) => !game.products.some((product) => product.id === productId && product.stock > 0))
                  .map((productId) => initialProducts.find((product) => product.id === productId)?.name ?? productId);
                return (
                  <article key={combo.id} className={active ? 'active' : ''}>
                    <strong>{combo.title}</strong>
                    <p>{combo.description}</p>
                    <small>{active ? `${combo.effect} 热度 ${formatSigned(combo.riskWeight)}。` : `缺少：${missingProducts.join('、')} · 热度 ${formatSigned(combo.riskWeight)}`}</small>
                  </article>
                );
              })}
            </div>

            <div className={`rumor-forecast-card ${rumorForecast.heat >= 70 ? 'hot' : rumorForecast.heat < 45 ? 'calm' : ''}`}>
              <div>
                <Lightbulb size={18} />
                <span>怪谈热度</span>
                <b>{rumorForecast.heat}/100</b>
              </div>
              <strong>{rumorForecast.title}</strong>
              <p>{rumorForecast.description}</p>
              <div className="rumor-track">
                <i style={{ width: `${rumorForecast.heat}%` }} />
              </div>
              <small>下一日倾向：{rumorForecast.nextEvent.title}</small>
            </div>

            <div className="npc-panel">
              <div className="avatar portrait">
                <img src={currentNpc.portrait} alt={`${currentNpc.name}头像`} />
              </div>
              <div>
                <p className="eyebrow">下一位顾客</p>
                <h2>{currentNpc.name}</h2>
                <p>{currentNpc.role} · {currentMemory.mood} · 预算 {currentBudget}</p>
                <blockquote>{currentNpc.quote}</blockquote>
              </div>
            </div>

            <div className="memory-card">
              <div>
                <UserRoundCog size={18} />
                <span>NPC 记忆</span>
              </div>
              <p>{currentNpc.memoryHook}</p>
              <strong>好感 {currentMemory.affinity} · 到访 {currentMemory.visits} 次</strong>
              <small>{currentMemory.lastFeedback}</small>
            </div>

            <div className={`event-choice-card ${currentEventChoice ? 'resolved' : ''}`}>
              <div>
                <ShieldCheck size={18} />
                <span>经营抉择</span>
              </div>
              {currentEventChoice ? (
                <article>
                  <strong>{currentEventChoice.title}</strong>
                  <p>{currentEventChoice.effect}</p>
                  <small>本日事件规则已按此抉择调整。</small>
                </article>
              ) : (
                getEventChoiceOptions(currentEvent).map((option) => (
                  <button
                    key={option.id}
                    onClick={() => applyEventChoice(option.id)}
                    disabled={game.completed || game.coins + option.coinsDelta < 0}
                  >
                    <strong>{option.title}</strong>
                    <span>{option.description}</span>
                    <small>{option.effect}</small>
                  </button>
                ))
              )}
            </div>

            <div className={`relationship-card ${game.relationshipQuest.status}`}>
              <div>
                <Sparkles size={18} />
                <span>关系任务</span>
              </div>
              <strong>{game.relationshipQuest.title}</strong>
              <p>{game.relationshipQuest.description}</p>
              <div className="quest-progress">
                <i style={{ width: `${Math.round((game.relationshipQuest.progress / game.relationshipQuest.target) * 100)}%` }} />
              </div>
              <small>
                {game.relationshipQuest.status === 'completed'
                  ? `已完成：${game.relationshipQuest.reward}`
                  : `进度 ${game.relationshipQuest.progress}/${game.relationshipQuest.target} · 奖励：${game.relationshipQuest.reward}`}
              </small>
            </div>

            <div className="achievement-card">
              <div>
                <ClipboardCheck size={18} />
                <span>夜市成就</span>
              </div>
              {game.achievements.map((achievement) => (
                <article key={achievement.id} className={achievement.status}>
                  <strong>{achievement.title}</strong>
                  <span>{achievement.status === 'unlocked' ? `Day ${achievement.unlockedAtDay} 解锁` : `${getAchievementProgress(achievement, game)}%`}</span>
                  <small>{achievement.description}</small>
                </article>
              ))}
            </div>

            <div className="message-box">
              <MessageSquareText size={18} />
              <p>{game.lastMessage}</p>
            </div>

            <div className="actions">
              <button className="primary" onClick={serveNpc} disabled={game.completed}>
                接待顾客
              </button>
              <button onClick={endDay} disabled={game.completed}>
                今日收摊
              </button>
              <button className="icon-button" onClick={resetGame} title="重新开始">
                <RotateCcw size={18} />
              </button>
            </div>

            <div className={`local-save-card ${localSaveMeta.status}`}>
              <div>
                <History size={18} />
                <span>本地存档</span>
                <b>{localSaveMeta.status === 'saved' ? '已保存' : localSaveMeta.status === 'error' ? '异常' : '待保存'}</b>
              </div>
              <p>{localSaveMeta.message}</p>
              <small>事件 {game.events.length} 条 · 配置历史 {game.configHistory.length} 版 · 快照仅保存在本机。</small>
              <button onClick={exportSnapshot}>
                <PackageSearch size={18} />
                导出演示快照
              </button>
              <label className="snapshot-import">
                <Upload size={18} />
                导入演示快照
                <input type="file" accept="application/json,.json" onChange={importSnapshot} />
              </label>
              <div className="save-slot-panel">
                <div>
                  <span>演示槽位</span>
                  <button onClick={saveCurrentSlot}>保存当前局面</button>
                </div>
                {saveSlots.length === 0 ? (
                  <p>暂无槽位。保存后可在面试中一键读取不同局面。</p>
                ) : (
                  saveSlots.map((slot) => (
                    <article key={slot.id}>
                      <strong>{slot.title}</strong>
                      <small>{slot.savedAt} · 接待 {slot.visits} · 铜钱 {slot.coins}</small>
                      <div>
                        <button onClick={() => loadSaveSlot(slot)}>读取</button>
                        <button onClick={() => deleteSaveSlot(slot.id)}>删除</button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>

            <div className="goal-strip">
              <div>
                <span>今日目标</span>
                <b>{game.completed ? '试营业已完成' : `${currentDailyGoalProgress}%`}</b>
              </div>
              <strong>{game.completed ? '三天目标已结算' : currentDailyGoal.title}</strong>
              <p>{game.completed ? '查看运营后台和 Agent 工作台进行版本复盘。' : currentDailyGoal.description}</p>
              {!game.completed && (
                <>
                  <div className="goal-mini-track">
                    <i style={{ width: `${currentDailyGoalProgress}%` }} />
                  </div>
                  <ul>
                    {currentDailyGoal.checks.map((check) => (
                      <li key={check.label} className={check.current >= check.target ? 'done' : ''}>
                        <span>{check.label}</span>
                        <em>{check.current}/{check.target}{check.unit}</em>
                      </li>
                    ))}
                  </ul>
                  <small>达成后收摊奖励 {currentDailyGoal.reward} 铜钱；未达成会降低满意度。</small>
                </>
              )}
            </div>
          </aside>

          <section className="inventory">
            {game.products.map((product) => {
              const restockCost = getRestockCost(product, game.activeConfig, game.relationshipQuest);
              const effectiveCharm = getEffectiveCharm(product, currentEvent, currentEventChoice, currentReputationBranch, activeProductCombos);
              return (
                <article key={product.id} className={`product-card rarity-${product.rarity}`}>
                  <div className="product-main">
                    <img src={product.icon} alt="" />
                    <div>
                      <h3>{product.name}</h3>
                      <p>{product.description}</p>
                      <small>库存 {product.stock} · 售价 {product.price} · 魅力 {effectiveCharm}</small>
                    </div>
                  </div>
                  <button onClick={() => buyStock(product.id)} disabled={game.completed || game.coins < restockCost}>
                    补货 {restockCost}
                  </button>
                </article>
              );
            })}
          </section>
        </section>
      )}

      {activeTab === 'ops' && <OpsDashboard game={game} metrics={metrics} />}
      {activeTab === 'agent' && <AgentDesk report={report} game={game} metrics={metrics} npcs={npcs} />}
      {activeTab === 'config' && (
        <ConfigView
          products={game.products}
          report={report}
          metrics={metrics}
          activeConfig={game.activeConfig}
          configHistory={game.configHistory}
          onApplyDraft={applyConfigDraft}
          onRollback={rollbackConfig}
        />
      )}
    </main>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="stat-card">
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function buildMetrics(game: GameState) {
  const conversion = game.visits ? Math.round((game.sales / game.visits) * 100) : 0;
  const averageRevenue = game.sales ? Math.round(game.revenue / game.sales) : 0;
  const missed = game.events.filter((event) => event.type === 'missed_sale').length;
  const saleEvents = game.events.filter((event) => event.type === 'sale');
  const visitEvents = game.events.filter((event) => event.type === 'npc_visit');
  const dayRevenue = [1, 2, 3].map((day) => ({
    day,
    revenue: saleEvents.filter((event) => event.day === day).reduce((sum, event) => sum + event.value, 0),
    visits: visitEvents.filter((event) => event.day === day).length,
    sales: saleEvents.filter((event) => event.day === day).length,
  }));
  const goalStats = dayRevenue.map((item) => {
    const goal = buildDailyGoal(game, item.day);
    const progress = getDailyGoalProgress(goal);
    const completed = isDailyGoalCompleted(goal);

    return {
      ...item,
      title: goal.title,
      goal: goal.description,
      reward: goal.reward,
      completed,
      progress,
      checks: goal.checks,
    };
  });
  const productStats = game.products.map((product) => {
    const productSales = saleEvents.filter((event) => event.label === product.name);
    const revenue = productSales.reduce((sum, event) => sum + event.value, 0);

    return {
      id: product.id,
      name: product.name,
      sales: productSales.length,
      revenue,
      stock: product.stock,
      conversion: game.visits ? Math.round((productSales.length / game.visits) * 100) : 0,
    };
  });
  const npcStats = npcs.map((npc) => {
    const visits = visitEvents.filter((event) => event.label === npc.name).length;
    const missedCount = game.events.filter((event) => event.type === 'missed_sale' && event.label === npc.name).length;
    const memory = game.npcMemories[npc.id];

    return {
      name: npc.name,
      visits,
      affinity: memory.affinity,
      mood: memory.mood,
      missed: missedCount,
      favorite: initialProducts.find((product) => product.id === npc.favorite)?.name ?? npc.favorite,
    };
  });
  const dayEndEvents = game.events.filter((event) => event.type === 'day_end');
  const relationshipEvents = game.events.filter((event) => event.type === 'relationship_quest');
  const relationshipProgress = Math.round((game.relationshipQuest.progress / game.relationshipQuest.target) * 100);
  const achievementEvents = game.events.filter((event) => event.type === 'achievement');
  const unlockedAchievements = game.achievements.filter((achievement) => achievement.status === 'unlocked');
  const achievementProgress = Math.round((unlockedAchievements.length / game.achievements.length) * 100);
  const eventChoiceEvents = game.events.filter((event) => event.type === 'event_choice');
  const eventChoiceRate = Math.min(100, Math.round((game.eventChoices.length / Math.max(1, game.day)) * 100));
  const dailyGoalEvents = game.events.filter((event) => event.type === 'daily_goal');
  const completedDailyGoals = dailyGoalEvents.filter((event) => event.value > 0).length;
  const reputationBranch = getReputationBranch(game.reputation);
  const reputationBranchEvents = game.events.filter((event) => event.type === 'reputation_branch');
  const productComboEvents = game.events.filter((event) => event.type === 'product_combo');
  const activeProductCombos = getActiveProductCombos(game.products);
  const productComboActivation = Math.round((activeProductCombos.length / productCombos.length) * 100);
  const rumorForecast = getRumorForecast(game);
  const rumorHeatEvents = game.events.filter((event) => event.type === 'rumor_heat');
  const dropoffNodes = [
    { label: '进货后未接待', count: game.events.some((event) => event.type === 'buy_stock') && game.visits === 0 ? 1 : 0 },
    { label: '到访未成交', count: missed },
    { label: '收摊未达标', count: dayEndEvents.filter((event) => event.value === 0).length },
    { label: '库存断档', count: game.products.filter((product) => product.stock === 0).length },
  ];
  const goalCompletion = Math.round((goalStats.filter((item) => item.completed).length / goalStats.length) * 100);
  const abTest = [
    {
      name: 'A 当前版本',
      conversion,
      revenuePerVisit: game.visits ? Math.round(game.revenue / game.visits) : 0,
      retentionScore: Math.min(100, Math.round((game.satisfaction + game.reputation * 3) / 1.3)),
      note: '保持当前价格和自然 NPC 顺序。',
    },
    {
      name: 'B 夜灯补贴',
      conversion: Math.min(100, conversion + (missed > 0 ? 14 : 5)),
      revenuePerVisit: game.visits ? Math.round((game.revenue + Math.max(6, missed * 8)) / Math.max(1, game.visits)) : 6,
      retentionScore: Math.min(100, Math.round((game.satisfaction + 6 + game.reputation * 3) / 1.25)),
      note: '首单低价商品补贴，优先补足偏好商品。',
    },
  ];

  return { conversion, averageRevenue, missed, dayRevenue, goalStats, productStats, npcStats, relationshipEvents, relationshipProgress, achievementEvents, unlockedAchievements, achievementProgress, eventChoiceEvents, eventChoiceRate, dailyGoalEvents, completedDailyGoals, reputationBranch, reputationBranchEvents, productComboEvents, activeProductCombos, productComboActivation, rumorForecast, rumorHeatEvents, dropoffNodes, goalCompletion, abTest };
}

function buildAgentReport(game: GameState, metrics: ReturnType<typeof buildMetrics>) {
  const emptyStock = game.products.filter((product) => product.stock === 0).map((product) => product.name);
  const weakProducts = metrics.productStats.filter((item) => item.sales === 0).map((item) => item.name);
  const weakNpcs = metrics.npcStats.filter((item) => item.visits > 0 && item.affinity <= 1).map((item) => item.name);
  const strongestVariant = metrics.abTest.reduce((best, item) => (item.retentionScore > best.retentionScore ? item : best), metrics.abTest[0]);
  const relationshipNote =
    game.relationshipQuest.status === 'completed'
      ? `${game.relationshipQuest.title} 已完成，${game.relationshipQuest.reward} 已进入经营规则。`
      : `${game.relationshipQuest.title} 进度 ${game.relationshipQuest.progress}/${game.relationshipQuest.target}，建议引导玩家接待灯纸匠。`;
  const achievementNote = metrics.unlockedAchievements.length
    ? `已解锁成就：${metrics.unlockedAchievements.map((achievement) => achievement.title).join('、')}。`
    : '尚未解锁成就，玩家需要更明确的成长反馈。';
  const latestChoice = game.eventChoices[game.eventChoices.length - 1];
  const eventChoiceNote = latestChoice
    ? `最近经营抉择：${latestChoice.title}，${latestChoice.effect}`
    : '本日尚未做经营抉择，玩家还没有主动处理怪谈事件。';
  const currentDailyGoal = buildDailyGoal(game);
  const currentDailyGoalProgress = getDailyGoalProgress(currentDailyGoal);
  const dailyGoalNote = game.completed
    ? `每日目标已结算 ${metrics.completedDailyGoals}/${metrics.dailyGoalEvents.length} 次。`
    : `当前目标：${currentDailyGoal.title}，进度 ${currentDailyGoalProgress}%，奖励 ${currentDailyGoal.reward} 铜钱。`;
  const reputationBranchNote = `声望分支：${metrics.reputationBranch.title}，${metrics.reputationBranch.effect}`;
  const productComboNote = metrics.activeProductCombos.length
    ? `商品组合：${metrics.activeProductCombos.map((combo) => combo.title).join('、')} 已激活，组合激活率 ${metrics.productComboActivation}%。`
    : '商品组合尚未激活，建议补齐成套商品以触发额外收益。';
  const rumorForecastNote = `怪谈热度：${metrics.rumorForecast.heat}/100，下一事件倾向为${metrics.rumorForecast.nextEvent.title}，${metrics.rumorForecast.description}`;
  const risk =
    metrics.reputationBranch.tier === 'low'
      ? '低声望已经触发巡夜调查，预算压力和流失惩罚都会上升。'
      : emptyStock.length > 1
      ? '库存断档正在增加，会压低接待成功率。'
      : metrics.goalCompletion < 50
        ? '任务完成率偏低，玩家可能不知道下一步应该优化什么。'
        : '库存结构暂时健康，可以继续观察偏好商品。';
  const action =
    metrics.conversion < 70
      ? '建议明天给低价高魅力商品做限时折扣，并优先补足顾客偏好商品。'
      : weakProducts.length > 2
        ? '建议给滞销商品绑定 NPC 小剧情，避免商品池只被一两个爆款吃掉。'
        : '建议保持当前价格，增加狐面具或醒魂茶的稀缺事件，提高高价值购买。';
  const evidence = `当前接待 ${game.visits} 人，成交 ${game.sales} 单，转化率 ${metrics.conversion}%，客单价 ${metrics.averageRevenue}。${dailyGoalNote}${reputationBranchNote}${productComboNote}${rumorForecastNote}${relationshipNote}${achievementNote}${eventChoiceNote}`;
  const anomalies = [
    {
      title: '库存风险',
      severity: emptyStock.length > 1 ? 'high' : emptyStock.length === 1 ? 'medium' : 'low',
      evidence: emptyStock.length ? `${emptyStock.join('、')} 已断货。` : '当前没有大面积断货。',
      hypothesis: emptyStock.length ? '偏好商品断货会让后续 NPC 更容易接受替代品或直接流失。' : '库存暂时能支撑下一轮接待。',
    },
    {
      title: '任务完成',
      severity: metrics.goalCompletion < 34 ? 'high' : metrics.goalCompletion < 67 ? 'medium' : 'low',
      evidence: `三日目标完成率 ${metrics.goalCompletion}%。${dailyGoalNote}`,
      hypothesis: metrics.goalCompletion < 67 ? '玩家可能需要更明确的阶段目标和奖励反馈。' : '目标节奏暂时可接受。',
    },
    {
      title: '每日目标压力',
      severity: currentDailyGoalProgress < 40 && !game.completed ? 'medium' : 'low',
      evidence: dailyGoalNote,
      hypothesis: currentDailyGoalProgress < 40 && !game.completed ? '当前目标还没有形成足够行动牵引，可能需要更早显示子条件或降低第一步门槛。' : '目标进度能为收摊决策提供明确反馈。',
    },
    {
      title: '声望分支',
      severity: metrics.reputationBranch.tier === 'low' ? 'high' : metrics.reputationBranch.tier === 'high' ? 'low' : 'medium',
      evidence: reputationBranchNote,
      hypothesis: metrics.reputationBranch.tier === 'high' ? '高声望正在把稀有商品和稀有顾客转化为高价值机会。' : metrics.reputationBranch.tier === 'low' ? '低声望会放大流失惩罚，建议优先恢复稳定成交。' : '当前声望还在观望区，玩家需要明确知道高低分支的收益与风险。',
    },
    {
      title: '商品长尾',
      severity: weakProducts.length >= 3 ? 'medium' : 'low',
      evidence: weakProducts.length ? `${weakProducts.join('、')} 暂无销量。` : '所有商品都已有销售记录。',
      hypothesis: weakProducts.length ? '商品缺少对应 NPC 触发或价格/魅力感知不足。' : '商品池覆盖良好。',
    },
    {
      title: '商品组合',
      severity: metrics.activeProductCombos.length === 0 ? 'medium' : 'low',
      evidence: `${productComboNote} 已触发 ${metrics.productComboEvents.length} 次组合奖励。`,
      hypothesis: metrics.activeProductCombos.length === 0 ? '商品目前只是单件收益，玩家缺少成套备货的策略目标。' : '组合奖励能把库存管理从补货行为升级为陈列策略。',
    },
    {
      title: '怪谈热度',
      severity: metrics.rumorForecast.heat >= 70 ? 'high' : metrics.rumorForecast.heat >= 45 ? 'medium' : 'low',
      evidence: `${rumorForecastNote} 已记录 ${metrics.rumorHeatEvents.length} 次热度快照。`,
      hypothesis: metrics.rumorForecast.heat >= 70 ? '稀有商品传闻正在放大高价值机会，同时也会增加风险事件压力。' : '热度评分可以把商品组合对事件概率的影响显性化。',
    },
    {
      title: '关系任务',
      severity: game.relationshipQuest.status === 'completed' ? 'low' : metrics.relationshipProgress === 0 ? 'medium' : 'low',
      evidence: relationshipNote,
      hypothesis: game.relationshipQuest.status === 'completed' ? '关系奖励已经转化为补货折扣。' : '关系线可以提升长期目标感，并把 NPC 偏好转化为经营策略。',
    },
    {
      title: '成长反馈',
      severity: metrics.achievementProgress === 0 ? 'medium' : metrics.achievementProgress < 50 ? 'low' : 'low',
      evidence: `成就解锁率 ${metrics.achievementProgress}%。${achievementNote}`,
      hypothesis: metrics.achievementProgress === 0 ? '玩家还没有获得短期正反馈，可能需要更早的奖励提示。' : '成就正在把短局行为转化为可感知成长。',
    },
    {
      title: '经营抉择',
      severity: latestChoice ? 'low' : 'medium',
      evidence: eventChoiceNote,
      hypothesis: latestChoice ? '玩家已经主动介入事件规则，选择行为可进入后续运营分析。' : '事件仍主要由系统驱动，缺少玩家主动决策信号。',
    },
  ];
  const actionPlan = [
    {
      title: '补足偏好商品库存',
      owner: '运营配置',
      impact: emptyStock.length ? '降低到访未成交和替代推荐比例。' : '维持当前转化并观察下一日。',
    },
    {
      title: '推出夜灯补贴实验',
      owner: 'LiveOps',
      impact: `${strongestVariant.name} 当前留存评分 ${strongestVariant.retentionScore}，适合作为下一版候选。`,
    },
    {
      title: '给低销量商品绑定 NPC 事件',
      owner: '内容策划',
      impact: weakProducts.length ? `优先处理 ${weakProducts.slice(0, 2).join('、')}。` : '暂时无需强行干预。',
    },
    {
      title: '优化商品组合陈列',
      owner: '商品运营',
      impact: metrics.activeProductCombos.length ? `当前激活 ${metrics.activeProductCombos.length} 组，可观察组合奖励是否提高满意和声望。` : '优先补齐醒魂茶、雨铃或狐面具等成套商品，形成可感知的备货策略。',
    },
    {
      title: '控制怪谈热度曲线',
      owner: 'LiveOps',
      impact: metrics.rumorForecast.heat >= 70 ? '高热度适合投放神秘订单，但需要同步准备满意度兜底。' : `下一事件倾向为${metrics.rumorForecast.nextEvent.title}，可用组合库存微调风险。`,
    },
    {
      title: '导出演示数据快照',
      owner: '桌面交付',
      impact: '面试或复盘前导出本地 JSON，保留事件流、关键指标、Agent 报告和配置草案证据。',
    },
    {
      title: '导入演示快照复现局面',
      owner: '桌面交付',
      impact: '可以从面试前准备好的 JSON 直接恢复到指定经营日，稳定复现高价值事件和 Agent 建议。',
    },
    {
      title: '维护多组演示槽位',
      owner: '桌面交付',
      impact: `当前保留 ${game.events.filter((event) => event.type === 'sale').length ? '可复盘成交局面' : '初始局面'}，建议为高热度、关系任务和配置回滚分别保存槽位。`,
    },
    {
      title: '推进灯纸匠关系线',
      owner: '剧情运营',
      impact: game.relationshipQuest.status === 'completed' ? '关系奖励已生效，可观察纸灯笼补货频率。' : '引导玩家卖出纸灯笼，解锁补货折扣形成成长反馈。',
    },
    {
      title: '放大成就反馈',
      owner: '玩法运营',
      impact: metrics.achievementProgress < 50 ? '把首单、低流失和回头客行为做成早期正反馈。' : '成就反馈已覆盖主要早期行为，可继续观察完成顺序。',
    },
    {
      title: '观察事件抉择偏好',
      owner: '数值策划',
      impact: latestChoice ? `玩家最近选择了${latestChoice.title}，可继续观察其对成交和满意度的影响。` : '提示玩家先处理当日怪谈事件，再接待顾客。',
    },
    {
      title: '校准每日目标奖励',
      owner: '关卡策划',
      impact: currentDailyGoalProgress < 50 && !game.completed ? `当前${currentDailyGoal.title}进度偏低，可把奖励前置到子目标。` : '目标奖励与收摊反馈暂时匹配。',
    },
    {
      title: '运营声望分支',
      owner: '系统策划',
      impact: metrics.reputationBranch.tier === 'high' ? '观察稀有顾客和狐面具销量是否提升。' : metrics.reputationBranch.tier === 'low' ? '降低连续失败惩罚或提供恢复声望的短任务。' : '继续用声望卡提示高低分支门槛。',
    },
  ];
  const tuningSuggestions = [
    {
      key: 'preferred_item_restock_priority',
      before: 'manual',
      after: emptyStock.length ? 'high' : 'normal',
      reason: '偏好商品直接影响 NPC 好感和成交稳定性。',
    },
    {
      key: 'first_purchase_subsidy',
      before: 0,
      after: metrics.conversion < 80 || metrics.goalCompletion < 67 ? 3 : 1,
      reason: '小额补贴能降低早期流失，并让玩家更快理解经营反馈。',
    },
    {
      key: 'long_tail_story_trigger',
      before: 'off',
      after: weakProducts.length >= 2 ? 'on' : 'observe',
      reason: '滞销商品需要剧情或任务牵引，而不是单纯降价。',
    },
    {
      key: 'product_combo_focus',
      before: 'single_item_sales',
      after: metrics.activeProductCombos.length ? 'observe_combo_reward' : 'restock_pair_items',
      reason: '商品组合能让玩家把库存、顾客偏好和事件奖励一起纳入经营决策。',
    },
    {
      key: 'rumor_heat_curve',
      before: 'fixed_event_rotation',
      after: metrics.rumorForecast.heat >= 70 ? 'cooldown_or_reward_guardrail' : 'combo_driven_forecast',
      reason: '事件倾向由商品组合和风险热度共同决定，便于运营调控节奏。',
    },
    {
      key: 'local_demo_snapshot',
      before: 'session_only_state',
      after: 'local_autosave_json_export_and_import',
      reason: '桌面演示需要保留局内进度，既能导出事件流复盘，也能导入快照稳定复现指定局面。',
    },
    {
      key: 'demo_save_slots',
      before: 'single_latest_save',
      after: 'three_local_demo_slots',
      reason: '面试演示常需要在多个局面之间切换，多槽位能减少现场重玩成本。',
    },
    {
      key: 'reputation_branch_threshold',
      before: 'low<=3, high>=12',
      after: metrics.reputationBranch.tier === 'low' ? 'add_recovery_task' : 'observe',
      reason: '声望分支会同时影响顾客到访、预算压力和稀有商品价值。',
    },
  ];
  const manualChecks = [
    '确认补贴不会让前三天金币膨胀过快。',
    '确认活动奖励只写入配置草案，不直接修改当前局内数值。',
    weakNpcs.length ? `复查低好感 NPC：${weakNpcs.join('、')}。` : '继续观察 NPC 好感分布。',
  ];

  return {
    summary: game.completed ? '三天试营业已结束，可以进入版本复盘。' : `第 ${game.day} 天运营中，Agent 已生成滚动建议。`,
    evidence,
    risk,
    action,
    anomalies,
    actionPlan,
    tuningSuggestions,
    manualChecks,
    configDraft: {
      activityId: 'night-market-retention-002',
      target: metrics.conversion < 70 || metrics.goalCompletion < 67 ? '提升早期留存和任务完成率' : '提升高价值商品销售',
      segment: 'day_1_to_day_3_new_players',
      trigger: emptyStock.length ? 'preferred_item_stockout' : 'first_purchase_or_low_goal_progress',
      bonus: metrics.conversion < 80 || metrics.goalCompletion < 67 ? '首次购买赠送 3 铜钱补贴' : '狐面具稀有顾客概率 +15%',
      tuning: tuningSuggestions,
      expectedImpact: {
        conversionLift: metrics.conversion < 80 ? '+8% to +14%' : '+3% to +6%',
        retentionScore: strongestVariant.retentionScore,
      },
      guardrail: '活动配置需人工确认后进入游戏，不允许 Agent 直接改写金币或声望。',
    },
  };
}

function OpsDashboard({ game, metrics }: { game: GameState; metrics: ReturnType<typeof buildMetrics> }) {
  const maxRevenue = Math.max(1, ...metrics.dayRevenue.map((item) => item.revenue));
  const winner = metrics.abTest.reduce((best, item) => (item.retentionScore > best.retentionScore ? item : best), metrics.abTest[0]);

  return (
    <section className="dashboard-layout">
      <div className="kpi-row">
        <Stat icon={<MessageSquareText size={18} />} label="接待人数" value={game.visits} />
        <Stat icon={<Coins size={18} />} label="总收入" value={game.revenue} />
        <Stat icon={<TrendingUp size={18} />} label="成交转化" value={`${metrics.conversion}%`} />
        <Stat icon={<ClipboardCheck size={18} />} label="任务完成" value={`${metrics.goalCompletion}%`} />
        <Stat icon={<CalendarDays size={18} />} label="目标结算" value={`${metrics.completedDailyGoals}/${metrics.dailyGoalEvents.length}`} />
        <Stat icon={<Sparkles size={18} />} label="声望分支" value={metrics.reputationBranch.title} />
        <Stat icon={<Boxes size={18} />} label="组合激活" value={`${metrics.activeProductCombos.length}/${productCombos.length}`} />
        <Stat icon={<Lightbulb size={18} />} label="怪谈热度" value={metrics.rumorForecast.heat} />
        <Stat icon={<Sparkles size={18} />} label="关系进度" value={`${metrics.relationshipProgress}%`} />
        <Stat icon={<ShieldCheck size={18} />} label="成就解锁" value={`${metrics.achievementProgress}%`} />
        <Stat icon={<SlidersHorizontal size={18} />} label="抉择次数" value={game.eventChoices.length} />
        <Stat icon={<BarChart3 size={18} />} label="流失次数" value={metrics.missed} />
      </div>
      <section className="panel trend-panel">
        <h2>三日收入与接待</h2>
        <div className="bars">
          {metrics.dayRevenue.map((item) => (
            <div key={item.day} className="bar-item">
              <div className="bar-track">
                <span style={{ height: `${Math.max(10, (item.revenue / maxRevenue) * 100)}%` }} />
              </div>
              <strong>第 {item.day} 天</strong>
              <small>{item.revenue} 铜钱 · {item.visits} 人</small>
            </div>
          ))}
        </div>
      </section>
      <section className="panel goal-panel">
        <h2>任务完成率</h2>
        {metrics.goalStats.map((item) => (
          <div key={item.day} className="goal-row">
            <div>
              <strong>第 {item.day} 天 · {item.title}</strong>
              <span>{item.goal} 奖励 {item.reward} 铜钱。</span>
              <small>{item.checks.map((check) => `${check.label} ${check.current}/${check.target}${check.unit}`).join(' · ')}</small>
            </div>
            <div className="progress-track">
              <i style={{ width: `${item.progress}%` }} />
            </div>
            <b className={item.completed ? 'success' : 'pending'}>{item.completed ? '已达成' : `${item.progress}%`}</b>
          </div>
        ))}
      </section>
      <section className="panel product-analytics">
        <h2>商品购买转化</h2>
        <div className="ops-table">
          <p>
            <span>商品</span>
            <span>销量</span>
            <span>收入</span>
            <span>转化</span>
            <span>库存</span>
          </p>
          {metrics.productStats.map((item) => (
            <p key={item.id}>
              <strong>{item.name}</strong>
              <span>{item.sales}</span>
              <span>{item.revenue}</span>
              <span>{item.conversion}%</span>
              <span>{item.stock}</span>
            </p>
          ))}
        </div>
      </section>
      <section className="panel combo-panel">
        <div className="panel-title">
          <h2>商品组合策略</h2>
          <span>{metrics.productComboActivation}% 激活</span>
        </div>
        <div className="combo-grid">
          <article className={metrics.rumorForecast.heat >= 70 ? 'hot' : 'active'}>
            <strong>下一事件倾向：{metrics.rumorForecast.nextEvent.title}</strong>
            <p>{metrics.rumorForecast.description}</p>
            <small>怪谈热度 {metrics.rumorForecast.heat}/100 · 已记录 {metrics.rumorHeatEvents.length} 次热度快照</small>
          </article>
          {productCombos.map((combo) => {
            const active = metrics.activeProductCombos.some((item) => item.id === combo.id);
            const triggers = metrics.productComboEvents.filter((event) => event.label.includes(combo.title)).length;

            return (
              <article key={combo.id} className={active ? 'active' : ''}>
                <strong>{combo.title}</strong>
                <p>{combo.effect}</p>
                <small>{active ? `已激活 · 触发 ${triggers} 次` : '库存缺口导致暂未激活'}</small>
              </article>
            );
          })}
        </div>
      </section>
      <section className="panel npc-analytics">
        <h2>NPC 互动率</h2>
        <div className="ops-table npc-table">
          <p>
            <span>NPC</span>
            <span>到访</span>
            <span>好感</span>
            <span>情绪</span>
            <span>偏好</span>
          </p>
          {metrics.npcStats.map((item) => (
            <p key={item.name}>
              <strong>{item.name}</strong>
              <span>{item.visits}</span>
              <span>{item.affinity}</span>
              <span>{item.mood}</span>
              <span>{item.favorite}</span>
            </p>
          ))}
        </div>
      </section>
      <section className="panel dropoff-panel">
        <h2>流失节点</h2>
        <div className="dropoff-grid">
          {metrics.dropoffNodes.map((node) => (
            <div key={node.label}>
              <PackageSearch size={18} />
              <span>{node.label}</span>
              <strong>{node.count}</strong>
            </div>
          ))}
        </div>
      </section>
      <section className="panel ab-panel">
        <div className="panel-title">
          <h2>基础 A/B 测试</h2>
          <span>推荐：{winner.name}</span>
        </div>
        <div className="ab-grid">
          {metrics.abTest.map((variant) => (
            <article key={variant.name}>
              <div>
                <FlaskConical size={18} />
                <strong>{variant.name}</strong>
              </div>
              <p><span>转化</span><b>{variant.conversion}%</b></p>
              <p><span>客均收入</span><b>{variant.revenuePerVisit}</b></p>
              <p><span>留存评分</span><b>{variant.retentionScore}</b></p>
              <small>{variant.note}</small>
            </article>
          ))}
        </div>
      </section>
      <section className="panel event-table">
        <h2>事件埋点</h2>
        <div>
          {game.events.slice(-12).reverse().map((event, index) => (
            <p key={`${event.day}-${event.type}-${index}`}>
              <span>Day {event.day}</span>
              <strong>{event.type}</strong>
              <em>{event.label}</em>
              <b>{event.value}</b>
            </p>
          ))}
        </div>
      </section>
    </section>
  );
}

function AgentDesk({
  report,
  game,
  metrics,
  npcs,
}: {
  report: ReturnType<typeof buildAgentReport>;
  game: GameState;
  metrics: ReturnType<typeof buildMetrics>;
  npcs: Npc[];
}) {
  const latestTrace = game.agentTraces[game.agentTraces.length - 1];

  return (
    <section className="agent-layout">
      <div className="panel agent-report">
        <p className="eyebrow">AI 运营日报</p>
        <h2>{report.summary}</h2>
        <h3>证据</h3>
        <p>{report.evidence}</p>
        <h3>风险</h3>
        <p>{report.risk}</p>
        <h3>建议</h3>
        <p>{report.action}</p>
      </div>
      <div className="panel anomaly-panel">
        <h2>异常与原因假设</h2>
        {report.anomalies.map((item) => (
          <article key={item.title} className={`severity-${item.severity}`}>
            <div>
              <strong>{item.title}</strong>
              <span>{item.severity}</span>
            </div>
            <p>{item.evidence}</p>
            <small>{item.hypothesis}</small>
          </article>
        ))}
      </div>
      <div className="panel tool-trace">
        <h2>Agent 工具调用轨迹</h2>
        <p><span>读取玩家数据</span><strong>{game.events.length} 条事件</strong></p>
        <p><span>读取商品配置</span><strong>{game.products.length} 个商品</strong></p>
        <p><span>读取 NPC 记忆</span><strong>{Object.keys(game.npcMemories).length} 个角色</strong></p>
        <p><span>读取每日目标</span><strong>{metrics.completedDailyGoals}/{metrics.dailyGoalEvents.length} 次达成</strong></p>
        <p><span>读取声望分支</span><strong>{metrics.reputationBranch.title}</strong></p>
        <p><span>读取事件抉择</span><strong>{game.eventChoices.length} 次选择</strong></p>
        <p><span>读取运营指标</span><strong>{report.anomalies.length} 个异常检查</strong></p>
        <p><span>生成活动草案</span><strong>等待人工确认</strong></p>
      </div>
      <div className="panel action-plan">
        <h2>行动计划</h2>
        {report.actionPlan.map((item) => (
          <article key={item.title}>
            <Lightbulb size={18} />
            <div>
              <strong>{item.title}</strong>
              <span>{item.owner}</span>
              <p>{item.impact}</p>
            </div>
          </article>
        ))}
      </div>
      <div className="panel tuning-panel">
        <h2>数值调参建议</h2>
        {report.tuningSuggestions.map((item) => (
          <article key={item.key}>
            <SlidersHorizontal size={18} />
            <div>
              <strong>{item.key}</strong>
              <p><span>{String(item.before)}</span><b>{String(item.after)}</b></p>
              <small>{item.reason}</small>
            </div>
          </article>
        ))}
      </div>
      <div className="panel manual-checks">
        <h2>人工确认清单</h2>
        {report.manualChecks.map((item) => (
          <p key={item}>
            <ClipboardCheck size={18} />
            <span>{item}</span>
          </p>
        ))}
      </div>
      <div className="panel npc-agent-card">
        <h2>最近 NPC Agent 决策</h2>
        {latestTrace ? (
          <>
            <p><span>顾客</span><strong>{latestTrace.npcName}</strong></p>
            <p><span>决策</span><strong>{latestTrace.decision}</strong></p>
            <p><span>边界</span><strong>{latestTrace.guardrail}</strong></p>
            <ul>
              {latestTrace.tools.map((tool) => (
                <li key={tool}>{tool}</li>
              ))}
            </ul>
          </>
        ) : (
          <p>接待第一位顾客后，这里会显示 NPC Agent 的工具读取和决策过程。</p>
        )}
      </div>
      <div className="panel memory-ledger">
        <h2>NPC 记忆账本</h2>
        {npcs.map((npc) => {
          const memory = game.npcMemories[npc.id];
          return (
            <p key={npc.id}>
              <span>{npc.name}</span>
              <strong>好感 {memory.affinity}</strong>
              <em>{memory.mood}</em>
              <small>{memory.lastBought ? `上次购买 ${memory.lastBought}` : memory.lastFeedback}</small>
            </p>
          );
        })}
      </div>
      <pre className="config-code">{JSON.stringify(report.configDraft, null, 2)}</pre>
    </section>
  );
}

function ConfigView({
  products,
  report,
  metrics,
  activeConfig,
  configHistory,
  onApplyDraft,
  onRollback,
}: {
  products: Product[];
  report: ReturnType<typeof buildAgentReport>;
  metrics: ReturnType<typeof buildMetrics>;
  activeConfig: LiveOpsConfig;
  configHistory: LiveOpsConfig[];
  onApplyDraft: () => void;
  onRollback: () => void;
}) {
  const validation = validateActivityConfig(report.configDraft);
  const config = {
    version: 'config-hot-update-0.5.0',
    maxDays: 3,
    analytics: {
      eventDriven: true,
      dashboards: ['goalCompletion', 'dailyGoalSettlement', 'productConversion', 'productCombos', 'npcInteraction', 'dropoffNodes', 'achievements', 'abTest'],
    },
    aiOpsAgent: {
      enabled: true,
      outputs: ['dailyReport', 'anomalyHypotheses', 'actionPlan', 'tuningSuggestions', 'activityConfigDraft'],
      approvalRequired: true,
    },
    products: products.map(({ id, name, cost, price, charm }) => ({ id, name, cost, price, charm })),
    npcMemory: {
      enabled: true,
      fields: ['affinity', 'visits', 'mood', 'lastBought', 'lastFeedback'],
    },
    relationshipQuest: {
      enabled: true,
      title: '灯纸匠的旧灯约',
      inputs: ['npcMemory', 'saleEvents', 'productPreference'],
      reward: 'paperLanternRestockDiscount',
    },
    dailyGoals: {
      enabled: true,
      eventType: 'daily_goal',
      goals: dailyGoalDefinitions.map((goal) => ({
        day: goal.day,
        title: goal.title,
        description: goal.description,
        reward: goal.reward,
      })),
      purpose: '把每日经营转化为明确短期目标、收摊奖励和 Agent 可分析数据',
    },
    reputationBranches: {
      enabled: true,
      eventType: 'reputation_branch',
      thresholds: {
        low: 'reputation <= 3',
        high: 'reputation >= 12',
      },
      effects: ['low: budgetPenaltyAndExtraReputationLoss', 'high: rareNpcBiasAndRareItemCharmBonus'],
      purpose: '让声望从静态数值变成顾客到访、商品价值和风险压力的分支规则',
    },
    productCombos: {
      enabled: true,
      eventType: 'product_combo',
      rules: productCombos.map((combo) => ({
        id: combo.id,
        title: combo.title,
        products: combo.products,
        effect: combo.effect,
        riskWeight: combo.riskWeight,
        eventBias: combo.eventBias,
      })),
      purpose: '把补货和陈列变成可被运营看板、Agent 诊断和玩家感知的组合策略',
    },
    rumorForecast: {
      enabled: true,
      eventType: 'rumor_heat',
      inputs: ['activeProductCombos', 'rareItemStock', 'reputation', 'satisfaction'],
      currentHeat: metrics.rumorForecast.heat,
      nextEvent: metrics.rumorForecast.nextEvent.title,
      eventScores: metrics.rumorForecast.eventScores,
      purpose: '用可解释的热度评分替代不可复现随机，让商品组合影响下一日事件倾向',
    },
    eventChoices: {
      enabled: true,
      eventType: 'event_choice',
      choices: ['fogLamp', 'saveOil', 'newWick', 'borrowDark', 'acceptOrder', 'declineOrder'],
      ruleInputs: ['activeMysteryEvent', 'coins', 'reputation', 'satisfaction'],
    },
    achievements: {
      enabled: true,
      eventType: 'achievement',
      ids: ['firstSale', 'lanternBond', 'trustedRegular', 'steadyNight'],
      purpose: '把短局行为转化为成长反馈和运营漏斗指标',
    },
    liveOpsConfig: {
      activeVersion: activeConfig.version,
      historyCount: configHistory.length,
      schemaValidation: validation.valid ? 'passed' : 'failed',
      rollbackSupported: true,
    },
    localPersistence: {
      enabled: true,
      storage: 'localStorage',
      key: LOCAL_SAVE_KEY,
      version: LOCAL_SAVE_VERSION,
      exports: ['gameState', 'eventLog', 'metricsSummary', 'agentReport', 'configDraft'],
      imports: ['second-game-demo-snapshot', 'local-save-payload'],
      importValidation: ['schema', 'version', 'minimalGameState'],
      saveSlots: {
        enabled: true,
        key: LOCAL_SAVE_SLOTS_KEY,
        maxSlots: MAX_SAVE_SLOTS,
        actions: ['saveCurrentState', 'loadSlot', 'deleteSlot'],
      },
      desktopMigrationPath: 'Tauri SQLite or local file snapshot',
      purpose: '支持 Web 和桌面壳本地演示，刷新后保留进度，并可导出或导入复盘证据',
    },
    guardrails: ['AI can suggest config drafts', 'Schema validation required', 'Human approval required before applying', 'Rollback required for applied config'],
  };

  return (
    <section className="config-workspace">
      <div className="panel config-summary">
        <p className="eyebrow">LiveOps Config</p>
        <h2>配置热更新工作台</h2>
        <p>AI 可以生成活动配置草案；草案必须通过 schema 校验和人工确认，才能影响当前局内经济。</p>
        <div className="config-actions">
          <button className="primary" onClick={onApplyDraft} disabled={!validation.valid}>
            <ShieldCheck size={18} />
            应用草案
          </button>
          <button onClick={onRollback}>
            <History size={18} />
            回滚配置
          </button>
        </div>
      </div>

      <div className="panel validation-panel">
        <h2>Schema 校验</h2>
        <strong className={validation.valid ? 'valid' : 'invalid'}>{validation.valid ? '通过' : '失败'}</strong>
        {validation.errors.length > 0 && validation.errors.map((item) => <p key={item}>{item}</p>)}
        {validation.warnings.length > 0 && validation.warnings.map((item) => <p key={item}>{item}</p>)}
        {validation.errors.length === 0 && validation.warnings.length === 0 && <p>配置结构完整，等待人工确认。</p>}
      </div>

      <div className="panel active-config">
        <h2>当前生效配置</h2>
        <p><span>版本</span><strong>{activeConfig.version}</strong></p>
        <p><span>状态</span><strong>{activeConfig.status}</strong></p>
        <p><span>活动</span><strong>{activeConfig.activity.activityId}</strong></p>
        <p><span>奖励</span><strong>{activeConfig.activity.bonus}</strong></p>
      </div>

      <div className="panel draft-panel">
        <h2>AI 活动配置草案</h2>
        <p><span>活动 ID</span><strong>{report.configDraft.activityId}</strong></p>
        <p><span>目标</span><strong>{report.configDraft.target}</strong></p>
        <p><span>触发</span><strong>{report.configDraft.trigger}</strong></p>
        <p><span>奖励</span><strong>{report.configDraft.bonus}</strong></p>
      </div>

      <div className="panel config-history">
        <h2>配置历史</h2>
        {configHistory.slice().reverse().map((item, index) => (
          <article key={`${item.version}-${index}`}>
            <div>
              <strong>{item.version}</strong>
              <span>{item.status}</span>
            </div>
            <p>{item.activity.target}</p>
            <small>{item.appliedAt ?? '未应用'}{item.rollbackFrom ? ` · rollback from ${item.rollbackFrom}` : ''}</small>
          </article>
        ))}
      </div>

      <pre className="config-code">{JSON.stringify(config, null, 2)}</pre>
    </section>
  );
}

export { App };
