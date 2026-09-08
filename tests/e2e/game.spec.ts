import { expect, test } from '@playwright/test';

async function requireWebGL2(page:import('@playwright/test').Page){
  const ok=await page.evaluate(()=>{const c=document.createElement('canvas');return Boolean(c.getContext('webgl2'));});
  test.skip(!ok,'BLOCKED: test browser does not expose a WebGL2 context');
}

async function openGarage(page:import('@playwright/test').Page){
  await page.goto('./');
  await requireWebGL2(page);
  await page.getByRole('button',{name:/WORKSHOPを開く/}).click();
  await expect(page.getByTestId('garage-3d').locator('canvas')).toBeVisible();
}

async function choosePart(page:import('@playwright/test').Page,category:string,partName:RegExp){
  await page.getByRole('button',{name:category,exact:true}).click();
  await page.getByRole('button',{name:partName}).click();
}

test('A02-A04/A08 garage covers four machines, all nine categories, explode and save restore',async({page},testInfo)=>{
  await openGarage(page);
  for(const name of ['AERO FALCON','TORQUE BISON','CORNER LYNX','BALANCE ORCA']){
    await page.getByRole('button',{name:new RegExp(name)}).click();
    await expect(page.getByRole('heading',{name})).toBeVisible();
  }

  // Use BALANCE ORCA because it accepts the wide stability wing and therefore permits
  // an actual replacement operation in every required category.
  await page.getByRole('button',{name:/BALANCE ORCA/}).click();
  const categories=['ボディー','シャーシ','モーター','ギヤ','タイヤ','ローラー','電池','ウイング','ブレーキ'];
  for(const category of categories){
    await page.getByRole('button',{name:category,exact:true}).click();
    const replacement=page.locator('.part-list button:not([disabled]):not(.selected)').first();
    await expect(replacement).toBeVisible();
    await replacement.click();
    await expect(page.locator('.part-list button.selected')).toBeVisible();
  }

  await page.getByRole('button',{name:/分解表示/}).click();
  await page.waitForTimeout(400);
  await page.getByRole('button',{name:/組み立て/}).click();
  await page.getByRole('button',{name:/車輪テスト/}).click();
  await page.getByRole('button',{name:'保存1'}).click();
  await page.getByRole('button',{name:/AERO FALCON/}).click();
  await page.getByRole('button',{name:/読込 SETUP 1/}).click();
  await expect(page.getByRole('heading',{name:'BALANCE ORCA'})).toBeVisible();
  await page.screenshot({path:`test-results/${testInfo.project.name}-garage.png`,fullPage:true});
});

test('A07/A12 OVAL race renders, pauses, switches five cameras, and reaches result',async({page},testInfo)=>{
  await openGarage(page);
  await page.getByRole('button',{name:/レースへ/}).click();
  await page.getByRole('button',{name:/WORKSHOP OVAL/}).click();
  await page.getByRole('button',{name:/4台・3周レース/}).click();
  await page.getByRole('button',{name:'START RACE'}).click();
  await expect(page.getByTestId('race-3d').locator('canvas')).toBeVisible();
  for(const label of ['追尾','車載','沿道','全景','AUTO']) await page.getByRole('button',{name:new RegExp(label)}).click();
  await page.getByRole('button',{name:/PAUSE/}).click();
  await expect(page.getByText('一時停止中')).toBeVisible();
  await page.getByRole('button',{name:/レースを再開/}).click();
  await expect(page.getByText(/RACE RESULT|レース結果/)).toBeVisible({timeout:120_000});
  await expect(page.locator('.result-hero strong').first()).toHaveText(/^#/);
  await page.screenshot({path:`test-results/${testInfo.project.name}-oval-result.png`,fullPage:true});
});

test('A07 browser race completes TECHNICAL RIDGE and SKY LOOP with a stable setup',async({page},testInfo)=>{
  await openGarage(page);
  await page.getByRole('button',{name:/BALANCE ORCA/}).click();
  await choosePart(page,'ボディー',/ダウンフォースシェル/);
  await choosePart(page,'シャーシ',/LCGスラント/);
  await choosePart(page,'モーター',/BAL-25/);
  await choosePart(page,'ギヤ',/3\.7:1 バランス/);
  await choosePart(page,'タイヤ',/28mm グリップ/);
  await choosePart(page,'ローラー',/17mm スタビ/);
  await choosePart(page,'電池',/PUNCH 1100/);
  await choosePart(page,'ウイング',/ワイドスタビライザー/);
  await choosePart(page,'ブレーキ',/ソフトブレーキ/);
  await page.getByRole('button',{name:/レースへ/}).click();

  for(const course of ['TECHNICAL RIDGE','SKY LOOP']){
    await page.getByRole('button',{name:new RegExp(course)}).click();
    await page.getByRole('button',{name:/4台・3周レース/}).click();
    await page.getByRole('button',{name:'START RACE'}).click();
    await expect(page.getByTestId('race-3d').locator('canvas')).toBeVisible();
    await expect(page.getByText(/RACE RESULT|レース結果/)).toBeVisible({timeout:120_000});
    await expect(page.locator('.result-hero strong').first()).toHaveText(/^#/);
    await page.screenshot({path:`test-results/${testInfo.project.name}-${course.toLowerCase().replace(/ /g,'-')}-result.png`,fullPage:true});
    await page.getByRole('button',{name:/コース選択/}).click();
  }
});
