import React from 'react';

function Input({ type = 'text', id, name, placeholder, value, onChange, className = '', label, error }) {
  const baseStyle = 'block w-full rounded-md border-border-color shadow-sm focus:border-primary focus:ring-primary sm:text-sm';
  const errorStyle = error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '';

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id || name} className="block text-sm font-medium text-text-main mb-1">
          {label}
        </label>
      )}
      <input
        type={type}
        id={id || name}
        name={name || id}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`${baseStyle} ${errorStyle} ${className}`}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

export default Input; 