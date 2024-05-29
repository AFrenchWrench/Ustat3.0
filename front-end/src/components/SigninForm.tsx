import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const SigninForm = () => {
  const userSchema = z.object({
    username: z.string()
      .min(1, "نام کاربری نمی‌تواند خالی باشد")
      .regex(/^[a-zA-Z][a-zA-Z0-9_]{3,20}$/, "نام کاربری معتبر نمیباشد"),
    password: z.string()
      .min(1, "گذرواژه نمی‌تواند خالی باشد")
      .min(8, "گذرواژه باید حداقل 8 کاراکتر باشد."),
  });

  type SignInSchema = z.infer<typeof userSchema>;

  const onSubmit: SubmitHandler<SignInSchema> = async (userInfo) => {
    try {
      const response = await fetch('http://127.0.0.1:8000/users/graphql/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
          mutation Login($username: String!, $password: String!) {
            login(username: $username, password: $password) {
              token
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
      if (!response.ok) {
        console.error("Network response was not ok", response);
        return;
      }

      if (data.errors) {
        console.error("GraphQL Error:", data.errors);
        return;
      }

      if (data.data.login.errors) {
        const errors = JSON.parse(data.data.login.errors);
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
        return;
      }

      if (data.data.login.token) {
        alert("User logged in successfully!");
        reset();
      } else {
        alert("Failed to log in");
      }
    } catch (error) {
      console.error("Error submitting the form:", error);
      alert("An unexpected error occurred");
    }
  };

  const { register, handleSubmit, formState: { errors, isSubmitting }, setError, reset } = useForm<SignInSchema>({
    mode: "all",
    resolver: zodResolver(userSchema)
  });

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className='signup_form flex flex-col items-center p-10 '>
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
          <p className='text-sm text-red-700 absolute bottom-0 translate-y-5'>
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
          <p className='text-sm text-red-700 absolute bottom-0 translate-y-5'>
            {`${errors.password.message}`}
          </p>
        )}
        <span className='line'></span>
        <label className="signup_form_label" htmlFor="password">رمز عبور :</label>
      </div>

      <button className="w-1/8 py-2 mt-4 bg-red-600 text-[#212121] rounded hover:bg-red-700 focus:outline-none disabled:bg-red-300" type="submit" disabled={isSubmitting}>ورود</button>
    </form>
  );
}

export default SigninForm;
