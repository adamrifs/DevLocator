import React from 'react';

/**
 * Section Title component for organizing panels and popups.
 */
export default function SectionTitle({ title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
      <div>
        <h3 className="text-xs font-semibold tracking-wider text-slate-300 uppercase">
          {title}
        </h3>
        {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

