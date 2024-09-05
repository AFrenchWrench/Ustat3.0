"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import styles from '../style/profilePageStyles.module.css';
import * as jalaali from 'jalaali-js';
import { RiLogoutBoxLine } from "react-icons/ri";
import { FiEdit } from "react-icons/fi";
import Edit from '@/components/authcomponents/edit';

import IuserData from '@/types/IuserData';
import Loading from '@/components/Loading';

const UserProfile = ({ params }: { params: { username: string } }) => {
  const [userData, setUserData] = useState<IuserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [updated, setUpdated] = useState(false);
  const { push } = useRouter();
  const hasFetched = useRef(false); // useRef to keep track of fetch status

  useEffect(() => {

    const fetchUserData = async () => {
      const token = Cookies.get('Authorization');
      try {
        const response = await fetch('/api/users/graphql/', {
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

                  business {
                    name
                    ownerFirstName
                    ownerLastName
                    ownerPhoneNumber
                    isConfirmed
                  }
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
        if (!isRedirecting) {
          setIsRedirecting(true);
          push(`/users/${data.data.currentUser.username}`);
        }
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('An unknown error occurred');
        }
        if (!isRedirecting) {
          setIsRedirecting(true);
          setError("not login");
          push("/auth");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [params, isRedirecting, push, updated]); // Remove dependencies that can cause re-renders



  const convertToJalaali = (gregorianDate: string) => {
    const [year, month, day] = gregorianDate.split('-');
    const jalaaliDate = jalaali.toJalaali(parseInt(year), parseInt(month), parseInt(day));
    return `${jalaaliDate.jy}/${jalaaliDate.jm}/${jalaaliDate.jd}`;
  };

  const handleLogout = async () => {
    const token = Cookies.get('Authorization');

    try {
      const response = await fetch('/api/users/graphql/', {
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
        Cookies.remove("Authorization");
        push(data.logout.redirectUrl);
      } else {
        setError("از حساب کاربری خارج هستید");
      }
    } catch (error) {
      console.log(error);
      push("/");
    }
  };

  if (loading) return <div><Loading /></div>;
  if (error) return;

  return (
    <section className={styles.profileContainer}>
      <div className={styles.profileDetails}>
        {
          isEditing ? (
            <Edit userData={userData} setIsEditing={setIsEditing} setUpdated={setUpdated} />
          ) : (
            userData && (
              <>
                <h1 className={styles.username}>{userData.username}</h1>

                <div style={{ width: "100%" }} className={styles.userData}>
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
                      <strong>تلفن همراه :</strong><p dir='ltr'> {userData.phoneNumber}</p>
                    </span>
                    <span>
                      <strong>تلفن ثابت :</strong><p dir='ltr'> {userData.landlineNumber}</p>
                    </span>
                  </div>

                  <div className={styles.firsLastName}>
                    <span>
                      <strong>ایمیل :</strong><p dir='ltr' className='text-xs'> {userData.email}</p>
                    </span>
                    <span>
                      <strong>تاریخ تولد :</strong><p> {convertToJalaali(userData.birthdate)}</p>
                    </span>
                  </div>

                  {
                    userData.business && (
                      <>
                        <div className={styles.firsLastName}>
                          <span>
                            <strong>نام شرکت :</strong><p className='text-xs'> {userData.business.name}</p>
                          </span>
                          <span>
                            <strong>وضعیت تایید :</strong><p className={userData.business.isConfirmed ? "!text-green-400" : "!text-red-400"}> {userData.business.isConfirmed ? "تایید شده" : "تایید نشده"}</p>
                          </span>
                        </div>

                        <div className={styles.firsLastName}>
                          <span>
                            <strong>نام صاحب شرکت :</strong><p className='text-xs'> {userData.business.ownerFirstName}</p>
                          </span>
                          <span>
                            <strong>نام خانوادگی صاحب شرکت :</strong><p> {userData.business.ownerLastName}</p>
                          </span>
                        </div>

                        <div className={styles.firsLastName}>
                          <span>
                            <strong>شماره همراه صاحب شرکت :</strong><p dir='ltr'> {userData.business.ownerPhoneNumber}</p>
                          </span>
                        </div>
                      </>
                    )
                  }
                </div>
              </>
            )
          )
        }

        <div className={styles.buttonContainer}>
          <button onClick={() => setIsEditing(!isEditing)} className='hover:text-gray-300'>{isEditing ? "نمایش" : "ویرایش"}<FiEdit /></button>
          <button onClick={handleLogout} className='text-red-400 hover:text-red-200'>خروج از حساب<RiLogoutBoxLine size='20px' /></button>
        </div>
      </div>
      <div className={styles.historyButtons}>
        <button onClick={() => push("/orders")}>تاریخچه سفارشات</button>
      </div>
    </section>
  );
};

export default UserProfile;
