
# 总部后台后端建设全景规划

## 一、现状分析

### 已完成的后端基础设施
| 模块 | 数据表 | Edge Function | 实时订阅 | 状态 |
|------|--------|---------------|----------|------|
| 门店管理 | stores | - | - | 已完成 |
| 订单系统 | orders | create-order | 已启用 | 基础完成 |
| 工单系统 | tickets | - | 已启用 | 已完成 |
| 评价系统 | reviews | - | 已启用 | 已完成 |
| SKU/物料 | sku_products, sku_materials, bom_recipes | - | - | 已完成 |
| 库存系统 | store_inventory, inventory_logs | - | - | 结构完成 |
| 用户档案 | profiles, user_roles | - | - | 结构完成 |
| 补货系统 | restock_batches, restock_items | - | - | 结构完成 |

### 待建设的后端能力
| 优先级 | 模块 | 问题 | 需要建设 |
|--------|------|------|----------|
| P0 | 订单-BOM联动 | 下单不扣减库存 | 自动消耗计算 |
| P0 | 用户运营 | 全部硬编码数据 | 用户统计 API |
| P1 | 认证系统 | 未实现 | 登录/注册流程 |
| P1 | 积分系统 | 不存在 | 新建数据表+API |
| P2 | 优惠券系统 | 不存在 | 新建数据表+API |
| P2 | 财务模块 | 占位页面 | 报表聚合 API |
| P3 | 消息推送 | 不存在 | 通知系统 |

---

## 二、后端建设分阶段计划

### 阶段 1：订单履约闭环 (核心业务)

**目标**: 下单自动扣减库存，实现真正的业务闭环

**数据库改造**:
```text
无需新建表，复用现有:
- store_inventory (库存)
- inventory_logs (日志)
- bom_recipes (配方)
```

**Edge Function 升级**: `create-order`
- 接收订单后，根据 BOM 配方计算物料消耗
- 自动扣减对应门店的 store_inventory
- 写入 inventory_logs 审计日志
- 库存不足时返回错误提示

**示意流程**:
```text
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  C端下单    │───▸│ create-order│───▸│  库存扣减   │
│  美式 x2    │    │  计算BOM    │    │ 咖啡豆 -36g │
└─────────────┘    └─────────────┘    └─────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │ inventory_  │
                   │ logs 记录   │
                   └─────────────┘
```

---

### 阶段 2：用户运营后端

**目标**: 用户统计页面接入真实数据

**新建数据表**:
```text
user_points (用户积分表)
├── id: UUID
├── user_id: UUID → auth.users
├── balance: INTEGER (当前积分)
├── lifetime_points: INTEGER (累计获得)
└── updated_at: TIMESTAMPTZ

point_transactions (积分流水)
├── id: UUID
├── user_id: UUID
├── amount: INTEGER (+/-)
├── type: ENUM (earn_order, redeem, expire, bonus)
├── reference_id: UUID (关联订单等)
└── created_at: TIMESTAMPTZ
```

**新建 Edge Functions**:

1. `get-user-stats` - 用户运营统计
   - 总用户数 (COUNT profiles)
   - 本周新增 (profiles.created_at > 7天前)
   - 复购率 (订单数 >= 2 的用户占比)
   - 平均客单价 (SUM(total_amount) / COUNT(orders))

2. `get-user-segments` - 用户分层统计
   - 新用户: profiles.created_at < 7天
   - 活跃老客: 7天内有订单
   - 沉睡用户: 15-30天无订单
   - 流失用户: 30天+ 无订单

3. `get-user-insights` - 用户画像
   - 性别/区域分布 (需扩展 profiles 表)
   - 购买时段分布 (聚合 orders.created_at)
   - 口味偏好 (聚合 orders.items)

---

### 阶段 3：认证与权限

**目标**: 实现三端统一认证

**认证流程**:
```text
┌────────────────┐
│   C端小程序    │──┐
└────────────────┘  │
┌────────────────┐  │    ┌──────────────┐    ┌───────────────┐
│   商家端App    │──┼───▸│ Supabase Auth│───▸│ user_roles    │
└────────────────┘  │    │   统一认证   │    │ 角色判断      │
┌────────────────┐  │    └──────────────┘    └───────────────┘
│ 总部Command    │──┘
└────────────────┘
```

**新建 Edge Functions**:

