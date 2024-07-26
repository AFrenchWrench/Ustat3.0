import React from 'react';
import dynamic from 'next/dynamic';

// Assuming ReactCodeInput is imported from 'react-code-input' as a dynamic component
const ReactCodeInput = dynamic(() => import('react-code-input'), { ssr: false });

// Define the type for props, including onChange
type CustomReactCodeInputProps = {
  onChange: (value: string) => void; // Define onChange as a function that accepts a string value and returns void
  [key: string]: any; // Allow other props to be passed through
};

// Functional component with explicit typing for props
const CustomReactCodeInput: React.FC<CustomReactCodeInputProps> = ({ onChange, ...rest }) => {
  const handleChange = (value: string) => {
    onChange(value); // Call onChange with the value directly
  };

  return <ReactCodeInput name={''} inputMode={'verbatim'} onChange={handleChange} {...rest} />;
};

export default CustomReactCodeInput;
