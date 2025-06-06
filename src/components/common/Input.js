import PropTypes from "prop-types";

const Input = React.forwardRef(
  (
    {
      type = "text",
      label,
      name,
      value,
      onChange,
      placeholder,
      disabled = false,
      error,
      helperText,
      leftIcon,
      rightIcon,
      inputClassName = "",
      labelClassName = "",
      wrapperClassName = "",
      size = "md", // sm, md, lg
      ...props
    },
    ref
  ) => {
    const uniqueId = useId();
    const inputId = props.id || `input-${uniqueId}`;
    const errorId = error ? `error-${uniqueId}` : undefined;
    const helperId = helperText ? `helper-${uniqueId}` : undefined;

    let sizeStyles = "px-3 py-2 text-sm"; // Default md size (theme.components.input.paddingX, paddingY, fontSize)
    let iconSize = "h-5 w-5";

    if (size === "sm") {
      sizeStyles = "px-2.5 py-1.5 text-xs";
      iconSize = "h-4 w-4";
    } else if (size === "lg") {
      sizeStyles = "px-4 py-2.5 text-base";
      iconSize = "h-6 w-6";
    }

    const baseInputStyles = `
      block w-full rounded-md shadow-sm 
      focus:outline-none focus:ring-2 focus:ring-offset-0
      transition-colors duration-150 ease-in-out
    `; // theme.components.input.borderRadius

    const stateStyles = error
      ? "border-red-500 text-red-700 focus:border-red-500 focus:ring-red-500 placeholder-red-400" // theme.colors.status.error
      : "border-gray-300 text-gray-800 focus:border-blue-500 focus:ring-blue-500 placeholder-gray-400"; // theme.colors.border.input, .inputFocus, text.primary, neutral.400

    const disabledStyles = disabled
      ? "bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200" // theme.colors.neutral.100, .500
      : "bg-white"; // theme.colors.background.paper

    const iconPaddingStyles = `
      ${leftIcon ? "pl-10" : ""} 
      ${rightIcon ? "pr-10" : ""}
    `;

    return (
      <div className={`relative ${wrapperClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className={`block text-sm font-medium text-gray-700 mb-1 ${labelClassName}`} // theme.colors.text.secondary
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 ${iconSize}`}>
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            id={inputId}
            name={name}
            ref={ref}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            className={`${baseInputStyles} ${sizeStyles} ${stateStyles} ${disabledStyles} ${iconPaddingStyles} ${inputClassName}`}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={`${errorId || ""} ${helperId || ""}`.trim() || undefined}
            {...props}
          />
          {rightIcon && (
             <div className={`absolute inset-y-0 right-0 pr-3 flex items-center ${type === "password" ? "" : "pointer-events-none"} text-gray-400 ${iconSize}`}>
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p id={errorId} className="mt-1 text-xs text-red-600"> {/* theme.colors.status.error.DEFAULT */}
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className="mt-1 text-xs text-gray-500"> {/* theme.colors.text.secondary */}
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.propTypes = {
  type: PropTypes.string,
  label: PropTypes.string,
  name: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  error: PropTypes.string,
  helperText: PropTypes.string,
  leftIcon: PropTypes.node,
  rightIcon: PropTypes.node,
  inputClassName: PropTypes.string,
  labelClassName: PropTypes.string,
  wrapperClassName: PropTypes.string,
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  id: PropTypes.string,
};

Input.displayName = "Input";

export default Input;
