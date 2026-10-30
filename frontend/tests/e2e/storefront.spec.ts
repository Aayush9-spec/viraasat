import {test,expect} from '@playwright/test';
const product={id:'123e4567-e89b-42d3-a456-426614174000',artisanId:'123e4567-e89b-42d3-a456-426614174001',name:'Audit Blue Pottery Vase',price:1200,stock:3,category:'Pottery',region:'Rajasthan',description:'Handmade test catalog item',images:['/images/products/clean/jaipur-blue-pottery-urn.jpg'],isActive:true,status:'active'};

test('mobile navigation opens, reaches shop, and closes',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await page.getByRole('button',{name:'Toggle menu'}).click();
  const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();
  await dialog.getByRole('link',{name:'Shop',exact:true}).click();
  await expect(page).toHaveURL(/\/shop/);await expect(dialog).not.toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)).toBe(true);
});

test('shop displays server catalog without demo listings',async({page})=>{
  await page.route('**/api/products',r=>r.fulfill({json:{success:true,data:{products:[product]}}}));
  await page.goto('/shop');
  await expect(page.getByText('Audit Blue Pottery Vase').first()).toBeVisible();
  await expect(page.locator('a[href="/product/'+product.id+'"]')).toHaveCount(1);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)).toBe(true);
});

test('catalog failure is visible without demo products',async({page})=>{
  await page.route('**/api/products',r=>r.fulfill({status:503,json:{error:'Unavailable'}}));
  await page.goto('/shop');
  await expect(page.getByRole('alert').filter({hasText:'catalog'})).toBeVisible();
  await expect(page.locator('a[href^="/product/prod-"]')).toHaveCount(0);
});

test('newsletter failure does not claim subscription or credit',async({page})=>{
  await page.route('**/api/newsletter',r=>r.fulfill({status:503,json:{error:'Unavailable'}}));
  await page.goto('/');
  await page.getByRole('textbox',{name:'Email for newsletter'}).fill('audit@example.test');
  await page.getByRole('button',{name:'Join Circle',exact:true}).click();
  await expect(page.getByText('Subscription failed',{exact:true})).toBeVisible();
  await expect(page.getByRole('textbox',{name:'Email for newsletter'})).toHaveValue('audit@example.test');
});

test('public artisans are accessible and unknown products return 404',async({page})=>{
  const artisans=await page.goto('/artisans');expect(artisans?.status()).toBe(200);
  await expect(page.getByRole('heading',{level:1})).toBeVisible();
  const missing=await page.goto('/product/not-a-product');expect(missing?.status()).toBe(404);
});
