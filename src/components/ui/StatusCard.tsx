import { ReactNode } from "react";

export function StatusCard({
  title, total, items, icon, accent = "#3B82F6", groupKey
}:{
  title:string;
  total:number;
  items:{label:string;count:number}[];
  icon?:ReactNode;
  accent?:string;       // hex or rgb
  groupKey:string;      // 'todo' | 'inprog' | 'withclient' | 'ready' | 'done'
}) {
  return (
    <section
      className="card card--pad kpi-link"
      data-group={groupKey}
      style={
        { 
          // expose accent to CSS
          // @ts-ignore
          "--accent": accent,
        } as React.CSSProperties
      }
      aria-labelledby={`${groupKey}-title`}
    >
      <header className="sc__hdr">
        <span className="sc__ico" aria-hidden>{icon}</span>
        <h3 id={`${groupKey}-title`} className="sc__title">{title}</h3>
        <span className="sc__total">{total}</span>
      </header>
      <div className="sc__meta">
        {items.map(i=>(
          <div key={i.label} className="sc__row">
            <span>{i.label}</span><span>{i.count}</span>
          </div>
        ))}
      </div>
    </section>
  );
}