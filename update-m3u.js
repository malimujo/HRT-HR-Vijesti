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
    
    const result = await page.evaluate(() => {
      // 1. Pronađi MP3
      const allLinks = Array.from(document.querySelectorAll('a[href], script'));
      let mp3Url = null;
      
      for (const link of allLinks) {
        const href = link.href || link.src || link.getAttribute('data-src');
        if (href && href.includes('api.hrt.hr/media') && href.includes('.mp3')) {
          mp3Url = href;
          break;
        }
      }
      
      const scripts = Array.from(document.querySelectorAll('script'));
      for (const script of scripts) {
        const content = script.textContent || script.innerHTML;
        const mp3Match = content.match(/"(https?:\/\/api\.hrt\.hr\/media[^"]*\.mp3[^"]*)"/) ||
                        content.match(/'(https?:\/\/api\.hrt\.hr\/media[^']*\.mp3[^']*)'/);
        if (mp3Match && !mp3Url) mp3Url = mp3Match[1];
      }
      
      // 2. Pronađi datum/vrijeme IZ MP3 filename-a
      let emisijaInfo = '';
      if (mp3Url) {
        const filenameMatch = mp3Url.match(/(\d{8})-vijesti-\d+-\d{14}\.mp3/);
        if (filenameMatch) {
          const dateStr = filenameMatch[1];
          const year = dateStr.slice(0,4);
          const month = dateStr.slice(4,6);
          const day = dateStr.slice(6,8);
          emisijaInfo = `${day}.${month}.${year}`;
        }
      }
      
      return { mp3Url, emisijaInfo };
    });
    
    console.log('🎵 MP3:', result.mp3Url);
    console.log('📅 Emisija:', result.emisijaInfo || 'Nema info');
    
    if (result.mp3Url) {
      const title = result.emisijaInfo ? `HRT Vijesti ${result.emisijaInfo}` : 'HRT Vijesti Najnovija';
      const m3uContent = `#EXTM3U
#EXTINF:-1 tvg-logo="https://radio.hrt.hr/favicon.ico",${title}
${result.mp3Url}`;
      
      fs.writeFileSync('vijesti.m3u', m3uContent);
      console.log('✅ M3U spreman s datumom!');
    } else {
      throw new Error('Nema MP3-a');
    }
    
  } catch (error) {
    console.error('❌', error.message);
    const fallback = `#EXTM3U
#EXTINF:-1,HRT Vijesti 07.03.2026
https://api.hrt.hr/media/28/da/20260307-vijesti-37328738-20260307091001.mp3`;
    fs.writeFileSync('vijesti.m3u', fallback);
  } finally {
    if (browser) await browser.close();
  }
}

updateM3U();
