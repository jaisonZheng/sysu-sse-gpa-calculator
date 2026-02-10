const { chromium } = require('playwright');

const netid = 'zhengzsh5';
const password = 'Jason2024&Zzs';

async function testFilterArea() {
  console.log('=== 测试筛选区域 ===\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    proxy: { server: 'http://127.0.0.1:7890' }
  });

  const page = await context.newPage();

  try {
    // 登录
    console.log('登录...');
    await page.goto('https://jwxt.sysu.edu.cn/jwxt/#/login', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    await page.waitForTimeout(2000);

    const loginButton = await page.$('button:has-text("登录")');
    await Promise.all([
      page.waitForURL('https://cas.sysu.edu.cn/**', { timeout: 30000 }),
      loginButton.click()
    ]);

    await page.fill('input[placeholder="请输入 NetID"]', netid);
    await page.fill('input[placeholder="请输入密码"]', password);

    const casLoginBtn = await page.$('button[class*="login"]');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }).catch(() => {}),
      casLoginBtn.click()
    ]);

    await page.waitForTimeout(3000);

    // 访问成绩页面
    const gradesUrl = 'https://jwxt.sysu.edu.cn/jwxt/mk/studentWeb/#/stuAchievementView?code=jwxsd_wdcj&resourceName=%E6%88%91%E7%9A%84%E6%88%90%E7%BB%A9';
    await page.goto(gradesUrl, {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    await page.waitForTimeout(5000);

    console.log('分析筛选区域...\n');

    // 查找所有输入框
    const inputs = await page.$$('input');
    console.log(`找到 ${inputs.length} 个input元素`);

    for (let i = 0; i < Math.min(inputs.length, 10); i++) {
      const type = await inputs[i].getAttribute('type');
      const placeholder = await inputs[i].getAttribute('placeholder');
      const value = await inputs[i].inputValue().catch(() => '');
      const className = await inputs[i].getAttribute('class');
      console.log(`  [${i}] type=${type}, placeholder=${placeholder}, value=${value}, class=${className?.substring(0, 50)}`);
    }

    // 查找所有带class包含select的元素
    console.log('\n查找下拉选择器...');
    const selectElements = await page.$$('[class*="select"], .ant-select, .ant-select-selector');
    console.log(`找到 ${selectElements.length} 个可能的选择器元素`);

    // 查找所有按钮
    console.log('\n查找按钮...');
    const buttons = await page.$$('button');
    for (let i = 0; i < Math.min(buttons.length, 15); i++) {
      const text = await buttons[i].textContent();
      const className = await buttons[i].getAttribute('class');
      console.log(`  [${i}] "${text?.trim()}" class=${className?.substring(0, 50)}`);
    }

    // 查找筛选区域
    console.log('\n查找筛选区域...');
    const filterAreas = await page.$$('[class*="filter"], [class*="search"], .ant-form');
    console.log(`找到 ${filterAreas.length} 个可能的筛选区域`);

    // 尝试通过文本查找元素
    console.log('\n查找包含特定文本的元素...');
    const labels = ['学年', '类别', '学期', '课程'];
    for (const label of labels) {
      const elements = await page.$$(`*:has-text("${label}")`);
      console.log(`  "${label}": 找到 ${elements.length} 个元素`);
    }

    // 获取页面HTML片段，查找筛选区域
    console.log('\n=== 页面HTML中筛选相关的内容 ===');
    const html = await page.content();

    // 查找包含"学年"的HTML片段
    const yearIndex = html.indexOf('学年');
    if (yearIndex > 0) {
      console.log('学年附近HTML:');
      console.log(html.substring(Math.max(0, yearIndex - 200), yearIndex + 200));
    }

    // 尝试点击"学年"标签相关的下拉框
    console.log('\n=== 尝试操作筛选器 ===');

    // 查找ant-select元素并尝试点击
    const antSelects = await page.$$('.ant-select');
    console.log(`\n找到 ${antSelects.length} 个.ant-select元素`);

    for (let i = 0; i < antSelects.length; i++) {
      const text = await antSelects[i].textContent();
      console.log(`  [${i}] text: ${text?.substring(0, 100)}`);

      // 尝试点击
      if (i === 0) { // 假设第一个是学年选择
        console.log(`\n  点击第${i}个选择器...`);
        await antSelects[i].click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: `/tmp/filter-clicked-${i}.png` });

        // 查找下拉选项
        const options = await page.$$eval('.ant-select-dropdown .ant-select-item', items =>
          items.map(item => item.textContent.trim())
        );
        console.log('  下拉选项:', options);
      }
    }

    console.log('\n测试完成');

  } catch (error) {
    console.error('错误:', error.message);
    await page.screenshot({ path: '/tmp/test-error.png' });
  } finally {
    await browser.close();
  }
}

testFilterArea();
