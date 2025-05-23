"use client"

import React, { useEffect, useState } from 'react';
import UserEditSchema from '@/types/userEditSchema';
import styles from '@/app/users/style/profilePageStyles.module.css';

import { useRouter } from 'next/navigation';

import Cookies from 'js-cookie';

import * as jalaali from 'jalaali-js';


import IuserData from '@/types/IuserData';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Controller, useForm } from 'react-hook-form';

import DateObject from 'react-date-object';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import DatePicker from 'react-multi-date-picker';
import gregorian from 'react-date-object/calendars/gregorian';
import "react-multi-date-picker/styles/colors/red.css";
import "react-multi-date-picker/styles/backgrounds/bg-dark.css";
import { FaCalendarAlt } from 'react-icons/fa';

import { FaRegEye } from "react-icons/fa";
import { FaRegEyeSlash } from "react-icons/fa";
import Link from 'next/link';

const userSchema = UserEditSchema;

type TuserEditSchema = z.infer<typeof userSchema>;

type FieldNames =
  | "username"
  | "firstName"
  | "lastName"
  | "password"
  | "newPassword"
  | "confirmNewPassword"
  | "email"
  | "phoneNumber"
  | "landlineNumber"
  | "city"
  | "birthdate"
  | "business.name"
  | "business.ownerFirstName"
  | "business.ownerLastName"
  | "business.ownerPhoneNumber"

interface ErrorMapping {
  [key: string]: FieldNames;
}


interface EditProps {
  userData: IuserData | null;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
  setUpdated: React.Dispatch<React.SetStateAction<boolean>>;
}

const inputHandler = (e: React.FocusEvent<HTMLInputElement>) => {
  e.target.select();
};

const convertToJalaali = (gregorianDate: string | undefined) => {
  if (gregorianDate) {
    const [year, month, day] = gregorianDate.split('-');
    const jalaaliDate = jalaali.toJalaali(parseInt(year), parseInt(month), parseInt(day));
    return `${jalaaliDate.jy}/${jalaaliDate.jm}/${jalaaliDate.jd}`;
  }
};


