"use client"

import React from 'react';
import { useForm } from 'react-hook-form';

const Page = () => {
  const { register, handleSubmit } = useForm();

  const onSubmit = async (formData: any) => {
    const { code } = formData;
    const query = `
    mutation VerifyEmail {
    verifyEmail(code:${code}) {
        success
        error
        redirectUrl
        token
    }
}
    `
    console.log(query);
    
    try {
      const response = await fetch('http://127.0.0.1:8000/users/graphql/', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            mutation VerifyEmail {
    verifyEmail(code: "${code}") {
        success
        error
        redirectUrl
        token
    }
}
          `,
        }),
      });

      const { data } = await response.json();
      console.log(data);
      
      if (data.verifyEmail.success) {
        alert("Email verified successfully");
      }
       else {
        alert("Failed to verify email");
      }
    } catch (error) {
      console.error('Error verifying email:', error);
      alert('An unexpected error occurred');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("code")} type="text" />
      <button type='submit'>Submit</button>
    </form>
  );
};

export default Page;
