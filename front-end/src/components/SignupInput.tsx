import React from 'react';

interface SignupInputProps {
  title: string;
  type: string;
  id: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}

const SignupInput: React.FC<SignupInputProps> = ({
  title,
  type,
  id,
  name,
  value,
  onChange,
  required = false,
}) => {
  return (
    <div className='m-4 w-1/3 flex flex-col'>
      <label className='' htmlFor={id}>{title}:</label>
      <input
        className='bg-slate-200 text-black'
        type={type}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
      />
    </div>
  );
};

export default SignupInput;
