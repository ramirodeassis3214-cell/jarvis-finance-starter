import {useEffect,useRef,useState,type FormEvent} from 'react';
import type {Analysis,Judgment,Transaction} from '../types';

const REFLECTIONS_KEY='advisor-reflections-v1';
const judgments:Judgment[]=['need','want','unsure'];
type Reflection={judgment:Judgment;text:string};
type Reflections=Record<string,Reflection>;

function validJudgment(value:unknown):value is Judgment {
 return judgments.includes(value as Judgment);
}

function loadReflections():Reflections {
 const raw=localStorage.getItem(REFLECTIONS_KEY);
 if(!raw) return {};
 const value:unknown=JSON.parse(raw);
 if(!value||typeof value!=='object'||Array.isArray(value)) throw Error('Saved reflections are invalid.');
 return Object.fromEntries(Object.entries(value).flatMap(([id,entry])=>{
  if(!entry||typeof entry!=='object'||!('judgment' in entry)||!('text' in entry)||
   !validJudgment(entry.judgment)||typeof entry.text!=='string') return [];
  return [[id,{judgment:entry.judgment,text:entry.text.slice(0,500)}]];
 }));
}

function isAnalysis(value:unknown):value is Analysis {
 if(!value||typeof value!=='object') return false;
 const result=value as Record<string,unknown>;
 return (result.mode==='mock'||result.mode==='live')&&validJudgment(result.label)&&
  typeof result.reason==='string'&&typeof result.question==='string'&&typeof result.alternative==='string';
}

function expenseTitle(row:Transaction) {
 return `${row.item} — $${(row.cents/100).toFixed(2)} (${row.date})`;
}

