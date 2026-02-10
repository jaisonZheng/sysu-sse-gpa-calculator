# 中山大学保研绩点计算器 - 项目开发文档

## 项目概述

为中山大学学生开发的保研绩点计算器网站，支持手动输入和自动爬取两种模式。

**已授权声明**：本项目已获得学校授权爬取教务系统数据，仅用于本校学生个人成绩计算。

---

## 测试账号信息

### 测试账号 1（有缓考/P-NP科目）
- **NetID**: `chenjliang27`
- **密码**: `1925Asd.`
- **用途**: 测试缓考科目和 Pass/Not Pass 科目的处理

### 测试账号 2
- **NetID**: （请询问管理员）
- **密码**: （请询问管理员）

**注意**：测试账号包含真实学生信息，请妥善保管，不要泄露给他人。

---

## 教务系统信息

### 登录流程
1. 访问登录页面：`https://jwxt.sysu.edu.cn/jwxt/#/login`
2. 点击"统一身份认证登录"（netid登录）
3. 跳转到CAS认证页面：`https://cas.sysu.edu.cn/esc-sso/login/page`
4. 如有"切换账号"按钮，先点击切换
5. 输入netid和密码
6. 登录成功后跳转到：`https://jwxt.sysu.edu.cn/jwxt/#/student`

### 成绩查询页面
- **URL**: `https://jwxt.sysu.edu.cn/jwxt/mk/studentWeb/#/stuAchievementView?code=jwxsd_wdcj&resourceName=%E6%88%91%E7%9A%84%E6%88%90%E7%BB%A9`
- **操作步骤**：
  1. 选择"学年"（如 2024-2025）
  2. 选择"学期"（第一学期 / 第二学期）
  3. 点击"查询"按钮
  4. 获取成绩表格数据

### 成绩表格字段
| 字段 | 说明 |
|------|------|
| 序号 | 行号 |
| 课程属性 | 公必/专必/专选/公选 |
| 课程名称 | 课程中文名 |
| 教师 | 授课教师 |
| 学年 | 学年名称 |
| 学期 | 第一学期/第二学期 |
| 学分 | 课程学分 |
| 原始成绩 | 百分制成绩 |
| 成绩 | 最终成绩（可能为"P"/"NP"/"缓考"）|
| 特殊原因 | 缓考等特殊情况 |
| 绩点 | 课程绩点 |
| 考试性质 | 正常/补考等 |
| 及格标志 | 是/否 |
| 班级排名 | 排名百分比 |

---

## 保研绩点计算规则

### 计算公式
```
综合成绩绩点 = (所有公共必修课和一年级专业必修课的平均绩点 × 0.5) + (二年级和三年级专业必修课的平均绩点 × 0.5)
```

### 课程分类
- **公必**：公共必修课
- **专必**：专业必修课
- **专选**：专业选修课
- **公选**：公共选修课（不计入保研绩点）

### 特殊成绩处理
- **缓考科目**：显示为"缓考"，不纳入GPA计算
- **P/NP科目**：显示为"P"或"NP"，不纳入GPA计算
- **正常科目**：按百分制成绩转换为绩点

### 百分制转绩点规则
| 分数 | 绩点 |
|------|------|
| 90-100 | 5.0 |
| 85-89 | 4.7 |
| 80-84 | 4.2 |
| 75-79 | 3.7 |
| 70-74 | 3.2 |
| 65-69 | 2.7 |
| 60-64 | 2.2 |
| < 60 | 0 |

---

## 技术栈

### 前端
- **框架**: React + TypeScript + Vite
- **UI组件**: Tailwind CSS + shadcn/ui
- **状态管理**: React Context
- **构建工具**: Vite

### 后端
- **框架**: Node.js + Express + TypeScript
- **数据库**: SQLite (轻量级，适合单机部署)
- **爬虫**: Playwright (无头浏览器)
- **进程管理**: PM2

### 部署
- **服务器**: 腾讯云 (IP: 43.136.42.69)
- **反向代理**: Nginx
- **端口**: 8082 (后端API)

---

## 项目结构

```
gpa-calculator/
├── frontend/                 # React前端
│   ├── src/
│   │   ├── components/       # UI组件
│   │   ├── pages/            # 页面
│   │   ├── types/            # TypeScript类型
│   │   └── App.tsx           # 主应用
│   ├── package.json
│   └── vite.config.ts
├── backend/                  # Node.js后端
│   ├── src/
│   │   ├── routes/           # API路由
│   │   ├── services/         # 业务逻辑
│   │   ├── scraper/          # 爬虫模块
│   │   │   └── scraper.ts    # 成绩爬取逻辑
│   │   ├── database/         # 数据库
│   │   ├── utils/            # 工具函数
│   │   │   └── gpa.ts        # GPA计算逻辑
│   │   └── types/            # 类型定义
│   │       └── index.ts      # 核心类型
│   ├── package.json
│   └── tsconfig.json
├── deploy/                   # 部署脚本
│   └── nginx.conf
├── CLAUDE.md                 # 本文档
└── README.md                 # 用户说明文档
```

