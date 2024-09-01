import React from 'react'

import Style from "@/allStyles/payment.module.css"
import Image from 'next/image';

interface Iitems {
    name: string;
    price: number;
    quantity: number;
}

interface FullPaymentProps {
    payFunction: () => void;
    items: Iitems[]
    totalPrice: number | undefined;
}

const FullPayment: React.FC<FullPaymentProps> = ({ payFunction, items, totalPrice }) => {
    console.log(totalPrice);

    return (
        <div className={Style.container}>
            <Image className={Style.svgImage} src="/image/Group 15.png" alt="svg" width={500} height={300} />
            <h3>پرداخت نقدی</h3>
            <div className={Style.itemsContainer}>
                {
                    items.map((item, index) => {
                        return (
                            <div className={Style.itemContainer} key={index}>
                                <p className={Style.itemQuantity}>x {item.quantity}</p>
                                <p className={Style.itemName}>{item.name}</p>
                                <p className={Style.itemPrice}>{Number(item.price).toLocaleString("en-US")}</p>
                            </div>
                        )
                    })
                }
            </div>
            <div className={Style.totalPrice}>
                <p>قیمت کل :</p>
                <p>{Number(totalPrice).toLocaleString("en-US")} تومان</p>
            </div>
            <button className={Style.payButton} onClick={payFunction}>پرداخت</button>
        </div>
    )
}

export default FullPayment
