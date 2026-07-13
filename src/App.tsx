import { useMemo, useState } from 'react';
import {
  BarChart3,
  Bot,
  Boxes,
  CalendarDays,
  ClipboardCheck,
  Coins,
  FlaskConical,
  MessageSquareText,
  PackageSearch,
  RotateCcw,
  Sparkles,
  Store,
  UserRoundCog,
  TrendingUp,
} from 'lucide-react';

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
};

type NpcMemory = {
  affinity: number;
  visits: number;
  lastBought?: string;
  lastFeedback: string;
  mood: string;
};

type AgentTrace = {
  day: number;
  npcName: string;
  tools: string[];
  decision: string;
  guardrail: string;
};

type GameEvent = {
  day: number;
  type: 'buy_stock' | 'npc_visit' | 'sale' | 'missed_sale' | 'npc_memory' | 'day_end' | 'reset';
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
  completed: boolean;
};

const initialProducts: Product[] = [
  { id: 'moonCake', name: '月影糕', cost: 6, price: 12, stock: 2, charm: 2 },
  { id: 'spiritTea', name: '醒魂茶', cost: 8, price: 16, stock: 1, charm: 3 },
  { id: 'paperLantern', name: '纸灯笼', cost: 5, price: 11, stock: 2, charm: 1 },
  { id: 'foxMask', name: '狐面具', cost: 10, price: 22, stock: 1, charm: 4 },
  { id: 'rainBell', name: '雨铃', cost: 7, price: 15, stock: 1, charm: 2 },
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
  },
];

const dayGoals = [
  '完成 2 次接待，赚到 25 枚铜钱',
  '让满意度保持 62 以上，并完成 3 次接待',
  '卖出至少 4 件商品，声望达到 12',
];

const initialNpcMemories: Record<NpcId, NpcMemory> = {
  aqing: { affinity: 0, visits: 0, mood: '紧张', lastFeedback: '还没有和摊主真正打过交道。' },
  umbrellaGranny: { affinity: 0, visits: 0, mood: '挑剔', lastFeedback: '还在观察这家摊子的规矩。' },
  foxBoy: { affinity: 0, visits: 0, mood: '兴奋', lastFeedback: '想看看摊主懂不懂节庆。' },
  nightWatch: { affinity: 0, visits: 0, mood: '疲惫', lastFeedback: '只希望今晚别再白跑一趟。' },
  lanternSmith: { affinity: 0, visits: 0, mood: '温和', lastFeedback: '愿意给新摊主一点耐心。' },
};

const makeInitialState = (): GameState => ({
  day: 1,
  coins: 56,
  reputation: 5,
  satisfaction: 66,
  products: initialProducts,
  events: [{ day: 1, type: 'reset', label: '新摊开张', value: 0 }],
  visits: 0,
  sales: 0,
  revenue: 0,
  currentNpcIndex: 0,
  lastMessage: '夜市刚亮灯。先补一点货，再接待第一位客人。',
  npcMemories: initialNpcMemories,
  agentTraces: [],
  completed: false,
});

const formatSigned = (value: number) => (value > 0 ? `+${value}` : `${value}`);

function appendEvent(state: GameState, event: GameEvent): GameState {
  return { ...state, events: [...state.events, event] };
}

