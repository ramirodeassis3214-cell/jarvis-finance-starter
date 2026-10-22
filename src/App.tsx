import {useEffect,useState} from 'react';
import type {Transaction,Kind} from './types';
import {balance,money,parseCents,today} from './money';
import HudCore,{type Transfer} from './components/HudCore';
import ThemeControls from './components/ThemeControls';
import Charts from './components/Charts';
import Goal from './components/Goal';
import Advisor from './components/Advisor';
import RotatableDashboard from './components/RotatableDashboard';
const categories=['Food','Transport','Learning','Entertainment','Other'];
const seed=():Transaction[]=>[{id:'initial',date:today(),item:'Allowance',kind:'income',cents:10000,category:'Other'}];
function load():Transaction[]{try{const a=JSON.parse(localStorage.getItem('space-bank-v1')||'null');return Array.isArray(a)&&a.every(r=>r&&typeof r.id==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(r.date)&&typeof r.item==='string'&&['income','expense'].includes(r.kind)&&Number.isSafeInteger(r.cents)&&r.cents>0&&typeof r.category==='string')?a:seed();}catch{return seed();}}
export default function App(){
 const [rows,setRows]=useState<Transaction[]>(load),[event,setEvent]=useState<Transfer|null>(null);
 const [item,setItem]=useState(''),[amount,setAmount]=useState(''),[kind,setKind]=useState<Kind>('expense'),[date,setDate]=useState(today()),[category,setCategory]=useState(categories[0]),[error,setError]=useState(''),[edit,setEdit]=useState<string|null>(null),[saved,setSaved]=useState('');
 const cents=balance(rows);
 useEffect(()=>{try{localStorage.setItem('space-bank-v1',JSON.stringify(rows));setSaved('Saved on this device');}catch{setSaved('Changes could not be saved on this device. Keep this page open.');}},[rows]);
 function submit(e:React.FormEvent){e.preventDefault();try{
  if(!item.trim()||!date) throw Error('Enter an item and a valid date.');
  const value=parseCents(amount);
  const row:Transaction={id:edit||crypto.randomUUID(),date,item:item.trim(),kind,cents:value,category};
  const next=edit?rows.map(r=>r.id===edit?row:r):[...rows,row];
  if(balance(next)<0) throw Error('Insufficient balance. Check the amount or record any missing income.');
  setRows(next);
  if(!edit) setEvent({id:Date.now(),kind,cents:value,before:cents,after:balance(next)});
  else setEvent(null);
  setItem('');setAmount('');setEdit(null);setError('');
 }catch(e){setError((e as Error).message);}}
 function remove(id:string){const next=rows.filter(r=>r.id!==id);if(balance(next)<0){setError('Removing this income would make the balance negative. Review the related expenses first.');return;}setRows(next);setEvent(null);if(edit===id){setEdit(null);setItem('');setAmount('');}}
 return <RotatableDashboard><main><header><span className="tag">AI FUTURE CREATORS / LAB 03</span><h1>Bank</h1><p>PERSONAL FINANCE INTERFACE · Track cash flow. Understand your choices.</p></header>
 <ThemeControls/><HudCore cents={cents} event={event} transactions={rows.length}/>
 <section className="card"><h2>{edit?'Edit transaction':'Log a transaction'}</h2><form onSubmit={submit}>
 <label>Date<input type="date" value={date} onChange={e=>setDate(e.target.value)} required/></label>
 <label>Type<select value={kind} onChange={e=>setKind(e.target.value as Kind)}><option value="expense">Expense</option><option value="income">Income</option></select></label>
 <label>Item<input value={item} onChange={e=>setItem(e.target.value)} placeholder="e.g. Lunch / Allowance" maxLength={80} required/></label>
 <label>Amount<input inputMode="decimal" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="50.00" required/></label>
 <label>Category<select value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select></label>
 <button>{edit?'Save changes':'Log transaction'}</button>{edit&&<button type="button" onClick={()=>{setEdit(null);setItem('');setAmount('');}}>Cancel</button>}
 </form><p role="alert" className="error">{error}</p></section>
 <section className="card"><h2>Transaction ledger</h2><p className="muted">{saved} · Fictional classroom data · Amounts in $</p><div className="table-wrap"><table><thead><tr><th>Date</th><th>Item</th><th>Category</th><th>Type</th><th>Amount</th><th>Actions</th></tr></thead><tbody>
 {rows.map(r=><tr key={r.id}><td>{r.date}</td><td>{r.item}</td><td>{r.category}</td><td>{r.kind==='income'?'Income':'Expense'}</td><td className={r.kind}>{r.kind==='income'?'+':'−'}{money(r.cents)}</td><td><button className="small" onClick={()=>{setEdit(r.id);setDate(r.date);setItem(r.item);setAmount((r.cents/100).toFixed(2));setKind(r.kind);setCategory(r.category);}}>Edit</button><button className="small" onClick={()=>remove(r.id)}>Delete</button></td></tr>)}
 {!rows.length&&<tr><td colSpan={6}>No transactions yet. Log your first income.</td></tr>}</tbody></table></div></section>
 <Charts rows={rows}/><Goal rows={rows}/><Advisor rows={rows}/>
 <footer>Keep a clear record. Make your own spending decisions.</footer></main></RotatableDashboard>;
}
