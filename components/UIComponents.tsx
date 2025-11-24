import React, { ReactNode, useState } from 'react';
import { Category } from '../types';

// --- Card Component ---
interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  action?: ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, action }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-6 ${className}`}>
    {(title || action) && (
      <div className="flex justify-between items-center mb-4">
        {title && <h3 className="text-lg font-semibold text-slate-800">{title}</h3>}
        {action && <div>{action}</div>}
      </div>
    )}
    {children}
  </div>
);

// --- Button Component ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200 focus:ring-emerald-500",
    secondary: "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 focus:ring-slate-400",
    danger: "bg-rose-50 text-rose-600 hover:bg-rose-100 focus:ring-rose-500",
    ghost: "bg-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`} 
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : children}
    </button>
  );
};

// --- Input Component ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => (
  <div className="flex flex-col gap-1.5 mb-3">
    <label className="text-sm font-medium text-slate-600">{label}</label>
    <input 
      className={`px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all ${className}`}
      {...props}
    />
  </div>
);

// --- Select Component ---
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { label: string; value: string }[];
}

export const Select: React.FC<SelectProps> = ({ label, options, className = '', ...props }) => (
  <div className="flex flex-col gap-1.5 mb-3">
    <label className="text-sm font-medium text-slate-600">{label}</label>
    <div className="relative">
      <select 
        className={`w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none appearance-none transition-all ${className}`}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </div>
    </div>
  </div>
);

// --- Badge Component ---
export const Badge: React.FC<{ children: ReactNode; color?: 'emerald' | 'blue' | 'slate' | 'rose' }> = ({ children, color = 'slate' }) => {
  const colors = {
    emerald: "bg-emerald-100 text-emerald-800",
    blue: "bg-blue-100 text-blue-800",
    slate: "bg-slate-100 text-slate-700",
    rose: "bg-rose-100 text-rose-800"
  };
  return (
    <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${colors[color]}`}>
      {children}
    </span>
  );
}

// --- Smart Icon Component ---
interface SmartIconProps {
  title: string;
  categories: Category[];
  className?: string;
}

export const SmartIcon: React.FC<SmartIconProps> = ({ title, categories, className = '' }) => {
  const [imageError, setImageError] = useState(false);

  // Fallback Emoji Logic
  const getFallbackEmoji = () => {
    if (categories.includes(Category.ENTERTAINMENT)) return '🎮';
    if (categories.includes(Category.FOOD)) return '🍔';
    if (categories.includes(Category.TRANSPORT)) return '🚗';
    if (categories.includes(Category.AI_TOOLS)) return '🤖';
    if (categories.includes(Category.SHOPPING)) return '🛍️';
    if (categories.includes(Category.HEALTH)) return '💪';
    if (categories.includes(Category.EDUCATION)) return '🎓';
    if (categories.includes(Category.WORK)) return '💼';
    return '📄';
  };

  // Fallback Color Logic
  const getFallbackColor = () => {
    if (categories.includes(Category.ENTERTAINMENT)) return 'bg-purple-100 text-purple-600';
    if (categories.includes(Category.FOOD)) return 'bg-orange-100 text-orange-600';
    if (categories.includes(Category.AI_TOOLS)) return 'bg-indigo-100 text-indigo-600';
    if (categories.includes(Category.UTILITIES)) return 'bg-blue-100 text-blue-600';
    return 'bg-slate-100 text-slate-600';
  };

  // Attempt to build a favicon URL
  // Google Favicon Service: https://www.google.com/s2/favicons?domain={domain}&sz={size}
  const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '');
  // Manual overrides for common services where name != domain
  const domainMap: Record<string, string> = {
    'chatgpt': 'openai.com',
    'prime': 'amazon.com',
    'gpalestra': 'gymshark.com', // Example guess
    'playstation': 'playstation.com',
    'xbox': 'xbox.com',
    'steam': 'steampowered.com',
    'adobe': 'adobe.com',
    'office': 'office.com'
  };

  let domain = cleanTitle + ".com";
  // Check if we have a better guess in map, looking for substrings
  for (const key in domainMap) {
    if (cleanTitle.includes(key)) {
      domain = domainMap[key];
      break;
    }
  }

  const iconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

  if (!imageError) {
    return (
      <div className={`overflow-hidden rounded-full bg-white flex items-center justify-center border border-slate-100 shadow-sm ${className}`}>
        <img 
          src={iconUrl} 
          alt={title} 
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  return (
    <div className={`rounded-full flex items-center justify-center text-lg shrink-0 ${getFallbackColor()} ${className}`}>
      {getFallbackEmoji()}
    </div>
  );
};