import {useRef,useState,type PointerEvent,type ReactNode} from 'react';

type Angles={x:number;y:number};
type DragStart=Angles&{pointerId:number;clientX:number;clientY:number};

function wrapAngle(degrees:number) {
 return ((degrees%360)+360)%360;
}

export default function RotatableDashboard({children}:{children:ReactNode}) {
 const [angles,setAngles]=useState<Angles>({x:0,y:0});
 const [dragging,setDragging]=useState(false);
 const dragStart=useRef<DragStart|null>(null);

 function startDrag(event:PointerEvent<HTMLDivElement>) {
  if(event.pointerType==='mouse'&&event.button!==0) return;
  if((event.target as HTMLElement).closest('button,input,select,textarea,a,label')) return;
  dragStart.current={pointerId:event.pointerId,clientX:event.clientX,clientY:event.clientY,...angles};
  event.currentTarget.setPointerCapture(event.pointerId);
  setDragging(true);
 }

 function moveDrag(event:PointerEvent<HTMLDivElement>) {
  const start=dragStart.current;
  if(!start||start.pointerId!==event.pointerId) return;
  setAngles({
   x:wrapAngle(start.x-(event.clientY-start.clientY)*0.5),
   y:wrapAngle(start.y+(event.clientX-start.clientX)*0.5)
  });
 }

 function stopDrag(event:PointerEvent<HTMLDivElement>) {
  if(dragStart.current?.pointerId!==event.pointerId) return;
  dragStart.current=null;
  setDragging(false);
 }

 return <div className="dashboard-experience">
  <div className="rotation-controls" aria-label="3D view controls">
   <span className="rotation-title">3D VIEW</span>
   <span className="rotation-hint">Drag the dashboard to rotate it.</span>
   <label>Horizontal rotation
    <input type="range" min="0" max="359" value={Math.round(angles.y)} onChange={event=>setAngles(current=>({...current,y:Number(event.target.value)}))}/>
   </label>
   <label>Vertical rotation
    <input type="range" min="0" max="359" value={Math.round(angles.x)} onChange={event=>setAngles(current=>({...current,x:Number(event.target.value)}))}/>
   </label>
   <button type="button" onClick={()=>setAngles({x:0,y:0})}>Reset view</button>
  </div>
  <div className="dashboard-stage" onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={stopDrag} onPointerCancel={stopDrag}>
   <div className={`dashboard-scene${dragging?' is-dragging':''}`} style={{transform:`rotateX(${angles.x}deg) rotateY(${angles.y}deg)`}}>
    {children}
   </div>
  </div>
 </div>;
}
