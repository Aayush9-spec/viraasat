'use client';
import { useEffect, useState, useCallback } from 'react';
import type { Product } from '@/lib/types';
export interface ProductsResult {products:Product[];loading:boolean;error:Error|null;isOnline:boolean;}
export function useProducts(opts:{max?:number}={}):ProductsResult {
  const [state,setState]=useState<ProductsResult>({products:[],loading:true,error:null,isOnline:true});
  const max=opts.max || 100;
  const refresh=useCallback(async(signal?:AbortSignal)=>{
    try {
      const response=await fetch('/api/products',{signal});
      if(!response.ok)throw new Error('The catalog is temporarily unavailable. Please retry.');
      const result=await response.json();
      if(!signal?.aborted)setState({products:(result.data?.products || []).slice(0,max),loading:false,error:null,isOnline:true});
    }catch(e){if(!signal?.aborted)setState({products:[],loading:false,error:e instanceof Error?e:new Error('Catalog unavailable'),isOnline:false});}
  },[max]);
  useEffect(()=>{
    const controller=new AbortController();
    const update=()=>{void refresh(controller.signal);};update();
    window.addEventListener('viraasat_products_updated',update);
    return ()=>{controller.abort();window.removeEventListener('viraasat_products_updated',update);};
  },[refresh]);
  return state;
}
export const resumeFirestore=async():Promise<void>=>{};
