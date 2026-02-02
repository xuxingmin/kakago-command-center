

# 财务模块设计规划

## 一、模块总览

财务模块将提供完整的资金流可视化和门店结算管理功能，分为两大核心板块：

```text
┌─────────────────────────────────────────────────────────────┐
│                      财务模块 /finance                       │
├───────────────────────────┬─────────────────────────────────┤
│      财务经营看板          │         门店结算中心            │
│  (实时资金流 + KPI指标)    │    (周期结算 + 对账管理)        │
└───────────────────────────┴─────────────────────────────────┘
```

---

## 二、财务经营看板设计

### 2.1 顶部 KPI 指标卡片

| 指标 | 数据来源 | 计算逻辑 |
|------|----------|----------|
| 总营收 | orders.total_amount | SUM(已完成订单金额) |
| 今日营收 | orders | 当日 completed 订单合计 |
| 物料成本 | inventory_logs + sku_materials | 消耗量 x 单位成本 |
| 毛利率 | 计算字段 | (营收 - 物料成本) / 营收 |
| 应付门店 | settlements | 待结算金额合计 |
| 优惠券投放成本 | user_coupons | 已核销券面额 x 50% |

### 2.2 资金流全景图 (Sankey/瀑布图)

```text
进项 (收入)                              出项 (支出)
┌──────────────┐                    ┌──────────────┐
│ 订单营收     │───────┐    ┌───────│ 物料采购成本 │
│ ¥ 128,560    │       │    │       │ ¥ 38,200     │
└──────────────┘       │    │       └──────────────┘
┌──────────────┐       ▼    ▼       ┌──────────────┐
│ 会员充值     │───▸ 资金池 ───▸    │ 门店结算     │
│ ¥ 12,800     │    ¥ 92,160       │ ¥ 64,000     │
└──────────────┘                    └──────────────┘
┌──────────────┐                    ┌──────────────┐
│ 其他收入     │                    │ 优惠券成本   │
│ ¥ 2,000      │                    │ ¥ 8,200      │
└──────────────┘                    └──────────────┘
```

### 2.3 财务报表组件

**收入明细表**
- 按日期/门店/品类筛选
- 订单笔数、金额、退款
- 环比/同比增长率

**成本明细表**
- 物料消耗成本（基于 BOM 反算）
- 补货采购成本（基于 restock_batches）
- 优惠券核销成本

**应收应付表**
- 应收：会员充值余额、预付款
- 应付：待结算门店款项、供应商货款

---

## 三、门店结算中心设计

### 3.1 结算规则

```text
Kakago 平台结算周期：每 7 天
结算日：每周固定日（可配置）

门店应得金额计算公式：
┌─────────────────────────────────────────────────────────┐
│ 应结金额 = 门店订单总额 - 平台服务费 - 优惠券分摊成本   │
│                                                         │
│ 其中:                                                   │
│ - 平台服务费 = 订单总额 x 费率（可配置，如 5%）          │
│ - 优惠券分摊成本 = 门店核销券面额 x 50%                 │
└─────────────────────────────────────────────────────────┘
```

### 3.2 结算状态流转

```text
pending (待结算)
    │
    ▼ 周期到达 + 审核
confirmed (已确认)
    │
    ▼ 财务打款
paid (已支付)
    │
    ▼ 门店确认
completed (已完成)
```

### 3.3 门店结算列表视图

| 列名 | 说明 |
|------|------|
| 门店名称 | 关联 stores.name |
| 结算周期 | 2026-01-27 ~ 2026-02-02 |
| 订单笔数 | 该周期内完成订单数 |
| 订单总额 | SUM(total_amount) |
| 优惠券核销数 | 核销券数量 |
| 优惠券成本 | 券面额 x 50% |
| 平台服务费 | 订单总额 x 费率 |
| 应结金额 | 最终应付门店金额 |
| 状态 | pending/confirmed/paid |
| 操作 | 确认/导出/查看明细 |

---

## 四、数据库设计

### 4.1 新增表

**settlements (结算记录表)**
```sql
CREATE TABLE public.settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id),
  
  -- 结算周期
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- 金额明细
  order_count INTEGER DEFAULT 0,
  order_total NUMERIC DEFAULT 0,
  
  -- 扣减项
  coupon_count INTEGER DEFAULT 0,
  coupon_cost NUMERIC DEFAULT 0,          -- 券面额 x 50%
  platform_fee_rate NUMERIC DEFAULT 0.05, -- 平台费率
  platform_fee NUMERIC DEFAULT 0,         -- 平台服务费
  
  -- 最终金额
  settlement_amount NUMERIC DEFAULT 0,    -- 应结金额
  
  -- 状态
  status settlement_status DEFAULT 'pending',
  confirmed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  
  -- 备注
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TYPE settlement_status AS ENUM ('pending', 'confirmed', 'paid', 'completed');
```

