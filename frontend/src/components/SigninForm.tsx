import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Cookies from 'js-cookie';

import { useRouter } from 'next/navigation';
import Link from 'next/link';


const userSchema = z.object({
  username: z.string()
    .min(1, "نام کاربری نمی‌تواند خالی باشد")
    .regex(/^[a-zA-Z][a-zA-Z0-9_]{3,20}$/, "نام کاربری معتبر نمیباشد"),
  password: z.string()
    .min(1, "گذرواژه نمی‌تواند خالی باشد")
    .min(8, "گذرواژه باید حداقل 8 کاراکتر باشد."),
});

const SigninForm = () => {


  const {push} = useRouter()

  type SignInSchema = z.infer<typeof userSchema>;

  const { register, handleSubmit, formState: { errors, isSubmitting }, setError, reset } = useForm<SignInSchema>({
    mode: 'all',
    resolver: zodResolver(userSchema)
  });

  const onSubmit: SubmitHandler<SignInSchema> = async (userInfo) => {
    try {
      const token = Cookies.get('Authorization');
      const response = await fetch('http://127.0.0.1:8000/users/graphql/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? token : '',
        },
        body: JSON.stringify({
          query: `
          mutation Login($username: String!, $password: String!) {
            login(username: $username, password: $password) {
              token
              success
              redirectUrl
            }
          }
        `,
          variables: {
            username: userInfo.username,
            password: userInfo.password,
          },
        }),
      });

      const data = await response.json();
      console.log("Response data:", data); 

      if (!response.ok) {
        console.error("Network response was not ok", response);
        return;
      }

      if (data.errors) {
        console.error("Server returned errors:", data.errors); 
        setError("username", { message: "نام کاربری یا رمز عبور اشتباه است", type: "server" });
      }

      if (data.data && data.data.login.success && data.data.login.token) {
        Cookies.set('Authorization', `Bearer ${data.data.login.token}`);
        push(data.data.login.redirectUrl);
        reset();
      }
      if (data.data.login.success == false && data.data.login.redirectUrl){
        Cookies.set('username', `${userInfo.username}`);
        push(data.data.login.redirectUrl)
      }
      else {
        console.error("Login failed with no token returned");
        setError("username", { message: "نام کاربری یا رمز عبور اشتباه است", type: "server" });
      }
    } catch (error) {
      console.error("Error submitting the form:", error);
      alert("An unexpected error occurred");
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className='signup_form flex flex-col items-center p-10 relative'>
     
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
         {errors.username && (
        <p className='text-sm text-red-700 absolute bottom-0 left-0 translate-y-5'>
          {`${errors.username.message}`}
        </p>
      )}
        <label className="signup_form_label" htmlFor="user-name">نام کاربری :</label>
        <span className='line'></span>
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
          <p className='text-sm text-red-700 absolute bottom-0 left-0 translate-y-5'>
            {`${errors.password.message}`}
          </p>
        )}
        <span className='line'></span>
        <label className="signup_form_label" htmlFor="password">رمز عبور :</label>
      </div>

      <button className="w-1/8 py-2 mt-4 bg-red-600 text-[#212121] rounded hover:bg-red-700 focus:outline-none disabled:bg-red-300" type="submit" disabled={isSubmitting}>ورود</button>
        <Link className='text-gray-300 text-sm absolute left-5 bottom-5' href={"/auth/otp-login-request"}>فراموشی رمزعبور؟</Link>
    </form>
  );
}

export default SigninForm;
