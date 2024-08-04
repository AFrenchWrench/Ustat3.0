'use client'

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

import Styles from "@/allStyles/orderStyles.module.css";

import * as jalaali from 'jalaali-js';

import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from '@hookform/resolvers/zod';

import DatePicker, { DateObject } from "react-multi-date-picker";
import persian from 'react-date-object/calendars/persian';
import persian_fa from "react-date-object/locales/persian_fa";
import gregorian from "react-date-object/calendars/gregorian";
import "react-multi-date-picker/styles/colors/red.css";
import "react-multi-date-picker/styles/backgrounds/bg-dark.css";
import { FaCalendarAlt } from "react-icons/fa";

import { RiDeleteBin6Line } from "react-icons/ri";

import ConfirmAlert from "../components/ConfirmAlert"; // Import the ConfirmAlert component

interface OrderItems {
    id: string;
    type: string;
    name: string;
    dimensions: object;
    price: number;
    quantity: number;
    description: string;
}

interface DisplayItem {
    id: string;
    dueDate: string;
    creationDate: string;
    orderNumber: string;
    status: string;
    items: OrderItems[];
}

const orderSchema = z.object({
    quantity: z.number(),
    orderDate: z.string()
});

type TorderSchema = z.infer<typeof orderSchema>;

const Page = () => {
    const [orderData, setOrderData] = useState<DisplayItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [itemQuantities, setItemQuantities] = useState<{ [key: string]: number }>({});
    const [confirmAlert, setConfirmAlert] = useState<{ show: boolean; type: 'delete' | 'update'; itemId: string } | null>(null);
    const { order } = useParams();
    const [update, setUpdate] = useState(false);
    const { push } = useRouter()

    useEffect(() => {
        if (!order) return;

        const fetchProductData = async () => {
            try {
                const user = Cookies.get("Authorization");
                const response = await fetch('/api/sales/graphql/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': user ? user : '',
                    },
                    body: JSON.stringify({
                        query: `
                            query UserOrders {
                                userOrders(filter: { orderNumber_Icontains: "${order}" }) {
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

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                if (data.errors || !data.data.userOrders) {
                    throw new Error(data.errors ? data.errors[0].message : 'No item found');
                }


                const fetchedOrderData = data.data.userOrders[0];
                if (!fetchedOrderData) {
                    push("/cart")
                    return
                }
                setOrderData(fetchedOrderData);

                // Initialize item quantities
                const initialQuantities = fetchedOrderData.items.reduce((acc: { [key: string]: number }, item: OrderItems) => {
                    acc[item.id] = item.quantity;
                    return acc;
                }, {});
                setItemQuantities(initialQuantities);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchProductData();
    }, [order, update]);

    const convertToJalaali = (gregorianDate: string | undefined) => {
        if (gregorianDate) {
            const [year, month, day] = gregorianDate.split('-');
            const jalaaliDate = jalaali.toJalaali(parseInt(year), parseInt(month), parseInt(day));
            return `${jalaaliDate.jy}/${jalaaliDate.jm}/${jalaaliDate.jd}`;
        }
    };

    const [dateValue, setDateValue] = useState<string | undefined>();

    useEffect(() => {
        if (orderData?.dueDate) {
            setDateValue(convertToJalaali(orderData.dueDate));
        }
    }, [orderData?.dueDate]);

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        control
    } = useForm<TorderSchema>({
        resolver: zodResolver(orderSchema),
        mode: "all"
    });

    const handleDateChange = (date: DateObject | null) => {
        const gregorianDate = date ? date.convert(gregorian) : null;
        const formattedDate = gregorianDate ? gregorianDate.toDate().toISOString().split("T")[0] : '';
        setValue("orderDate", formattedDate);
        setDateValue(convertToJalaali(formattedDate));
    };

    const handleQuantityChange = (itemId: string, increment: boolean) => {
        setItemQuantities((prevQuantities) => {
            const currentQuantity = prevQuantities[itemId] || 1;
            if (increment) {
                return { ...prevQuantities, [itemId]: currentQuantity + 1 };
            } else {
                return { ...prevQuantities, [itemId]: Math.max(currentQuantity - 1, 1) };
            }
        });
    };

    const handleStatus = () => {
        const status = orderData?.status;
        switch (status) {
            case 'P':
                return 'در انتظار تایید';
            case 'PS':
                return 'در انتظار ثبت';
            case 'D':
                return 'تایید نشده';
            case 'A':
                return 'تایید شده';
            case 'C':
                return 'لغو شده';
            default:
                return 'نامشخض';
        }
    };

    const handleConfirmAlert = (type: 'delete' | 'update', itemId: string) => {
        setConfirmAlert({ show: true, type, itemId });
    };

    const handleConfirm = async (type: 'delete' | 'update', itemId: string) => {
        const user = Cookies.get("Authorization");

        let query: string = '';  // Initialize with an empty string
        let variables: any = {}; // Initialize with an empty object

        // Set query and variables based on the type
        if (type === "delete") {
            query = `
                mutation DeleteOrderItem($id: ID!) {
                    deleteOrderItem(input: { id: $id }) {
                        success
                        message
                    }
                }
            `;
            variables = { id: itemId };
        } else if (type === "update") {
            query = `
                mutation UpdateOrderItem($itemIdVar: ID!, $quantity: Int!) {
                    updateOrderItem(input: { id: $itemIdVar, quantity: $quantity }) {
                        success
                    }
                }
            `;
            variables = { itemIdVar: itemId, quantity: itemQuantities[itemId] };
        }

        try {
            const response = await fetch('http://localhost/api/sales/graphql/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': user ? user : '',
                },
                body: JSON.stringify({
                    query,
                    variables
                }),
            });
            console.log(query);

            const data = await response.json();

            console.log(data);

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            if (data.errors || !data.data) {
                throw new Error(data.errors ? data.errors[0].message : 'Something went wrong');
            }

            if (type === "delete") {
                console.log(`Delete response: ${data.data.deleteOrderItem.message}`);
            } else if (type === "update") {
                console.log(`Update response: ${data.data.updateOrderItem.success}`);
            }
            setUpdate(!update);
        } catch (error) {
            console.error('Error executing mutation:', error);
        } finally {
            setConfirmAlert(null);
        }
    };

    const handleCancel = () => {
        setConfirmAlert(null);
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!orderData) {
        return <div>No orders found</div>;
    }

    return (
        <section className={Styles.section}>
            <div className={Styles.Container}>
                <div className={Styles.name} key={orderData.id}>
                    <p>شماره سفارش :</p>
                    <p className={Styles.orderNumber}>{orderData.orderNumber}</p>
                </div>
                <div className={Styles.itemsContainer}>
                    {orderData.items && orderData.items.map((item) => (
                        <div className={Styles.itemContainer} key={item.id}>
                            <div className={Styles.itemRight}>
                                <p>{item.name}</p>
                                <div className={Styles.quantityControl}>
                                    <span className='flex gap-[10px] items-center'>
                                        <p>تعداد :</p>
                                        <button
                                            className={Styles.increment}
                                            disabled={itemQuantities[item.id] < 2}
                                            onClick={() => handleQuantityChange(item.id, false)}
                                        >
                                            -
                                        </button>
                                        <span className={Styles.quantity}>{itemQuantities[item.id]}</span>
                                        <button
                                            className={Styles.increment}
                                            onClick={() => handleQuantityChange(item.id, true)}
                                        >
                                            +
                                        </button>
                                    </span>
                                </div>
                            </div>
                            <div className={Styles.itemLeft}>
                                <p>{item.description}</p>
                                <div className={Styles.udButtons}>
                                    <button
                                        className={Styles.updateButton}
                                        onClick={() => handleConfirmAlert('update', item.id)}
                                    >
                                        بروزرسانی
                                    </button>
                                    <button
                                        className={Styles.deleteButton}
                                        onClick={() => handleConfirmAlert('delete', item.id)}
                                    >
                                        <RiDeleteBin6Line color='white' width={35} height={35} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className='flex justify-center mt-[30px] gap-2 w-[100%] relative items-center'>
                    <label htmlFor="orderDate" className='flex items-center gap-2'>
                        تاریخ تحویل :<FaCalendarAlt />
                    </label>
                    <Controller
                        control={control}
                        name='orderDate'
                        render={() => (
                            <DatePicker
                                id='orderDate'
                                calendar={persian}
                                locale={persian_fa}
                                calendarPosition="bottom-right"
                                onChange={handleDateChange}
                                minDate={new DateObject({ calendar: persian }).set("day", 15)}
                                className="red bg-dark text-color-white"
                                inputClass={Styles.customInput}
                                value={dateValue}
                            />
                        )}
                    />
                    <button className={Styles.updateButton}>بروزرسانی</button>
                    {errors.orderDate && (
                        <p className='text-sm text-red-700 absolute bottom-0 left-0 translate-y-5 whitespace-nowrap'>
                            {errors.orderDate.message}
                        </p>
                    )}
                </div>
                <p className={orderData.status}>{handleStatus()}</p>
                <h3></h3>
                {
                    orderData.status === "PS" ?
                        <div className={Styles.acButtons}>
                            <button className={Styles.sButton}>ثبت</button>
                            <button className={Styles.cButton}>لغو</button>
                        </div>
                        : ""
                }
            </div>

            {confirmAlert && (
                <ConfirmAlert
                    type={confirmAlert.type}
                    itemId={confirmAlert.itemId}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                />
            )}
        </section>
    );
}

export default Page;
