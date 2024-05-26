"use client"

import { useState } from 'react';

import {Controller,type FieldValue, useForm} from "react-hook-form"

import citys from "../../public/c.json"
import States from "../../public/p.json"

import { z } from "zod"
import { zodResolver } from '@hookform/resolvers/zod';


import DatePicker, { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import gregorian from "react-date-object/calendars/gregorian";

import cities from '../../public/cityName';

import { FaCalendarAlt } from "react-icons/fa";


const is_persian_string=(str: string): boolean => {
  const persianPattern = /^[\u0600-\u06FF]+$/;

  return persianPattern.test(str);
}


const userSchema = z.object({
  username: z.string()
    .regex(/^[a-zA-Z][a-zA-Z0-9_]{4,20}$/, "نام کاربری معتبر نمیباشد")
    .min(1,"نام کاربری نمی‌تواند خالی باشد"),

  password: z.string()
    .min(1,"گذرواژه نمی‌تواند خالی باشد")
    .min(8, "گذرواژه باید حداقل 8 کاراکتر باشد.")
    .regex(/[A-Z]/, "گذرواژه باید حداقل شامل یک حرف بزرگ انگلیسی باشد.")
    .regex(/[0-9]/, "گذرواژه باید حداقل شامل یک عدد باشد.")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "گذرواژه باید حداقل شامل یک کاراکتر ویژه باشد."),

  confirmPassword: z.string()
    .min(1,"تکرار گذرواژه نمی‌تواند خالی باشد"),

  firstName: z.string({ required_error: "نام نمی‌تواند خالی باشد" })
    .refine(is_persian_string, "نام شما باید فارسی باشد"),
  lastName: z.string({ required_error: "نام خانوادگی نمی‌تواند خالی باشد" })
    .refine(is_persian_string, "نام خانوادگی شما باید فارسی باشد"),

  email: z.string({required_error:"ایمیل نمی‌تواند خالی باشد"})
    .email("ایمیل وارد شده معتبر نمی‌باشد"),

  phoneNumber: z.string()
    .regex(/^\+\d{9,15}$/, "شماره تلفن وارد شده معتبر نمی‌باشد فرمت درست : ...98+")
    .min(1,"شماره تلفن نمی‌تواند خالی باشد"),

  landlineNumber: z.string()
    .regex(/^\+\d{9,15}$/, "شماره ثابت وارد شده معتبر نمی‌باشد فرمت درست : ...98+")
    .min(1,"شماره ثابت نمی‌تواند خالی باشد"),
  city: z.string({required_error: "شهر نمی‌تواند خالی باشد"}),

})
.refine((data) => data.password === data.confirmPassword, {
  message: "رمزعبور یکسان نیست",
  path: ["confirmPassword"]
});

type signUpSchema = z.infer<typeof userSchema>;

interface IfilterCitys {
  name: string;
    province_id: number;
}