---

## API 端点

### 自动模式
```
POST /api/auto/login
请求: { netid, password }
响应: { success, sessionId, message }

POST /api/auto/fetch-grades
请求: { sessionId }
响应: { success, courses[], gpaResult, message }

POST /api/auto/logout
请求: { sessionId }
响应: { success }
```

### 手动模式
```
POST /api/manual/calculate
请求: { courses: [{name, credits, score, category, year}] }
响应: { finalGpa, details: {...} }
```

---

## 数据库表结构

### user_grades (用户成绩)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 自增ID |
| session_id | TEXT | 用户会话ID |
| course_code | TEXT | 课程代码 |
| course_name | TEXT | 课程名称 |
| credits | REAL | 学分 |
| score | REAL | 百分制成绩 |
| gpa | REAL | 绩点 |
| category | TEXT | 课程类别 |
| academic_year | INTEGER | 学年: 1/2/3 |
| semester | INTEGER | 学期: 1/2 |
| status | TEXT | 状态: normal/deferred/pass/not_pass |
| display_score | TEXT | 显示值: 缓考/P/NP |
| created_at | TIMESTAMP | 创建时间 |

---

## 开发注意事项

### 1. 爬虫开发
- 使用 Playwright 的无头浏览器模式
- 需要配置代理（服务器上使用 127.0.0.1:7890）
- 注意页面加载等待时间（使用 waitForTimeout）
- 学年和学期选择器需要分别操作

### 2. 成绩获取逻辑
```typescript
// 伪代码
for each year in ["2023-2024", "2024-2025", "2025-2026"]:
  for each semester in ["第一学期", "第二学期"]:
    selectYear(year)
    selectSemester(semester)
    clickQueryButton()
    waitForTableLoad()
    extractGrades()
```

### 3. 特殊成绩识别
- **缓考**: `specialReason` 包含"缓考" 或 `finalScore` 包含"缓"
- **P**: `finalScore` 为 "P" 或包含"合格"
- **NP**: `finalScore` 为 "NP" 或包含"不合格"

### 4. GPA计算排除规则
在 `utils/gpa.ts` 中的 `shouldIncludeInCalculation` 函数：
```typescript
- 缓考 (deferred) → 排除
- P/NP (pass/not_pass) → 排除
- 正常成绩 (normal) → 包含
```

### 5. 数据库查询
```sql
-- 查询某个用户的所有成绩
SELECT * FROM user_grades WHERE session_id = ? ORDER BY academic_year, semester;

-- 查询缓考科目
SELECT * FROM user_grades WHERE status = 'deferred';

-- 查询P/NP科目
SELECT * FROM user_grades WHERE status IN ('pass', 'not_pass');
```

---

## 部署命令

### 本地构建
```bash
cd frontend
npm install
npm run build
cd ../backend
npm install
npm run build
```

### 服务器部署
```bash
# 上传文件
scp -r frontend/dist ubuntu@43.136.42.69:/var/www/gpa-calculator/
scp -r backend ubuntu@43.136.42.69:~/gpa-calculator/

# 服务器端操作
ssh ubuntu@43.136.42.69
cd ~/gpa-calculator/backend
npm install
npm run build

# 重启服务
pm2 restart gpa-backend
```

---

## 常见问题

### Q: 如何测试爬虫？
A: 使用测试账号 `chenjliang27` / `1925Asd.`，该账号有缓考和 P/NP 科目，可用于测试特殊成绩处理。

### Q: 成绩表格没有加载？
A: 检查是否已选择学年和学期，并点击了"查询"按钮。页面默认不会自动加载数据。

### Q: 如何添加新的测试账号？
A: 更新此文档的"测试账号信息"部分，并确保获得账号所有者的授权。

### Q: 数据库中是否保存了用户密码？
A: **否**。密码仅用于登录教务系统，不会被存储。只保存成绩数据和netid（用于识别）。

### Q: 如何清空测试数据？
```bash
# 在服务器上执行
rm -f /path/to/database.sqlite
# 然后重启服务
```

---

## 联系方式

- **项目维护**: Jaison Zheng
- **GitHub**: https://github.com/jaisonZheng/sysu-sse-gpa-calculator

---

**最后更新**: 2026-02-10
**版本**: v1.1.0
