"use client"

import SignupForm from '@/components/authcomponents/SignupForm'
import SigninForm from '@/components/authcomponents/SigninForm'
import React, { useEffect, useState } from 'react'
import { useTitle } from '@/components/TitleContext';
import useDynamicTitle from '@/components/useDynamicTitle';

type Titles = {
  [key: string]: string;
};

const titles: Titles = {
  en: 'Ustattecaret-Auth',
  fa: 'اوستات تجارت-ورود/ثبت نام',
};


const Auth = () => {

  const [signin, setSignin] = useState(true)
  const { setTitle } = useTitle();


  useDynamicTitle(); // This will set the document title based on context

  useEffect(() => {
    const language = navigator.language || 'en';
    const langCode = language.split('-')[0];
    const pageTitle = titles[langCode] || titles['en'];
    setTitle(pageTitle);
    return () => setTitle('Ustat'); // Reset title on unmount if desired
  }, [setTitle]);



  const signInSignUpHandler = () => {
    setSignin(!signin)
  }



  return (
    <section className='flex w-full flex-col items-center justify-center min-h-[100vh]'>
      <div className='forms'>
        {
          signin ? <SigninForm /> : <SignupForm />
        }
      </div>
      <div className='signup_signin_btns'>
        <button onClick={signInSignUpHandler} className={`login_btn hover:text-white ${signin ? "translate-x-[110%]" : ""}`}>ورود به اکانت ؟</button>
        <button onClick={signInSignUpHandler} className={`login_btn hover:text-white ${!signin ? "translate-x-[-110%]" : ""}`}>ساخت حساب ؟</button>
      </div>

    </section>
  )
}

export default Auth
