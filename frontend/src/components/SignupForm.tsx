"use client"

import { useState } from 'react';

import {Controller, useForm} from "react-hook-form"

import citys from "../../public/c.json"
import States from "../../public/p.json"

import { z } from "zod"
import { zodResolver } from '@hookform/resolvers/zod';


import DatePicker, { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import gregorian from "react-date-object/calendars/gregorian";
import Select, { ActionMeta, SingleValue } from "react-select"


import { FaCalendarAlt } from "react-icons/fa";



const is_persian_string=(str: string): boolean => {
  const persianPattern = /^[\u0600-\u06FF]+$/;

  return persianPattern.test(str);
}


const userSchema = z.object({
  username: z.string()
    .min(1,"نام کاربری نمی‌تواند خالی باشد")
    .regex(/^[a-zA-Z][a-zA-Z0-9_]{3,20}$/, "نام کاربری معتبر نمیباشد"),

  password: z.string()
    .min(1,"گذرواژه نمی‌تواند خالی باشد")
    .min(8, "گذرواژه باید حداقل 8 کاراکتر باشد.")
    .regex(/[A-Z]/, "گذرواژه باید حداقل شامل یک حرف بزرگ انگلیسی باشد.")
    .regex(/[0-9]/, "گذرواژه باید حداقل شامل یک عدد باشد.")
    .regex(/[!@#$%^&*(),.?":{}|<>_]/, "گذرواژه باید حداقل شامل یک کاراکتر ویژه باشد."),

  confirmPassword: z.string()
    .min(1,"تکرار گذرواژه نمی‌تواند خالی باشد"),

  firstName: z.string({ required_error: "نام نمی‌تواند خالی باشد" })
    .refine(is_persian_string, "نام شما باید فارسی باشد"),
  lastName: z.string({ required_error: "نام خانوادگی نمی‌تواند خالی باشد" })
    .refine(is_persian_string, "نام خانوادگی شما باید فارسی باشد"),

  email: z.string({required_error:"ایمیل نمی‌تواند خالی باشد"})
    .email("ایمیل وارد شده معتبر نمی‌باشد"),

  phoneNumber: z.string()
    .regex(/^\d{9,15}$/, "شماره تلفن وارد شده معتبر نمی‌باشد فرمت درست : ...98+")
    .min(1,"شماره تلفن نمی‌تواند خالی باشد")
    .min(12,"شماره تلفن باید 12 رقم باشد")
    ,

  landlineNumber: z.string()
    .regex(/^\d{9,15}$/, "شماره ثابت وارد شده معتبر نمی‌باشد فرمت درست : ...98+")
    .min(1,"شماره ثابت نمی‌تواند خالی باشد")
    .min(12,"شماره تلفن ثابت باید 12 رقم باشد")
    ,


  city: z.string({required_error: "شهر نمی‌تواند خالی باشد"}),
  birthDate: z.string({required_error:"تاریخ تولد الزامی است"}),

  isBusinessSigninInput: z.string(),
   
  businessName: z.string({ required_error: "نام شرکت الزامی است" }).optional(),
  ownerFirstName: z.string({ required_error: "نام صاحبت شرکت الزامی است" }).optional(),
  ownerLastName: z.string({ required_error: "نام خانوادگی صاحبت شرکت الزامی است" }).optional(),
  ownerPhoneNumber: z.string({ required_error: "شماره تلفن صاحب شرکت الزامی است" }).optional(),
  address: z.string({ required_error: "آدرس الزامی است" }).optional()

})
.refine((data) => data.password === data.confirmPassword, {
  message: "رمزعبور یکسان نیست",
  path: ["confirmPassword"],
})
.refine((data) => {
  if (data.isBusinessSigninInput) {
    return (
      data.businessName &&
      data.ownerFirstName &&
      data.ownerLastName &&
      data.ownerPhoneNumber &&
      data.address
    );
  }
  return true;
}, {
  message: "تمامی فیلدهای شرکت الزامی است",
  path: ["businessName", "ownerFirstName", "ownerLastName", "ownerPhoneNumber", "address"],
});







type signUpSchema = z.infer<typeof userSchema>;

interface IfilterCitys {
  name: string;
    province_id: number;
}
interface StateOption {
  value: string;
  label: string;
}




const SignupForm = () => {


  const [filteredCities, setFilteredCities] = useState<IfilterCitys[]>([]);
  const [isBusinessSigninInput,setIsBusinessSigninInput] = useState(false)

  const handleStateChange = (selectedOption: SingleValue<StateOption>,
    actionMeta: ActionMeta<StateOption>) => {
    if (selectedOption) {
      const stateId = selectedOption.value;

  
      const filterCity = citys.filter(city => city.province_id.toString() === stateId);
      setFilteredCities(filterCity);
    }
    
  };

  const cityOptions = filteredCities.map(city => ({
    value: city.name,
    label: city.name
  }));


  const handleDateChange = (date: DateObject | null) => {
    const gregorianDate = date ? date.convert(gregorian) : null;
    const formattedDate = gregorianDate ? gregorianDate.toDate().toISOString().split("T")[0] : '';
    setValue("birthDate", formattedDate);
  };


  const onSubmit = async (userInfo: signUpSchema) => {

    console.log(userInfo.isBusinessSigninInput);
    
    try {
      
      const userData = `
      userData: {
        username: "${userInfo.username}",
        firstName: "${userInfo.firstName}",
        lastName: "${userInfo.lastName}",
        password: "${userInfo.password}",
        phoneNumber: "+${userInfo.phoneNumber}",
        landlineNumber: "+${userInfo.landlineNumber}",
        email: "${userInfo.email}",
        city: "${userInfo.city}",
        birthDate: "${userInfo.birthDate}"
      }
    `;

    const businessData = userInfo.isBusinessSigninInput ? `
      businessData: {
        name: "${userInfo.businessName}",
        ownerFirstName: "${userInfo.ownerFirstName}",
        ownerLastName: "${userInfo.ownerLastName}",
        ownerPhoneNumber: "${userInfo.ownerPhoneNumber}",
        address: "${userInfo.address}"
      }
    ` : '';

    const query = `
      mutation {
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
      
    const response = await fetch('http://127.0.0.1:8000/users/graphql/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

      const data = await response.json();
      if (!response.ok) {
        return;
      }
  
      if (data.errors) {
        console.error("GraphQL Error:", data.errors);
        return;
      }
  
      if (data.data.createUser.errors) {
        const errors = JSON.parse(data.data.createUser.errors)        
  
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
        if (errors.landline_number) {
          setError("landlineNumber", {
            type: "server",
            message: errors.landline_number,
          });
        }
        if (errors.city) {
          setError("landlineNumber", {
            type: "server",
            message: errors.city,
          });
        }
        if (errors.birthdate) {
          setError("birthDate",{
            type:"server",
            message: errors.birthdate
          })
        }
        if (errors.name) {
          setError("birthDate",{
            type:"server",
            message: errors.name
          })
        }
        if (errors.owner_first_name) {
          setError("birthDate",{
            type:"server",
            message: errors.owner_first_name
          })
        }
        if (errors.owner_last_name) {
          setError("birthDate",{
            type:"server",
            message: errors.owner_last_name
          })
        }
        if (errors.owner_phone_number) {
          setError("birthDate",{
            type:"server",
            message: errors.owner_phone_number
          })
        }
        if (errors.address) {
          setError("birthDate",{
            type:"server",
            message: errors.address
          })
        }
        return;
      }
  
      if (data.data.createUser.success) {
        alert("User created successfully!");
        reset();
      } else {
        alert("Failed to create user");
      }
    } catch (error) {
      console.error("Error submitting the form:", error);
      alert("An unexpected error occurred");
    }
  };
  

    const {
      register,
      handleSubmit,
      formState:{errors,isSubmitting},
      setError,
      reset,
      setValue,
      getValues,
      control
    } = useForm<signUpSchema>({
      resolver:zodResolver(userSchema),
      mode:"all"
    })

  return (

    <form noValidate  onSubmit={handleSubmit(onSubmit)} className='signup_form flex flex-col items-center p-10 '>

<div className='signup_form_container !mt-0'>
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
    <p className='text-sm text-red-700 absolute bottom-0 left-0 translate-y-5'>
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
      {errors.confirmPassword &&( 
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
      {errors.firstName &&( 
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
      {errors.lastName &&( 
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
      {errors.email &&( 
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
      {errors.phoneNumber &&( 
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
      {errors.landlineNumber &&( 
        <p className='text-sm text-red-700 absolute bottom-0 left-0 translate-y-5'>{`${errors.landlineNumber.message}`}</p>
      )}
      <span className='line'></span>
      <label className="signup_form_label" htmlFor="landlineNumber">شماره تلفن ثابت :</label>
    </div>




    <div className='signup_form_container !flex-row !justify-between'>
      <div className='flex items-center gap-2 relative'>
        <label htmlFor="States">استان :</label>

        <Select
        onChange={handleStateChange}
        className='select_signup bg-[#1f1f1f]'
        placeholder="انتخاب کنید"
        styles={{
          input:(styles)=>({...styles,color:"white",fontSize:"12px", whiteSpace:"nowrap",direction:"rtl"}),
          placeholder:(styles)=>({...styles,color:"#757575",fontSize:"12px", whiteSpace:"nowrap"}),
          control:(styles) => ({...styles , background:"#212121" , border:"none"}),
          option:(styles) => ({...styles , background:"#212121" , border:"none", direction:"rtl",fontSize:"13px"}),
          singleValue: (base) => ({ ...base, color: 'white',fontSize:"13px",direction:"rtl" }),
          valueContainer: (base) => ({
            ...base,
            background:"#212121",
            color: 'white',
            width: '100%',
            minWidth: '90px'

          }),
        }}
        options= {
          States.map((state) => (
        {
          value:state.id.toString(),
          label:state.name
        }
        ))}
        />
      </div>
      <div className='flex gap-2 items-center'>
        <label htmlFor="city">شهر:</label>
        <Controller
        control={control}
        name='city'
        render={({field:{ onChange, value}})=>{
          return <Select
            value={cityOptions.find(c => c.value === value)}
            onChange={val => onChange(val ? val.value : null)}
            className='select_signup bg-[#1f1f1f]'
            placeholder="...انتخاب کنید"
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
            }}
            options={cityOptions} />;
        }}
        />
        
        {errors.city &&( 
        <p className='text-sm text-red-700 absolute bottom-0 left-0 translate-y-5 whitespace-nowrap'>{`${errors.city.message}`}</p>
      )}
      </div>
    </div>


  <div className=' flex justify-center mt-[30px] gap-2 w-[100%] relative'>
  <label htmlFor="birthDate" className='flex items-center gap-2'>   تاریخ تولد :<FaCalendarAlt /></label>
      <Controller
      control={control}
      name='birthDate'
      render={()=>(
        <DatePicker
        id='birthDate'
        calendar={persian}
        locale={persian_fa}
        calendarPosition="bottom-right"
        onChange={handleDateChange}
        maxDate={new DateObject({ calendar: persian }).set("day", 15)}
      />)
      }
      />
     
      {errors.birthDate &&(
        <p className='text-sm text-red-700 absolute bottom-0 left-0 translate-y-5 whitespace-nowrap'>{errors.birthDate.message}</p>
      ) }
</div>

{
  isBusinessSigninInput?
  <div className='bg-blue-700 p-5 w-full mt-5 rounded-sm' >

<div className='signup_form_container !mt-0'>
    <input
    {...register("businessName")}
    className="signup_form_input"
    id='business-name'
    type='text'
    required
    />
    <label className="signup_form_label" htmlFor="business-name">نام شرکت :</label>
   <div className='line'></div>
    {errors.businessName && (
    <p className='text-sm text-red-700 absolute bottom-0 left-0 translate-y-5'>
    {`${errors.businessName.message}`}
    </p>
  )}
</div>
<div className='signup_form_container'>
    <input
    {...register("ownerFirstName")}
    className="signup_form_input"
    id='owner-first-name'
    type='text'
    required
    />
    <label className="signup_form_label" htmlFor="owner-first-name">نام صاحبت شرکت :</label>
   <div className='line'></div>
    {errors.ownerFirstName && (
    <p className='text-sm text-red-700 absolute bottom-0 left-0 translate-y-5'>
    {`${errors.ownerFirstName.message}`}
    </p>
  )}
</div>
<div className='signup_form_container'>
    <input
    {...register("ownerLastName")}
    className="signup_form_input"
    id='owner-last-name'
    type='text'
    required
    />
    <label className="signup_form_label" htmlFor="owner-last-name">نام خانوادگی صاحبت شرکت :</label>
   <div className='line'></div>
    {errors.ownerLastName && (
    <p className='text-sm text-red-700 absolute bottom-0 left-0 translate-y-5'>
    {`${errors.ownerLastName.message}`}
    </p>
  )}
</div>
<div className='signup_form_container'>
    <input
    {...register("ownerPhoneNumber")}
    className="signup_form_input"
    id='ownerPhoneNumber'
    type='text'
    required
    />
    <label className="signup_form_label" htmlFor="ownerPhoneNumber">شماره تلفن صاحب شرکت :</label>
   <div className='line'></div>
    {errors.ownerPhoneNumber && (
    <p className='text-sm text-red-700 absolute bottom-0 left-0 translate-y-5'>
    {`${errors.ownerPhoneNumber.message}`}
    </p>
  )}
</div>

<div className='signup_form_container'>
    <textarea
      {...register("address")}
      className="signup_form_input !pt-[20px] resize-none"
      id='address'
      required
    />
    <label className="signup_form_label" htmlFor="address">آدرس :</label>
    <div className='line'></div>
    {errors.address && (
      <p className='text-sm text-red-700 absolute bottom-0 left-0 translate-y-5'>
        {`${errors.address.message}`}
      </p>
    )}
  </div>
  </div>
  :""
}
      <button 
        onClick={()=>{console.log(getValues("isBusinessSigninInput"));
        }}
        disabled={isSubmitting}
        type='submit'
        className="w-1/8 py-2 mt-4 bg-red-600 text-[#212121] rounded hover:bg-red-700 focus:outline-none disabled:bg-red-300"
      >
        ثبت نام
      </button>
      <div className='flex gap-3 mt-5 w-full justify-end'>
      <label  htmlFor="isBusinessSigninInput">ثبت نام شرکت</label>
      <input {...register("isBusinessSigninInput")} checked={isBusinessSigninInput} onChange={()=>setIsBusinessSigninInput(!isBusinessSigninInput)} type="checkbox" name='isBusinessSigninInput' id='isBusinessSigninInput'/>
      </div>
    </form>

  );
};

export default SignupForm;


