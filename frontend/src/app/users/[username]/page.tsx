"use client"

import React, { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import Cookies from 'js-cookie';

import styles from '../style/profilePageStyles.module.css';

import * as jalaali from 'jalaali-js';

import { RiLogoutBoxLine } from "react-icons/ri";
import { FiEdit } from "react-icons/fi";

const UserProfile = ({ params }: { params: { username: string } }) => {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { push } = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      const token = Cookies.get('Authorization');
      try {
        const response = await fetch('http://127.0.0.1:8000/users/graphql/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? token : ''
          },
          body: JSON.stringify({
            query: `
              query CurrentUser {
                currentUser {
                  username
                  firstName
                  lastName
                  phoneNumber
                  landlineNumber
                  email
                  birthdate
                }
              }
            `,
          }),
        });
        const data = await response.json();
        console.log(data);
        
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        if (data.errors || !data.data.currentUser) {
          throw new Error(data.errors ? data.errors[0].message : 'User not logged in');
        }

        setUserData(data.data.currentUser);
        push(`/users/${data.data.currentUser.username}`)
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('An unknown error occurred');
        }
        setError("not login")
        push("/auth")
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [params.username, push]);

  const convertToJalaali = (gregorianDate: string) => {
    const [year, month, day] = gregorianDate.split('-');
    const jalaaliDate = jalaali.toJalaali(parseInt(year), parseInt(month), parseInt(day));
    return `${jalaaliDate.jy}/${jalaaliDate.jm}/${jalaaliDate.jd}`;
  };


  const handleLogout =async ()=>{
    const token = Cookies.get('Authorization');

    try {
      const response = await fetch('http://127.0.0.1:8000/users/graphql/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? token : ''
        },
        body: JSON.stringify({
          query: `
              mutation Logout {
                logout {
                  success
                  redirectUrl
                }
              }
            `,
        }),
      });
      const data = await response.json();
        console.log(data);
        
        if (data.data.logout.success) {
          Cookies.remove("Authorization")
          push(data.data.logout.redirectUrl)
        }
        else{
          setError("از حساب کاربری خارج هستید")
        }

    } catch (error) {
      console.log(error);
      push("/")
      
    }
  }

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className={styles.profileContainer}>
      <div className={styles.profileDetails}>
        <h1 className={styles.username}>{userData.username}</h1>

      <div className={styles.firsLastName}>
        <span>
           <strong>نام:</strong><p> {userData.firstName}</p>
        </span>

        <span>
           <strong>نام خانوادگی:</strong><p> {userData.lastName}</p>
        </span>
      </div>

        <div className={styles.firsLastName}>
        <span>
           <strong>تلفن همراه :</strong><p> {userData.phoneNumber}</p>
        </span>
        <span>
          <strong>تلفن ثابت :</strong><p> {userData.landlineNumber}</p>
        </span>
        </div>

        <div className={styles.firsLastName}>
        <span>
           <strong>ایمیل :</strong><p> {userData.email}</p>
        </span>
        <span>
          <strong>تاریخ تولد :</strong><p> {convertToJalaali(userData.birthdate)}</p>
        </span>
        </div>

        <div className={styles.buttonContainer}>
          <button className='hover:text-gray-300'>ویرایش<FiEdit/></button>
          <button onClick={handleLogout} className='text-red-400 hover:text-red-200'>خروج از حساب<RiLogoutBoxLine size='20px'/></button>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
