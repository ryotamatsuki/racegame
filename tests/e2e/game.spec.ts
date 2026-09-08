import { expect, test } from '@playwright/test';

async function requireWebGL2(page:import('@playwright/test').Page){
  const ok=await page.evaluate(()=>{const c=document.createElement('canvas');return Boolean(c.getContext('webgl2'));});
  test.skip(!ok,'BLOCKED: test browser does not expose a WebGL2 context');
}

test('A02-A04 garage renders and supports machine/part/explode/save interactions',async({page},testInfo)=>{
  await page.goto('./');await requireWebGL2(page);await page.getByRole('button',{name:/WORKSHOPを開く/}).click();await expect(page.getByTestId('garage-3d').locator('canvas')).toBeVisible();
  for(const name of ['AERO FALCON','TORQUE BISON','CORNER LYNX','BALANCE ORCA']){await page.getByRole('button',{name:new RegExp(name)}).click();await expect(page.getByRole('heading',{name})).toBeVisible();}
  await page.getByRole('button',{name:/モーター/}).first().click();await page.getByRole('button',{name:/REV-28|TORQ-22|BAL-25/}).last().click();
  await page.getByRole('button',{name:/分解表示/}).click();await page.waitForTimeout(500);await page.getByRole('button',{name:/組み立て/}).click();
  await page.getByRole('button',{name:'保存1'}).click();
  await page.screenshot({path:`test-results/${testInfo.project.name}-garage.png`,fullPage:true});
});

test('A07/A12 race renders, pauses, switches five cameras, and reaches result',async({page},testInfo)=>{
  await page.goto('./');await requireWebGL2(page);await page.getByRole('button',{name:/WORKSHOPを開く/}).click();await page.getByRole('button',{name:/レースへ/}).click();
  await page.getByRole('button',{name:/WORKSHOP OVAL/}).click();await page.getByRole('button',{name:/4台・3周レース/}).click();await page.getByRole('button',{name:'START RACE'}).click();
  await expect(page.getByTestId('race-3d').locator('canvas')).toBeVisible();
  for(const label of ['追尾','車載','沿道','全景','AUTO']) await page.getByRole('button',{name:new RegExp(label)}).click();
  await page.getByRole('button',{name:/PAUSE/}).click();await expect(page.getByText('一時停止中')).toBeVisible();await page.getByRole('button',{name:/レースを再開/}).click();
  await expect(page.getByText(/RACE RESULT|レース結果/)).toBeVisible({timeout:120_000});await page.screenshot({path:`test-results/${testInfo.project.name}-result.png`,fullPage:true});
});
