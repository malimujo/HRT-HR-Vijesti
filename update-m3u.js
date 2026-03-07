const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function debugPage() {
  const response = await axios.get('https://radio.hrt.hr/slusaonica/vijesti', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  
  const $ = cheerio.load(response.data);
  
  console.log('=== SVI A LINKOVI ===');
  $('a').each((i, el) => {
    const href = $(el).attr('href') || '';
    const text = $(el).text().trim().substring(0, 50);
    if (href && (href.includes('mp3') || href.includes('audio') || href.includes('stream') || text.includes('slušaj'))) {
      console.log(`🔗 ${i}: ${href} | "${text}"`);
    }
  });
  
  console.log('=== AUDIO TAGOVI ===');
  $('audio, source').each((i, el) => {
    console.log(`🎵 AUDIO ${i}:`, $(el).attr('src') || $(el).attr('data-src'));
  });
}

debugPage();
