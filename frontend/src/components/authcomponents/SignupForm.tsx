"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import Cookies from 'js-cookie';

import { Controller, useForm } from "react-hook-form"

// import citys from "../../../public/c.json"
// import States from "../../../public/p.json"

import { z } from "zod"
import { zodResolver } from '@hookform/resolvers/zod';

import UserSchema from '@/types/userSchema';


import DatePicker, { DateObject } from "react-multi-date-picker";
import "react-multi-date-picker/styles/colors/red.css"
import "react-multi-date-picker/styles/backgrounds/bg-dark.css"
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import gregorian from "react-date-object/calendars/gregorian";



import { FaCalendarAlt } from "react-icons/fa";




const userSchema = UserSchema




type signUpSchema = z.infer<typeof userSchema>;

interface IfilterCitys {
  name: string;
  province_id: number;
}
interface StateOption {
  value: string;
  label: string;
}

type FieldNames =
  | "username"
  | "password"
  | "confirmPassword"
  | "email"
  | "phoneNumber"
  | "landlineNumber"

  | "birthDate"
  | "businessName"
  | "ownerFirstName"
  | "ownerLastName"
  | "ownerPhoneNumber"


// | "city"
interface ErrorMapping {
  [key: string]: FieldNames;
}




const SignupForm = () => {


  // const [filteredCities, setFilteredCities] = useState<IfilterCitys[]>([]);
  const [isBusinessSigninInput, setIsBusinessSigninInput] = useState(false)

  const { push } = useRouter();

  // const handleStateChange = (selectedOption: SingleValue<StateOption>,
  //   actionMeta: ActionMeta<StateOption>) => {
  //   if (selectedOption) {
  //     const stateId = selectedOption.value;


  //     const filterCity = citys.filter(city => city.province_id.toString() === stateId);
  //     setFilteredCities(filterCity);
  //   }

  // };

  // const cityOptions = filteredCities.map(city => ({
  //   value: city.name,
  //   label: city.name
  // }));


  const handleDateChange = (date: DateObject | null) => {
    const gregorianDate = date ? date.convert(gregorian) : null;
    const formattedDate = gregorianDate ? gregorianDate.toDate().toISOString().split("T")[0] : '';
    setValue("birthDate", formattedDate);
  };


  const onSubmit = async (userInfo: signUpSchema) => {
    try {
      const userData = `
        userData: {
          username: "${userInfo.username}",
          firstName: "${userInfo.firstName}",
          lastName: "${userInfo.lastName}",
          password1: "${userInfo.password}",
          password2: "${userInfo.confirmPassword}",
          phoneNumber: "+${userInfo.phoneNumber}",
          landlineNumber: "+${userInfo.landlineNumber}",
          email: "${userInfo.email}",

          birthdate: "${userInfo.birthDate}"
        }
      `;

      // city: "${userInfo.city}",

      const businessData = userInfo.isBusinessSigninInput ? `
        businessData: {
          name: "${userInfo.businessName}",
          ownerFirstName: "${userInfo.ownerFirstName}",
          ownerLastName: "${userInfo.ownerLastName}",
          ownerPhoneNumber: "${userInfo.ownerPhoneNumber}",
        }
      ` : '';

      const query = `
        mutation CreateUser{
          createUser(
            ${userData}
            ${businessData}
          ) {
            success
            errors
            redirectUrl
          }
        }
      `;


      const response = await fetch('/api/users/graphql/', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      const data = await response.json();

      const { createUser } = data.data;
      if (data.errors) {
        console.error('GraphQL Error:', data.errors);
        return;
      }


      if (createUser.errors && createUser.success == false) {
        const errors = JSON.parse(createUser.errors);
        const errorMapping: ErrorMapping = {
          username: "username",
          password1: "password",
          password2: "confirmPassword",
          email: "email",
          phone_number: "phoneNumber",
          landline_number: "landlineNumber",
          // city: "city",
          birthdate: "birthDate",
          name: "businessName",
          owner_first_name: "ownerFirstName",
          owner_last_name: "ownerLastName",
          owner_phone_number: "ownerPhoneNumber",
        };

        Object.keys(errors).forEach((key) => {
          if (errorMapping[key]) {
            setError(errorMapping[key], {
              type: "server",
              message: errors[key]
            });
          }
        });

        return;
      }



      if (createUser.success) {
        Cookies.set('email', userInfo.email);
        push(createUser.redirectUrl)
      } else {
        alert('Failed to create user');

      }
    } catch (error) {
      console.error('Error submitting the form:', error);
      alert('An unexpected error occurred');
    }
  };


  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    setValue,
    control
  } = useForm<signUpSchema>({
    resolver: zodResolver(userSchema),
    mode: "all"
  })

  return (

    <form name='sign-up' noValidate onSubmit={handleSubmit(onSubmit)} className='signup_form flex flex-col items-center p-10 '>

      <div className='signup_form_container !mt-0'>
        <input
          {...register("username", {
            required: "نام کاربری الزامی است",
          })}
          className="signup_form_input"
          id='username'
          type='text'
          required
        />
        <label className="signup_form_label" htmlFor="username">نام کاربری :</label>
        <div className='line'></div>
        {errors.username && (
          <p className='text-sm text-red-700 absolute bottom-0 left-0 translate-y-5'>
            {`${errors.username.message}`}
          </p>
        )}
      </div>





      <div className='signup_form_container'>
        <input
          {...register("password", {
            required: "رمز عبور الزامی است",
          })}
          className="signup_form_input"
          id='password'
          dir='ltr'
          type='password'
          required
        />
        {errors.password && (
          <p className='text-sm text-red-700 absolute bottom-0 left-0 translate-y-5'>{`${errors.password.message}`}</p>
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
        {errors.confirmPassword && (
          <p className='text-sm text-red-700 absolute bottom-0 left-0 translate-y-5'>{`${errors.confirmPassword.message}`}</p>
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
        {errors.firstName && (
          <p className='text-sm text-red-700 absolute bottom-0 left-0 translate-y-5'>{`${errors.firstName.message}`}</p>
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
        {errors.lastName && (
          <p className='text-sm text-red-700 absolute bottom-0 left-0 translate-y-5'>{`${errors.lastName.message}`}</p>
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
        {errors.email && (
          <p className='text-sm text-red-700 absolute bottom-0 left-0 translate-y-5'>{`${errors.email.message}`}</p>
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
          maxLength={12}
          pattern="\d{1,13}"
          onInput={(e) => {
            const input = e.target as HTMLInputElement;
            input.value = input.value.replace(/\D/g, '').slice(0, 13);
          }}
        />
        {errors.phoneNumber && (
          <p className='text-sm text-red-700 absolute bottom-0 left-0 translate-y-5'>{`${errors.phoneNumber.message}`}</p>
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
          maxLength={12}
          pattern="\d{1,13}"
          onInput={(e) => {
            const input = e.target as HTMLInputElement;
            input.value = input.value.replace(/\D/g, '').slice(0, 13);
          }}
        />
        {errors.landlineNumber && (
          <p className='text-sm text-red-700 absolute bottom-0 left-0 translate-y-5'>{`${errors.landlineNumber.message}`}</p>
        )}
        <span className='line'></span>
        <label className="signup_form_label" htmlFor="landlineNumber">شماره تلفن ثابت :</label>
      </div>




      {/* <div className='signup_form_container location !justify-between'>
        <div className='location_div flex items-center gap-2 relative'>
          <p>استان :</p>

          <Select
            onChange={handleStateChange}
            className='select_signup bg-[#1f1f1f]'
            placeholder="انتخاب کنید..."
            styles={{
              input: (styles) => ({ ...styles, color: "white", fontSize: "12px", whiteSpace: "nowrap", direction: "rtl" }),
              placeholder: (styles) => ({ ...styles, color: "#757575", fontSize: "12px", whiteSpace: "nowrap" }),
              control: (styles) => ({ ...styles, background: "#212121", border: "none" }),
              option: (styles) => ({ ...styles, background: "#212121", border: "none", direction: "rtl", fontSize: "13px" }),
              singleValue: (base) => ({ ...base, color: 'white', fontSize: "13px", direction: "rtl" }),
              valueContainer: (base) => ({
                ...base,
                background: "#212121",
                color: 'white',
                width: '100%',
                minWidth: '90px'

              }),
              menuList: (base) => ({
                ...base,
                "::-webkit-scrollbar": {
                  width: "4px",
                  height: "0px",
                },
                "::-webkit-scrollbar-track": {
                  background: "#212121"
                },
                "::-webkit-scrollbar-thumb": {
                  background: "#888"
                },
                "::-webkit-scrollbar-thumb:hover": {
                  background: "#555"
                }

              }),
            }}
            options={
              States.map((state) => (
                {
                  value: state.id.toString(),
                  label: state.name
                }
              ))}
          />
        </div>
        <div className='location_div flex gap-2 items-center'>
          <p>شهر:</p>
          <Controller
            control={control}
            name='city'
            render={({ field: { onChange, value } }) => {
              return <Select
                value={cityOptions.find(c => c.value === value)}
                onChange={val => onChange(val ? val.value : null)}
                className='select_signup bg-[#1f1f1f]'
                placeholder="انتخاب کنید..."
                styles={{
                  input: (styles) => ({ ...styles, color: "white", fontSize: "12px", whiteSpace: "nowrap", direction: "rtl" }),
                  placeholder: (styles) => ({ ...styles, color: "#757575", fontSize: "12px", whiteSpace: "nowrap" }),
                  control: (styles) => ({ ...styles, background: "#212121", border: "none" }),
                  option: (styles) => ({ ...styles, background: "#212121", border: "none", direction: "rtl", fontSize: "13px" }),
                  singleValue: (base) => ({ ...base, color: 'white', fontSize: "13px", direction: "rtl" }),
                  valueContainer: (base) => ({
                    ...base,
                    background: "#212121",
                    color: 'white',
                    width: '100%',
                    minWidth: '90px'
                  }),
                  menuList: (base) => ({
                    ...base,
                    "::-webkit-scrollbar": {
                      width: "4px",
                      height: "0px",
                    },
                    "::-webkit-scrollbar-track": {
                      background: "#212121"
                    },
                    "::-webkit-scrollbar-thumb": {
                      background: "#888"
                    },
                    "::-webkit-scrollbar-thumb:hover": {
                      background: "#555"
                    }

                  }),
                }}
                options={cityOptions} />;
            }}
          />

          {errors.city && (
            <p className='text-sm text-red-700 absolute bottom-0 left-0 translate-y-5 whitespace-nowrap'>{`${errors.city.message}`}</p>
          )}
        </div>
      </div> */}


      <div className=' flex justify-center mt-[30px] gap-2 w-[100%] relative'>
        <label htmlFor="birthDate" className='flex items-center gap-2'>   تاریخ تولد :<FaCalendarAlt /></label>
        <Controller
          control={control}
          name='birthDate'
          render={() => (
            <DatePicker
              id='birthDate'
              calendar={persian}
              locale={persian_fa}
              calendarPosition="bottom-right"
              onChange={handleDateChange}
              maxDate={new DateObject({ calendar: persian }).set("day", 15)}
              className="red bg-dark"
              inputClass="custom-input"
            />)
          }
        />

        {errors.birthDate && (
          <p className='text-sm text-red-700 absolute bottom-0 left-0 translate-y-5 whitespace-nowrap'>{errors.birthDate.message}</p>
        )}
      </div>

      {isBusinessSigninInput && (
        <div className=' w-full mt-8 rounded-sm'>
          <div className='signup_form_container !mt-0'>
            <input {...register("businessName")} className="signup_form_input" id='business-name' type='text' required />
            <label className="signup_form_label" htmlFor="business-name">نام شرکت :</label>
            <div className='line'></div>
            {errors.businessName && (
              <p className='text-sm text-red-700 absolute bottom-0 left-0 translate-y-5'>
                {errors.businessName.message}
              </p>
            )}
          </div>
          <div className='signup_form_container'>
            <input {...register("ownerFirstName")} className="signup_form_input" id='owner-first-name' type='text' required />
            <label className="signup_form_label" htmlFor="owner-first-name">نام صاحبت شرکت :</label>
            <div className='line'></div>
            {errors.ownerFirstName && (
              <p className='text-sm text-red-700 absolute bottom-0 left-0 translate-y-5'>
                {errors.ownerFirstName.message}
              </p>
            )}
          </div>
          <div className='signup_form_container'>
            <input {...register("ownerLastName")} className="signup_form_input" id='owner-last-name' type='text' required />
            <label className="signup_form_label" htmlFor="owner-last-name">نام خانوادگی صاحبت شرکت :</label>
            <div className='line'></div>
            {errors.ownerLastName && (
              <p className='text-sm text-red-700 absolute bottom-0 left-0 translate-y-5'>
                {errors.ownerLastName.message}
              </p>
            )}
          </div>
          <div className='signup_form_container'>
            <input {...register("ownerPhoneNumber")} className="signup_form_input" id='ownerPhoneNumber' type='text' required />
            <label className="signup_form_label" htmlFor="ownerPhoneNumber">شماره تلفن صاحب شرکت :</label>
            <div className='line'></div>
            {errors.ownerPhoneNumber && (
              <p className='text-sm text-red-700 absolute bottom-0 left-0 translate-y-5'>
                {errors.ownerPhoneNumber.message}
              </p>
            )}
          </div>
        </div>
      )}
      <button
        disabled={isSubmitting}
        type='submit'
        className="w-1/8 py-2 mt-6 bg-red-600 text-[#212121] rounded hover:bg-red-700 focus:outline-none disabled:bg-red-300"
      >
        ثبت نام
      </button>
      <div className='flex gap-3 mt-5 w-full justify-end'>
        <label htmlFor="isBusinessSigninInput">ثبت نام شرکت</label>
        <input {...register("isBusinessSigninInput")} checked={isBusinessSigninInput} onChange={() => setIsBusinessSigninInput(!isBusinessSigninInput)} type="checkbox" name='isBusinessSigninInput' id='isBusinessSigninInput' />
      </div>
    </form>

  );
};

export default SignupForm;


