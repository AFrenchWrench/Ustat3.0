"use client"

import React, { useEffect, useState } from 'react';
import "./componentStyles.css";
import Cookies from "js-cookie";

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
    onRemove: () => void;
}

const SelectOrder: React.FC<SelectOrderProps> = ({ onRemove, id }) => {
    const [orderData, setOrderData] = useState<DisplayItem[]>([]);
    const [quantities, setQuantities] = useState<number>(1); // To store quantities

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const Authorization = Cookies.get("Authorization");

                const response = await fetch('/api/sales/graphql/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        "Authorization": Authorization ? Authorization : "",
                    },
                    body: JSON.stringify({
                        query: `
                            query GetUserPendingOrders {
                                getUserPendingOrders {
                                    id
                                    dueDate
                                    creationDate
                                    orderNumber
                                    status
                                    items {
                                        id
                                        type
                                        name
                                        dimensions
                                        price
                                        description
                                        quantity
                                    }
                                }
                            }
                        `,
                    }),
                });
                const data = await response.json();
                console.log(data);

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                if (data.errors || !data.data.getUserPendingOrders) {
                    throw new Error(data.errors ? data.errors[0].message : 'No items found');
                }

                setOrderData(data.data.getUserPendingOrders);

            } catch (error) {
                console.error(error);
            }
        };

        fetchUserData();
    }, []);

    const handleQuantityChange = (increment: boolean) => {
        if (increment) {
            setQuantities(quantities + 1)
        } else if (quantities > 1) {
            setQuantities(quantities - 1)
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

            console.log(query);
            console.log(result);

        } catch (error) {
            console.error('Error:', error);
        }

        onRemove();
    };



    return (
        <div className='select_order_container'>
            <p >انتخاب سبد خرید</p>
            <div className='orders_section'>
                {orderData.map((order) => (
                    <div onClick={() => handleOrder(order.id)} key={order.id}>
                        <p>{order.orderNumber}</p>
                        <span>
                            <p>{order.items[0].name}
                                <p className='item_quantity'>{order.items[0].quantity}</p>
                            </p>
                            {order.items[1]?.name ?
                                <p>{order.items[1].name}
                                    <p className='item_quantity'>{order.items[1].quantity}</p>
                                </p>
                                : ""}
                        </span>
                        <p className='text-yellow-600'>در انتظار تایید</p>
                    </div>
                ))}

            </div>
            <div className='quantity_control'>
                <span className='flex gap-[10px] items-center'>
                    <p>تعداد :</p>
                    <button className='increment  disabled:bg-gray-600' disabled={quantities < 2} onClick={() => handleQuantityChange(false)}>-</button>
                    <span className='quantities'>{quantities}</span>
                    <button className='increment' onClick={() => handleQuantityChange(true)}>+</button>
                </span>
                <button className='add' onClick={() => handleOrder()}>جدید +</button>
            </div>
            <button className='remove' onClick={onRemove}>x</button>
        </div>
    );
}

export default SelectOrder;
