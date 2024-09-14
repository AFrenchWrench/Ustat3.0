"use client"

import React, { useState } from 'react'
import Style from "@/allStyles/payment.module.css"
import Image from 'next/image';

interface Iitems {
  name: string;
  price: number;
  quantity: number;
}

interface FullPaymentProps {
  payFunction: (upfront: string, checks: string) => void;
  items: Iitems[];
  totalPrice: number | undefined;
  rank: "A" | "B" | "C" | null;
}

const Installment: React.FC<FullPaymentProps> = ({ payFunction, items, totalPrice, rank }) => {
  const [upfront, setUpfront] = useState<string>("");
  const [checks, setChecks] = useState<string>("");
  const [error, setError] = useState<string>(""); // State to hold error message

  // Calculate the upfront payment based on selected percentage
  const upfrontPayment = totalPrice && upfront ? (totalPrice * parseFloat(upfront) / 100) : null;

  const handlePayment = () => {
    if (!upfront || !checks) {
      setError("لطفاً مقدار پیش‌پرداخت و تعداد چک‌ها را انتخاب کنید.");
      return;
    }
    setError(""); // Clear the error message if validation passes
    payFunction(upfront, checks);
  };

  // Define the available options based on the user's rank
  const getUpfrontOptions = () => {
    switch (rank) {
      case "C":
        return (
          <>
            <option value="50">50%</option>
            <option value="60">60%</option>
          </>
        );
      case "B":
        return (
          <>
            <option value="40">40%</option>
            <option value="50">50%</option>
            <option value="60">60%</option>
          </>
        );
      case "A":
      case null:
        return (
          <>
            <option value="30">30%</option>
            <option value="40">40%</option>
            <option value="50">50%</option>
            <option value="60">60%</option>
          </>
        );
      default:
        return null;
    }
  };

  const getChecksOptions = () => {
    switch (rank) {
      case "C":
        return (
          <>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
          </>
        );
      case "B":
        return (
          <>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
          </>
        );
      case "A":
      case null:
        return (
          <>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
            <option value="7">7</option>
            <option value="8">8</option>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className={Style.container}>
      <Image className={Style.svgImage} src="/image/Group 15.png" alt="svg" width={500} height={300} />
      <h3>پرداخت اقساطی</h3>
      <div className={Style.itemsContainer}>
        {items.map((item, index) => (
          <div className={Style.itemContainer} key={index}>
            <p className={Style.itemQuantity}>x {item.quantity}</p>
            <p className={Style.itemName}>{item.name}</p>
            <p className={Style.itemPrice}>{Number(item.price).toLocaleString("en-US")}</p>
          </div>
        ))}
      </div>
      <div className={Style.installmentContainer}>
        <div className={Style.installmentSelectDiv}>
          <label htmlFor="upfront">مقدار پیش پرداخت :</label>
          <select
            id="upfront"
            value={upfront}
            onChange={(e) => setUpfront(e.target.value)}
          >
            <option value="" disabled>انتخاب</option>
            {getUpfrontOptions()}
          </select>
        </div>
        <div className={Style.installmentSelectDiv}>
          <label htmlFor="checks">تعداد چک :</label>
          <select
            id="checks"
            value={checks}
            onChange={(e) => setChecks(e.target.value)}
          >
            <option value="" disabled>انتخاب</option>
            {getChecksOptions()}
          </select>
        </div>
      </div>
      {error && <p className={Style.errorMessage}>{error}</p>} {/* Display error message */}
      <div className={Style.installmentPrice}>
        <p>پیش پرداخت :</p>
        <p>تومان {upfrontPayment !== null ? upfrontPayment.toLocaleString("en-US") : "-"}</p>
      </div>
      <div className={Style.totalPrice}>
        <p>قیمت کل :</p>
        <p>تومان {totalPrice !== undefined ? totalPrice.toLocaleString("en-US") : "-"}</p>
      </div>
      <button className={Style.payButton} onClick={handlePayment}>پرداخت</button>
    </div>
  );
};

export default Installment;
