"use client"

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import AddItem from '@/components/adminComponent/addItem';

import Loading from '@/components/Loading';

const Page = () => {
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null); // Use null to represent loading state
    const router = useRouter();

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
                           isStaff
                                    }
                                }
            `,
                    }),
                });
                const data = await response.json();

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                if (data.errors || !data.data.currentUser) {
                    throw new Error(data.errors ? data.errors[0].message : 'User not logged in');
                }

                setIsAdmin(data.data.currentUser.isStaff);


            } catch (error) {
                console.log(error);

            } finally {
            }
        };

        fetchUserData();
    }, [])

    // Show loading indicator while checking admin status
    if (isAdmin === null) {
        return <>{<Loading />}</>;
    }

    return (
        <>
            {isAdmin ? (
                <AddItem />
            ) : (
                router.push('/')
            )}
        </>
    );
};

export default Page;
