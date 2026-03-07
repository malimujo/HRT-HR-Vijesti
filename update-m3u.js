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
    
    console.log('📄 učitavam https://radio.hrt.hr/slusaonica/vijesti');
    await page.goto('https://radio.hrt.hr/slusaonica/vijesti', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Čekaj da se player učita (kao što radiš ručno)
    await page.waitForTimeout(3000);
    
    // Pronađi PRVI play button i klikni ga
    const firstMp3 = await page.evaluate(() => {
      // Pronađi prvi audio element ILI play button
      const audio = document.querySelector('audio source[src], audio[src]');
      if (audio && audio.src) return audio.src;
      
      // Pronađi prvi "Slušaj" / "Play" button
      const playBtn = document.querySelector('a[href*="mp3"], button, .play, [data-audio], [onclick*="play"]');
      if (playBtn) {
        // Simuliraj klik da se MP3 učita
        playBtn.click();
        
        // Vrati src iz audio elementa nakon klika
        return new Promise(resolve => {
          setTimeout(() => {
            const loadedAudio = document.querySelector('audio[src]');
            resolve(loadedAudio ? loadedAudio.src : null);
          }, 1000);
        });
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
    fs.writeFileSync('vijesti.m3u', '#EXTM3U\n#EXTINF:-1,HRT Vijesti\nhttps://radio.hrt.hr/stream/6');
  } finally {
    if (browser) await browser.close();
  }
}

updateM3U();