const Edit: React.FC<EditProps> = ({ userData, setIsEditing, setUpdated }) => {

  const [dateValue, setDateValue] = useState(convertToJalaali(userData?.birthdate));
  const [showPassword, setShowPassword] = useState(false);
  const { push } = useRouter();


  const handleDateChange = (date: DateObject | null) => {
    const gregorianDate = date ? date.convert(gregorian) : null;
    const formattedDate = gregorianDate
      ? gregorianDate.toDate().toLocaleDateString('en-CA') // Use local date string in 'YYYY-MM-DD' format
      : '';
    setValue("birthdate", formattedDate);
    setDateValue(convertToJalaali(formattedDate));
  };


  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    setValue,
    control,
    reset // Add reset for default values
  } = useForm<TuserEditSchema>({
    resolver: zodResolver(userSchema),
    mode: "all",
    defaultValues: userData ? {
      username: userData.username,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phoneNumber: userData.phoneNumber,
      landlineNumber: userData.landlineNumber,
      email: userData.email,
      birthdate: userData.birthdate,
      // city: userData.city.name,
      isBusinessSigninInput: userData.business !== undefined,
      business: {
        name: userData.business?.name,
        ownerFirstName: userData.business?.ownerFirstName,
        ownerLastName: userData.business?.ownerLastName,
        ownerPhoneNumber: userData.business?.ownerPhoneNumber,
      }
    } : undefined,
  });

  if (!userData) {
    return null;
  }



  const onSubmit = async (userInfo: TuserEditSchema) => {
    const token = Cookies.get("Authorization");

    try {
      const generateUserData = (userInfo: TuserEditSchema, userData: any) => {
        const fields = [
          userInfo.username && userInfo.username !== userData.username ? `username: "${userInfo.username}"` : '',
          userInfo.firstName && userInfo.firstName !== userData.firstName ? `firstName: "${userInfo.firstName}"` : '',
          userInfo.lastName && userInfo.lastName !== userData.lastName ? `lastName: "${userInfo.lastName}"` : '',
          userInfo.phoneNumber && userInfo.phoneNumber !== userData.phoneNumber ? `phoneNumber: "${userInfo.phoneNumber}"` : '',
          userInfo.landlineNumber && userInfo.landlineNumber !== userData.landlineNumber ? `landlineNumber: "${userInfo.landlineNumber}"` : '',
          userInfo.email && userInfo.email !== userData.email ? `email: "${userInfo.email}"` : '',
          userInfo.password ? `oldPassword: "${userInfo.password}"` : '',
          userInfo.newPassword ? `password: "${userInfo.newPassword}"` : '',
          userInfo.confirmNewPassword ? `password2: "${userInfo.confirmNewPassword}"` : '',
          userInfo.birthdate ? `birthdate: "${userInfo.birthdate}"` : '',
        ];

        return fields.filter(field => field !== '').join(',\n');
      };

      const generateBusinessData = (userInfo: any, userData: any) => {
        const fields = [
          userInfo.business?.name && userInfo.business?.name !== userData.business?.name ? `name: "${userInfo.business?.name}"` : '',
          userInfo.business?.ownerFirstName && userInfo.business?.ownerFirstName !== userData.business?.ownerFirstName ? `ownerFirstName: "${userInfo.business?.ownerFirstName}"` : '',
          userInfo.business?.ownerLastName && userInfo.business?.ownerLastName !== userData.business?.ownerLastName ? `ownerLastName: "${userInfo.business?.ownerLastName}"` : '',
          userInfo.business?.ownerPhoneNumber && userInfo.business?.ownerPhoneNumber !== userData.business?.ownerPhoneNumber ? `ownerPhoneNumber: "${userInfo.business?.ownerPhoneNumber}"` : '',
        ];

        return fields.filter(field => field !== '').join(',\n');
      };

      const userNewData = generateUserData(userInfo, userData);
      const businessData = userInfo.isBusinessSigninInput ? generateBusinessData(userInfo, userData) : '';

      if (!userNewData && !businessData) {
        console.log("No fields to update.");
        return;
      }

      const createUserQuery = `
        mutation UpdateUser {
          updateUser(

            ${userNewData ? ` userData: {${userNewData}}` : ''}
            ${businessData ? `, businessData: {${businessData}}` : ''}
          ) {
            success
            errors
            redirectUrl
          }
        }
      `;

      const response = await fetch('/api/users/graphql/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? token : '',
        },
        body: JSON.stringify({
          query: createUserQuery,
        }),
      });

      console.log(createUserQuery);
      const result = await response.json();
      console.log(result);


      if (result.data.updateUser.success) {
        if (userInfo.email && userInfo.email !== userData.email && userInfo.username) {
          Cookies.set("username", userInfo.username)
          Cookies.remove("Authorization")
          push("/auth")
        }
        if (userInfo.password && userInfo.newPassword !== userInfo.confirmNewPassword || userInfo.username !== userData.username) {
          Cookies.remove("Authorization")
          push("/auth")
        }
        setIsEditing(false)
        setUpdated((prev) => !prev)
      } else {
        const errors = JSON.parse(result.data.updateUser.errors);

        const errorMapping: ErrorMapping = {
          username: "username",
          old_password: "password",
          password: "newPassword",
          password2: "confirmNewPassword",
          email: "email",
          phone_number: "phoneNumber",
          landline_number: "landlineNumber",
          city: "city",
          birthdate: "birthdate",
          name: "business.name",
          owner_first_name: "business.ownerFirstName",
          owner_last_name: "business.ownerLastName",
          owner_phone_number: "business.ownerPhoneNumber",
        };


        Object.keys(errors).forEach((key) => {
          if (errorMapping[key]) {
            setError(errorMapping[key], {
              type: "server",
              message: errors[key]
            });
          }
        });
      }

    } catch (error) {
      console.error("Error updating user:", error);
    }
  };





  return (
    <form autoComplete='off' onSubmit={handleSubmit(onSubmit)} className={styles.formDetails}>
      <div className={styles.twoHolder}>
        <span>
          <label htmlFor="username-edit">نام کاربری :</label>
          <input {...register("username")} dir='ltr' defaultValue={userData.username} type="text" id='username-edit' onFocus={(e) => inputHandler(e)} />
          {errors.username && (<p className={styles.errorMessage}>{errors.username.message}</p>)}
        </span>
        <span>
          <label htmlFor="firsName-edit">نام :</label>
          <input {...register("firstName")} defaultValue={userData.firstName} type="text" id='firsName-edit' onFocus={(e) => inputHandler(e)} />
          {errors.firstName && (<p className={styles.errorMessage}>{errors.firstName.message}</p>)}

        </span>
      </div>

      <div className={styles.twoHolder}>
        <span>
          <label htmlFor="lastName-edit">نام خانوادگی :</label>
          <input {...register("lastName")} defaultValue={userData.lastName} type="text" id='lastName-edit' onFocus={(e) => inputHandler(e)} />
          {errors.lastName && (<p className={styles.errorMessage}>{errors.lastName.message}</p>)}
        </span>
        <span>
          <label htmlFor="phoneNumber-edit">تلفن همراه :</label>
          <input dir='ltr' {...register("phoneNumber")} defaultValue={userData.phoneNumber} type="text" id='phoneNumber-edit' onFocus={(e) => inputHandler(e)} />
          {errors.phoneNumber && (<p className={styles.errorMessage}>{errors.phoneNumber.message}</p>)}

        </span>
      </div>

      <div className={styles.twoHolder}>
        <span>
          <label htmlFor="landlineNumber-edit">تلفن ثابت :</label>
          <input {...register("landlineNumber")} dir='ltr' defaultValue={userData.landlineNumber} type="text" id='landlineNumber-edit' onFocus={(e) => inputHandler(e)} />
          {errors.landlineNumber && (<p className={styles.errorMessage}>{errors.landlineNumber.message}</p>)}

        </span>
        <span>
          <label htmlFor="email-edit">ایمیل :</label>
          <input dir='ltr' {...register("email")} defaultValue={userData.email} type="text" id='email-edit' onFocus={(e) => inputHandler(e)} />
          {errors.email && (<p className={styles.errorMessage}>{errors.email.message}</p>)}
        </span>
      </div>

      <div className={styles.twoHolder}>
        <span className='!w-full relative'>
          <label htmlFor="password-edit">رمز عبور :</label>
          <input
            {...register("password")}
            dir='ltr'
            type={showPassword ? "text" : "password"}
            id='password-edit'
            autoComplete="new-password"
          />
          <button type='button' className='bg-transparent absolute right-[28%]' onClick={togglePasswordVisibility}>
            {showPassword ? <FaRegEyeSlash /> : <FaRegEye />}
          </button>
          {errors.password && (<p className={styles.errorMessage}>{errors.password.message}</p>)}
        </span>
      </div>

      <div className={styles.twoHolder}>
        <span className='!w-full'>
          <label htmlFor="newPassword-edit">رمز عبور جدید :</label>
          <input
            {...register("newPassword")}
            dir='ltr'
            type={showPassword ? "text" : "password"}
            id='newPassword-edit'
          />
          {errors.newPassword && (<p className={styles.errorMessage}>{errors.newPassword.message}</p>)}

        </span>
      </div>

      <div className={styles.twoHolder}>
        <span className='!w-full'>
          <label htmlFor="confirmNewPassword-edit">تکرار رمز عبور جدید :</label>
          <input
            {...register("confirmNewPassword")}
            dir='ltr'
            type={showPassword ? "text" : "password"}
            id='confirmNewPassword-edit'
          />
          {errors.confirmNewPassword && (<p className={styles.errorMessage}>{errors.confirmNewPassword.message}</p>)}
        </span>
      </div>

      <div className={styles.twoHolder}>
        <div className=' flex justify-center gap-2 w-[100%] relative'>
          <label htmlFor="birthDate" className='flex items-center gap-2'>   تاریخ تولد :<FaCalendarAlt /></label>
          <Controller
            control={control}
            name='birthdate'
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
                value={dateValue}
              />)
            }
          />

          {errors.birthdate && (<p className={styles.errorMessage}>{errors.birthdate.message}</p>)}

        </div>

      </div>



      {
        !userData.business ?
          <div className='flex gap-2 mr-[80%]'>
            <Link className='text-white hover:text-gray-300' href={"/auth/businessSignUp"}>ثبت شرکت</Link>
          </div>
          : ""
      }
      {
        userData.business ?
          <>
            <div className={styles.twoHolder}>
              <span>
                <label htmlFor="businessName-edit">نام شرکت :</label>
                <input {...register("business.name")} type="text" id='businessName-edit' onFocus={(e) => inputHandler(e)} />
                {errors.business?.name && (<p className={styles.errorMessage}>{errors.business.name.message}</p>)}

              </span>
              <span>
                <label htmlFor="ownerFirstName-edit">نام مالک شرکت:</label>
                <input  {...register("business.ownerFirstName")} type="text" id='ownerFirstName-edit' onFocus={(e) => inputHandler(e)} />
                {errors.business?.ownerFirstName && (<p className={styles.errorMessage}>{errors.business.ownerFirstName.message}</p>)}

              </span>
            </div>

            <div className={styles.twoHolder}>
              <span>
                <label htmlFor="ownerLastName-edit">نام خانوادگی مالک شرکت :</label>
                <input {...register("business.ownerLastName")} type="text" id='ownerLastName-edit' onFocus={(e) => inputHandler(e)} />
                {errors.business?.ownerLastName && (<p className={styles.errorMessage}>{errors.business.ownerLastName.message}</p>)}

              </span>
              <span>
                <label htmlFor="ownerPhoneNumber-edit">تلفن همراه مالک شرکت :</label>
                <input dir='ltr' {...register("business.ownerPhoneNumber")} type="text" id='ownerPhoneNumber-edit' onFocus={(e) => inputHandler(e)} />
                {errors.business?.ownerPhoneNumber && (<p className={styles.errorMessage}>{errors.business.ownerPhoneNumber.message}</p>)}

              </span>
            </div>
          </>
          : ""
      }
      <button disabled={isSubmitting} className={styles.saveBtn}>ذخیره</button>


    </form>
  );
}

export default Edit;
