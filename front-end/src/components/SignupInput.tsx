
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
  onRegionChange?:(value: string) => void;
}

const SignupInput: React.FC<SignupInputProps> = ({
  dir,
  title,
  type,
  id,
  name,
  value,
  onChange,
  required,
  verror,
  onRegionChange
}) => {


  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    if (onRegionChange) {
      onRegionChange(value);
    }
  };

  return (
    <div className='signup_form_container'>
      <label className={value?"absolute top-1/2 right-[1%] translate-y-[-150%]":`signup_form_label`} htmlFor={id}>{title}:</label>
      <input
        dir={dir}
        className={type==="tel"?'signup_form_input !pl-[10%]':"signup_form_input"}
        type={type}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
      />
      <span className='line'></span>
      <span className='text-sm text-red-700 absolute bottom-0 translate-y-5'>{verror?`${verror}*`:""}</span>
      {type==="tel"?
        <select onChange={handleRegionChange} className='w-[10%] h-50px absolute left-0 top-[50%] translate-y-[-50%] pb-[.75%] bg-inherit text-color-white-700 ' name="region" id="region">
        <option className='text-black' value="+98">98+</option>
        <option className='text-black' value="+96">96+</option>
      </select>:""  
    }
      
    </div>
  );
};

export default SignupInput;


// `
//             mutation {
//               createUser(
//                 userData: {
//                   username: "${userInfo.username}",
//                   firstName: "${userInfo.firstName}",
//                   lastName: "${userInfo.lastName}",
//                   password: "${userInfo.password}",
//                   phoneNumber: "${userInfo.phoneNumber}",
//                   landlineNumber: "${userInfo.landlineNumber}",
//                   email: "${userInfo.email}",
//                   city: "${userInfo.city}",
//                   birthDate: "${birthDate}"
//                 }
//               ) {
//                 success
//                 errors
//               }
//             }
//           `


           // if (!response.ok) {
      //   alert("failed")
      // }
      
      // if (data.data.createUser.errors) {
      // const errors = JSON.parse(JSON.parse(data.data.createUser.errors))
      //   if (errors.username) {
      //     setError("username", {
      //       type: "server",
      //       message: errors.username,
      //     });
      //   }
      //   if (errors.password) {
      //     setError("password", {
      //       type: "server",
      //       message: errors.password,
      //     });
      //   }
      //   if (errors.email) {
      //     setError("email", {
      //       type: "server",
      //       message: errors.email,
      //     });
      //   }
      //   if (errors.phone_number) {
      //     setError("phoneNumber", {
      //       type: "server",
      //       message: errors.phone_number,
      //     });
      //   }
      //   if (errors.landlineNumber) {
      //     setError("landlineNumber", {
      //       type: "server",
      //       message: errors.landlineNumber,
      //     })}
      // }







