"use client"

import React from 'react'

import { useEffect, useState } from "react";
import Cookies from 'js-cookie';

import Navbar from "@/allStyles/adminNavbar.module.css";
import Link from 'next/link';

import { IoMdAddCircle } from "react-icons/io";


const AdminNav = () => {
    const [isAdmin, setIsAdmin] = useState<boolean>(false);

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

    return (
        <>
            {
                isAdmin ?
                    <nav className={Navbar.adminNavbar}>
                        <ul>
                            <li>
                                <Link href={"/admin/add-item"}><IoMdAddCircle color="black" size="30px" /></Link>
                            </li>
                        </ul>
                    </nav>

                    : ""
            }
        </>
    )
}

export default AdminNav
