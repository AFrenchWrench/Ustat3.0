"use client";

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from "@/allStyles/navbar.module.css";
import { HiOutlineHome } from "react-icons/hi";
import { MdAccountCircle } from "react-icons/md";
import { PiShoppingCartSimple } from "react-icons/pi";
import { MdOutlineSupportAgent } from "react-icons/md";
import { AiOutlineProduct } from "react-icons/ai";

const Nav = () => {
  const [selectBgTop, setSelectBgTop] = useState("8px");
  const router = usePathname();

  useEffect(() => {
    const determineBgTop = () => {
      if (router.startsWith('/products')) {
        return "168px"; // Adjust based on your layout for /products and /products/[type]
      }

      switch (router) {
        case '/users/username':
          return "8px"; // Adjust based on your layout
        case '/':
          return "88px"; // Adjust based on your layout
        case '/cart':
          return "248px"; // Adjust based on your layout
        case '/support':
          return "328px"; // Adjust based on your layout
        default:
          return "8px";
      }
    };

    setSelectBgTop(determineBgTop());
  }, [router]);

  return (
    <nav className={Navbar.navbar}>
      <ul>
        <li>
          <Link href={"/users/username"}><MdAccountCircle color="white" size="30px" /></Link>
        </li>
        <li>
          <Link href={"/"}><HiOutlineHome color='white' size="30px" /></Link>
        </li>
        <li>
          <Link href={"/products"}><AiOutlineProduct color='white' size="30px" /></Link>
        </li>
        <li>
          <Link href={"/cart"}><PiShoppingCartSimple color='white' size="30px" /></Link>
        </li>
        <li>
          <Link href={"/support"}><MdOutlineSupportAgent color='white' size="30px" /></Link>
        </li>
        <div className={Navbar.holder}>
          <span className={Navbar.selectedBg} style={{ top: selectBgTop }}></span>
        </div>
      </ul>
    </nav>
  );
};

export default Nav;
