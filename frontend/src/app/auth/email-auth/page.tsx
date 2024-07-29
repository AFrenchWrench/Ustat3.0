"use client"

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

import Cookies from 'js-cookie';

import { z } from "zod";
import { zodResolver } from '@hookform/resolvers/zod';
import CountdownTimer from '@/components/countDown';

const codeSchema = z.object({
  verificationCode: z.string().min(1, "لطفا کد را وارد کنید")
});
type TcodeSchema = z.infer<typeof codeSchema>;

const CustomReactCodeInput = dynamic(() => import('@/components/CustomReactCodeInput'), { ssr: false });

const Page = () => {
  const [resendvar, setResendvar] = useState(false); // ابتدا false
  const [isTimerRunning, setIsTimerRunning] = useState(true); // ابتدا true

  const { handleSubmit, control, setError, formState: { errors, isSubmitting } } = useForm<TcodeSchema>({
    resolver: zodResolver(codeSchema)
  });

  const { push } = useRouter();

  useEffect(() => {
    const countdown = setInterval(() => {
      setIsTimerRunning(prevIsTimerRunning => {
        if (prevIsTimerRunning) {
          return true; // تایمر هنوز در حال شمارش است
        } else {
          clearInterval(countdown); // تایمر به پایان رسید
          setResendvar(true); // فعال کردن دوباره دکمه
          return false;
        }
      });
    }, 1000); // هر 1000 میلی‌ثانیه (یک ثانیه) اجرا شود

    return () => clearInterval(countdown); // پاک کردن تایمر در cleanup
  }, [isTimerRunning]); // اجرای این useEffect یکبار تنها هنگام بارگذاری صفحه

  const handleResend = async () => {
    const emailCookie = Cookies.get("email")
    const query = `
            mutation ResendEmail {
                resendEmail(emailType:"verification") {
                success
                error
    }
}
    `;
    try {
      const response = await fetch('/api/users/graphql/', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'email': emailCookie ? emailCookie : '',
        },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();


    } catch (error) {
      console.log(error);

    }
    setIsTimerRunning(true); // شروع مجدد تایمر
    setResendvar(false); // غیر فعال کردن دکمه ارسال دوباره کد
  };

  const onSubmit = async (formData: TcodeSchema) => {
    const emailCookie = Cookies.get("email")
    const usernameCookie = Cookies.get("username")
    const { verificationCode } = formData;
    const query = `
      mutation VerifyEmail {
        verifyEmail(code: "${verificationCode}") {
          success
          error
          redirectUrl
          token
        }
      }
    `;

    try {
      const response = await fetch('/api/users/graphql/', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'email': emailCookie ? emailCookie : '',
          'username': usernameCookie ? usernameCookie : '',
        },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();
      console.log(data);


      if (data.data.verifyEmail.success) {
        Cookies.set('Authorization', `Bearer ${data.data.verifyEmail.token}`, { expires: .5 });
        Cookies.remove("username")
        Cookies.remove("email")
        push(data.data.verifyEmail.redirectUrl);
      } else {
        setError("verificationCode", {
          type: "server",
          message: data.data.verifyEmail.error,
        });
      }
    } catch (error) {
      setError("verificationCode", {
        type: "server",
        message: "اشتباهی از سمت سرور پیش آمده، لطفا بعدا دوباره امتحان کنید",
      });
    }
  };

  const props = {
    className: 'reactCodeInput',
    inputStyle: {
      margin: '4px',
      MozAppearance: 'textfield',
      width: '45px',
      borderRadius: '8px',
      textAlign: 'center',
      fontSize: '24px',
      height: '45px',
      padding: '7px',
      backgroundColor: 'var(--secondary-black)',
      color: 'lightskyblue',
      border: '1px solid var(--dark-grey)',
    },
    inputStyleInvalid: {
      margin: '4px',
      MozAppearance: 'textfield',
      width: '15px',
      borderRadius: '3px',
      fontSize: '24px',
      height: '26px',
      padding: '7px',
      backgroundColor: 'var(--secondary-black)',
      color: 'red',
      border: '1px solid red',
    },
    type: 'text', // Required prop 'type'
    fields: 6, // Required prop 'fields'
    name: 'code', // Required prop 'name'
    inputMode: 'text', // Required prop 'inputMode'
  };

  return (
    <section className='flex w-full flex-col items-center justify-center'>
      <form className='signup_form flex flex-col items-center p-10 relative' onSubmit={handleSubmit(onSubmit)}>
        <Controller
          control={control}
          name='verificationCode'
          render={({ field }) => <CustomReactCodeInput {...field} {...props} />}
        />
        <div className='w-full flex justify-between items-center mt-5'>
          <button disabled={isSubmitting} className='w-1/8 py-2 bg-red-600 text-[#212121] rounded hover:bg-red-700 focus:outline-none disabled:bg-red-300' type='submit'>تایید</button>

          <div className='flex flex-col items-start h-[30px]'>
            {isTimerRunning && <CountdownTimer setResendvar={setResendvar} setIsTimerRunning={setIsTimerRunning} />} {/* Pass state setters to CountdownTimer */}
            <button type='button' onClick={handleResend} disabled={!resendvar} className='bg-transparent disabled:text-gray-500 p-0'>ارسال مجدد کد</button>
          </div>
        </div>

        {errors.verificationCode && (
          <p className='text-sm text-red-700 absolute bottom-0 left-0 translate-y-5 whitespace-nowrap'>{errors.verificationCode.message}</p>
        )}
      </form>
    </section>
  );
};

export default Page;
