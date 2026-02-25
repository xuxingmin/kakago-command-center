

# 营销中心模块规划

## 概述

在侧边栏"商家中心"下方新增"营销中心"入口（路由 `/marketing`），提供一个独立的营销活动管理页面，涵盖券模板管理、活动创建、投放记录追踪等功能。

---

## 一、导航变更

在 `CommandSidebar.tsx` 的菜单项中，在"商家中心"和"供应链"之间插入：

```text
作战室
用户中心
商家中心
营销中心  <-- 新增 (Megaphone 图标)
供应链
财务
设置
```

在 `App.tsx` 中添加 `/marketing` 路由。

---

## 二、页面布局设计

营销中心采用与项目一致的 HUD 深色风格，分为 3 个 Tab：

```text
┌─────────────────────────────────────────────────────────────┐
│  [券模板管理]  [营销活动]  [投放记录]                         │
├─────────────────────────────────────────────────────────────┤
```

### Tab 1: 券模板管理

管理 `coupons` 表中的券种模板，支持增删改。

```text
┌─────────┬─────────┬──────────┬──────────┐
│ KPI     │ KPI     │ KPI      │ KPI      │
│ 券种总数 │ 活跃中  │ 总发放量  │ 核销率   │
└─────────┴─────────┴──────────┴──────────┘
┌─────────────────────────────────────────┐
│ [+ 新建券模板]                           │
├─────────────────────────────────────────┤
│ 券名称  类型  面额  门槛  有效期  状态 操作│
│ 买一赠一  fixed  ¥15  ¥30  7天  活跃  编辑│
│ ...                                     │
└─────────────────────────────────────────┘
```

- 券类型：fixed（满减）、discount（折扣）、freebie（赠品）
- 操作：编辑、停用/启用

### Tab 2: 营销活动

创建和管理营销活动，将券与人群/门店绑定。

```text
┌─────────────────────────────────────────┐
│ [+ 创建活动]                             │
├─────────────────────────────────────────┤
│ 活动名称    目标人群    券种    状态  时间 │
│ 新人首单礼  新用户      买一赠一  进行中  │
│ 沉睡唤醒    沉睡用户    5折券    已结束  │
└─────────────────────────────────────────┘
```

需要新建 `marketing_campaigns` 表来存储活动数据。

### Tab 3: 投放记录

展示 `user_coupons` 表的投放和核销数据流水。

```text
┌─────────────────────────────────────────┐
│ 筛选: [全部状态▼] [时间范围]              │
├─────────────────────────────────────────┤
│ 时间       用户      券名称  门店  状态  │
│ 02-25 14:30  138****  5折券  望京  已核销│
│ 02-25 14:28  139****  赠饮券  朝阳  待使用│
└─────────────────────────────────────────┘
```

---

## 三、数据库变更

### 新建 `marketing_campaigns` 表

```sql
CREATE TABLE public.marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  coupon_id UUID REFERENCES coupons(id),
  target_segment TEXT NOT NULL,        -- 'new' | 'active' | 'sleeping' | 'lost' | 'all'
  target_store_ids UUID[],             -- 指定门店，空=全部
  target_count INTEGER DEFAULT 0,      -- 目标人数
  sent_count INTEGER DEFAULT 0,        -- 已发放数
  used_count INTEGER DEFAULT 0,        -- 已核销数
  status TEXT DEFAULT 'draft',         -- draft | active | paused | completed
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage campaigns"
  ON public.marketing_campaigns FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read active campaigns"
  ON public.marketing_campaigns FOR SELECT
  USING (status = 'active');
```

---

## 四、前端文件结构

```text
src/pages/Marketing.tsx                    -- 主页面 (Tab 切换)
src/components/marketing/CouponTemplates.tsx  -- 券模板管理
src/components/marketing/CampaignList.tsx     -- 营销活动列表
src/components/marketing/CampaignForm.tsx     -- 创建/编辑活动弹窗
src/components/marketing/DistributionLog.tsx  -- 投放记录流水
src/components/marketing/MarketingKPIRow.tsx  -- 顶部 KPI 统计
```

---

## 五、实施步骤

1. **数据库**: 创建 `marketing_campaigns` 表 + RLS
2. **路由**: 在 `App.tsx` 添加 `/marketing` 路由，在 `CommandSidebar.tsx` 添加导航项
3. **页面**: 创建 `Marketing.tsx` 主页面，包含三个 Tab
4. **组件**: 
   - `MarketingKPIRow` -- 券种数、发放量、核销率等 KPI
   - `CouponTemplates` -- 读取 `coupons` 表，支持新建/编辑券模板
   - `CampaignList` + `CampaignForm` -- 活动管理 CRUD
   - `DistributionLog` -- 读取 `user_coupons` 表展示投放流水
5. **整合**: 与用户中心的 `CouponDialog` 联动，投券操作写入 `user_coupons` 和 `marketing_campaigns`

---

## 六、技术要点

- 复用已有的 `coupons` 和 `user_coupons` 表，无需重复建表
- 券模板管理直接操作 `coupons` 表 CRUD
- 活动创建时关联 `coupon_id` 和目标人群
- 投放记录从 `user_coupons` JOIN `coupons` + `stores` 展示
- 所有组件遵循项目 HUD 风格：`#121212` 背景、`#333` 边框、JetBrains Mono 数字、`#7F00FF` 强调色

