import React from "react";
import PropTypes from "prop-types";

const Button = ({
  children,
  onClick,
  variant = "primary", // primary, secondary, text, destructive, outline
  size = "md", // sm, md, lg
  disabled = false,
  type = "button",
  className = "",
  leftIcon,
  rightIcon,
  fullWidth = false,
  isLoading = false,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-medium focus:outline-none transition-all duration-150 ease-in-out focus:ring-2 focus:ring-offset-2";

  let variantStyles = "";
  let sizeStyles = "";

  // Size styles (corresponds to theme.components.button padding and fontSize)
  switch (size) {
    case "sm":
      sizeStyles = "px-3 py-1.5 text-xs rounded-md";
      break;
    case "lg":
      sizeStyles = "px-6 py-3 text-base rounded-lg";
      break;
    case "md":
    default:
      sizeStyles = "px-4 py-2 text-sm rounded-md"; // theme.components.button.paddingX, paddingY, fontSize, borderRadius
      break;
  }

  // Variant styles (corresponds to theme.components.button variants)
  switch (variant) {
    case "secondary":
      variantStyles = `
        bg-gray-200 text-gray-700 border border-transparent shadow-sm
        hover:bg-gray-300
        focus:ring-gray-400
        active:bg-gray-400
        ${disabled || isLoading ? "disabled:bg-gray-100 disabled:text-gray-400" : ""}
      `; // theme.colors.neutral.200, .700, .300, .400, .100, .400
      break;
    case "text":
      variantStyles = `
        text-blue-600 bg-transparent
        hover:bg-blue-50 hover:text-blue-700
        focus:ring-blue-500
        active:bg-blue-100
        ${disabled || isLoading ? "disabled:text-gray-400" : ""}
      `; // theme.colors.text.link, theme.colors.text.linkHover
      break;
    case "destructive":
      variantStyles = `
        bg-red-500 text-white border border-transparent shadow-sm
        hover:bg-red-600
        focus:ring-red-500
        active:bg-red-700
        ${disabled || isLoading ? "disabled:bg-red-300" : ""}
      `; // theme.colors.status.error.DEFAULT, .dark, .light
      break;
    case "outline":
       variantStyles = `
        bg-white text-gray-700 border border-gray-300 shadow-sm
        hover:bg-gray-50
        focus:ring-blue-500
        active:bg-gray-100
        ${disabled || isLoading ? "disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200" : ""}
      `; // theme.colors.neutral.300 (border), .600 (text), .100 (hoverBg)
      break;
    case "primary":
    default:
      variantStyles = `
        bg-blue-500 text-white border border-transparent shadow-sm
        hover:bg-blue-600
        focus:ring-blue-500
        active:bg-blue-700
        ${disabled || isLoading ? "disabled:bg-blue-300" : ""}
      `; // theme.colors.primary.DEFAULT, .dark, .light
      break;
  }

  const widthStyles = fullWidth ? "w-full" : "";
  const disabledCursorStyles = disabled || isLoading ? "cursor-not-allowed" : "";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${widthStyles} ${disabledCursorStyles} ${className}`}
      {...props}
    >
      {isLoading && (
        <svg
          className={`animate-spin h-4 w-4 ${leftIcon || rightIcon || children ? (size === "sm" ? "mr-1.5" : "mr-2") : "" }`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {leftIcon && !isLoading && <span className={`${size === "sm" ? "mr-1.5" : "mr-2"} -ml-0.5 h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center`}>{leftIcon}</span>}
      {!isLoading && children}
      {rightIcon && !isLoading && <span className={`${size === "sm" ? "ml-1.5" : "ml-2"} -mr-0.5 h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center`}>{rightIcon}</span>}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node,
  onClick: PropTypes.func,
  variant: PropTypes.oneOf(["primary", "secondary", "text", "destructive", "outline"]),
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  disabled: PropTypes.bool,
  type: PropTypes.oneOf(["button", "submit", "reset"]),
  className: PropTypes.string,
  leftIcon: PropTypes.node,
  rightIcon: PropTypes.node,
  fullWidth: PropTypes.bool,
  isLoading: PropTypes.bool,
};

export default Button;