1. `auth-register` - 用户注册
   - 支持手机号/邮箱注册
   - 自动创建 profiles 记录
   - 默认赋予 public_user 角色

2. `auth-merchant-login` - 商家登录
   - 验证 user_roles 中的 merchant 角色
   - 返回关联的 store_id

3. `get-current-user` - 获取用户信息
   - 返回 profile + roles + 积分余额

---

### 阶段 4：优惠券系统

**目标**: 支持总部一键投券、C端核销

**新建数据表**:
```text
coupons (优惠券模板)
├── id: UUID
├── name: TEXT (券名称)
├── type: ENUM (discount, fixed, freebie)
├── value: NUMERIC (折扣值/抵扣金额)
├── min_order: NUMERIC (满减门槛)
├── valid_days: INTEGER (有效天数)
├── target_segment: TEXT (目标人群)
└── created_at: TIMESTAMPTZ

user_coupons (用户券包)
├── id: UUID
├── user_id: UUID
├── coupon_id: UUID → coupons
├── status: ENUM (active, used, expired)
├── received_at: TIMESTAMPTZ
├── used_at: TIMESTAMPTZ
├── used_order_id: UUID
└── expire_at: TIMESTAMPTZ
```

**新建 Edge Functions**:

1. `batch-send-coupons` - 批量发券
   - 根据用户分层筛选目标用户
   - 批量插入 user_coupons

2. `redeem-coupon` - 核销优惠券
   - 验证券有效性
   - 更新状态为 used
   - 关联 order_id

---

### 阶段 5：财务报表

**目标**: 财务模块数据驱动

**新建 Edge Functions**:

1. `get-finance-summary` - 财务概览
   - 今日/本周/本月营收
   - 订单数量趋势
   - 各门店营收排行

2. `get-cost-analysis` - 成本分析
   - 物料消耗成本 (sku_materials.cost × 消耗量)
   - 毛利率计算

---

## 三、数据库扩展汇总

**新增表 (共 4 张)**:
| 表名 | 用途 | 关联 |
|------|------|------|
| user_points | 用户积分余额 | profiles |
| point_transactions | 积分流水记录 | user_points, orders |
| coupons | 优惠券模板 | - |
| user_coupons | 用户券包 | profiles, coupons, orders |

**扩展现有表**:
| 表名 | 新增字段 | 用途 |
|------|----------|------|
| profiles | gender, region, birth_date | 用户画像 |
| orders | coupon_id, points_earned, points_used | 积分/优惠券关联 |

---

## 四、Edge Functions 清单

| 函数名 | 阶段 | 功能 | 认证要求 |
|--------|------|------|----------|
| create-order (升级) | 1 | 下单+BOM扣减 | 可选 |
| get-user-stats | 2 | 用户统计 | Admin |
| get-user-segments | 2 | 用户分层 | Admin |
| get-user-insights | 2 | 用户画像 | Admin |
| auth-register | 3 | 用户注册 | 公开 |
| auth-merchant-login | 3 | 商家登录 | 公开 |
| get-current-user | 3 | 获取当前用户 | 认证 |
| batch-send-coupons | 4 | 批量发券 | Admin |
| redeem-coupon | 4 | 核销优惠券 | 认证 |
| get-finance-summary | 5 | 财务概览 | Admin |
| get-cost-analysis | 5 | 成本分析 | Admin |

---

## 五、建议执行顺序

```text
第1周: 阶段1 - 订单履约闭环
       ↓ 核心业务流转，C端可真实下单
第2周: 阶段2 - 用户运营后端
       ↓ 用户统计页面接入真实数据
第3周: 阶段3 - 认证与权限
       ↓ 三端可登录，数据归属用户
第4周: 阶段4 - 优惠券系统
       ↓ 营销闭环，提升复购
第5周: 阶段5 - 财务报表
       ↓ 经营数据可视化
```

---

## 六、技术细节

### RLS 策略设计
- user_points: 用户只能查看自己的积分
- user_coupons: 用户只能查看/使用自己的券
- coupons: Admin 可管理，用户只读

### 实时订阅
- user_points: 启用，积分变动实时显示
- user_coupons: 启用，新券实时推送

### 性能考虑
- 用户分层统计使用数据库函数 (RPC) 而非前端计算
- 财务报表支持缓存，避免频繁聚合查询
