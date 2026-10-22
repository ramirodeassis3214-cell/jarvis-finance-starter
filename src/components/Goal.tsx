import {useEffect,useRef,useState} from 'react';
import type {Transaction} from '../types';
import {balance,money,parseCents,periodRows,today} from '../money';

const TARGET_KEY='space-savings-target-v1';
const DEFAULT_TARGET={name:'Weekly savings',cents:3000};
const MAX_TARGET_CENTS=100000000;
type Target={name:string;cents:number};

function loadTarget():Target {
 try {
  const stored=localStorage.getItem(TARGET_KEY);
  if(stored){
   const value:unknown=JSON.parse(stored);
   if(value&&typeof value==='object'&&'name' in value&&'cents' in value&&
    typeof value.name==='string'&&value.name.trim().length>0&&value.name.trim().length<=60&&
    typeof value.cents==='number'&&Number.isSafeInteger(value.cents)&&value.cents>0&&value.cents<=MAX_TARGET_CENTS){
    return {name:value.name.trim(),cents:value.cents};
   }
  }
 }catch{}
 return DEFAULT_TARGET;
}

function formatCents(cents:number) {
 return cents<0?`-${money(-cents)}`:money(cents);
}

export default function Goal({rows}:{rows:Transaction[]}) {
 const [target,setTarget]=useState(loadTarget);
 const [name,setName]=useState(target.name);
 const [amount,setAmount]=useState((target.cents/100).toFixed(2));
 const [mode,setMode]=useState<'week'|'month'>('week');
 const [referenceDate,setReferenceDate]=useState(today);
 const [error,setError]=useState('');
 const [confirmation,setConfirmation]=useState(false);
 const periodNet=referenceDate?balance(periodRows(rows,referenceDate,mode)):0;
 const achieved=periodNet>=target.cents;
 const previousAchieved=useRef(achieved);
 const confirmationTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const progress=Math.min(100,Math.max(0,periodNet/target.cents*100));
 const remaining=target.cents-periodNet;

 useEffect(()=>{
  if(achieved&&!previousAchieved.current){
   setConfirmation(true);
   if(confirmationTimer.current) clearTimeout(confirmationTimer.current);
   confirmationTimer.current=setTimeout(()=>{setConfirmation(false);confirmationTimer.current=null;},2400);
  }else if(!achieved){
   setConfirmation(false);
   if(confirmationTimer.current){clearTimeout(confirmationTimer.current);confirmationTimer.current=null;}
  }
  previousAchieved.current=achieved;
 },[achieved]);

 useEffect(()=>()=>{if(confirmationTimer.current)clearTimeout(confirmationTimer.current);},[]);

 function saveTarget(event:React.FormEvent<HTMLFormElement>) {
  event.preventDefault();
  let next:Target;
  try{
   const cleanName=name.trim();
   if(!cleanName||cleanName.length>60) throw Error('Enter a target name of 1 to 60 characters.');
   const cents=parseCents(amount);
   if(cents>MAX_TARGET_CENTS) throw Error('The target must be no more than $1,000,000.00.');
   next={name:cleanName,cents};
  }catch(e){
   setError(e instanceof Error?e.message:'The target could not be saved.');
   return;
  }
  try{
   localStorage.setItem(TARGET_KEY,JSON.stringify(next));
  }catch{
   setError('The target could not be saved on this device.');
   return;
  }
  setTarget(next);
  setName(next.name);
  setAmount((next.cents/100).toFixed(2));
  setError('');
 }

 return <section className="card">
  <h2>Savings target</h2>
  <form noValidate onSubmit={saveTarget}>
   <label>Target name<input value={name} onChange={event=>{setName(event.target.value);setError('');}} maxLength={60} required/></label>
   <label>Target amount<input type="number" inputMode="decimal" min="0.01" max="1000000" step="0.01" value={amount} onChange={event=>{setAmount(event.target.value);setError('');}} required/></label>
   <label>Period<select value={mode} onChange={event=>setMode(event.target.value as 'week'|'month')}><option value="week">Week</option><option value="month">Month</option></select></label>
   <label>Reference date<input type="date" value={referenceDate} onChange={event=>setReferenceDate(event.target.value)}/></label>
   <button type="submit">Save target</button>
  </form>
  <p role="alert" className="error">{error}</p>
  <p className="muted">Available balance is your all-time wallet balance. Period net savings is income minus expenses within the selected period. Progress compares that period net with your target.</p>
  <p className="goal-status" aria-live="polite">{target.name} · {achieved?'TARGET ACHIEVED':'TARGET IN PROGRESS'}</p>
  <p>Period net savings ({mode}): <strong>{formatCents(periodNet)}</strong> · Target: <strong>{money(target.cents)}</strong> · Remaining: <strong>{formatCents(remaining)}</strong> · Progress: <strong>{progress.toFixed(1)}%</strong></p>
  <div className="progress" role="progressbar" aria-label="Savings target progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Number(progress.toFixed(1))}>
   <div style={{width:`${progress}%`}}/>
  </div>
  {!referenceDate&&<p className="muted">Select a reference date to calculate period savings.</p>}
  {confirmation&&<div className="transaction-scan" role="status" aria-live="polite"><b>TARGET ACHIEVED</b><span>Period savings reached your target.</span></div>}
 </section>;
}
