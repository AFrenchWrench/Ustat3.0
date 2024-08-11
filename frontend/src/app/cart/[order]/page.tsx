"use client"

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
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
import SelectAddress from '../components/selectAddress';

interface OrderItems {
    id: string;
    type: string;
    name: string;
    thumbnail: string;
    quantity: number;
    fabric: string;
    color: string;
    woodColor: string;
    dimensions: string;
}

interface DisplayItem {
    id: string;
    dueDate: string;
    orderNumber: string;
    status: string;
    items: OrderItems[];
}

const orderSchema = z.object({
    quantity: z.number().optional(),
    orderDate: z.string().optional(),
    address: z.string().min(1, "آدرس الزامی است"),
    postalCode: z.string().min(1, "کد پستی الزامی است").max(10, "Postal Code must be at most 10 characters long"),
    description: z.string().optional()
});

type TupdateType = "update" | "delete" | "updateDate" | "changeStatus";

type TorderSchema = z.infer<typeof orderSchema>;

interface ConfirmAlertType {
    show: boolean;
    type: TupdateType;
    itemId: string;
    status?: string;
    addressId?: string
}

const Page = () => {
    const [orderData, setOrderData] = useState<DisplayItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [itemQuantities, setItemQuantities] = useState<{ [key: string]: number }>({});
    const [confirmAlert, setConfirmAlert] = useState<ConfirmAlertType | null>(null);
    const [formData, setFormData] = useState<TorderSchema | null>(null);
    const { order } = useParams();
    const [update, setUpdate] = useState(false);
    const { push } = useRouter();

    const [addressId, setAddressId] = useState<string>("")
    const [address, setAddress] = useState<string>("")
    const [showSelectAddress, setShowSelectAddress] = useState<boolean>(false)

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
                                query Order {
                                    order(id: ${order}) {
                                        id
                                        dueDate
                                        orderNumber
                                        status
                                        items {
                                            id
                                            type
                                            name
                                            quantity
                                            thumbnail
                                            fabric
                                            color
                                            woodColor
                                            dimensions
                                        }
                                    }
                                }
                        `,
                    }),
                });
                const data = await response.json();

                console.log('Fetched Data:', data); // Check fetched data

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                if (data.errors || !data.data.order) {
                    throw new Error(data.errors ? data.errors[0].message : 'No item found');
                }

                const fetchedOrderData = data.data.order;
                console.log('Fetched Order Data:', fetchedOrderData); // Log order data before setting state

                if (!fetchedOrderData) {
                    push("/cart");
                    return;
                }

                setOrderData(fetchedOrderData); // Update state here

                const initialQuantities = fetchedOrderData.items.reduce((acc: { [key: string]: number }, item: OrderItems) => {
                    acc[item.id] = item.quantity;
                    return acc;
                }, {});
                setItemQuantities(initialQuantities);
            } catch (error) {
                console.error('Error fetching data:', error);
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
        getValues,
        control
    } = useForm<TorderSchema>({
        resolver: zodResolver(orderSchema),
        mode: "all"
    });

    const handleDateChange = (date: DateObject | null) => {
        if (date) {
            const gregorianDate = date.convert(gregorian).toDate();
            const utcDate = new Date(Date.UTC(gregorianDate.getFullYear(), gregorianDate.getMonth(), gregorianDate.getDate()));
            const formattedDate = utcDate.toISOString().split("T")[0];
            setValue("orderDate", formattedDate);
            setDateValue(convertToJalaali(formattedDate));
        } else {
            setValue("orderDate", '');
            setDateValue(undefined);
        }
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

    const handleAddressId = (id: string) => {
        setAddressId(id)
    }
    const handleAddress = (address: string) => {
        setAddress(address)
    }
    const handleShowSelectAddress = () => {
        setShowSelectAddress(false)
    }

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
                return 'نامشخص';
        }
    };

    const handleStatusColor = (status: string) => {
        switch (status) {
            case 'P':
                return "yellow";
            case 'PS':
                return "white";
            case 'D':
                return "red";
            case 'A':
                return "green";
            case 'C':
                return "red";
            default:
                return "white";
        }
    }

    const handleConfirmAlert = (type: TupdateType, itemId: string, status?: string, addressId?: string) => {
        setConfirmAlert({ show: true, type, itemId, status, addressId });
    };

    const handleConfirm = async (type: TupdateType, itemId: string, status?: string, addressId?: string) => {
        const user = Cookies.get("Authorization");

        let query: string = '';  // Initialize with an empty string
        let variables: any = {}; // Initialize with an empty object

        // Set query and variables based on the type
        console.log(addressId);


        if (type === "delete") {
            query = `
                mutation DeleteOrderItem($id: ID!) {
                    deleteOrderItem(input: { id: $id }) {
                        success
                        messages
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
        } else if (type === "updateDate") {
            query = `
                mutation UpdateOrder($itemIdVar: ID!, $dueDate: Date!) {
                    updateOrder(input: { id: $itemIdVar, dueDate: $dueDate }) {
                        success
                        errors
                    }
                }
            `;
            variables = { itemIdVar: itemId, dueDate: getValues("orderDate") };
        } else if (type === "changeStatus") {
            query = `
                mutation UpdateOrder($itemIdVar: ID!, $status: String! , $address: ID!) {
                    updateOrder(input: { id: $itemIdVar, status: $status, address: $address }) {
                        success
                        errors
                    }
                }
            `;
            variables = { itemIdVar: itemId, status: status, address: addressId };
        }

        try {
            const response = await fetch('/api/sales/graphql/', {
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

            const data = await response.json();
            console.log(data);


            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            if (data.errors || !data.data) {
                throw new Error(data.errors ? data.errors[0].messages : 'Something went wrong');
            }

            if (type === "delete") {
                console.log(`Delete response: ${data.data.deleteOrderItem.messages}`);
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

    const onSubmit = async (data: TorderSchema) => {
        // Store form data
        setFormData(data);
        console.log("hello");


        // Trigger confirmation alert after validation
        handleConfirmAlert('update', orderData!.id);
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
                                <div className={Styles.infoContainer}>
                                    <div className={Styles.dimensionsContainer}>
                                        <div>
                                            <p>{JSON.parse(item.dimensions).length ? `طول: ${JSON.parse(item.dimensions).length}` : 'N/A'}</p>
                                            <p>{JSON.parse(item.dimensions).width ? `عرض: ${JSON.parse(item.dimensions).width}` : 'N/A'} x</p>
                                            <p>{JSON.parse(item.dimensions).height ? `ارتفاع: ${JSON.parse(item.dimensions).height}` : 'N/A'} x</p>
                                        </div>
                                    </div>
                                    <div className={Styles.colorSection}>
                                        <p>رنگ : <span>{item.color || 'N/A'}</span></p>
                                        <p>رنگ چوب : <span>{item.woodColor || 'N/A'}</span></p>
                                    </div>
                                    <div className={Styles.colorSection}>
                                        <p className='fabric_title'>پارچه : <span>{item.fabric || 'N/A'}</span></p>
                                    </div>
                                </div>
                                <div className={Styles.quantityControl}>
                                    <span className='flex gap-[10px] items-center'>
                                        <p>تعداد :</p>
                                        {orderData.status === "PS" && (
                                            <button
                                                className={Styles.increment}
                                                disabled={itemQuantities[item.id] < 2}
                                                onClick={() => handleQuantityChange(item.id, false)}
                                            >
                                                -
                                            </button>
                                        )}
                                        <span className={Styles.quantity}>{itemQuantities[item.id]}</span>
                                        {orderData.status === "PS" && (
                                            <button
                                                className={Styles.increment}
                                                onClick={() => handleQuantityChange(item.id, true)}
                                            >
                                                +
                                            </button>
                                        )}
                                    </span>
                                </div>
                            </div>
                            <div className={Styles.itemLeft}>
                                <picture><img src={`/media/${item.thumbnail}`} alt="thumbnail" /></picture>

                                {orderData.status === "PS" && (
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
                                )}
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
                                disabled={orderData.status !== "PS"}
                            />
                        )}
                    />
                    {orderData.status === "PS" && (
                        <button onClick={() => handleConfirmAlert('updateDate', orderData.id)} className={Styles.updateButton}>بروزرسانی</button>
                    )}
                    {errors.orderDate && (
                        <p className='text-sm text-red-700 absolute bottom-0 left-0 translate-y-5 whitespace-nowrap'>
                            {errors.orderDate.message}
                        </p>
                    )}
                </div>
                <p style={{ color: handleStatusColor(orderData.status) }} className={orderData.status}>{handleStatus()}</p>

                {orderData.status === "PS" && (
                    <>

                        <div className={Styles.formGroup}>
                            <button type='button' onClick={() => setShowSelectAddress(true)} disabled={showSelectAddress}>انتخاب آدرس</button>
                            {
                                address && (
                                    <p>{address}</p>
                                )
                            }
                        </div>

                        <div className={Styles.acButtons}>
                            <button type='button' onClick={() => handleConfirmAlert('changeStatus', orderData.id, 'p', addressId)} className={Styles.submitButton}>ثبت</button>
                            <button type='button' onClick={() => handleConfirmAlert('changeStatus', orderData.id, 'c')} className={Styles.cButton}>لغو</button>
                        </div>
                    </>
                )}
            </div>

            {confirmAlert && (
                <ConfirmAlert
                    type={confirmAlert.type}
                    status={confirmAlert.status}
                    addressId={confirmAlert.addressId}
                    itemId={confirmAlert.itemId}
                    onConfirm={async (type, itemId, status, addressId) => {
                        if (type === 'update') {
                            await handleConfirm(type, itemId); // Use the stored form data
                            // Submit the form data here
                            console.log("Submitting form data:", formData, formData?.quantity);
                        } else {
                            await handleConfirm(type, itemId, status, addressId);
                        }
                    }}
                    onCancel={handleCancel}
                />
            )}
            {
                showSelectAddress && (
                    <SelectAddress
                        onClose={handleShowSelectAddress}
                        selectedAddressId={handleAddressId}
                        selectedAddress={handleAddress}
                    />
                )}
        </section>
    );
}

export default Page;