const SignupForm = () => {

  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [filteredCities, setFilteredCities] = useState<IfilterCitys[]>([]);

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const stateId = e.target.value;
    setSelectedState(stateId);

    const filterCity = citys.filter(city => city.province_id.toString() === stateId)
    setFilteredCities(filterCity)
    
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCity(e.target.value);
  };


  const [bdate, setBdate] = useState< DateObject | null>(null);
  const [birthDate, setBirthDate] = useState<String | null>(null);
  const handleDateChange = (date: DateObject | null) => {
    setBdate(date);
    const gregorianDate = date ? date.convert(gregorian) : null;
    setBirthDate(gregorianDate ? gregorianDate.toDate().toISOString().split("T")[0]: null)
  };


  const onSubmit =async (userInfo:signUpSchema)=>{
    try {
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
                username: "${userInfo.username}",
                firstName: "${userInfo.firstName}",
                lastName: "${userInfo.lastName}",
                password: "${userInfo.password}",
                phoneNumber: "${userInfo.phoneNumber}",
                landlineNumber: "${userInfo.landlineNumber}",
                email: "${userInfo.email}",
                city: "${userInfo.city}",
                birthDate: "${birthDate}"
              }
            ) {
              success
              errors
            }
          }
        `,
        }),
      });
      console.log(userInfo);
      console.log(birthDate);
      
      const data = await response.json();
      if (!response.ok) {
        alert("failed")
      }
      
      if (data.data.createUser.errors) {
      const errors = JSON.parse(JSON.parse(data.data.createUser.errors))
      console.log(errors);
      
        if (errors.username) {
          setError("username", {
            type: "server",
            message: errors.username,
          });
        }
        if (errors.password) {
          setError("password", {
            type: "server",
            message: errors.password,
          });
        }
        if (errors.email) {
          setError("email", {
            type: "server",
            message: errors.email,
          });
        }
        if (errors.phone_number) {
          setError("phoneNumber", {
            type: "server",
            message: errors.phone_number,
          });
        }
        if (errors.landlineNumber) {
          setError("landlineNumber", {
            type: "server",
            message: errors.landlineNumber,
          })}
      }
      console.log(data);
    } catch (error) {
      console.error("Error submitting the form:", error);
    }

    //  reset()
  }

    const {
      register,
      handleSubmit,
      formState:{errors,isSubmitting},
      setError,
      reset,
    } = useForm<signUpSchema>({
      resolver:zodResolver(userSchema)
    })

  return (
    <form noValidate  onSubmit={handleSubmit(onSubmit)} className='signup_form flex flex-col items-start w-[80%]   m-auto p-10 '>

<div className='signup_form_container'>
  <input
    {...register("username", {
      required: "نام کاربری الزامی است",
    })}
    className="signup_form_input"
    id='user-name'
    type='text'
    required
  />
    <label className="signup_form_label" htmlFor="user-name">نام کاربری :</label>
  <div className='line'></div>
  {errors.username && (
    <p className='text-sm text-red-700 absolute bottom-0 translate-y-5'>
      {`${errors.username.message}`}
    </p>
  )}
</div>





      <div className='signup_form_container'>
      <input
        {...register("password",{
          required:"رمز عبور الزامی است",
        })}
        className="signup_form_input"
        id='password'
        dir='ltr'
        type='password'
        required
      />
      {errors.password &&( 
        <p className='text-sm text-red-700 absolute bottom-0 translate-y-5'>{`${errors.password.message}`}</p>
      )}
      <span className='line'></span>
      <label className="signup_form_label" htmlFor="password">رمز عبور :</label>
    </div>

    <div className='signup_form_container'>
      <input
        {...register("confirmPassword")}
        className="signup_form_input"
        id='confirmPassword'
        dir='ltr'
        type='password'
        required
      />
      {errors.confirmPassword &&( 
        <p className='text-sm text-red-700 absolute bottom-0 translate-y-5'>{`${errors.confirmPassword.message}`}</p>
      )}
      <span className='line'></span>
      <label className="signup_form_label" htmlFor="confirmPassword">تکرار رمز عبور :</label>
    </div>

    <div className='signup_form_container'>
      <input
        {...register("firstName")}
        className="signup_form_input"
        id='firstName'
        type='text'
        required
      />
      {errors.firstName &&( 
        <p className='text-sm text-red-700 absolute bottom-0 translate-y-5'>{`${errors.firstName.message}`}</p>
      )}
      <span className='line'></span>
      <label className="signup_form_label" htmlFor="firstName">نام :</label>
    </div>

    <div className='signup_form_container'>
      <input
        {...register("lastName")}
        className="signup_form_input"
        id='lastName'
        type='text'
        required
      />
      {errors.lastName &&( 
        <p className='text-sm text-red-700 absolute bottom-0 translate-y-5'>{`${errors.lastName.message}`}</p>
      )}
      <span className='line'></span>
      <label className="signup_form_label" htmlFor="lastName">نام خانوادگی :</label>
    </div>
      





    <div className='signup_form_container'>
      <input
        {...register("email")}
        className="signup_form_input"
        id='email'
        dir='ltr'
        type='email'
        required
      />
      {errors.email &&( 
        <p className='text-sm text-red-700 absolute bottom-0 translate-y-5'>{`${errors.email.message}`}</p>
      )}
      <span className='line'></span>
      <label className="signup_form_label" htmlFor="email">ایمیل :</label>
    </div>

    <div className='signup_form_container'>
      <input
        {...register("phoneNumber")}
        className="signup_form_input"
        id='phoneNumber'
        dir='ltr'
        type='tel'
        required
      />
      {errors.phoneNumber &&( 
        <p className='text-sm text-red-700 absolute bottom-0 translate-y-5'>{`${errors.phoneNumber.message}`}</p>
      )}
      <span className='line'></span>
      <label className="signup_form_label" htmlFor="phoneNumber">شماره تلفن :</label>
    </div>

    <div className='signup_form_container'>
      <input
        {...register("landlineNumber")}
        className="signup_form_input"
        id='landlineNumber'
        dir='ltr'
        type='tel'
        required
      />
      {errors.landlineNumber &&( 
        <p className='text-sm text-red-700 absolute bottom-0 translate-y-5'>{`${errors.landlineNumber.message}`}</p>
      )}
      <span className='line'></span>
      <label className="signup_form_label" htmlFor="landlineNumber">شماره تلفن ثابت :</label>
    </div>












    <div className='signup_form_container !flex-row !justify-between'>
      <div>
        <label htmlFor="States">استان:</label>
        <select
          className='text-black'
          id="States"
          required
          value={selectedState}
          onChange={handleStateChange}
        >
          <option value="" disabled>انتخاب کنید</option>
          {States.map((state, index) => (
            <option
              className='text-black'
              key={index}
              value={state.id}
            >
              {state.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="city">شهر:</label>
        <select
          className='text-black'
          id="city"
          required
          {...register("city")}
        >
          <option value="" disabled>انتخاب کنید</option>
          {
          filteredCities.map((city, index) => (
            <option
              className='text-black'
              key={index}
              value={city.name}
            >
              {city.name}
            </option>
          ))}
        </select>
        {errors.city &&( 
        <p className='text-sm text-red-700 absolute bottom-0 translate-y-5'>{`${errors.city.message}`}</p>
      )}
      </div>
    </div>








      <div className='flex justify-start mt-4 gap-2'>
  <label htmlFor="birthDate" className='flex items-center gap-2'>   تاریخ تولد :<FaCalendarAlt /></label>

      <DatePicker
        id='birthDate'
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
        disabled={isSubmitting}
        type='submit'
        className="w-1/8 py-2 mt-4 bg-red-600 text-[#212121] rounded hover:bg-red-700 focus:outline-none disabled:bg-red-300"
      >
        ثبت نام
      </button>
    </form>
  );
};

export default SignupForm;


