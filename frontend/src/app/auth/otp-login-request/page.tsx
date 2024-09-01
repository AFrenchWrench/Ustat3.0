"use client"

import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Cookies from 'js-cookie';

import { useRouter } from 'next/navigation';


const userSchema = z.object({
  email: z.string({ required_error: "ایمیل نمی‌تواند خالی باشد" })
    .email("ایمیل وارد شده معتبر نمی‌باشد"),
});

const SigninForm = () => {


  const { push } = useRouter()

  type SignInSchema = z.infer<typeof userSchema>;

  const { register, handleSubmit, formState: { errors, isSubmitting }, setError, reset } = useForm<SignInSchema>({
    mode: 'all',
    resolver: zodResolver(userSchema)
  });

  const onSubmit: SubmitHandler<SignInSchema> = async (userInfo) => {
    try {
      const token = Cookies.get('Authorization');
      const query = `
          mutation OtpLoginRequest {
             otpLoginRequest(email: "${userInfo.email}") {
              success
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
        body: JSON.stringify({ query }),
      });
      console.log(query);

      const data = await response.json();
      console.log("Response data:", data);

      if (!response.ok) {
        console.error("Network response was not ok", response);
        return;
      }

      if (data.errors) {
        setError("email", { message: "ایمیل اشتباه است", type: "server" });
        return
      }

      if (data.data.otpLoginRequest.success) {
        Cookies.set("email", userInfo.email)
        push(data.data.otpLoginRequest.redirectUrl)
      } else {
        console.error("Login failed with no token returned");
      }
    } catch (error) {
      console.error("Error submitting the form:", error);
      alert("An unexpected error occurred");
    }
  };

  return (
    <section className='flex w-full flex-col items-center justify-center min-h-[100vh]'>
      <form noValidate onSubmit={handleSubmit(onSubmit)} className='signup_form flex flex-col items-center !p-5 '>

        <div className='signup_form_container !mt-0'>
          <input
            {...register("email", {
              required: "ایمیل الزامی است",
            })}
            className="signup_form_input ltr"
            id='user-name'
            type='email'
            dir='ltr'
            required
          />
          {errors.email && (
            <p className='text-sm text-red-700 absolute bottom-0 left-0 translate-y-5'>
              {`${errors.email.message}`}
            </p>
          )}
          <label className="signup_form_label" htmlFor="user-name">ایمیل :</label>
          <span className='line'></span>
        </div>


        <button className="w-1/8 py-2 mt-4 bg-red-600 text-[#212121] rounded hover:bg-red-700 focus:outline-none disabled:bg-red-300" type="submit" disabled={isSubmitting}>ورود</button>
      </form>
    </section>

  );
}

export default SigninForm;
