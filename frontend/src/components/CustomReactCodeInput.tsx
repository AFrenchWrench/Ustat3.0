import React from 'react';
import ReactCodeInput from 'react-code-input';

type CustomReactCodeInputProps = {
  onChange: (value: string) => void;
  [key: string]: any;
};

const CustomReactCodeInput: React.FC<CustomReactCodeInputProps> = ({ onChange, ...rest }) => {
  const handleChange = (value: string) => {
    onChange(value);
  };

  return <ReactCodeInput name={''} inputMode={'verbatim'} onChange={handleChange} {...rest} />;
};

export default CustomReactCodeInput;

