const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    userDataDir: 'C:\\Users\\bdaubin\\AppData\\Local\\Temp\\opencode\\tesla-delivery-hub\\server\\chrome-profile',
    args: ['--no-first-run','--no-default-browser-check']
  });
  const page = await browser.newPage();
  await page.goto('https://amp.tesla.com/acquisition/26b451ee-7fc7-4e92-b4b0-7976205b5cd0', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 5000));
  
  // Try to get the registration number by reading input values
  const plate = await page.evaluate(() => {
    // Look for input fields with plate value
    const inputs = document.querySelectorAll('input');
    for (const input of inputs) {
      const val = input.value || '';
      if (val.match(/^[A-Z]{2}[-]?[0-9]{3}[-]?[A-Z]{2,3}$/)) return val;
    }
    // Look for label "Registration Number" and its sibling input
    const labels = document.querySelectorAll('label, span, div');
    for (const el of labels) {
      if (el.textContent.trim() === 'Registration Number') {
        const parent = el.closest('div');
        const input = parent ? parent.querySelector('input') : null;
        if (input) return input.value;
        const next = el.nextElementSibling;
        if (next) return next.textContent.trim();
      }
    }
    return null;
  });
  
  console.log('PLATE:', plate);
  
  await browser.close();
})().catch(e => console.log('Error:', e.message));