export default function Advisor({rows}:{rows:Transaction[]}) {
 const expenses=rows.filter(row=>row.kind==='expense');
 const [selectedId,setSelectedId]=useState(()=>expenses[0]?.id||'');
 const [context,setContext]=useState('');
 const [initialJudgment,setInitialJudgment]=useState<Judgment>('unsure');
 const [finalJudgment,setFinalJudgment]=useState<Judgment>('unsure');
 const [analysis,setAnalysis]=useState<Analysis|null>(null);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState('');
 const [reflectionError,setReflectionError]=useState('');
 const [reflectionText,setReflectionText]=useState('');
 const [reflectionSaved,setReflectionSaved]=useState(false);
 const requestId=useRef(0);
 const activeRequest=useRef<AbortController|null>(null);
 const selected=expenses.find(row=>row.id===selectedId);
 const currentState=useRef({selectedId,context,rows});
 currentState.current={selectedId,context,rows};

 function invalidateRequest() {
  requestId.current++;
  activeRequest.current?.abort();
  activeRequest.current=null;
  setLoading(false);
 }

 useEffect(()=>{
  if((selectedId&&!expenses.some(row=>row.id===selectedId))||(!selectedId&&expenses.length>0)){
   invalidateRequest();
   const next=expenses[0]?.id||'';
   setSelectedId(next);
   setContext('');
   setInitialJudgment('unsure');
   setFinalJudgment('unsure');
   setAnalysis(null);
   setError('');
   setReflectionText('');
   setReflectionSaved(false);
  }
 },[expenses,selectedId]);

 useEffect(()=>{
  if(!selectedId) return;
  try{
   const saved=loadReflections()[selectedId];
   setInitialJudgment('unsure');
   setFinalJudgment(saved?.judgment||'unsure');
   setReflectionText(saved?.text||'');
   setReflectionSaved(Boolean(saved));
   setReflectionError('');
  }catch{
   setInitialJudgment('unsure');
   setFinalJudgment('unsure');
   setReflectionText('');
   setReflectionSaved(false);
   setReflectionError('Saved reflections could not be read on this device.');
  }
 },[selectedId]);

 useEffect(()=>()=>{activeRequest.current?.abort();},[]);

 function chooseExpense(id:string) {
  if(id===selectedId) return;
  invalidateRequest();
  setSelectedId(id);
  setContext('');
  setInitialJudgment('unsure');
  setFinalJudgment('unsure');
  setAnalysis(null);
  setError('');
  setReflectionError('');
  setReflectionText('');
  setReflectionSaved(false);
 }

 function changeContext(value:string) {
  setContext(value);
  setAnalysis(null);
  setError('');
 }

 async function analyse() {
  if(!selected) return;
  const request=++requestId.current;
  const submittedId=selected.id;
  const submittedContext=context;
  const controller=new AbortController();
  activeRequest.current=controller;
  setLoading(true);
  setError('');
  setAnalysis(null);
  const timeout=setTimeout(()=>controller.abort(),20000);
  const isCurrent=()=>request===requestId.current&&currentState.current.selectedId===submittedId&&
   currentState.current.context===submittedContext&&currentState.current.rows.some(row=>row.id===submittedId&&row.kind==='expense');
  try{
   const response=await fetch('/api/classify',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({item:selected.item,cents:selected.cents,context}),
    signal:controller.signal
   });
   let body:unknown;
   try{body=await response.json();}catch{throw Error('The advisor returned an unreadable response. Please try again.');}
   if(!isCurrent()) return;
   if(!response.ok){
    const message=body&&typeof body==='object'&&'error' in body&&typeof body.error==='string'?body.error:'The advisor could not complete the request.';
    throw Error(message);
   }
   if(!isAnalysis(body)) throw Error('The advisor returned an invalid response. Please try again.');
   setAnalysis(body);
  }catch(cause){
   if(!isCurrent()) return;
   if(controller.signal.aborted) setError('The request timed out or was cancelled. Please try again.');
   else if(cause instanceof TypeError) setError('Could not reach the advisor. Check your connection and try again.');
   else setError(cause instanceof Error?cause.message:'The advisor request failed. Please try again.');
  }finally{
   clearTimeout(timeout);
   if(isCurrent()){
    activeRequest.current=null;
    setLoading(false);
   }
  }
 }

 function saveReflection(event:FormEvent<HTMLFormElement>) {
  event.preventDefault();
  if(!selected) return;
  try{
   const current=loadReflections();
   const updated={...current,[selected.id]:{judgment:finalJudgment,text:reflectionText.slice(0,500)}};
   localStorage.setItem(REFLECTIONS_KEY,JSON.stringify(updated));
   setReflectionSaved(true);
   setReflectionError('');
  }catch{
   setReflectionSaved(false);
   setReflectionError('Your reflection could not be saved on this device.');
  }
 }

 return <section className="card">
  <h2>Spending reflection</h2>
  {expenses.length===0?<p className="muted">Log an expense to reflect on a spending choice.</p>:<>
   <label>Expense to review
    <select value={selected?.id||''} onChange={event=>chooseExpense(event.target.value)} disabled={loading}>
     {expenses.map(row=><option key={row.id} value={row.id}>{expenseTitle(row)}</option>)}
    </select>
   </label>
   {selected&&<>
    <label>Purpose or existing alternatives (optional)
     <textarea value={context} onChange={event=>changeContext(event.target.value)} maxLength={500} rows={3} disabled={loading}/>
    </label>
    <p className="muted">{context.length}/500 characters. Needs support health, safety, basic living, or necessary learning. Wants are extras, upgrades, or choices that can be postponed. Context matters; limited information may mean Unsure.</p>
    <label>My initial judgment
     <select value={initialJudgment} onChange={event=>setInitialJudgment(event.target.value as Judgment)}>
      <option value="need">Need</option><option value="want">Want</option><option value="unsure">Unsure</option>
     </select>
    </label>
    <button type="button" onClick={analyse} disabled={loading}>{loading?'Analysing spending…':'Analyse spending'}</button>
    {loading&&<p className="muted" role="status">Waiting for the advisor. This may take up to 20 seconds.</p>}
    {error&&<p className="error" role="alert">{error}</p>}
    {analysis&&<div className="judgment" aria-live="polite">
     <p className="goal-status">{analysis.mode==='mock'?'MOCK MODE — fixed example, not connected to AI':'LIVE AI RESPONSE'}</p>
     <p>Your initial judgment: <strong>{initialJudgment.toUpperCase()}</strong></p>
     <p>Advisor judgment: <strong>{analysis.label.toUpperCase()}</strong></p>
     <p><strong>Reason:</strong> {analysis.reason}</p>
     <p><strong>Follow-up question:</strong> {analysis.question}</p>
     <p><strong>Alternative:</strong> {analysis.alternative}</p>
     <p className="muted">This is guidance, not a certain verdict. You make the final decision.</p>
    </div>}
    <form onSubmit={saveReflection}>
     <label>My final judgment
      <select value={finalJudgment} onChange={event=>{setFinalJudgment(event.target.value as Judgment);setReflectionSaved(false);}}>
       <option value="need">Need</option><option value="want">Want</option><option value="unsure">Unsure</option>
      </select>
     </label>
     <label>I agree/disagree because…
      <textarea value={reflectionText} onChange={event=>{setReflectionText(event.target.value);setReflectionSaved(false);setReflectionError('');}} maxLength={500} rows={3}/>
     </label>
     <button type="submit">Save my reflection</button>
    </form>
    {reflectionSaved&&<p className="muted" role="status">Your reflection is saved for this expense on this device.</p>}
    {reflectionError&&<p className="error" role="alert">{reflectionError}</p>}
   </>}
  </>}
 </section>;
}
