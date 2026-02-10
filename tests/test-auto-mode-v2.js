const { chromium } = require('playwright');

async function testAutoMode() {
  console.log('Starting auto mode test...');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  try {
    // Navigate to the website
    console.log('Navigating to http://43.136.42.69:8082...');
    await page.goto('http://43.136.42.69:8082');
    await page.waitForLoadState('networkidle');

    // Take screenshot of homepage
    await page.screenshot({ path: '/Users/mac/foo/gpa-calculator/screenshots/01-homepage.png' });
    console.log('Screenshot saved: 01-homepage.png');

    // Wait for the page to load and find buttons
    await page.waitForTimeout(2000);

    // Click on "自动爬取模式" (Auto Mode) button
    console.log('Clicking on 自动爬取模式 button...');
    const autoButton = await page.$('button:has-text("自动爬取模式")');
    if (autoButton) {
      await autoButton.click();
    }

    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/Users/mac/foo/gpa-calculator/screenshots/02-auto-mode.png' });
    console.log('Screenshot saved: 02-auto-mode.png');

    // Fill in the login form
    console.log('Filling in login form...');

    // Find netid input
    const netidInput = await page.$('input[type="text"], input[name="netid"], input[placeholder*="学号"], input[placeholder*="netid"]');
    if (netidInput) {
      await netidInput.fill('zhengzsh5');
      console.log('Filled netid: zhengzsh5');
    }

    // Find password input
    const passwordInput = await page.$('input[type="password"], input[name="password"]');
    if (passwordInput) {
      await passwordInput.fill('Jason2024&Zzs');
      console.log('Filled password');
    }

    await page.screenshot({ path: '/Users/mac/foo/gpa-calculator/screenshots/03-login-filled.png' });
    console.log('Screenshot saved: 03-login-filled.png');

    // Click login button
    console.log('Clicking login button...');
    const loginButton = await page.$('button[type="submit"], button:has-text("登录"), button:has-text("Login")');
    if (loginButton) {
      await loginButton.click();
    }

    // Wait for login to complete - check for loading state or error/success
    console.log('Waiting for login response...');

    // Wait for either error message or success
    let attempt = 0;
    let foundResult = false;
    while (attempt < 60 && !foundResult) { // Wait up to 60 seconds
      await page.waitForTimeout(1000);
      attempt++;

      const pageContent = await page.content();

      // Check for error messages
      if (pageContent.includes('错误') || pageContent.includes('失败') || pageContent.includes('error')) {
        console.log(`Attempt ${attempt}: Found error message`);
        const errorAlert = await page.$('[role="alert"], .alert, .error, .text-red-500, .text-red-600');
        if (errorAlert) {
          const errorText = await errorAlert.textContent();
          console.log('Error message:', errorText);
        }
      }

      // Check for loading state
      if (pageContent.includes('加载') || pageContent.includes('登录中') || pageContent.includes('爬取')) {
        console.log(`Attempt ${attempt}: Still loading...`);
        continue;
      }

      // Check for success - look for GPA results or course data
      if (pageContent.includes('GPA') || pageContent.includes('绩点') || pageContent.includes('成绩') || pageContent.includes('课程')) {
        console.log(`Attempt ${attempt}: Found results!`);
        foundResult = true;
        break;
      }

      // Take screenshot every 10 seconds
      if (attempt % 10 === 0) {
        await page.screenshot({ path: `/Users/mac/foo/gpa-calculator/screenshots/04-attempt-${attempt}.png` });
        console.log(`Screenshot saved: 04-attempt-${attempt}.png`);
      }
    }

    await page.screenshot({ path: '/Users/mac/foo/gpa-calculator/screenshots/04-final.png' });
    console.log('Screenshot saved: 04-final.png');

    // Get final page content
    const finalContent = await page.content();
    console.log('Page contains GPA:', finalContent.includes('GPA'));
    console.log('Page contains 绩点:', finalContent.includes('绩点'));
    console.log('Page contains 成绩:', finalContent.includes('成绩'));
    console.log('Page contains 课程:', finalContent.includes('课程'));

    // Wait for user to see the result
    console.log('Test completed. Waiting 10 seconds before closing...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: '/Users/mac/foo/gpa-calculator/screenshots/error-screenshot.png' });
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
}

// Create screenshots directory
const fs = require('fs');
const dir = '/Users/mac/foo/gpa-calculator/screenshots';
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

testAutoMode();
