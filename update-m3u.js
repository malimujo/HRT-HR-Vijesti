const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function updateM3U() {
  try {
    // Pokušaj više HRT stranica s emisijama
    const urls = [
      'https://radio.hrt.hr/slusaonica/vijesti'
    ];
    
    let audioUrl = null;
    
    for (const url of urls) {
      console.log(`Provjeravam: ${url}`);
      const response = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      
      const $ = cheerio.load(response.data);
      
      // Široki selektor za sve audio formate
      audioUrl = $('a[href*=".mp3"], a[href*=".m3u8"], a[href*=".aac"], a[href*="audio/"], a[data-src*=".mp3"]').first().attr('href') ||
                 $('audio source[src], audio[src]').first().attr('src') ||
                 $('.play-button, .audio-play, [data-audio]').first().attr('data-audio');
      
      if (audioUrl) {
        if (!audioUrl.startsWith('http')) audioUrl = 'https://radio.hrt.hr' + audioUrl;
        console.log(`✅ MP3 nađen na ${url}: ${audioUrl}`);
        break;
      }
    }
    
    if (audioUrl) {
      const m3uContent = `#EXTM3U
#EXTINF:-1 tvg-logo="https://radio.hrt.hr/favicon.ico",HRT Vijesti Najnovije
${audioUrl}`;
      fs.writeFileSync('vijesti.m3u', m3uContent);
      console.log('🎵 M3U spreman s MP3!');
    } else {
      throw new Error('Nema MP3');
    }
    
  } catch (error) {
    console.error('❌', error.message);
    // SPECIFIČAN fallback - HRT HR1 emisije stranica (često ima MP3)
    const specificFallback = `#EXTM3U
#EXTINF:-1,HRT HR1 Emisije
https://radio.hrt.hr/prvi-program`;
    fs.writeFileSync('vijesti.m3u', specificFallback);
  }
}

updateM3U();
