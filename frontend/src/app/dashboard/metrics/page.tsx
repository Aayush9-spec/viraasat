'use client';
import {useEffect,useState} from 'react';
import {BACKEND_URL} from '@/services/backend/client';
export default function MetricsPage() {
  const [metrics,setMetrics]=useState<Record<string,Record<string,unknown>>|null>(null);
  const [error,setError]=useState('');
  useEffect(()=>{
    const controller=new AbortController();
    fetch(`${BACKEND_URL}/api/metrics/evaluation`,{signal:controller.signal}).then(async r=>{if(!r.ok)throw new Error();setMetrics(await r.json());})
      .catch(()=>{if(!controller.signal.aborted)setError('Evaluation metrics are unavailable. Please retry later.');});
    return ()=>controller.abort();
  },[]);
  return <main className="p-4 space-y-6"><h1 className="font-serif text-3xl">Model evaluation</h1>
    <p>Stored artifact results describe their evaluation data, not verified production accuracy. Missing measurements are shown explicitly.</p>
    {error?<p role="alert">{error}</p>:!metrics?<p role="status">Loading metrics…</p>:<div className="grid md:grid-cols-2 gap-4">{Object.entries(metrics).map(([name,values])=><section key={name} className="p-5 border rounded-xl bg-card">
      <h2 className="text-xl font-serif capitalize">{name.replaceAll('_',' ')}</h2>
      <dl className="space-y-2 mt-4">{Object.entries(values).map(([key,value])=><div key={key} className="flex justify-between gap-4"><dt className="capitalize">{key.replaceAll('_',' ')}</dt><dd className="font-mono text-right break-words">{value==null?'Not measured':typeof value==='boolean'?value?'Yes':'No':String(value)}</dd></div>)}</dl>
    </section>)}</div>}
  </main>;
}
