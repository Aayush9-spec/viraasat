/** @jest-environment node */
jest.mock('server-only',()=>({}),{virtual:true});
jest.mock('../security',()=>({...jest.requireActual('../security'),identity:jest.fn(),profile:jest.fn(),database:jest.fn()}));
import {identity,profile,database,HttpError} from '../security';
import {GET as products} from '@/app/api/products/route';
import { NextRequest } from 'next/server';
import {PUT as wishlist} from '@/app/api/wishlist/route';
import {POST as review} from '@/app/api/reviews/route';
import {PATCH as orderUpdate} from '@/app/api/orders/route';
import {POST as newsletter,GET as subscribers} from '@/app/api/newsletter/route';
import {POST as contact} from '@/app/api/contact/route';
const id='123e4567-e89b-42d3-a456-426614174000';
const owner='123e4567-e89b-42d3-a456-426614174001';
let data:Record<string,any[]>;let fails:boolean;let writes:any[];
function query(table:string) {
  const filters:[string,unknown][]=[];let operation='read';let payload:any;
  const q:any={select:()=>q,order:()=>q,limit:()=>q,range:()=>q,contains:()=>q,in:()=>q,
    eq:(k:string,v:unknown)=>{filters.push([k,v]);return q;},
    insert:(v:any)=>{operation='insert';payload=v;return q;},
    upsert:(v:any)=>{operation='upsert';payload=v;return q;},
    delete:()=>{operation='delete';return q;},
    update:(v:any)=>{operation='update';payload=v;return q;},
    maybeSingle:()=>execute(true),single:()=>execute(true),then:(resolve:any)=>Promise.resolve(execute(false)).then(resolve)};
  function execute(single:boolean) {
    if(fails)return {data:null,error:{code:'offline'}};
    const matches=(data[table]||[]).filter(row=>filters.every(([k,v])=>row[k]===v));
    if(operation!=='read')writes.push({table,operation,payload,filters});
    return {data:single?matches[0] || null:matches,error:null};
  }
  return q;
}
const request=(body:any)=>new Request('http://test/api',{method:'POST',body:JSON.stringify(body)});
beforeEach(()=>{
  jest.clearAllMocks();fails=false;writes=[];
  data={products:[{id,is_active:true,artisan_id:owner}],commerce_orders:[{id,buyer_id:'user_buyer',payment_status:'Paid',updated_at:'2026-01-01',payload:{items:[{productId:id,artisanId:owner}]},fulfillment:{}}]};
  (identity as jest.Mock).mockResolvedValue({id:'user_buyer',email:'buyer@example.test',name:'Buyer',role:'buyer'});
  (profile as jest.Mock).mockResolvedValue({id:owner});
  (database as jest.Mock).mockReturnValue({from:query});
});
test('wishlist ignores client identity and derives owner from session',async()=>{
  expect((await wishlist(request({productId:id,saved:true}))).status).toBe(200);
  expect(writes[0].payload).toEqual({user_id:owner,product_id:id});
  expect((await wishlist(request({productId:id,saved:true,user_id:'victim'}))).status).toBe(400);
});
test('wishlist storage errors never report success',async()=>{fails=true;expect((await wishlist(request({productId:id,saved:false}))).status).toBe(503);});
test('anonymous wishlist writes are rejected',async()=>{(identity as jest.Mock).mockRejectedValue(new HttpError(401,'Sign in'));expect((await wishlist(request({productId:id,saved:true}))).status).toBe(401);expect(writes).toHaveLength(0);});
test('review provider unavailable cannot bypass server moderation',async()=>{
  process.env.BACKEND_URL='http://moderation.test';global.fetch=jest.fn().mockResolvedValue({ok:false});
  expect((await review(request({productId:id,rating:5,comment:'Beautifully crafted product'}))).status).toBe(503);expect(writes).toHaveLength(0);
});
test('review writes session identity and purchase evidence after moderation',async()=>{
  process.env.BACKEND_URL='http://moderation.test';global.fetch=jest.fn().mockResolvedValue({ok:true,json:async()=>({is_fraudulent:false})});
  expect((await review(request({productId:id,rating:5,comment:'Beautifully crafted product'}))).status).toBe(200);
  expect(writes[0].payload).toMatchObject({reviewer_id:'user_buyer',verified_purchase:true});
});
test('flagged review cannot be inserted',async()=>{
  process.env.BACKEND_URL='http://moderation.test';global.fetch=jest.fn().mockResolvedValue({ok:true,json:async()=>({is_fraudulent:true})});
  expect((await review(request({productId:id,rating:5,comment:'Beautifully crafted product'}))).status).toBe(422);expect(writes).toHaveLength(0);
});
test('refund request belongs to buyer and requires payment',async()=>{
  data.commerce_orders[0].buyer_id='user_other';
  expect((await orderUpdate(request({action:'request-refund',id,reason:'The item arrived broken'}))).status).toBe(403);
  data.commerce_orders[0].buyer_id='user_buyer';data.commerce_orders[0].payment_status='Pending Payment';
  expect((await orderUpdate(request({action:'request-refund',id,reason:'The item arrived broken'}))).status).toBe(409);
  expect(writes).toHaveLength(0);
});
test('refund request is persisted with requested status, not a fake refund',async()=>{
  expect((await orderUpdate(request({action:'request-refund',id,reason:'The item arrived broken'}))).status).toBe(200);
  expect(writes[0].payload.refund_request.status).toBe('Requested');
  expect(writes[0].payload.payment_status).toBeUndefined();
});
test('artisan fulfillment enforces ownership, step order and tracking',async()=>{
  (identity as jest.Mock).mockResolvedValue({id:'user_artisan',role:'artisan'});
  (profile as jest.Mock).mockResolvedValue({id:'other'});
  expect((await orderUpdate(request({action:'fulfill',id,status:'Ready to Ship'}))).status).toBe(403);
  (profile as jest.Mock).mockResolvedValue({id:owner});
  expect((await orderUpdate(request({action:'fulfill',id,status:'Delivered',trackingId:'ABC'}))).status).toBe(409);
  data.commerce_orders[0].fulfillment={[owner]:{status:'Ready to Ship'}};
  expect((await orderUpdate(request({action:'fulfill',id,status:'Shipped'}))).status).toBe(400);
  expect((await orderUpdate(request({action:'fulfill',id,status:'Shipped',trackingId:'ABC'}))).status).toBe(200);
  expect(writes[0].payload.fulfillment[owner]).toMatchObject({status:'Shipped',trackingId:'ABC'});
});
test('newsletter subscribers are private and persistence failure is visible',async()=>{
  expect((await subscribers()).status).toBe(403);
  fails=true;expect((await newsletter(request({email:'buyer@example.test'}))).status).toBe(503);
});
test('contact submission failure cannot show success',async()=>{
  fails=true;expect((await contact(request({name:'Buyer',topic:'Delivery',message:'Where is my order?'}))).status).toBe(503);
});

test('artisan catalog uses session ownership and rejects buyer access',async()=>{
  const req=new NextRequest('http://test/api/products?scope=artisan');
  expect((await products(req)).status).toBe(403);
  (identity as jest.Mock).mockResolvedValue({id:'user_artisan',role:'artisan'});
  data.products.push({id:'other',is_active:true,artisan_id:'another-seller'});
  const response=await products(req);
  expect(response.status).toBe(200);
  expect((await response.json()).data.products.map((p: {id:string})=>p.id)).toEqual([id]);
});