**financial_transactions (资金流水表)**
```sql
CREATE TABLE public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 流水类型
  type financial_tx_type NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
  
  -- 金额
  amount NUMERIC NOT NULL,
  
  -- 关联
  store_id UUID REFERENCES stores(id),
  order_id UUID REFERENCES orders(id),
  settlement_id UUID REFERENCES settlements(id),
  
  -- 描述
  description TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TYPE financial_tx_type AS ENUM (
  'order_revenue',      -- 订单收入
  'refund',             -- 退款
  'material_purchase',  -- 物料采购
  'store_settlement',   -- 门店结算支出
  'coupon_cost',        -- 优惠券成本
  'other_income',       -- 其他收入
  'other_expense'       -- 其他支出
);
```

**coupons (优惠券模板) - 如尚未创建**
```sql
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type coupon_type NOT NULL,
  value NUMERIC NOT NULL,           -- 面额
  min_order NUMERIC DEFAULT 0,      -- 满减门槛
  valid_days INTEGER DEFAULT 7,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TYPE coupon_type AS ENUM ('fixed', 'discount', 'freebie');
```

**user_coupons (用户券包) - 如尚未创建**
```sql
CREATE TABLE public.user_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  coupon_id UUID REFERENCES coupons(id),
  store_id UUID REFERENCES stores(id),    -- 核销门店
  
  status coupon_status DEFAULT 'active',
  
  received_at TIMESTAMPTZ DEFAULT now(),
  used_at TIMESTAMPTZ,
  used_order_id UUID REFERENCES orders(id),
  expire_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TYPE coupon_status AS ENUM ('active', 'used', 'expired');
```

### 4.2 扩展 orders 表

```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES coupons(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_discount NUMERIC DEFAULT 0;
```

---

## 五、Edge Functions 设计

### 5.1 get-finance-summary

**功能**: 获取财务概览数据

**返回数据**:
```json
{
  "today": {
    "revenue": 12560,
    "orderCount": 89,
    "materialCost": 3800,
    "couponCost": 1200,
    "grossProfit": 7560,
    "grossMargin": 0.602
  },
  "thisWeek": { ... },
  "thisMonth": { ... },
  "pendingSettlement": 64000,
  "trends": [
    { "date": "2026-01-27", "revenue": 11200, "cost": 3400 },
    ...
  ]
}
```

### 5.2 get-store-settlements

**功能**: 获取门店结算列表

**参数**:
- period_start: 周期开始日期
- period_end: 周期结束日期
- store_id: 可选，指定门店
- status: 可选，筛选状态

**返回数据**:
```json
{
  "settlements": [
    {
      "store_id": "uuid",
      "store_name": "望京店",
      "period": "2026-01-27 ~ 2026-02-02",
      "order_count": 156,
      "order_total": 8920,
      "coupon_count": 12,
      "coupon_cost": 180,
      "platform_fee": 446,
      "settlement_amount": 8294,
      "status": "pending"
    }
  ],
  "summary": {
    "total_stores": 205,
    "total_amount": 1680000,
    "total_coupon_cost": 42000,
    "total_platform_fee": 84000
  }
}
```

### 5.3 generate-weekly-settlements

**功能**: 生成周期结算单（定时任务触发或手动执行）

**逻辑**:
1. 查询上一周期所有门店的已完成订单
2. 计算各门店核销的优惠券成本
3. 计算平台服务费
4. 生成 settlements 记录
5. 写入 financial_transactions 流水

### 5.4 confirm-settlement

**功能**: 确认结算单（管理员操作）

### 5.5 get-cashflow-report

**功能**: 获取资金流报表

**返回**: 按类型汇总的进出项数据，支持 Sankey 图渲染

---

## 六、前端页面结构

```text
src/pages/Finance.tsx
├── 顶部 Tab 切换: 财务看板 | 门店结算
│
├── [财务看板 Tab]
│   ├── components/finance/FinanceKPICards.tsx      -- KPI 指标卡片
│   ├── components/finance/CashflowChart.tsx        -- 资金流图表
│   ├── components/finance/RevenueTrendChart.tsx    -- 营收趋势
│   ├── components/finance/CostBreakdown.tsx        -- 成本构成
│   └── components/finance/ReceivablePayable.tsx    -- 应收应付
│
└── [门店结算 Tab]
    ├── components/finance/SettlementFilters.tsx    -- 筛选器(周期/门店)
    ├── components/finance/SettlementTable.tsx      -- 结算列表
    ├── components/finance/SettlementSummary.tsx    -- 汇总统计
    └── components/finance/SettlementDetail.tsx     -- 结算详情抽屉
```

