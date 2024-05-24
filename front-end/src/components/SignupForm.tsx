"use client"

import { useState } from 'react';
import SignupInput from './SignupInput';

import DatePicker, { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import gregorian from "react-date-object/calendars/gregorian";

import cities from '../../public/cityName';




const SignupForm = () => {

  const validateUsername = (username:string) => {
    const pattern = /^[a-zA-Z][a-zA-Z0-9_]{4,20}$/;
    if (username.length>1 &&  !pattern.test(username)) {
      return "نام کاربری معتبر نمیباشد"
    }

    return "";
  };
  
  const validatePassword = (password:string) => {
    if (password.length > 1 && password.length < 8) {
      return "گذرواژه باید حداقل 8 کاراکتر باشد.";
    }
    if (password.length > 1 && !/[A-Z]/.test(password) ) {
      return "گذرواژه باید حداقل شامل یک حرف بزرگ انگلیسی باشد.";
    }
    if (password.length > 1 && !/[0-9]/.test(password)) {
      return "گذرواژه باید حداقل شامل یک عدد باشد.";
    }
    if (password.length > 1 && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return "گذرواژه باید حداقل شامل یک کاراکتر ویژه باشد.";
    }
    return "";
  };
  
  const isPersianString = (str:string) => {
    const persianPattern = /^[\u0600-\u06FF\s]+$/;
    return persianPattern.test(str);
  };
  
  const validateFirstName = (firstName:string) => {
    if (firstName.length > 1 && !isPersianString(firstName)) {
      return "نام شما باید فارسی باشد";
    }
    return "";
  };
  
  const validateLastName = (lastName:string) => {
    if (lastName.length > 1 && !isPersianString(lastName)) {
      return "نام خانوادگی شما باید فارسی باشد";
    }
    return "";
  };
  


  const [formData, setFormData] = useState({
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    landline_number: '',
    email: '',
    city: '',
    birthDate: null as String | null,
  });


  const [bdate, setBdate] = useState<DateObject | null>(null);
  const [cPass, setcPass] = useState("")

  const [userNameError, setUserNameError] = useState("")
  const [passError, setPassError] = useState("")
  const [firstNameError, setFirstNameError] = useState("")
  const [lastNameError, setlastNameError] = useState("")

  const handleDateChange = (date: DateObject | null) => {
    setBdate(date);
    const gregorianDate = date ? date.convert(gregorian) : null;
    setFormData({
      ...formData,
      birthDate: gregorianDate ? gregorianDate.toDate().toISOString().split("T")[0]: null
    });
  };


  const handleChange = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    setUserNameError(validateUsername(formData.username))
    setPassError(validatePassword(formData.password))
    setFirstNameError(validateFirstName(formData.first_name))
    setlastNameError(validateLastName(formData.last_name))
  };

  const handleSubmit = async (e : React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const response = await fetch('http://127.0.0.1:8000/users/graphql/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    query: `
    mutation {
        createUser(
          userData: {
            username: "${formData.username}",
            firstName: "${formData.first_name}",
            lastName: "${formData.last_name}",
            password: "${formData.password}",
            phoneNumber: "${formData.phone_number}",
            landlineNumber: "${formData.landline_number}",
            email: "${formData.email}",
            city: "${formData.city}",
            birthDate: "${formData.birthDate}"
          }
        ) {
          success
          errors
        }
      }
    `,
  }),
});
    const data = await response.json();
    console.log(data);
    console.log(formData)
  };


  return (
    <form onSubmit={handleSubmit} className='signup_form flex flex-col items-center w-4/5 m-auto p-10 '>
      <SignupInput
        title="نام کاربری "
        type="text"
        id="username"
        name="username"
        value={formData.username}
        onChange={handleChange}
        required={true}
        verror={userNameError}
      />
      <SignupInput
        dir="ltr"
        title="رمز عبور "
        type="password"
        id="password"
        name="password"
        value={formData.password}
        onChange={handleChange}
        required={true}
        verror={passError}
      />

     <SignupInput
        dir="ltr"
        title="تکرار رمز عبور "
        type="password"
        id="repeat-password"
        name="repeat-password"
        value={cPass}
        onChange={(e)=>setcPass(e.target.value)}
        required={true}
      />
      

      <SignupInput
        title="نام "
        type="text"
        id="first-name"
        name="first_name"
        value={formData.first_name}
        onChange={handleChange}
        required={true}
        verror={firstNameError}
      />

      <SignupInput
        title="نام خانوادگی "
        type="text"
        id="last-name"
        name="last_name"
        value={formData.last_name}
        onChange={handleChange}
        required={true}
        verror={lastNameError}
      />

      <SignupInput
        dir="ltr"
        title="شماره تلفن همراه "
        type="tel"
        id="phone-number"
        name="phone_number"
        value={formData.phone_number}
        onChange={handleChange}
        required={true}
      />

      <SignupInput
        dir="ltr"
        title="تلفن ثابت "
        type="tel"
        id="landline-number"
        name="landline_number"
        value={formData.landline_number}
        onChange={handleChange}
        required={true}
      />

      <SignupInput
        dir="ltr"
        title="ایمیل"
        type="email"
        id="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        required={true}
      />

     <div className='m-4 w-1/3 flex flex-col'>
        <label htmlFor="city">
           شهر
        </label>
        <select className='text-black' name="city" id="city" onChange={handleChange} value={formData.city} required>
        <option value={""} disabled>انتخاب کنید</option>
            {
                cities.map((value, index)=>{
                    return(
                        <option className='text-black' key={index} value={value.value}>{value.title}</option>
                    )
                })
            }
        </select>
      </div>

      <div className='m-4 w-1/3 flex flex-col'>
        <label htmlFor="birthDate">تاریخ تولد :</label>
        <DatePicker
          calendar={persian}
          locale={persian_fa}
          calendarPosition="bottom-right"
          value={bdate}
          onChange={handleDateChange}
          maxDate={new DateObject({ calendar: persian }).set("day", 15)}
          required
        />
      </div>

      <button 
        type='submit'
        className="w-1/8 py-2 mt-4 bg-blue-500 text-white rounded hover:bg-blue-700 focus:outline-none focus:bg-blue-700"
      >
        ثبت نام
      </button>
    </form>
  );
};

export default SignupForm;
function moment(arg0: Date) {
    throw new Error('Function not implemented.');
}

