/** @jest-environment node */
jest.mock('server-only', () => ({}), { virtual: true });
jest.mock('@clerk/nextjs/server', () => ({ currentUser: jest.fn() }));
jest.mock('@supabase/supabase-js', () => ({ createClient: jest.fn() }));
jest.mock('razorpay', () => jest.fn());
jest.mock('@/lib/notifications/email',()=>({sendOrderConfirmation:jest.fn().mockResolvedValue(true)}));
import { currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import Razorpay from 'razorpay';
import crypto from 'node:crypto';
import { checkoutInput, createOrder, signatureMatches, totals, verifyPayment } from '../commerce';
import { POST } from '@/app/api/create-order/route';
import { POST as webhook } from '@/app/api/razorpay/webhook/route';

const productId = '123e4567-e89b-42d3-a456-426614174000';
const input = { items: [{productId, quantity: 2}], idempotencyKey: '123e4567-e89b-42d3-a456-426614174001', shippingOption: 'standard', shipping: {fullName:'Buyer',addressLine1:'Street',city:'Delhi',state:'Delhi',zipCode:'110001',country:'India',phoneNumber:'9876543210'} };
let rows: Record<string, any>[];
let storageFails: boolean;
const create = jest.fn();
const fetchPayment = jest.fn();
function query(table: string) {
  let filters: [string, unknown][] = [];
  let write: string | undefined;
  let payload: any;
  const q: any = {
    select: () => q, in: () => q,
    eq: (key: string, value: unknown) => { filters.push([key,value]); return q; },
    insert: (value: unknown) => { write='insert';payload=value;return q; },
    update: (value: unknown) => { write='update';payload=value;return q; },
    maybeSingle: () => execute(true),
    then: (resolve: (value: unknown) => void) => Promise.resolve(execute(false)).then(resolve),
  };
  function execute(single: boolean) {
    if (storageFails) return {data:null,error:{code:'storage'}};
    if (table === 'products') return {data:[{id:productId,name:'Craft',price:100,stock:3,artisan_id:'seller',images:[],is_active:true}],error:null};
    if (write==='insert') {
      if(rows.some(r=>r.idempotency_key===payload.idempotency_key)) return {data:null,error:{code:'23505'}};
      rows.push({...payload,payment_status:'Pending Payment'});
    }
    const selected=rows.filter(r=>filters.every(([k,v])=>r[k]===v));
    if(write==='update') selected.forEach(r=>Object.assign(r,payload));
    return {data:single?selected[0]||null:selected,error:null};
  }
  return q;
}
beforeEach(() => {
  jest.clearAllMocks(); rows=[];storageFails=false;
  Object.assign(process.env,{NEXT_PUBLIC_SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test-only',RAZORPAY_KEY_ID:'test-id',RAZORPAY_KEY_SECRET:'test-secret'});
  (currentUser as jest.Mock).mockResolvedValue({id:'user_buyer',fullName:'Buyer',publicMetadata:{role:'buyer'},primaryEmailAddress:{emailAddress:'buyer@example.test',verification:{status:'verified'}}});
  (createClient as jest.Mock).mockReturnValue({from:query});
  create.mockResolvedValue({id:'order_test'});
  (Razorpay as unknown as jest.Mock).mockImplementation(()=>({orders:{create},payments:{fetch:fetchPayment}}));
});
test('legacy amount-only endpoint cannot create a payment',async()=>{
  const response=await POST(new Request('http://test/api/create-order',{method:'POST',body:JSON.stringify({amount:100})}));
  expect(response.status).toBe(400);expect(create).not.toHaveBeenCalled();
});
test('rejects fractional, excessive and duplicate quantities',async()=>{
  expect(checkoutInput.safeParse({...input,items:[{productId,quantity:1.5}]}).success).toBe(false);
  expect(checkoutInput.safeParse({...input,items:[{productId,quantity:100}]}).success).toBe(false);
  await expect(createOrder({...input,items:[...input.items,...input.items]})).rejects.toMatchObject({status:400});
});
test('recomputes price and persists order; same key reuses provider order',async()=>{
  const result=await createOrder({...input,amount:1});
  expect(result.amount).toBe(23600);expect(rows[0].payload.totalAmount).toBe(236);
  expect(rows[0].buyer_id).toBe('user_buyer');
  await createOrder({...input,amount:1});expect(create).toHaveBeenCalledTimes(1);
});
test('storage unavailable prevents provider call',async()=>{
  storageFails=true;await expect(createOrder(input)).rejects.toMatchObject({status:503});expect(create).not.toHaveBeenCalled();
});
test('anonymous checkout is rejected',async()=>{
  (currentUser as jest.Mock).mockResolvedValue(null);
  await expect(createOrder(input)).rejects.toMatchObject({status:401});expect(create).not.toHaveBeenCalled();
});
test('payment signature alone is insufficient: capture and amount must match',async()=>{
  await createOrder(input);
  const signature=crypto.createHmac('sha256','test-secret').update('order_test|pay_test').digest('hex');
  const body={order_id:'order_test',payment_id:'pay_test',signature};
  fetchPayment.mockResolvedValue({order_id:'order_test',amount:100,currency:'INR',status:'captured'});
  await expect(verifyPayment(body)).rejects.toMatchObject({status:400});
  expect(rows[0].payment_status).toBe('Pending Payment');
  fetchPayment.mockResolvedValue({order_id:'order_test',amount:23600,currency:'INR',status:'authorized'});
  await expect(verifyPayment(body)).rejects.toMatchObject({status:409});
  fetchPayment.mockResolvedValue({order_id:'order_test',amount:23600,currency:'INR',status:'captured'});
  await expect(verifyPayment(body)).resolves.toMatchObject({verified:true});
  rows[0].payment_status='Refunded';
  await expect(verifyPayment(body)).rejects.toMatchObject({status:409});
});
test('another buyer cannot verify an order',async()=>{
  await createOrder(input); rows[0].buyer_id='user_other';
  await expect(verifyPayment({order_id:'order_test',payment_id:'pay_test',signature:'bad'})).rejects.toMatchObject({status:404});
});
test('HMAC rejects malformed signatures without throwing',()=>{
  expect(signatureMatches('body','z'.repeat(64),'secret')).toBe(false);
  expect(signatureMatches('body',null,'secret')).toBe(false);
  expect(totals([{unitPrice:10.01,quantity:3}],false).amount).toBe(3544);
});

test('reusing idempotency key with changed shipping is rejected',async()=>{
  await createOrder(input);
  await expect(createOrder({...input,shipping:{...input.shipping,city:'Mumbai'}})).rejects.toMatchObject({status:409});
  expect(create).toHaveBeenCalledTimes(1);
});
test('provider failure leaves a reservation and cannot generate a second order',async()=>{
  create.mockRejectedValueOnce(new Error('provider timeout'));
  await expect(createOrder(input)).rejects.toThrow('provider timeout');
  expect(rows).toHaveLength(1);
  await expect(createOrder(input)).rejects.toMatchObject({status:409});
  expect(create).toHaveBeenCalledTimes(1);
});

function webhookRequest(event: string, signed = true) {
  process.env.RAZORPAY_WEBHOOK_SECRET = 'webhook-test-secret';
  const raw = JSON.stringify({event,payload:{payment:{entity:{id:'pay_test'}}}});
  const signature = crypto.createHmac('sha256','webhook-test-secret').update(raw).digest('hex');
  return new Request('http://test/api/razorpay/webhook',{method:'POST',body:raw,headers:{'x-razorpay-signature':signed?signature:'invalid'}});
}
test('webhook rejects unsigned events without reading a payment',async()=>{
  expect((await webhook(webhookRequest('payment.captured',false))).status).toBe(400);
  expect(fetchPayment).not.toHaveBeenCalled();
});
test('webhook updates canonical order and delayed capture cannot undo refund',async()=>{
  await createOrder(input);
  fetchPayment.mockResolvedValue({order_id:'order_test',amount:23600,currency:'INR',status:'captured',amount_refunded:0});
  expect((await webhook(webhookRequest('payment.captured'))).status).toBe(200);
  expect(rows[0].payment_status).toBe('Paid');
  fetchPayment.mockResolvedValue({order_id:'order_test',amount:23600,currency:'INR',status:'refunded',amount_refunded:23600});
  expect((await webhook(webhookRequest('refund.processed'))).status).toBe(200);
  expect(rows[0].payment_status).toBe('Refunded');
  fetchPayment.mockResolvedValue({order_id:'order_test',amount:23600,currency:'INR',status:'captured',amount_refunded:0});
  expect((await webhook(webhookRequest('payment.captured'))).status).toBe(200);
  expect(rows[0].payment_status).toBe('Refunded');
});
