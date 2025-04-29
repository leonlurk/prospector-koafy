import React from 'react';

function Button({ children, onClick, type = 'button', variant = 'primary', className = '', disabled = false }) {
  const baseStyle = 'inline-flex items-center justify-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-150 ease-in-out';

  let variantStyle = '';
  switch (variant) {
    case 'secondary':
      variantStyle = 'bg-white text-primary border-border-color hover:bg-gray-50 focus:ring-primary';
      break;
    case 'danger':
       variantStyle = 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500';
      break;
    case 'primary':
    default:
      variantStyle = 'bg-primary text-white hover:bg-primary-dark focus:ring-primary';
  }

  const disabledStyle = disabled ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseStyle} ${variantStyle} ${disabledStyle} ${className}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export default Button; 