const puppeteer = require('puppeteer');
const fs = require('fs');

async function updateM3U() {
  let browser;
  try {
    console.log('🚀 Pokrećem Chrome...');
    
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    console.log('📄 Učitavam https://radio.hrt.hr/slusaonica/vijesti');
    await page.goto('https://radio.hrt.hr/slusaonica/vijesti', { 
      waitUntil: 'networkidle2'
    });
    
    await new Promise(r => setTimeout(r, 4000));
    
    const firstMp3 = await page.evaluate(() => {
      const allLinks = Array.from(document.querySelectorAll('a[href], script'));
      
      for (const link of allLinks) {
        const href = link.href || link.src || link.getAttribute('data-src');
        if (href && href.includes('api.hrt.hr/media') && href.includes('.mp3')) {
          return href;
        }
      }
      
      const scripts = Array.from(document.querySelectorAll('script'));
      for (const script of scripts) {
        const content = script.textContent || script.innerHTML;
        const mp3Match = content.match(/"(https?:\/\/api\.hrt\.hr\/media[^"]*\.mp3[^"]*)"/) ||
                        content.match(/'(https?:\/\/api\.hrt\.hr\/media[^']*\.mp3[^']*)'/);
        if (mp3Match) return mp3Match[1];
      }
      
      return null;
    });
    
    console.log('🎵 NAJNOVIJI MP3:', firstMp3);
    
    if (firstMp3) {
      // 🎯 IZVLAČENJE DATUMA/VREMENA iz filename-a: 20260307091001
      const timeMatch = firstMp3.match(/(\d{4})(\d{2})(\d{2})(\d{6})\.mp3$/);
      let emisijaInfo = 'Najnovija';
      
      if (timeMatch) {
        const godina = timeMatch[1];  // 2026
        const mjesec = timeMatch[2];  // 03
        const dan = timeMatch[3];     // 07
        const vrijeme = timeMatch[4]; // 091001
        
        const sat = vrijeme.slice(0,2);   // 09
        const minute = vrijeme.slice(2,4); // 10
        
        emisijaInfo = `${dan}.${mjesec}.${godina} ${sat}:${minute}`;
      }
      
      console.log('📅 Datum/vrijeme:', emisijaInfo);
      
      const m3uContent = `#EXTM3U
#EXTINF:-1 tvg-logo="https://radio.hrt.hr/favicon.ico",HRT Vijesti ${emisijaInfo}
${firstMp3}`;

      //