function chooseProductForNpc(npc: Npc, memory: NpcMemory, products: Product[]) {
  const favorite = products.find((item) => item.id === npc.favorite);
  const fallback = products
    .filter((item) => item.stock > 0 && item.price <= npc.budget && !npc.dislikes.includes(item.id))
    .sort((a, b) => b.charm + b.price / 10 - (a.charm + a.price / 10))[0];
  const forgivingFallback = products
    .filter((item) => item.stock > 0 && item.price <= npc.budget)
    .sort((a, b) => b.charm - a.charm)[0];
  const trustsOwner = memory.affinity >= 4;

  if (favorite && favorite.stock > 0 && favorite.price <= npc.budget) {
    return { chosen: favorite, reason: '命中偏好商品' };
  }

  if (fallback) {
    return { chosen: fallback, reason: trustsOwner ? '基于历史好感接受替代推荐' : '选择预算内高魅力替代品' };
  }

  if (trustsOwner && forgivingFallback) {
    return { chosen: forgivingFallback, reason: '因过往好感接受一次不完美推荐' };
  }

  return { chosen: undefined, reason: '库存、价格或厌恶偏好导致无法成交' };
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
  const [game, setGame] = useState<GameState>(makeInitialState);

  const currentNpc = npcs[game.currentNpcIndex % npcs.length];
  const currentMemory = game.npcMemories[currentNpc.id];
  const metrics = useMemo(() => buildMetrics(game), [game]);
  const report = useMemo(() => buildAgentReport(game, metrics), [game, metrics]);

  const buyStock = (productId: ProductId) => {
    setGame((state) => {
      if (state.completed) return state;
      const product = state.products.find((item) => item.id === productId);
      if (!product || state.coins < product.cost) {
        return { ...state, lastMessage: '铜钱不够，今晚只能精打细算。' };
      }

      const nextProducts = state.products.map((item) =>
        item.id === productId ? { ...item, stock: item.stock + 1 } : item,
      );

      return appendEvent(
        {
          ...state,
          coins: state.coins - product.cost,
          products: nextProducts,
          lastMessage: `补进 1 件${product.name}，成本 ${product.cost}。`,
        },
        { day: state.day, type: 'buy_stock', label: product.name, value: -product.cost },
      );
    });
  };

  const serveNpc = () => {
    setGame((state) => {
      if (state.completed) return state;
      const npc = npcs[state.currentNpcIndex % npcs.length];
      const memory = state.npcMemories[npc.id];
      const { chosen, reason } = chooseProductForNpc(npc, memory, state.products);

      const visited = appendEvent(
        {
          ...state,
          visits: state.visits + 1,
          currentNpcIndex: state.currentNpcIndex + 1,
        },
        { day: state.day, type: 'npc_visit', label: npc.name, value: 1 },
      );

      if (!chosen) {
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
            `read_npc_memory: visits=${memory.visits}, affinity=${memory.affinity}, mood=${memory.mood}`,
          ],
          decision: reason,
          guardrail: '规则系统只允许扣减满意度和声望，Agent 对话不能直接改写关键数值。',
        };
        return appendEvent(
          {
            ...visited,
            satisfaction: Math.max(0, visited.satisfaction - 6),
            reputation: Math.max(0, visited.reputation - 1),
            npcMemories: { ...visited.npcMemories, [npc.id]: nextMemory },
            agentTraces: [...visited.agentTraces, trace],
            lastMessage: `${dialogue} 满意度 -6，声望 -1。`,
          },
          { day: state.day, type: 'missed_sale', label: npc.name, value: -1 },
        );
      }

      const liked = chosen.id === npc.favorite;
      const satisfactionDelta = liked ? 8 : 3;
      const reputationDelta = liked ? 3 : 1;
      const affinityDelta = liked ? 3 : npc.dislikes.includes(chosen.id) ? -1 : 1;
      const nextAffinity = Math.max(-3, Math.min(10, memory.affinity + affinityDelta));
      const dialogue = buildNpcDialogue(npc, memory, chosen, liked, reason);
      const nextMemory: NpcMemory = {
        affinity: nextAffinity,
        visits: memory.visits + 1,
        lastBought: chosen.name,
        lastFeedback: liked
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
          `read_npc_memory: visits=${memory.visits}, affinity=${memory.affinity}, mood=${memory.mood}`,
          `read_task_state: day=${state.day}, goal=${dayGoals[state.day - 1]}`,
        ],
        decision: `${reason}，推荐 ${chosen.name}`,
        guardrail: '购买结果由库存、预算、偏好和规则校验确认，Agent 只生成解释和推荐理由。',
      };
      const nextProducts = visited.products.map((item) =>
        item.id === chosen.id ? { ...item, stock: item.stock - 1 } : item,
      );

      const sold = appendEvent(
        {
          ...visited,
          coins: visited.coins + chosen.price,
          reputation: visited.reputation + reputationDelta,
          satisfaction: Math.min(100, visited.satisfaction + satisfactionDelta),
          products: nextProducts,
          sales: visited.sales + 1,
          revenue: visited.revenue + chosen.price,
          npcMemories: { ...visited.npcMemories, [npc.id]: nextMemory },
          agentTraces: [...visited.agentTraces, trace],
          lastMessage: `${dialogue} 满意度 ${formatSigned(satisfactionDelta)}，声望 ${formatSigned(reputationDelta)}，好感 ${formatSigned(affinityDelta)}。`,
        },
        { day: state.day, type: 'sale', label: chosen.name, value: chosen.price },
      );

      return appendEvent(sold, { day: state.day, type: 'npc_memory', label: `${npc.name} 好感`, value: affinityDelta });
    });
  };

  const endDay = () => {
    setGame((state) => {
      if (state.completed) return state;
      const dayRevenue = state.events
        .filter((event) => event.day === state.day && event.type === 'sale')
        .reduce((sum, event) => sum + event.value, 0);
      const dayVisits = state.events.filter((event) => event.day === state.day && event.type === 'npc_visit').length;
      const goalBonus = dayRevenue >= 25 || dayVisits >= 3 ? 8 : 0;
      const nextDay = state.day + 1;
      const completed = nextDay > 3;
      const restockPressure = state.products.filter((item) => item.stock === 0).length;
      const nextSatisfaction = Math.max(0, Math.min(100, state.satisfaction + goalBonus / 2 - restockPressure * 2));

      return appendEvent(
        {
          ...state,
          day: completed ? state.day : nextDay,
          coins: state.coins + goalBonus,
          satisfaction: nextSatisfaction,
          completed,
          lastMessage: completed
            ? `三天试营业结束。总收入 ${state.revenue}，接待 ${state.visits} 人，声望 ${state.reputation}。`
            : `第 ${state.day} 天收摊，运营奖励 ${goalBonus}。第 ${nextDay} 天目标：${dayGoals[nextDay - 1]}`,
        },
        { day: state.day, type: 'day_end', label: completed ? '试营业结束' : `进入第 ${nextDay} 天`, value: goalBonus },
      );
    });
  };

  const resetGame = () => setGame(makeInitialState());

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
            <div className="moon" />
            <div className="lantern-grid">
              <span />
              <span />
              <span />
            </div>
            <div className="stall">
              <div className="stall-roof" />
              <div className="stall-sign">怪谈夜食</div>
              <div className="goods-row">
                {game.products.map((product) => (
                  <div key={product.id} className="good-token">
                    <span>{product.name.slice(0, 1)}</span>
                    <small>{product.stock}</small>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="play-panel">
            <div className="stat-grid">
              <Stat icon={<CalendarDays size={18} />} label="天数" value={`${game.day}/3`} />
              <Stat icon={<Coins size={18} />} label="铜钱" value={game.coins} />
              <Stat icon={<Sparkles size={18} />} label="声望" value={game.reputation} />
              <Stat icon={<TrendingUp size={18} />} label="满意度" value={`${Math.round(game.satisfaction)}%`} />
            </div>

            <div className="npc-panel">
              <div className="avatar">{currentNpc.avatar}</div>
              <div>
                <p className="eyebrow">下一位顾客</p>
                <h2>{currentNpc.name}</h2>
                <p>{currentNpc.role} · {currentMemory.mood} · 预算 {currentNpc.budget}</p>
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

            <div className="goal-strip">
              <span>今日目标</span>
              <strong>{game.completed ? '试营业已完成' : dayGoals[game.day - 1]}</strong>
            </div>
          </aside>

          <section className="inventory">
            {game.products.map((product) => (
              <article key={product.id} className="product-card">
                <div>
                  <h3>{product.name}</h3>
                  <p>库存 {product.stock} · 售价 {product.price} · 魅力 {product.charm}</p>
                </div>
                <button onClick={() => buyStock(product.id)} disabled={game.completed || game.coins < product.cost}>
                  补货 {product.cost}
                </button>
              </article>
            ))}
          </section>
        </section>
      )}

      {activeTab === 'ops' && <OpsDashboard game={game} metrics={metrics} />}
      {activeTab === 'agent' && <AgentDesk report={report} game={game} npcs={npcs} />}
      {activeTab === 'config' && <ConfigView products={game.products} />}
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
    const completed =
      item.day === 1
        ? item.visits >= 2 && item.revenue >= 25
        : item.day === 2
          ? item.visits >= 3 && game.satisfaction >= 62
          : game.sales >= 4 && game.reputation >= 12;

    return {
      ...item,
      goal: dayGoals[item.day - 1],
      completed,
      progress:
        item.day === 1
          ? Math.min(100, Math.round(((item.visits / 2 + item.revenue / 25) / 2) * 100))
          : item.day === 2
            ? Math.min(100, Math.round(((item.visits / 3 + game.satisfaction / 62) / 2) * 100))
            : Math.min(100, Math.round(((game.sales / 4 + game.reputation / 12) / 2) * 100)),
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

  return { conversion, averageRevenue, missed, dayRevenue, goalStats, productStats, npcStats, dropoffNodes, goalCompletion, abTest };
}

function buildAgentReport(game: GameState, metrics: ReturnType<typeof buildMetrics>) {
  const emptyStock = game.products.filter((product) => product.stock === 0).map((product) => product.name);
  const risk = emptyStock.length > 1 ? '库存断档正在增加，会压低接待成功率。' : '库存结构暂时健康，可以继续观察偏好商品。';
  const action =
    metrics.conversion < 70
      ? '建议明天给低价高魅力商品做限时折扣，并优先补足顾客偏好商品。'
      : '建议保持当前价格，增加狐面具或醒魂茶的稀缺事件，提高高价值购买。';
  const evidence = `当前接待 ${game.visits} 人，成交 ${game.sales} 单，转化率 ${metrics.conversion}%，客单价 ${metrics.averageRevenue}。`;

  return {
    summary: game.completed ? '三天试营业已结束，可以进入版本复盘。' : `第 ${game.day} 天运营中，Agent 已生成滚动建议。`,
    evidence,
    risk,
    action,
    configDraft: {
      activityId: 'night-market-retention-001',
      target: metrics.conversion < 70 ? '提升接待转化率' : '提升高价值商品销售',
      bonus: metrics.conversion < 70 ? '首次购买赠送 3 铜钱补贴' : '狐面具稀有顾客概率 +15%',
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
              <strong>第 {item.day} 天</strong>
              <span>{item.goal}</span>
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

function AgentDesk({ report, game, npcs }: { report: ReturnType<typeof buildAgentReport>; game: GameState; npcs: Npc[] }) {
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
      <div className="panel tool-trace">
        <h2>Agent 工具调用轨迹</h2>
        <p><span>读取玩家数据</span><strong>{game.events.length} 条事件</strong></p>
        <p><span>读取商品配置</span><strong>{game.products.length} 个商品</strong></p>
        <p><span>读取 NPC 记忆</span><strong>{Object.keys(game.npcMemories).length} 个角色</strong></p>
        <p><span>生成活动草案</span><strong>等待人工确认</strong></p>
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

function ConfigView({ products }: { products: Product[] }) {
  const config = {
    version: 'ops-dashboard-0.3.0',
    maxDays: 3,
    analytics: {
      eventDriven: true,
      dashboards: ['goalCompletion', 'productConversion', 'npcInteraction', 'dropoffNodes', 'abTest'],
    },
    products: products.map(({ id, name, cost, price, charm }) => ({ id, name, cost, price, charm })),
    npcMemory: {
      enabled: true,
      fields: ['affinity', 'visits', 'mood', 'lastBought', 'lastFeedback'],
    },
    guardrails: ['AI can suggest config drafts', 'Schema validation required', 'Human approval required before applying'],
  };

  return (
    <section className="config-layout">
      <div className="panel">
        <h2>配置驱动草案</h2>
        <p>第一版先展示结构化配置，后续会接入 schema 校验、配置历史和回滚。</p>
      </div>
      <pre className="config-code">{JSON.stringify(config, null, 2)}</pre>
    </section>
  );
}

export { App };
