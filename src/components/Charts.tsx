import {useState} from 'react';
import {Bar,BarChart,CartesianGrid,Cell,Legend,Pie,PieChart,ResponsiveContainer,Tooltip,XAxis,YAxis} from 'recharts';
import type {Transaction} from '../types';
import {categoryTotals,periodRows,today} from '../money';

const pieColors=['#ff6b6b','#56dcff','#b896ff','#ffbd66','#7ce8b0'];

export default function Charts({rows}:{rows:Transaction[]}) {
 const [mode,setMode]=useState<'week'|'month'>('week');
 const [referenceDate,setReferenceDate]=useState(today);
 const data=referenceDate?categoryTotals(periodRows(rows,referenceDate,mode)):[];
 const total=data.reduce((sum,row)=>sum+row.amount,0);

 return <section className="card">
  <h2>Expense summary</h2>
  <div className="row">
   <label>Period
    <select value={mode} onChange={e=>setMode(e.target.value as 'week'|'month')}>
     <option value="week">Week</option><option value="month">Month</option>
    </select>
   </label>
   <label>Reference date
    <input type="date" value={referenceDate} onChange={e=>setReferenceDate(e.target.value)}/>
   </label>
  </div>
  <p className="muted" aria-live="polite">
   Total expenses: ${total.toFixed(2)}{data.length>0&&<> · {data.map(row=>`${row.name}: $${row.amount.toFixed(2)}`).join(' · ')}</>}
  </p>
  {!referenceDate?<p className="muted">Select a reference date to view expenses.</p>:total===0?<p className="muted">No expenses in this period.</p>:
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,420px),1fr))',gap:20}}>
    <div style={{height:300,width:'100%',minWidth:0}}>
     <h3>Bar chart</h3>
     <ResponsiveContainer width="100%" height="85%">
      <BarChart data={data} margin={{top:12,right:12,bottom:8,left:8}}>
       <CartesianGrid stroke="#263b51" strokeDasharray="3 3"/>
       <XAxis dataKey="name" tick={{fill:'#b6c6d7',fontSize:12}}/>
       <YAxis tick={{fill:'#b6c6d7',fontSize:12}} tickFormatter={value=>`$${Number(value).toFixed(0)}`}/>
       <Tooltip contentStyle={{backgroundColor:'#0c1420',border:'1px solid #52677c',color:'#e8edf4'}} labelStyle={{color:'#e8edf4'}} itemStyle={{color:'#e8edf4'}} formatter={value=>[`$${Number(value).toFixed(2)}`,'Expenses']}/>
       <Bar dataKey="amount" name="Expenses" fill="var(--accent)" isAnimationActive={false}/>
      </BarChart>
     </ResponsiveContainer>
    </div>
    <div style={{height:300,width:'100%',minWidth:0}}>
     <h3>Pie chart</h3>
     <ResponsiveContainer width="100%" height="85%">
      <PieChart>
       <Pie data={data} dataKey="amount" nameKey="name" cx="50%" cy="45%" outerRadius="65%" label={({name,value,percent})=>`${name}: $${Number(value).toFixed(2)} (${(Number(percent)*100).toFixed(0)}%)`} isAnimationActive={false}>
        {data.map((entry,index)=><Cell key={entry.name} fill={pieColors[index%pieColors.length]}/>)}
       </Pie>
       <Tooltip contentStyle={{backgroundColor:'#0c1420',border:'1px solid #52677c',color:'#e8edf4'}} labelStyle={{color:'#e8edf4'}} itemStyle={{color:'#e8edf4'}} formatter={value=>[`$${Number(value).toFixed(2)}`,'Expenses']}/>
       <Legend wrapperStyle={{color:'#b6c6d7'}}/>
      </PieChart>
     </ResponsiveContainer>
    </div>
   </div>}
 </section>;
}
