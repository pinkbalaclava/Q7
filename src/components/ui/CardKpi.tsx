import React from 'react';
import { cn } from '@/lib/utils';

interface CardKpiProps {
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  icon?: React.ReactNode;
  status?: "neutral" | "good" | "warn" | "bad";
  className?: string;
  'data-group'?: string;
}

export function CardKpi({ 
  title, 
  value, 
  subtitle, 
  icon, 
  status = "neutral",
  className,
  ...props
}: CardKpiProps) {
  const statusClasses = {
    neutral: "bg-white border-gray-200",
    good: "bg-green-50 border-green-200",
    warn: "bg-yellow-50 border-yellow-200", 
    bad: "bg-red-50 border-red-200"
  };

  return (
    <div className={cn(
      "kpi-card rounded-2xl border p-6 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
      statusClasses[status],
      className
    )}>
      {...props}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        {icon && (
          <div className="text-gray-400">
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <div className="mb-2">
        <div className="text-3xl font-bold text-gray-900">
          {value}
        </div>
      </div>

      {/* Subtitle */}
      {subtitle && (
        <div className="text-sm text-gray-500">
          {subtitle}
        </div>
      )}
    </div>
  );
}