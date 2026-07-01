const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    userDataDir: 'C:\\Users\\bdaubin\\AppData\\Local\\Temp\\opencode\\tesla-delivery-hub\\server\\chrome-profile',
    args: ['--no-first-run', '--no-default-browser-check']
  });
  const page = await browser.newPage();
  
  // Use the exact same URL format as the browser
  const url = 'https://intrepid.tesla.com/cogs/vehiclereadiness/inbound?status=All&search=&searchShipmentNumber=&match=All&etaEndDate=Mon%20Jun%2029%202026%2000:00:00%20GMT%2B0200&etaStartDate=Mon%20Jun%2029%202026%2000:00:00%20GMT%2B0200';
  
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 10000));
  
  // Try clicking Search button
  try {
    await page.click('button.btn-primary, button:has-text("Search")');
    await new Promise(r => setTimeout(r, 5000));
  } catch(e) {}
  
  const text = await page.evaluate(() => document.body.innerText);
  console.log('Length:', text.length);
  const vins = text.match(/[A-Z0-9]{17}/g);
  if (vins) console.log('VINs:', vins.length, vins.slice(0, 3));
  
  const total = text.match(/Total Records:\s*(\d+)/);
  if (total) console.log('Total:', total[1]);
  else console.log('No total found');
  console.log('Last 200:', text.substring(text.length - 200));
  
  await browser.close();
})().catch(e => console.log('Error:', e.message));
