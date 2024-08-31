"use client";

import Link from 'next/link';
import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from "@/allStyles/navbar.module.css";
import { HiOutlineHome } from "react-icons/hi";
import { MdAccountCircle } from "react-icons/md";
import { PiShoppingCartSimple } from "react-icons/pi";
import { MdOutlineSupportAgent } from "react-icons/md";
import { AiOutlineProduct } from "react-icons/ai";

const Nav = () => {
  const [selectBgTop, setSelectBgTop] = useState("-25px");
  const router = usePathname();

  const homeRef = useRef<HTMLLIElement>(null);
  const accountRef = useRef<HTMLLIElement>(null);
  const productsRef = useRef<HTMLLIElement>(null);
  const cartRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const determineBgTop = () => {
      let selectedElement = null;

      if (router.startsWith('/products')) {
        selectedElement = productsRef.current;
      } else if (router.startsWith('/users')) {
        selectedElement = accountRef.current;
      } else if (router === "/") {
        selectedElement = homeRef.current;
      } else if (router.startsWith('/cart')) {
        selectedElement = cartRef.current;
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
    <nav className={Navbar.navbar}>
      <ul>
        <li ref={accountRef}>
          <Link href={"/users/username"}><MdAccountCircle color="white" className={Navbar.icons} /></Link>
        </li>
        <li ref={homeRef}>
          <Link href={"/"}><HiOutlineHome color='white' className={Navbar.icons} /></Link>
        </li>
        <li ref={productsRef}>
          <Link href={"/products"}><AiOutlineProduct color='white' className={Navbar.icons} /></Link>
        </li>
        <li ref={cartRef}>
          <Link href={"/cart"}><PiShoppingCartSimple color='white' className={Navbar.icons} /></Link>
        </li>
        <div className={Navbar.holder}>
          <span className={Navbar.selectedBg} style={{ top: selectBgTop, transform: 'translateY(-50%)' }}></span>
        </div>
      </ul>
    </nav>
  );
};

export default Nav;
