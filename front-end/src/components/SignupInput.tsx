import { error } from 'console';
import React from 'react';

interface SignupInputProps {
  dir?: string;
  title: string;
  type: string;
  id: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  verror?: string;
}

const SignupInput: React.FC<SignupInputProps> = ({
  dir,
  title,
  type,
  id,
  name,
  value,
  onChange,
  required = false,
  verror
}) => {
  return (
    <div className='m-4 w-1/3 flex flex-col relative'>
      <label className='block' htmlFor={id}>{title}:</label>
      <input
        dir={dir}
        className='bg-transparent text-white border-2 border-zinc-500 outline-0 p-1 border rounded
        focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500
      disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:shadow-none
      invalid:border-red-500 invalid:text-red-600
      focus:invalid:border-red-500 focus:invalid:ring-red-500
        
        '
        type={type}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
      />
      <span className='text-sm text-red-700'>{verror?`${verror}*`:""}</span>
    </div>
  );
};

export default SignupInput;
