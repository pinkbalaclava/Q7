export default function TopKpi({title, value, subtitle, variant='neutral'}:{
  title:string; value:React.ReactNode; subtitle?:string; variant?:'neutral'|'good'|'warn'|'bad';
}){
  return (<div className={`topkpi ${variant}`}>
    <div style={{fontWeight:600,color:'#0f172a'}}>{title}</div>
    <div style={{fontWeight:700,fontSize:28}}>{value}</div>
    {subtitle && <div style={{color:'#64748b',fontSize:12}}>{subtitle}</div>}
  </div>);
}