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

    // Get all buttons
    const buttons = await page.$$('button');
    console.log(`Found ${buttons.length} buttons`);

    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i].textContent();
      console.log(`Button ${i}: ${text}`);
    }

    // Click on "自动计算" (Auto Mode) button
    console.log('Clicking on 自动计算 button...');
    const autoButton = await page.$('button:has-text("自动计算")');
    if (autoButton) {
      await autoButton.click();
    } else {
      // Try to find by partial text
      const allButtons = await page.$$('button');
      for (const btn of allButtons) {
        const text = await btn.textContent();
        if (text && text.includes('自动')) {
          await btn.click();
          break;
        }
      }
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

    // Wait for login to complete and grades to fetch
    console.log('Waiting for login and grade fetching...');
    await page.waitForTimeout(30000); // Wait up to 30 seconds for login and scraping

    await page.screenshot({ path: '/Users/mac/foo/gpa-calculator/screenshots/04-after-login.png' });
    console.log('Screenshot saved: 04-after-login.png');

    // Check for any error messages
    const errorAlert = await page.$('[role="alert"], .alert, .error');
    if (errorAlert) {
      const errorText = await errorAlert.textContent();
      console.log('Error message found:', errorText);
    }

    // Get page content to check results
    const pageContent = await page.content();
    if (pageContent.includes('GPA') || pageContent.includes('绩点') || pageContent.includes('成绩')) {
      console.log('Page appears to show GPA/grade results!');
    }

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
