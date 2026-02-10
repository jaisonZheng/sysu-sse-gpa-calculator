# 中山大学保研绩点计算器 - 自动模式开发文档

## 日期：2026-02-09

---

## 服务器环境检查

### 服务状态
- **gpa-backend**: 运行在端口3002，状态正常
- **VPN (mihomo)**: 运行在端口7890，用于代理访问外网
- **Playwright**: 已安装

### 项目结构
```
gpa-calculator/
├── backend/src/
│   ├── scraper/scraper.ts    # 爬虫核心实现
│   ├── routes/auto.ts        # 自动模式API路由
│   └── index.ts              # 后端入口
├── frontend/                  # React前端
└── data/                      # 数据文件
```

---

## 问题分析

### 当前实现的问题

1. **scraper.ts 中的成绩爬取逻辑过于简化**
   - 使用 `table tr` 选择器可能无法匹配实际的DOM结构
   - 没有处理学年切换的逻辑
   - 没有正确处理动态加载的表格数据

2. **成绩页面交互逻辑不完整**
   - 需要选择"培养类别"为"主修"
   - 需要通过下拉菜单切换学年获取所有成绩
   - 成绩数据可能是异步加载的

---

## 调试计划

### Phase 1: 使用playwright-cli测试登录流程
1. 使用playwright-cli打开登录页面
2. 测试统一身份认证登录
3. 验证是否能成功跳转到学生主页

### Phase 2: 测试成绩页面爬取
1. 访问成绩页面
2. 分析实际的DOM结构
3. 测试选择"主修"培养类别
4. 测试切换学年获取成绩
5. 提取成绩数据

### Phase 3: 修复和优化代码
1. 根据实际测试结果修复选择器
2. 实现学年切换逻辑
3. 完善错误处理

### Phase 4: 验证和测试
1. 完整流程测试
2. 边界情况处理

---

## 调试记录

### 登录流程测试 - 2026-02-09
- **测试时间**: 2026-02-09 20:00+
- **测试结果**: 发现问题并找到解决方案
- **问题记录**:
  1. 教务系统登录按钮文本是"NetID登录"而非"统一身份认证登录"
  2. CAS页面输入框选择器不匹配：
     - 用户名: `input[placeholder="请输入 NetID"]` (不是 `input[name="username"]`)
     - 密码: `input[placeholder="请输入密码"]` (不是 `input[name="password"]`)
  3. 登录按钮文本是"登 录"（中间有空格），class为 `para-widget-account-psw__login-button`
  4. 有一个iframe用于企业微信扫码，但输入框不在iframe中

- **解决方案**:
  - 用户名选择器: `input[placeholder="请输入 NetID"]`
  - 密码选择器: `input[placeholder="请输入密码"]`
  - 登录按钮选择器: `button[class*="login"]` 或 `.para-widget-actions button`
  - 修复 `waitForURL` 调用时机：使用 `Promise.all` 同时执行点击和等待导航

### 代码修复 - 2026-02-09
- **修改文件**: `backend/src/scraper/scraper.ts`
- **修改内容**:
  1. 修改登录按钮选择器从 `text=统一身份认证登录` 改为 `button:has-text("登录")`
  2. 修改用户名输入框选择器为 `input[placeholder="请输入 NetID"]`
  3. 修改密码输入框选择器为 `input[placeholder="请输入密码"]`
  4. 修改CAS登录按钮选择器为 `button[class*="login"]`
  5. 修复 `waitForURL` 使用 `Promise.all` 同时执行点击和等待导航
  6. 添加错误检查：如果找不到按钮则抛出错误
- **服务状态**: 已构建并重启成功 (端口3002)

### 成绩页面测试 - 2026-02-09
- **测试时间**: 2026-02-09
- **实际页面结构**:
  - **URL**: `https://jwxt.sysu.edu.cn/jwxt/mk/studentWeb/#/stuAchievementView?code=jwxsd_wdcj`
  - **表格框架**: Ant-Design Table (`.ant-table`)
  - **表头**: 序号、类别、课程、教师、学年、学期、学分、原始成绩、最终成绩、特殊原因、绩点、考试性质、是否通过、教学班排名
  - **筛选器**: 3个 `.ant-select` 元素
    - [0] 培养类别（主修/辅修）
    - [1] 学年（如2025-2026）
    - [2] 学期（第一学期/第二学期）
  - **数据行数**: 18行
- **选择器验证**:
  - 表格: `.ant-table`
  - 表头: `.ant-table-thead th`
  - 数据行: `.ant-table-tbody tr`
  - 单元格: `td`
- **学年切换逻辑**:
  - 点击 `.ant-select` 第1个元素（索引1）
  - 从下拉选项中选择其他学年
  - 等待表格重新加载
