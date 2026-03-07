const axios = require('axios');
const fs = require('fs');

async function testRSS() {
  const rssUrls = [
    'https://radio.hrt.hr/rss',
    'https://o-nama.hrt.hr/rss-i-mobilne-aplikacije/rss-328191'
  ];
  
  for (const url of rssUrls) {
    try {
      const response = await axios.get(url);
      console.log(`RSS ${url}:`, response.data.slice(0, 500));
    } catch(e) {
      console.log(`RSS ${url} ne radi`);
    }
  }
}
testRSS();
