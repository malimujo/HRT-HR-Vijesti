const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function updateM3U() {
  try {
    // Primjer: parsiraj https://radio.hrt.hr/prvi-program za najnovije vijesti
    const response = await axios.get('https://radio.hrt.hr/prvi-program');
    const $ = cheerio.load(response.data);
    
    // Pronađi najnoviji audio link vijesti (prilagoditi selektor prema HTML-u HRT-a)
    const latestAudio = $('a:contains("Vijesti")').first().attr('href') || 'https://radio.hrt.hr/stream/6';
    
    const m3uContent = `#EXTM3U
#EXTINF:-1,Najnovije Vijesti HRT
${latestAudio}`;
    
    fs.writeFileSync('vijesti.m3u', m3uContent);
    console.log('M3U ažurirana s najnovijim linkom:', latestAudio);
  } catch (error) {
    console.error('Greška:', error.message);
    // Fallback na live stream
    fs.writeFileSync('vijesti.m3u', '#EXTM3U\n#EXTINF:-1,Vijesti HRT Live\nhttps://radio.hrt.hr/stream/6');
  }
}

updateM3U();
