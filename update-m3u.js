const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function updateM3U() {
  try {
    // Specifične HRT emisije sa MP3-ovima
    const emisije = [
      'https://radio.hrt.hr/slusaonica/vijesti',
    ];
    
    let audioUrl = null;
    
    for (const url of emisije) {
      console.log(`🔍 Tražim MP3 na: ${url}`);
      
      const response = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      
      const $ = cheerio.load(response.data);
      
      // Pronađi MP3 u datotekama, streamovima ili player data atributima
      audioUrl = 
        $('a[href$=".mp3"]').attr('href') ||
        $('a[href$=".m3u8"]').attr('href') ||
        $('*[data-mp3], *[data-audio], *[data-stream]').first().attr('data-mp3') ||
        $('audio source').attr('src');
      
      if (audioUrl) {
        audioUrl = audioUrl.startsWith('http') ? audioUrl : 'https://radio.hrt.hr' + audioUrl;
        console.log(`✅ MP3 NAĐEN: ${audioUrl}`);
        break;
      }
    }
    
    if (!audioUrl) {
      // ULTIMATIVNI pokušaj - traži player API endpoint
      console.log('Pokušavam pronaći JS player API...');
      const jsPlayer = $('script:contains("mp3"), script:contains("stream"), script:contains("audio")')
        .first().html() || '';
      
      const mp3Match = jsPlayer.match(/"(https?:\/\/[^"]*\.mp3[^"]*)"/) ||
                      jsPlayer.match(/'(https?:\/\/[^']*\.mp3[^']*)'/);
      
      if (mp3Match) audioUrl = mp3Match[1];
    }
    
    if (audioUrl) {
      const m3uContent = `#EXTM3U
#EXTINF:-1 tvg-logo="https://radio.hrt.hr/favicon.ico",HRT Vijesti MP3
${audioUrl}`;
      
      fs.writeFileSync('vijesti.m3u', m3uContent);
      console.log('🎵 SPREMANO!');
    } else {
      throw new Error('Nema MP3-a');
    }
    
  } catch (error) {
    console.error('❌ Nema MP3-a, koristim HR1 emisije stranicu');
    const fallback = `#EXTM3U
#EXTINF:-1,HRT HR1 Najnovije emisije
https://radio.hrt.hr/prvi-program`;
    fs.writeFileSync('vijesti.m3u', fallback);
  }
}

updateM3U();
