import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavItem {
  href: string;
  label: string;
}

interface PersonaNavProps {
  items: NavItem[];
}

export default function PersonaNav({ items }: PersonaNavProps) {
  const location = useLocation();
  
  return (
    <nav aria-label="Page navigation" className="flex gap-2 flex-wrap">
      {items.map(item => {
        const active = location.pathname === item.href || 
                      (item.href.includes('#') && location.pathname + location.hash === item.href) ||
                      location.pathname.startsWith(item.href + '#');
        
        return (
          <Link 
            key={item.href} 
            to={item.href}
            aria-current={active ? 'page' : undefined}
            className={`px-3 py-2 rounded-md text-sm transition-colors ${
              active 
                ? 'bg-blue-100 text-blue-900 font-medium' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}