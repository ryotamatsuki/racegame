import { defineConfig, devices } from '@playwright/test';
const publicBase=(globalThis as typeof globalThis & {process?:{env?:Record<string,string|undefined>}}).process?.env?.PLAYWRIGHT_BASE_URL;
const localBase='http://127.0.0.1:4173/racegame/';
export default defineConfig({
  testDir:'./tests/e2e', timeout:150_000, expect:{timeout:10_000}, retries:0, workers:1,
  reporter:[['list'],['html',{outputFolder:'playwright-report',open:'never'}]],
  use:{baseURL:publicBase??localBase,trace:'retain-on-failure',screenshot:'only-on-failure'},
  webServer:publicBase?undefined:{command:'npm run dev -- --host 127.0.0.1 --port 4173',url:localBase,reuseExistingServer:false,timeout:120_000},
  projects:[{name:'chromium-desktop',use:{...devices['Desktop Chrome'],viewport:{width:1440,height:900}}},{name:'chromium-mobile',use:{...devices['Pixel 7'],viewport:{width:915,height:412}}}],
});
