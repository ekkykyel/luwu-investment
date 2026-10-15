import React from 'react';
import { FileSearch } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message: string;
  isTable?: boolean;
  colSpan?: number;
}

export function EmptyState({ title = "Belum Ada Data", message, isTable = false, colSpan = 1 }: EmptyStateProps) {
  const content = (
    <div className="flex flex-col items-center justify-center py-12 text-slate-800 dark:text-slate-200 dark:text-slate-400 w-full">
      <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center mb-4 border border-slate-200 dark:border-slate-800">
        <FileSearch size={28} className="text-slate-600 dark:text-slate-400" />
      </div>
      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">{title}</h3>
      <p className="text-xs text-center max-w-sm">{message}</p>
    </div>
  );

  if (isTable) {
    return (
      <tr>
        <td colSpan={colSpan} className="py-8">
          {content}
        </td>
      </tr>
    );
  }

  return content;
}
