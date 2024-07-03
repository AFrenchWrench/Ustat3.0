'use client'

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const UserProfile = ({ params }: { params: { username: string } }) => {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { push } = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/users/graphql/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
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

        const result = await response.json();

        if (result.errors || !result.data.currentUser) {
          throw new Error(result.errors ? result.errors[0].message : 'User not logged in');
        }

        setUserData(result.data.currentUser);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('An unknown error occurred');
        }
        // push('/auth');
        setError("not login")
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [params.username, push]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>User Profile</h1>
      <p>Username: {userData.username}</p>
      <p>First Name: {userData.firstName}</p>
      <p>Last Name: {userData.lastName}</p>
      <p>Phone Number: {userData.phoneNumber}</p>
      <p>Landline Number: {userData.landlineNumber}</p>
      <p>Email: {userData.email}</p>
      <p>Birthdate: {userData.birthdate}</p>
    </div>
  );
};

export default UserProfile;
