"use client"

import SignupForm from '@/components/authcomponents/SignupForm'
import SigninForm from '@/components/authcomponents/SigninForm'
import React, { useState } from 'react'


const Auth = () => {

  const[signin,setSignin] = useState(true)


  const signInSignUpHandler = ()=>{
    setSignin(!signin)
  }



  return (
    <section className='flex w-full flex-col items-center justify-center'>
     <div className='forms'>
      {
        signin?<SigninForm/>:<SignupForm/>
      }
    </div>
  <div className='signup_signin_btns'>
    <button onClick={signInSignUpHandler} className={`login_btn hover:text-white ${signin?"translate-x-[110%]":""}`}>ورود به اکانت ؟</button>
    <button onClick={signInSignUpHandler} className={`login_btn hover:text-white ${!signin?"translate-x-[-110%]":""}`}>ساخت حساب ؟</button>
    </div>

    </section>
  )
}

export default Auth
