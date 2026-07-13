import { useMemo, useState } from 'react';
import {
  BarChart3,
  Bot,
  Boxes,
  CalendarDays,
  Coins,
  MessageSquareText,
  RotateCcw,
  Sparkles,
  Store,
  TrendingUp,
} from 'lucide-react';

type ProductId = 'moonCake' | 'spiritTea' | 'paperLantern' | 'foxMask' | 'rainBell';
type Tab = 'game' | 'ops' | 'agent' | 'config';

type Product = {
  id: ProductId;
  name: string;
  cost: number;
  price: number;
  stock: number;
  charm: number;
};

type Npc = {
  name: string;
  role: string;
  mood: string;
  budget: number;
  favorite: ProductId;
  quote: string;
  avatar: string;
};

type GameEvent = {
  day: number;
  type: 'buy_stock' | 'npc_visit' | 'sale' | 'missed_sale' | 'day_end' | 'reset';
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
    name: '阿青',
    role: '赶夜路的学生',
    mood: '紧张',
    budget: 16,
    favorite: 'spiritTea',
    quote: '我总觉得身后有人，来杯能醒神的东西吧。',
    avatar: '青',
  },
  {
    name: '灰伞婆婆',
    role: '雨巷常客',
    mood: '挑剔',
    budget: 14,
    favorite: 'rainBell',
    quote: '铃声要清，不然夜里的路会走偏。',
    avatar: '伞',
  },
  {
    name: '狐面少年',
    role: '节庆演员',
    mood: '兴奋',
    budget: 26,
    favorite: 'foxMask',
    quote: '老板，有没有戴上就不像自己的面具？',
    avatar: '狐',
  },
  {
    name: '巡夜人',
    role: '街口守夜者',
    mood: '疲惫',
    budget: 18,
    favorite: 'moonCake',
    quote: '今晚雾重，甜一点的东西能稳住心。',
    avatar: '巡',
  },
  {
    name: '灯纸匠',
    role: '手艺人',
    mood: '温和',
    budget: 15,
    favorite: 'paperLantern',
    quote: '好灯不怕风，怕的是没人点它。',
    avatar: '灯',
  },
];

const dayGoals = [
  '完成 2 次接待，赚到 25 枚铜钱',
  '让满意度保持 62 以上，并完成 3 次接待',
  '卖出至少 4 件商品，声望达到 12',
];

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
  completed: false,
});

const formatSigned = (value: number) => (value > 0 ? `+${value}` : `${value}`);

function appendEvent(state: GameState, event: GameEvent): GameState {
  return { ...state, events: [...state.events, event] };
}

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('game');
  const [game, setGame] = useState<GameState>(makeInitialState);

  const currentNpc = npcs[game.currentNpcIndex % npcs.length];
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
      const favorite = state.products.find((item) => item.id === npc.favorite);
      const fallback = state.products
        .filter((item) => item.stock > 0 && item.price <= npc.budget)
        .sort((a, b) => b.charm - a.charm)[0];
      const chosen = favorite && favorite.stock > 0 && favorite.price <= npc.budget ? favorite : fallback;

      const visited = appendEvent(
        {
          ...state,
          visits: state.visits + 1,
          currentNpcIndex: state.currentNpcIndex + 1,
        },
        { day: state.day, type: 'npc_visit', label: npc.name, value: 1 },
      );

      if (!chosen) {
        return appendEvent(
          {
            ...visited,
            satisfaction: Math.max(0, visited.satisfaction - 6),
            reputation: Math.max(0, visited.reputation - 1),
            lastMessage: `${npc.name}摇摇头：今晚没有合适的东西。满意度 -6，声望 -1。`,
          },
          { day: state.day, type: 'missed_sale', label: npc.name, value: -1 },
        );
      }

      const liked = chosen.id === npc.favorite;
      const satisfactionDelta = liked ? 8 : 3;
      const reputationDelta = liked ? 3 : 1;
      const nextProducts = visited.products.map((item) =>
        item.id === chosen.id ? { ...item, stock: item.stock - 1 } : item,
      );

      return appendEvent(
        {
          ...visited,
          coins: visited.coins + chosen.price,
          reputation: visited.reputation + reputationDelta,
          satisfaction: Math.min(100, visited.satisfaction + satisfactionDelta),
          products: nextProducts,
          sales: visited.sales + 1,
          revenue: visited.revenue + chosen.price,
          lastMessage: `${npc.name}买走了${chosen.name}。${liked ? '正中喜好' : '虽然不是最爱，但还算满意'}，满意度 ${formatSigned(satisfactionDelta)}，声望 ${formatSigned(reputationDelta)}。`,
        },
        { day: state.day, type: 'sale', label: chosen.name, value: chosen.price },
      );
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
                <p>{currentNpc.role} · {currentNpc.mood} · 预算 {currentNpc.budget}</p>
                <blockquote>{currentNpc.quote}</blockquote>
              </div>
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
      {activeTab === 'agent' && <AgentDesk report={report} game={game} />}
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
  const dayRevenue = [1, 2, 3].map((day) => ({
    day,
    revenue: game.events.filter((event) => event.day === day && event.type === 'sale').reduce((sum, event) => sum + event.value, 0),
    visits: game.events.filter((event) => event.day === day && event.type === 'npc_visit').length,
  }));

  return { conversion, averageRevenue, missed, dayRevenue };
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

  return (
    <section className="dashboard-layout">
      <div className="kpi-row">
        <Stat icon={<MessageSquareText size={18} />} label="接待人数" value={game.visits} />
        <Stat icon={<Coins size={18} />} label="总收入" value={game.revenue} />
        <Stat icon={<TrendingUp size={18} />} label="成交转化" value={`${metrics.conversion}%`} />
        <Stat icon={<BarChart3 size={18} />} label="流失次数" value={metrics.missed} />
      </div>
      <section className="panel">
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

function AgentDesk({ report, game }: { report: ReturnType<typeof buildAgentReport>; game: GameState }) {
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
        <p><span>生成活动草案</span><strong>等待人工确认</strong></p>
      </div>
      <pre className="config-code">{JSON.stringify(report.configDraft, null, 2)}</pre>
    </section>
  );
}

function ConfigView({ products }: { products: Product[] }) {
  const config = {
    version: 'web-mvp-0.1.0',
    maxDays: 3,
    products: products.map(({ id, name, cost, price, charm }) => ({ id, name, cost, price, charm })),
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
