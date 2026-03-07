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
    
    await new Promise(r => setTimeout(r, 3000));
    
    const firstMp3 = await page.evaluate(() => {
      // 1. Pronađi postojeći audio element
      const audio = document.querySelector('audio source[src], audio[src]');
      if (audio && audio.src) return audio.src;
      
      // 2. Pronađi PRVI play button KORISTEĆI VALIDNE CSS SELEKTORE
      const selectors = [
        'a[href$=".mp3"]',
        'a[href$=".m3u8"]', 
        '.play',
        '.play-button',
        'button.play',
        '[data-audio]',
        '[data-mp3]',
        '[onclick*="play"]',
        '.audio-play'
      ];
      
      for (const selector of selectors) {
        const btn = document.querySelector(selector);
        if (btn) {
          btn.click();
          await new Promise(r => setTimeout(r, 1000));
          
          const loadedAudio = document.querySelector('audio[src]');
          if (loadedAudio && loadedAudio.src) return loadedAudio.src;
        }
      }
      
      // 3. Pronađi linkove s "slušaj" u textu (JavaScript filter)
      const links = Array.from(document.querySelectorAll('a')).find(link => 
        link.textContent.toLowerCase().includes('slušaj') || 
        link.textContent.toLowerCase().includes('play')
      );
      
      if (links) {
        links.click();
        await new Promise(r => setTimeout(r, 1000));
        const loadedAudio = document.querySelector('audio[src]');
        return loadedAudio ? loadedAudio.src : null;
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
