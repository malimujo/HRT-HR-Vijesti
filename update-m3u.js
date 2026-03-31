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
const allLinks = Array.from(document.querySelectorAll('a[href], script, img'));

// 🎵 MP3 link
for (const link of allLinks) {
const href = link.href || link.src || link.getAttribute('data-src');
if (href && href.includes('api.hrt.hr/media') && href.includes('.mp3')) {
return { mp3: href };
}
}

// 🎵 FIXIRANI REGEX u scriptovima
const scripts = Array.from(document.querySelectorAll('script'));
for (const script of scripts) {
const content = script.textContent || script.innerHTML;
const mp3Match1 = content.match(/"https?:\/\/api\.hrt\.hr\/media[^"]*\.mp3[^"]*"/);
const mp3Match2 = content.match(/'https?:\/\/api\.hrt\.hr\/media[^']*\.mp3[^']*'/);
if (mp3Match1) return { mp3: mp3Match1[0].slice(1, -1), };
if (mp3Match2) return { mp3: mp3Match2[0].slice(1, -1), };
}

return { mp3: null };
});

console.log('🎵 MP3:', result.mp3);

if (result.mp3) {
const timeMatch = result.mp3.match(/(\d{4})(\d{2})(\d{2})(\d{6})\.mp3$/);
let emisijaInfo = 'Najnovija';

if (timeMatch) {
const godina = timeMatch[1];
const mjesec = timeMatch[2];
const dan = timeMatch[3];
const vrijeme = timeMatch[4];
const sat = vrijeme.slice(0,2);
const minute = vrijeme.slice(2,4);
emisijaInfo = `${dan}.${mjesec}.${sat}:${minute}.`;
}

console.log('📅 Datum/vrijeme:', emisijaInfo);

// 🔥 FIKSNA SLIKA umjesto HRT‑ove
      const tvgLogoUrl = 'https://raw.githubusercontent.com/malimujo/HRT-HR-Vijesti/main/vijesti.png';

const m3uContent = `#EXTM3U
#EXTINF:-1 tvg-logo="${tvgLogoUrl}" group-title="Slušaonica",Vijesti ${emisijaInfo}
${result.mp3}`;

fs.writeFileSync('vijesti.m3u', m3uContent);
console.log('✅ M3U spreman s ikonom!');
} else {
throw new Error('Nema MP3-a');
}

} catch (error) {
console.error('❌', error.message);
const fallbackContent = `#EXTM3U
#EXTINF:-1 tvg-logo="https://radio.hrt.hr/favicon.ico",HRT Vijesti 08.03.2026 19:00
https://api.hrt.hr/media/28/da/20260308-vijesti-37328738-20260308190000.mp3`;
fs.writeFileSync('vijesti.m3u', fallbackContent);
console.log('✅ Fallback M3U spreman');
} finally {
if (browser) {
await browser.close();
}
}
}

updateM3U();
