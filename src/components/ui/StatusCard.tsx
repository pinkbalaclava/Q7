export function StatusCard({title,total,items}:{title:string;total:number;items:{label:string;count:number}[]}) {
  return (<div>
    <div style={{display:'flex',justifyContent:'space-between',fontWeight:600}}>{title}<span>{total}</span></div>
    <div style={{marginTop:8}}>
      {items.map(i=>(
        <div key={i.label} style={{display:'flex',justifyContent:'space-between',color:'#475569'}}>
          <span>{i.label}</span><span>{i.count}</span>
        </div>
      ))}
    </div>
  </div>);
}