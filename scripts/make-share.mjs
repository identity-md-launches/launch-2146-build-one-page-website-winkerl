import { chromium } from 'playwright';
import { startPreview } from './preview.mjs';

const preview = await startPreview('public');
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  await page.setContent(`<!doctype html><html lang="en"><head><base href="${preview.url}"><style>
  @font-face{font-family:Manrope;src:url('fonts/manrope-latin-variable.woff2') format('woff2');font-weight:200 800}
  *{box-sizing:border-box}body{margin:0;background:#e8dff7;color:#322239;font-family:Manrope,Arial,sans-serif;display:grid;grid-template-columns:1fr 1fr;height:630px}
  .copy{padding:62px 52px;position:relative}.brand{display:flex;align-items:center;gap:12px;font-size:37px;font-weight:700;letter-spacing:-1.5px}.brand svg{width:42px;height:42px}
  h1{font-size:74px;font-weight:700;line-height:1.08;letter-spacing:-4.5px;margin:83px 0 26px}p{font-size:19px;margin:0;line-height:1.5}.photo{padding:22px 22px 22px 0}.photo img{width:100%;height:100%;object-fit:cover;border-radius:170px 16px 16px 16px}
  .line{position:absolute;bottom:58px;left:52px;width:72px;border-top:2px solid #62407f}
  </style></head><body><div class="copy"><div class="brand"><svg viewBox="0 0 42 42" fill="none"><path d="m5 13 8-7 8 7m1 0 8-7 8 7M6 19v15h14V19m2 0v15h14V19" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>winkerl.</div><h1>Find your kind<br>of corner.</h1><p>Homes with character.<br>Vienna, with a little more you.</p><span class="line"></span></div><div class="photo"><img src="images/neubau-loft.webp" alt="A sunny living room"></div></body></html>`);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((img) => img.decode()));
  });
  await page.screenshot({ path: 'public/og-image.png' });
  console.log('Generated public/og-image.png (1200 × 630).');
} finally {
  await browser?.close();
  await preview.stop();
}
