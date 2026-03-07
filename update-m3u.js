const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function updateM3U() {
  try {
    console.log('Parsiram https://radio.hrt.hr/slusaonica/vijesti...');
    
    const response = await axios.get('https://radio.hrt.hr/slusaonica/vijesti', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    
    // **RAZNI SELEKTORI za MP3/audio - testiraj koji radi**
    let audioUrl = null;
    
    // 1. Direktni MP3 linkovi
    audioUrl = $('a[href$=".mp3"], a[href$=".m3u8"], a[href$=".aac"]').first().attr('href') ||
               $('audio source[src$=".mp3"]').first().attr('src') ||
               $('audio[src$=".mp3"]').first().attr('src');
    
    // 2. Linkovi s "slusaj" / "listen" / "play" u tekstu
    if (!audioUrl) {
      audioUrl = $('a:contains("Slušaj"), a:contains("slušaj"), a:contains("Play"), a:contains("play")')
        .first().attr('href');
    }
    
    // 3. Prvi audio-related link (fallback)
    if (!audioUrl) {
      audioUrl = $('a[href*="stream"], a[href*="audio"], a[href*=".mp3"]').first().attr('href');
    }
    
    // Ako je relativan link, pretvori u apsolutan
    if (audioUrl && !audioUrl.startsWith('http')) {
      audioUrl = 'https://radio.hrt.hr' + audioUrl;
    }
    
    console.log('Pronađeni audio link:', audioUrl || 'NIŠTA NIJE NAĐENO');
    
    if (audioUrl) {
      const m3uContent = `#EXTM3U
#EXTINF:-1 tvg-logo="https://radio.hrt.hr/favicon.ico",HRT Vijesti - Najnovije
${audioUrl}`;
      
      fs.writeFileSync('vijesti.m3u', m3uContent);
      console.log('✅ M3U ažurirana s MP3:', audioUrl);
    } else {
      throw new Error('Nema audio linka na stranici');
    }
    
  } catch (error) {
    console.error('❌ Greška:', error.message);
    // Fallback na HR1 live stream
    const fallback = `#EXTM3U
#EXTINF:-1 tvg-logo="https://radio.hrt.hr/favicon.ico",HRT HR1 Live (fallback)
https://radio.hrt.hr/stream/6`;
    fs.writeFileSync('vijesti.m3u', fallback);
    console.log('📡 Koristim HR1 live stream kao fallback');
  }
}

updateM3U();
