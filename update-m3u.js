const puppeteer = require('puppeteer');
const fs = require('fs');

async function updateM3U() {
  let browser;
  try {
    console.log('🚀 Pokrećem headless Chrome...');
    
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    console.log('📄 Učitavam https://radio.hrt.hr/slusaonica/vijesti');
    await page.goto('https://radio.hrt.hr/slusaonica/vijesti', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    await new Promise(r => setTimeout(r, 4000));
    
    // ✅ SINKRONI evaluate - BEZ await unutar!
    const firstMp3 = await page.evaluate(() => {
      // Pronađi audio element direktno
      const audio = document.querySelector('audio source[src], audio[src]');
      if (audio && audio.src) return audio.src;
      
      // Pronađi PRVI play button/link s tekstom "Slušaj"
      const allLinks = Array.from(document.querySelectorAll('a, button, .play'));
      const playLink = allLinks.find(link => 
        link.textContent.toLowerCase().includes('slušaj') || 
        link.textContent.toLowerCase().includes('play') ||
        link.href?.includes('.mp3') ||
        link.dataset.audio ||
        link.dataset.mp3
      );
      
      if (playLink) {
        playLink.click();
        
        // Vrati sve potencijalne audio URL-ove
        const urls = Array.from(document.querySelectorAll('audio[src], source[src], [data-src]'))
          .map(el => el.src || el.dataset.src)
          .filter(Boolean);
        
        return urls[0] || null;
      }
      
      return null;
    });
    
    console.log('🎵 PRVI MP3:', firstMp3);
    
    if (firstMp3) {
      const m3uContent = `#EXTM3U
#EXTINF:-1 tvg-logo="https://radio.hrt.hr/favicon.ico",HRT Vijesti - NAJNOVIJA
${firstMp3}`;
      
      fs.writeFileSync('vijesti.m3u', m3uContent);
      console.log('✅ UŠTEDJENO!');
    } else {
      throw new Error('Nema MP3-a');
    }
    
  } catch (error) {
    console.error('❌', error.message);
    fs.writeFileSync('vijesti.m3u', '#EXTM3U\n#EXTINF:-1,HRT Vijesti Fallback\nhttps://radio.hrt.hr/stream/6');
  } finally {
    if (browser) await browser.close();
  }
}

updateM3U();
