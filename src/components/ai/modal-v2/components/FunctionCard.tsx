'use client';

import { FunctionCardProps } from '../types';

export default function FunctionCard({
  type,
  title,
  icon,
  isSelected,
  onClick
}: FunctionCardProps) {
  return (
    <button
      onClick={() => onClick(type)}
      className={`
        flex flex-col items-center justify-center
        p-3 rounded-xl transition-all
        hover:shadow-md
        ${isSelected 
          ? 'bg-gradient-to-br from-purple-600 to-indigo-700 text-white shadow-lg scale-105' 
          : 'bg-white border border-gray-200 text-gray-700 hover:border-purple-200 hover:bg-purple-50'
        }
      `}
    >
      <span className="text-2xl mb-1">{icon}</span>
      <span className={`text-xs font-medium ${isSelected ? 'text-white' : 'text-gray-700'}`}>
        {title}
      </span>
    </button>
  );
} 