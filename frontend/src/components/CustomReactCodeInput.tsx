import React, { useState, forwardRef, useRef } from 'react';

type CustomCodeInputProps = {
  length: number;
  onChange: (value: string) => void;
};

const CustomReactCodeInput = forwardRef<HTMLDivElement, CustomCodeInputProps>((props, ref) => {
  const [code, setCode] = useState(Array(props.length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]); // Store refs for each input

  // Ensure refs are properly initialized
  const setInputRef = (el: HTMLInputElement | null, index: number) => {
    inputRefs.current[index] = el;
  };

  const handleChange = (value: string, index: number) => {
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    props.onChange(newCode.join('')); // Call onChange prop with joined code

    if (value.length === 1 && index < props.length - 1) {
      // Automatically move to the next input field
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (code[index] === '' && index > 0) {
        // Move focus to the previous input field if current is empty
        inputRefs.current[index - 1]?.focus();
      } else {
        // Clear the current input value
        const newCode = [...code];
        newCode[index] = '';
        setCode(newCode);
        props.onChange(newCode.join(''));
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, index: number) => {
    e.preventDefault(); // Prevent default paste behavior

    const pasteData = e.clipboardData.getData('text');
    const newCode = [...code];
    const data = pasteData.slice(0, props.length); // Only take up to `props.length` characters

    for (let i = 0; i < data.length; i++) {
      if (i < props.length) {
        newCode[i] = data[i];
      }
    }

    setCode(newCode);
    props.onChange(newCode.join('')); // Call onChange prop with joined code

    // Focus on the next input if there are more characters to paste
    if (data.length < props.length) {
      inputRefs.current[data.length]?.focus();
    }
  };

  return (
    <div dir='ltr' className="w-full flex items-center justify-center" ref={ref}>
      {code.map((digit, index) => (
        <input
          className='text-red-400 focus:outline-2 focus:outline-offset-2 focus:outline-white'
          dir='ltr'
          key={index}
          id={`code-input-${index}`}
          type="text"
          value={digit}
          maxLength={1}
          onChange={(e) => handleChange(e.target.value, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={(e) => handlePaste(e, index)} // Handle paste event
          tabIndex={index} // Set tabIndex for focus order (optional)
          ref={(el) => setInputRef(el, index)} // Use setInputRef to handle refs
          style={{
            width: '12%',
            aspectRatio: "1",
            textAlign: 'center',
            margin: '4px',
            borderRadius: '8px',
            fontSize: '24px',
            backgroundColor: 'var(--secondary-black)',
            border: '1px solid var(--dark-grey)',
          }}
        />
      ))}
    </div>
  );
});

CustomReactCodeInput.displayName = 'CustomReactCodeInput'; // Add display name here

export default CustomReactCodeInput;