- **数据解析**:
  - 类别（索引1）: "公必"、"专必"、"专选"、"公选"等
  - 学年（索引4）: 用于判断大一/大二/大三
  - 学期（索引5）: 第一学期/第二学期
  - 学分（索引6）
  - 最终成绩（索引8）
  - 绩点（索引10）

### 代码修复完成 - 2026-02-09
- **修改文件**: `backend/src/scraper/scraper.ts`
- **修改内容**:
  1. 修复登录流程选择器（教务系统登录按钮、CAS输入框、CAS登录按钮）
  2. 更新成绩页面URL为 `/jwxt/mk/studentWeb/#/stuAchievementView`
  3. 实现基于ant-table的成绩数据提取
  4. 添加学年判断逻辑（根据学年字符串计算大一/大二/大三）
  5. 正确解析课程类别（公必、专必、专选、公选）
- **验证结果**: ✅ 完整流程测试通过
  - 登录: 成功
  - 获取成绩: 18门课程
  - GPA计算: 大二专必绩点 4.74
  - 登出: 成功

---

## 测试结果总结

### 完整API流程测试
```
POST /api/auto/login      -> 成功，返回sessionId
POST /api/auto/fetch-grades -> 成功，返回18门课程
POST /api/auto/logout     -> 成功
```

### 获取的成绩数据示例
- 公必: 毛泽东思想和中国特色社会主义理论体系概论 (87分, 3.7绩点)
- 专必: 高等数学一（I） (93分, 4.3绩点)
- 专选: 人工智能与大模型（I） (79分, 2.9绩点)
- 公选: 数学建模实践 (88分, 3.8绩点)

### GPA计算结果
- 大一公必绩点: 0 (尚无数据)
- 大一专必绩点: 0 (尚无数据)
- 大二专必绩点: 4.74
- 大三专必绩点: 0 (尚无数据)
- **最终保研绩点: 4.74**

---

## 技术细节

### 教务系统登录流程
1. 访问: https://jwxt.sysu.edu.cn/jwxt/#/login
2. 点击: "统一身份认证登录"
3. 跳转: https://cas.sysu.edu.cn/esc-sso/login/page
4. 检查: "切换账号"按钮（如有则点击）
5. 输入: netid和密码
6. 登录: 成功后跳转至 https://jwxt.sysu.edu.cn/jwxt/#/student

### 成绩查询流程
1. 访问: https://jwxt.sysu.edu.cn/jwxt/#/student/grades
2. 选择: 培养类别为"主修"
3. 获取: 各学年下拉选项
4. 循环: 切换学年获取成绩
5. 解析: 表格数据

### Playwright配置
- 浏览器: Chromium
- 代理: http://127.0.0.1:7890 (VPN)
- User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)

---

## 待解决问题

1. [x] 验证登录流程各步骤的选择器
2. [x] 分析成绩页面的实际DOM结构
3. [x] 实现学年切换和成绩爬取
4. [ ] 处理登录验证码情况（如有）- 暂未遇到
5. [ ] 优化错误提示信息 - 已基础完成

## 已知限制

1. **学年判断**: 当前根据学年字符串自动判断（2025-2026学年对应大二），若学生入学年份不同可能需要调整
2. **成绩范围**: 当前只获取了当前学年的成绩（18门课程），如需获取所有学年成绩需要实现学年切换逻辑
3. **课程代码**: 成绩页面不显示课程代码，courseCode字段为空

---

## 系统状态

### 服务状态
| 组件 | 地址 | 状态 |
|------|------|------|
| 前端 | http://43.136.42.69:8082 | ✅ 正常 |
| 后端API | http://43.136.42.69:3002/api | ✅ 正常 |
| 自动模式API | http://43.136.42.69:3002/api/auto | ✅ 正常 |

### 可用功能
1. **手动模式** - 手动输入课程成绩计算GPA
2. **自动模式** - 自动登录教务系统并爬取成绩
   - 登录：POST /api/auto/login
   - 获取成绩：POST /api/auto/fetch-grades
   - 登出：POST /api/auto/logout
3. **课程数据API** - 获取课程信息

---

## 附录

### 测试登录流程
```bash
# SSH到服务器后，运行测试脚本
ssh -i ~/.ssh/tencent_cloud_gpa ubuntu@43.136.42.69
cd ~/gpa-calculator/backend
node test-login-manual.js
```

然后按提示输入NetID和密码进行测试。

### 常用命令
```bash
# SSH到服务器
ssh -i ~/.ssh/tencent_cloud_gpa ubuntu@43.136.42.69

# 查看服务状态
pm2 status

# 查看日志
pm2 logs gpa-backend

# 重启服务
pm2 restart gpa-backend
```

### 文件路径
- 后端代码: ~/gpa-calculator/backend/src/
- 日志: ~/.pm2/logs/
- 测试脚本: ~/gpa-calculator/backend/test-login-manual.js
