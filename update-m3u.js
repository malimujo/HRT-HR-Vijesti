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
    
    // 🎯 TRAŽI TOČNO HRT API MP3 format!
    const firstMp3 = await page.evaluate(() => {
      // Pronađi SVE linkove i filtriraj API.HRT.HR MP3
      const allLinks = Array.from(document.querySelectorAll('a[href], script'));
      
      for (const link of allLinks) {
        const href = link.href || link.src || link.getAttribute('data-src');
        if (href && href.includes('api.hrt.hr/media') && href.includes('.mp3')) {
          return href;
        }
      }
      
      // TRAŽI u script tagovima (JSON/data atributi)
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
      const m3uContent = `#EXTM3U
#EXTINF:-1 tvg-logo="https://radio.hrt.hr/favicon.ico",HRT Vijesti - NAJNOVIJA
${firstMp3}`;
      
      fs.writeFileSync('vijesti.m3u', m3uContent);
      console.log('✅ SPREMANO!');
    } else {
      throw new Error('Nema api.hrt.hr MP3-a');
    }
    
  } catch (error) {
    console.error('❌', error.message);
    // Tvoj točan primjer kao fallback
    fs.writeFileSync('vijesti.m3u', '#EXTM3U\n#EXTINF:-1,HRT Vijesti\nhttps://api.hrt.hr/media/28/da/20260307-vijesti-37328738-20260307091001.mp3');
  } finally {
    if (browser) await browser.close();
  }
}

updateM3U();
