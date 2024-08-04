"use client";

import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import "./componentStyles.css";
import Cookies from "js-cookie";
import Link from 'next/link';

interface OrderItems {
    id: string;
    type: string;
    name: string;
    dimensions: object;
    price: number;
    quantity: number;
}

interface DisplayItem {
    id: string;
    dueDate: string;
    creationDate: string;
    orderNumber: string;
    status: string;
    items: OrderItems[];
}

interface SelectOrderProps {
    id: string;
    orderData: DisplayItem[];
    onRemove: () => void;
    onOrderUpdate: (updatedOrderData: DisplayItem[]) => void;
}

const SelectOrder: React.FC<SelectOrderProps> = ({ id, orderData, onRemove, onOrderUpdate }) => {
    const [quantities, setQuantities] = useState<number>(1);

    const handleQuantityChange = (increment: boolean) => {
        if (increment) {
            setQuantities(quantities + 1);
        } else if (quantities > 1) {
            setQuantities(quantities - 1);
        }
    };

    const handleOrder = async (order?: string) => {
        const Authorization = Cookies.get("Authorization");

        const query = `
    mutation CreateOrderItem {
      createOrderItem(
        input: { 
          ${order ? `order:"${order}",` : ""}
          displayItem: "${id}",
          quantity: ${quantities}
        }
      ) {
        success
      }
    }
    `;

        try {
            const response = await fetch('/api/sales/graphql/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': Authorization ? Authorization : '',
                },
                body: JSON.stringify({ query }),
            });

            const result = await response.json();
            console.log(result);

            // Call the onOrderUpdate callback with the updated orderData
            onOrderUpdate(orderData); // Pass the updated orderData here
        } catch (error) {
            console.error('Error:', error);
        }

        onRemove();
    };

    return ReactDOM.createPortal(
        <section className='section'>
            <div className='select_order_container'>
                <p>انتخاب سبد خرید</p>
                <div className='orders_section'>
                    {orderData.map((order) => (
                        <div onClick={() => handleOrder(order.id)} key={order.id}>
                            <p>{order.orderNumber}</p>
                            <span>
                                {order.items[0]?.name && (
                                    <p>{order.items[0].name}
                                        <span className='item_quantity'>{order.items[0].quantity}×</span>
                                    </p>
                                )}

                                {order.items[1]?.name && (
                                    <p>{order.items[1].name}
                                        <span className='item_quantity'>{order.items[1].quantity}×</span>
                                    </p>
                                )}
                            </span>
                            <p className='text-yellow-600'>در انتظار تایید</p>
                            <Link href={`/cart/${order.orderNumber}`} onClick={(e) => e.stopPropagation()}>مشاهده</Link>
                        </div>
                    ))}
                </div>
                <div className='quantity_control'>
                    <span className='flex gap-[10px] items-center'>
                        <p>تعداد :</p>
                        <button className='increment disabled:bg-gray-600' disabled={quantities < 2} onClick={() => handleQuantityChange(false)}>-</button>
                        <span className='quantities'>{quantities}</span>
                        <button className='increment' onClick={() => handleQuantityChange(true)}>+</button>
                    </span>
                    <button className='add' onClick={() => handleOrder()}>جدید +</button>
                </div>
                <button className='remove' onClick={onRemove}>x</button>
            </div>
        </section>,
        document.body
    );
};

export default SelectOrder;
