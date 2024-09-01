"use client";

import React, { useEffect, useRef, useState } from 'react';
import Cookies from 'js-cookie';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { IoMdAddCircle } from "react-icons/io";
import Navbar from "@/allStyles/adminNavbar.module.css";
import { RiReceiptFill } from 'react-icons/ri';
import { FaUsers } from 'react-icons/fa';

const AdminNav = () => {
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const router = usePathname();

    const [selectBgTop, setSelectBgTop] = useState("-25px");

    const addItemRef = useRef<HTMLLIElement>(null);
    const usersRef = useRef<HTMLLIElement>(null);
    const ordersRef = useRef<HTMLLIElement>(null);



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

    useEffect(() => {
        const determineBgTop = () => {
            let selectedElement = null;

            if (router.startsWith('/admin/add-item')) {
                selectedElement = addItemRef.current;
            } else if (router.startsWith('/admin/users')) {
                selectedElement = usersRef.current;
            } else if (router.startsWith("/admin/orders")) {
                selectedElement = ordersRef.current;
            }

            if (selectedElement) {
                const iconHeight = selectedElement.offsetHeight;
                const iconTop = selectedElement.offsetTop;
                return `${iconTop + (iconHeight / 2)}px`;
            }

            return "-25px";
        };

        setSelectBgTop(determineBgTop());
    }, [router]);

    return (
        <>
            {isAdmin && (
                <nav className={Navbar.adminNavbar}>
                    <ul>
                        <li ref={addItemRef}>
                            <Link href={"/admin/add-item"}>
                                <IoMdAddCircle color="black" size="30px" />
                            </Link>
                        </li>
                        <li ref={ordersRef}>
                            <Link href={"/admin/orders"}>
                                <RiReceiptFill color="black" size="30px" />
                            </Link>
                        </li>
                        <li ref={usersRef}>
                            <Link href={"/admin/users"}>
                                <FaUsers color="black" size="30px" />
                            </Link>
                        </li>
                        <div className={Navbar.holder}>
                            <span className={Navbar.selectedBg} style={{ top: selectBgTop, transform: 'translateY(-50%)' }}></span>
                        </div>
                    </ul>
                </nav>
            )}
        </>
    );
};

export default AdminNav;
