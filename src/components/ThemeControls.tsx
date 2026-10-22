import {useEffect,useState} from 'react';
const presets=[['Cyan','#56dcff'],['Violet','#b896ff'],['Amber','#ffbd66'],['E[stein passive income]','#ff0000']];
function initial(){try{const s=localStorage.getItem('jarvis-accent');if(s&&/^#[0-9a-f]{6}$/i.test(s))return s;}catch{}return '#ff0000';}
export default function ThemeControls(){
 const [color,setColor]=useState(initial),[warning,setWarning]=useState('');
 useEffect(()=>{document.documentElement.style.setProperty('--accent',color);try{localStorage.setItem('jarvis-accent',color);}catch{setWarning('Your colour preference could not be saved.');}},[color]);
 return <section className="theme-controls" aria-label="Interface colours"><span className="eyebrow">INTERFACE ACCENT</span><div className="swatches">{presets.map(([name,hex])=><button type="button" key={hex} className={'swatch '+(color.toLowerCase()===hex?'selected':'')} style={{background:hex}} aria-label={name} aria-pressed={color.toLowerCase()===hex} title={name} onClick={()=>setColor(hex)}/>)}<label className="custom-color">Custom colour<input type="color" value={color} onChange={e=>setColor(e.target.value)} aria-label="Custom accent colour"/></label></div><p className="error" role="alert">{warning}</p></section>;
}
