"use client";

import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { IoMdAddCircle } from "react-icons/io";
import Navbar from "@/allStyles/adminNavbar.module.css";

const AdminNav = () => {
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const router = usePathname();

    useEffect(() => {
        const fetchUserData = async () => {
            const token = Cookies.get('Authorization');
            if (!token) {
                setIsAdmin(false);
                return;
            }
            try {
                const response = await fetch('/api/users/graphql/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token
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

                if (!response.ok || data.errors || !data.data.currentUser) {
                    setIsAdmin(false);
                } else {
                    setIsAdmin(data.data.currentUser.isStaff);
                }
            } catch (error) {
                console.log(error);
                setIsAdmin(false);
            }
        };

        fetchUserData();
    }, [router]);

    return (
        <>
            {isAdmin && (
                <nav className={Navbar.adminNavbar}>
                    <ul>
                        <li>
                            <Link href={"/admin/add-item"}>
                                <IoMdAddCircle color="black" size="30px" />
                            </Link>
                        </li>
                    </ul>
                </nav>
            )}
        </>
    );
};

export default AdminNav;
