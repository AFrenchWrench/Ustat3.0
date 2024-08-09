"use client"

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import AddItem from '@/components/adminComponent/addItem';
import Loading from '@/components/Loading';
import AddItemTable from '@/components/adminComponent/addItemTable';

const Page = () => {
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null); // Use null to represent loading state
    const { push } = useRouter();
    const [loading, setLoading] = useState(true);

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
                console.error(error);
                // Handle errors, maybe setIsAdmin to false or handle redirection here if necessary
                setIsAdmin(false);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    useEffect(() => {
        if (!Cookies.get("Authorization")) {
            push("/auth");
        } else if (!loading && isAdmin === false) {
            push('/');
        }
    }, [loading, isAdmin, push]);

    if (loading) return <div><Loading /></div>;

    return (
        <>
            {isAdmin ? (
                <AddItemTable />
            ) : null}
        </>
    );
};

export default Page;