---

## 七、UI 设计参考

### 财务看板布局

```text
┌─────────────────────────────────────────────────────────────┐
│  [财务看板]  [门店结算]                                       │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────┬─────────┬─────────┬─────────┬─────────┬───────┐ │
│ │总营收   │今日营收 │物料成本 │毛利率   │待结算   │券成本 │ │
│ │¥1.28M  │¥12,560 │¥38.2K  │68.2%   │¥64K    │¥8.2K │ │
│ └─────────┴─────────┴─────────┴─────────┴─────────┴───────┘ │
├─────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────┬──────────────────────────┐   │
│ │      资金流瀑布图          │      营收趋势图          │   │
│ │                            │                          │   │
│ │  收入 ████████████         │    ╭──╮                  │   │
│ │  成本 ████████             │   ╭╯  ╰──╮               │   │
│ │  结算 ██████               │  ╭╯      ╰──╮            │   │
│ │  净利 ████                 │ ╭╯          ╰╮           │   │
│ │                            │                          │   │
│ └────────────────────────────┴──────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────┬──────────────────────────┐   │
│ │      成本构成饼图          │      应收/应付明细       │   │
│ │                            │                          │   │
│ │     ╭───────╮              │  应收  ¥ 12,800         │   │
│ │    ╱ 物料60%╲             │  应付  ¥ 72,200         │   │
│ │   │ 优惠券15%│             │  净额  -¥ 59,400        │   │
│ │    ╲ 其他25%╱             │                          │   │
│ │     ╰───────╯              │                          │   │
│ └────────────────────────────┴──────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 门店结算布局

```text
┌─────────────────────────────────────────────────────────────┐
│  [财务看板]  [门店结算]                                       │
├─────────────────────────────────────────────────────────────┤
│ 结算周期: [2026-01-27] ~ [2026-02-02]  状态:[全部▼] [生成结算]│
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 汇总: 205家门店 | 订单¥1,680,000 | 券成本¥42,000        │ │
│ │       平台费¥84,000 | 应结¥1,554,000                    │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────────┐   │
│ │ 门店名称   订单数  订单总额  券核销  券成本  应结金额 状态│   │
│ ├───────────────────────────────────────────────────────┤   │
│ │ 望京店      156    ¥8,920    12     ¥180   ¥8,294   待结│   │
│ │ 朝阳店      203    ¥11,560   18     ¥270   ¥10,767  待结│   │
│ │ 海淀店      189    ¥10,200   15     ¥225   ¥9,480   已结│   │
│ │ ...                                                   │   │
│ └───────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 八、实施步骤

### 第一步: 数据库建设
1. 创建 settlements 表
2. 创建 financial_transactions 表
3. 创建 coupons 和 user_coupons 表（如未创建）
4. 扩展 orders 表添加优惠券字段
5. 配置 RLS 策略

### 第二步: Edge Functions 开发
1. get-finance-summary - 财务概览
2. get-store-settlements - 结算列表
3. generate-weekly-settlements - 生成结算单
4. confirm-settlement - 确认结算

### 第三步: 前端组件开发
1. 创建 components/finance/ 目录
2. 实现 KPI 卡片组件
3. 实现资金流图表（使用 recharts）
4. 实现门店结算表格
5. 实现结算详情抽屉

### 第四步: 页面整合
1. 重构 Finance.tsx 添加 Tab 切换
2. 整合所有财务组件
3. 接入真实数据

---

## 九、技术要点

### 结算金额计算公式
```typescript
const calculateSettlement = (
  orderTotal: number,
  couponFaceValue: number,
  platformFeeRate: number = 0.05
) => {
  const couponCost = couponFaceValue * 0.5;  // 券面额 50%
  const platformFee = orderTotal * platformFeeRate;
  const settlementAmount = orderTotal - couponCost - platformFee;
  return { couponCost, platformFee, settlementAmount };
};
```

### 周期自动结算
- 使用数据库定时任务（pg_cron）每周固定时间触发
- 或提供手动"生成本周结算"按钮

### RLS 策略
- settlements 表：Admin 可读写，门店仅可读取自己的记录
- financial_transactions：仅 Admin 可访问

