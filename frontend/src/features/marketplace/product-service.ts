import { categories as staticCategories, regions as staticRegions } from '@/lib/data';
import type { Product } from '@/lib/types';
import { supabase } from '@/services/supabase';

export function mapProduct(row: Record<string, any>): Product {
  return {...row,id:row.id,artisanId:row.artisan_id,name:row.name,description:row.description || '',
    price:Number(row.price),images:row.images || [],region:row.region || '',category:row.category || '',
    stock:row.stock,isActive:row.is_active,status:row.is_active?'active':'archived',
    originalLanguage:row.original_language,englishDescription:row.english_description,descriptions:row.descriptions,
    createdAt:row.created_at,updatedAt:row.updated_at,aiInsights:row.ai_insights} as Product;
}
export class ProductService {
  static async getAllProducts(): Promise<Product[]> {
    const {data,error}=await supabase.from('products').select('*').eq('is_active',true)
      .order('created_at',{ascending:false}).limit(1000).abortSignal(AbortSignal.timeout(10000));
    if(error)throw new Error('The catalog is temporarily unavailable');
    return (data || []).map(mapProduct);
  }
  static async getProductById(id:string):Promise<Product|undefined> {
    if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))return undefined;
    const {data,error}=await supabase.from('products').select('*').eq('is_active',true).eq('id',id).abortSignal(AbortSignal.timeout(10000)).maybeSingle();
    if(error)throw new Error('Product details are temporarily unavailable');
    return data?mapProduct(data):undefined;
  }
  static async getProductsByCategory(category:string) {return (await this.getAllProducts()).filter(p=>p.category.toLowerCase()===category.toLowerCase());}
  static async searchProducts(query:string) {const q=query.toLowerCase();return (await this.getAllProducts()).filter(p=>[p.name,p.description,p.region].some(v=>v.toLowerCase().includes(q)));}
  static async getAllCategories():Promise<string[]> {
    try {const items=await this.getAllProducts();return [...new Set(items.map(p=>p.category).filter(Boolean))].sort();}catch{return staticCategories;}
  }
  static async getAllRegions():Promise<string[]> {
    try {const items=await this.getAllProducts();return [...new Set(items.map(p=>p.region).filter(Boolean))].sort();}catch{return staticRegions;}
  }
}
export function watchCategories(onChange:(categories:string[])=>void,onError?:(err:Error)=>void):()=>void {
  const refresh=()=>{void ProductService.getAllCategories().then(onChange).catch(onError);};
  refresh();window.addEventListener('viraasat_products_updated',refresh);
  return ()=>window.removeEventListener('viraasat_products_updated',refresh);
}
