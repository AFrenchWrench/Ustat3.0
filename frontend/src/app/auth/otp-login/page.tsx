"use client"

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { z } from "zod";
import { zodResolver } from '@hookform/resolvers/zod';
import CountdownTimer from '@/components/countDown';
import CustomReactCodeInput from '@/components/CustomReactCodeInput';
import { useTitle } from '@/components/TitleContext';
import useDynamicTitle from '@/components/useDynamicTitle';

const codeSchema = z.object({
  verificationCode: z.string().min(1, "لطفا کد را وارد کنید")
});
type TcodeSchema = z.infer<typeof codeSchema>;

type Titles = {
  [key: string]: string;
};

const titles: Titles = {
  en: 'Ustattecaret-email otp login',
  fa: 'اوستات تجارت-ورود',
};

const Page = () => {
  const [resendvar, setResendvar] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const { setTitle } = useTitle();


  useDynamicTitle(); // This will set the document title based on context

  useEffect(() => {
    const language = navigator.language || 'en';
    const langCode = language.split('-')[0];
    const pageTitle = titles[langCode] || titles['en'];
    setTitle(pageTitle);
    return () => setTitle('Ustat'); // Reset title on unmount if desired
  }, [setTitle]);

  const { handleSubmit, control, setError, formState: { errors, isSubmitting } } = useForm<TcodeSchema>({
    resolver: zodResolver(codeSchema)
  });

  const { push } = useRouter();

  useEffect(() => {
    const countdown = setInterval(() => {
      setIsTimerRunning(prevIsTimerRunning => {
        if (prevIsTimerRunning) {
          return true;
        } else {
          clearInterval(countdown);
          setResendvar(true);
          return false;
        }
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, []);

  const handleResend = async () => {
    const emailCookie = Cookies.get("email");
    const query = `
      mutation ResendEmail {
        resendEmail(emailType:"otp") {
          success
          errors
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
      console.log(data);
    } catch (error) {
      console.log(error);
    }
    setIsTimerRunning(true);
    setResendvar(false);
  };

  const onSubmit = async (formData: TcodeSchema) => {
    const email = Cookies.get("email");
    const { verificationCode } = formData;

    const query = `
      mutation OtpLogin {
        otpLogin(code: "${verificationCode}") {
          success
          errors
          redirectUrl
          token
        }
      }
    `;

    console.log(query);


    try {
      const response = await fetch('/api/users/graphql/', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'email': email ? email : '',
        },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();
      console.log(data);
      console.log(data.data.otpLogin.success);

      if (data.data.otpLogin.success) {
        Cookies.set('Authorization', `Bearer ${data.data.otpLogin.token}`, { expires: 0.5 });
        Cookies.remove("email");
        push(data.data.otpLogin.redirectUrl);
      } else {
        setError("verificationCode", {
          type: "server",
          message: data.data.otpLogin.errors || "اشتباهی از سمت سرور پیش آمده، لطفا بعدا دوباره امتحان کنید",
        });
      }
    } catch (error) {
      setError("verificationCode", {
        type: "server",
        message: `${errors}` || "اشتباهی از سمت سرور پیش آمده، لطفا بعدا دوباره امتحان کنید",
      });
    }
  };


  return (
    <section className='flex w-full flex-col items-center justify-center min-h-[100vh]'>
      <form className='signup_form flex flex-col items-center p-10 relative' onSubmit={handleSubmit(onSubmit)} autoComplete="off">
        <Controller
          control={control}
          name='verificationCode'
          render={({ field }) => <CustomReactCodeInput length={6} {...field} />}
        />
        <div className='w-full flex justify-between items-center mt-5'>
          <button disabled={isSubmitting} className='w-1/8 py-2 bg-red-600 text-[#212121] rounded hover:bg-red-700 focus:outline-none disabled:bg-red-300' type='submit'>تایید</button>

          <div className='flex flex-col items-start h-[30px]'>
            {isTimerRunning && <CountdownTimer initialTime={30} setResendvar={setResendvar} setIsTimerRunning={setIsTimerRunning} />}
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
