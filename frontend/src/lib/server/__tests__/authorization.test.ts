/** @jest-environment node */
jest.mock('server-only',()=>({}),{virtual:true});
jest.mock('@clerk/nextjs/server',()=>({currentUser:jest.fn()}));
jest.mock('@/features/marketplace/product-service',()=>({ProductService:{getAllProducts:jest.fn()}}));
jest.mock('../security',()=>{
  const actual=jest.requireActual('../security');
  return {...actual,identity:jest.fn(),profile:jest.fn(),database:jest.fn()};
});
import { identity, profile, database, HttpError } from '../security';
import { GET, PATCH, DELETE } from '@/app/api/users/[id]/route';
import { GET as listUsers } from '@/app/api/users/route';
import { POST as saveProduct } from '@/app/api/products/route';
const id='123e4567-e89b-42d3-a456-426614174000';
const context={params:Promise.resolve({id})};
const request=(body:unknown)=>new Request('http://test',{method:'POST',body:JSON.stringify(body)});
beforeEach(()=>{
  jest.clearAllMocks();
  (identity as jest.Mock).mockResolvedValue({id:'user_owner',email:'owner@example.test',role:'buyer'});
  (profile as jest.Mock).mockResolvedValue({id});
});
test('user directory is not public to buyers',async()=>{
  expect((await listUsers()).status).toBe(403);expect(database).not.toHaveBeenCalled();
});
test.each([GET,DELETE])('cross-user detail and deletion are rejected',async handler=>{
  const response=await handler(request({}),{params:Promise.resolve({id:'123e4567-e89b-42d3-a456-426614174001'})});
  expect(response.status).toBe(403);expect(database).not.toHaveBeenCalled();
});
test.each([{role:'admin'},{email:'victim@example.test'},{id:'other'},{profile:{role:'admin'}}])('profile mutation rejects protected fields %j',async body=>{
  expect((await PATCH(request(body),context)).status).toBe(400);expect(database).not.toHaveBeenCalled();
});
test('product publishing requires an approved role',async()=>{
  expect((await saveProduct(request({name:'Craft',artisanId:'victim'}) as any)).status).toBe(403);
  expect(database).not.toHaveBeenCalled();
});
test('authentication failure does not fall through to product publishing',async()=>{
  (identity as jest.Mock).mockRejectedValue(new HttpError(401,'Sign in required'));
  expect((await saveProduct(request({name:'Craft'}) as any)).status).toBe(401);
  expect(database).not.toHaveBeenCalled();
});
test('product persistence failure returns an error, never success',async()=>{
  (identity as jest.Mock).mockResolvedValue({id:'user_owner',role:'artisan'});
  const query:any={insert:()=>query,select:()=>query,single:async()=>({data:null,error:{code:'storage'}})};
  (database as jest.Mock).mockReturnValue({from:()=>query});
  const response=await saveProduct(request({name:'Craft',description:'Handmade',price:100,stock:1,category:'Pottery',region:'Jaipur',images:['/images/product.jpg']}) as any);
  expect(response.status).toBe(503);
});
