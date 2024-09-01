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

import { CiEdit } from "react-icons/ci";

import "@/allStyles/datePickerOrder.css"

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
    price: number;
    totalPrice: number;
}

interface Iaddress {
    address: string
}

interface DisplayItem {
    id: string;
    dueDate: string;
    orderNumber: string;
    status: string;
    address: Iaddress;
    totalPrice: number;
    items: OrderItems[];
}

const orderSchema = z.object({
    quantity: z.number().optional(),
    orderDate: z.string().optional(),
    address: z.string().min(1, "آدرس الزامی است"),
    postalCode: z.string().min(1, "کد پستی الزامی است").max(10, "Postal Code must be at most 10 characters long"),
    description: z.string().optional()
});

type TupdateType = "update" | "delete" | "updateDate" | "changeStatus" | "changeStatusC";

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

    const [errorMessage, setErrorMessage] = useState<string>("")

    useEffect(() => {
        if (!order) return;
        console.log(order);


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
                                    order(id: "${order}") {
                                        id
                                        dueDate
                                        orderNumber
                                        status
                                        totalPrice
                                        address {
                                            address
                                        }
                                        items {
                                            id
                                            type
                                            name
                                            quantity
                                            thumbnail
                                            price
                                            totalPrice
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
    }, [order, update, push]);



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
        formState: { errors },
        setValue,
        getValues,
        control
    } = useForm<TorderSchema>({
        resolver: zodResolver(orderSchema),
        mode: "all"
    });

    const handleDateChange = (date: DateObject | null, id: string) => {
        if (date) {
            const gregorianDate = date.convert(gregorian).toDate();
            const utcDate = new Date(Date.UTC(gregorianDate.getFullYear(), gregorianDate.getMonth(), gregorianDate.getDate()));
            const formattedDate = utcDate.toISOString().split("T")[0];
            setValue("orderDate", formattedDate);
            setDateValue(convertToJalaali(formattedDate));
            handleConfirm("updateDate", id)
        } else {
            setValue("orderDate", '');
            setDateValue(undefined);
        }
    };

    const handleQuantityChange = (itemId: string, increment: boolean) => {
        setItemQuantities((prevQuantities) => {
            const currentQuantity = prevQuantities[itemId] || 1;
            const newQuantity = increment ? currentQuantity + 1 : Math.max(currentQuantity - 1, 1);

            // Call handleConfirm with the newQuantity
            handleConfirm("update", itemId, undefined, undefined, newQuantity);

            // Return updated state
            return { ...prevQuantities, [itemId]: newQuantity };
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

    const statusMapping: Record<string, string> = {
        "PS": "در انتظار ثبت",
        "P": "در انتظار تایید",
        "A": "تایید شده",
        "PP": "در انتظار پرداخت",
        "PD": "پرداخت شده",
        "PSE": "در انتظار ارسال",
        "S": "ارسال شده",
        "DE": "تحویل داده شده",
        "D": "تایید نشده",
        "C": "لغو شده",
    };

    const handleStatus = (status: string): string => {
        return statusMapping[status] || 'نامشخص';
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
                return "#00ff00";
            case 'C':
                return "red";
            default:
                return "white";
        }
    }

    const handleConfirmAlert = (type: TupdateType, itemId: string, status?: string, addressId?: string) => {
        setConfirmAlert({ show: true, type, itemId, status, addressId });
    };

    const handleConfirm = async (type: TupdateType, itemId: string, status?: string, addressId?: string, newQuantity?: number) => {
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
            variables = { itemIdVar: itemId, quantity: newQuantity };
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
            if (!addressId) {
                setErrorMessage("لطفا آدرس را انتخاب کنید")
                return
            }
            setErrorMessage("")
            query = `
                mutation UpdateOrder($itemIdVar: ID!, $status: String! , $address: ID!) {
                    updateOrder(input: { id: $itemIdVar, status: $status, address: $address }) {
                        success
                        errors
                    }
                }
            `;
            variables = { itemIdVar: itemId, status: status, address: addressId };
        } else if (type === "changeStatusC") {
            query = `
            mutation UpdateOrder($itemIdVar: ID!, $status: String!) {
                updateOrder(input: { id: $itemIdVar, status: $status}) {
                    success
                    errors
                }
            }
        `;
            variables = { itemIdVar: itemId, status: status };
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
                                <div className={Styles.quantityControl}>
                                    <p>تعداد :</p>
                                    <span className='flex gap-[10px] items-center ml-3'>
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
                                <div className={Styles.price}>
                                    <p>قیمت :</p>
                                    <p>{Number(item.price).toLocaleString("en-US")}</p>
                                </div>
                                <div className={Styles.totalPrice}>
                                    <p>قیمت کل :</p>
                                    <p>{Number(item.totalPrice).toLocaleString("en-US")}</p>
                                </div>
                                {orderData.status === "PS" && (
                                    <div className={Styles.udButtons}>
                                        <button
                                            className={Styles.deleteButton}
                                            onClick={() => handleConfirmAlert('delete', item.id)}
                                        >
                                            <RiDeleteBin6Line color='white' width={35} height={35} />
                                        </button>
                                    </div>
                                )}

                            </div>
                            <div className={Styles.itemLeft}>
                                <picture><img src={`/media/${item.thumbnail}`} alt="thumbnail" /></picture>
                            </div>
                        </div>
                    ))}
                </div>
                <div className={Styles.dateStatusContainer}>
                    <div className={Styles.dateContainer}>
                        <label htmlFor="orderDate" className='flex items-center gap-2'>
                            تاریخ دریافت :<FaCalendarAlt />
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
                                    onChange={(date) => handleDateChange(date, orderData.id)}
                                    minDate={new DateObject({ calendar: persian }).set("day", 15)}
                                    className="red bg-dark text-color-white"
                                    inputClass={Styles.customInput}
                                    value={dateValue}
                                    disabled={orderData.status !== "PS"}
                                />
                            )}
                        />
                        {errors.orderDate && (
                            <p className='text-sm text-red-700 absolute bottom-0 left-0 translate-y-5 whitespace-nowrap'>
                                {errors.orderDate.message}
                            </p>
                        )}
                    </div>
                    <div className={Styles.statusContainer}>
                        <p>وضعیت :</p>
                        <p style={{ color: handleStatusColor(orderData.status), textShadow: `0px 0px 4px ${handleStatusColor(orderData.status)}` }} className={Styles.status}>{handleStatus(orderData.status)}</p>
                    </div>

                </div>


                {
                    errorMessage && (
                        <p>{errorMessage}</p>
                    )
                }
                {orderData.status === "PS" && (
                    <>

                        <div className={Styles.formGroup}>
                            <p>آدرس :</p>
                            <div className='flex items-center gap-1 w-[85%] bg-[rgb(42,42,42)] p-1 py-0 rounded-md'>
                                {
                                    address ? (
                                        <p>{address}</p>
                                    ) : (
                                        orderData.address && <p className={Styles.addressText}>{orderData.address.address}</p>
                                    )
                                }
                                <button className='bg-transparent p-0 mr-[auto]' type='button' onClick={() => setShowSelectAddress(true)} disabled={showSelectAddress}><CiEdit className={Styles.editFontSize} /></button>
                            </div>
                        </div>

                        <div className={Styles.acButtons}>
                            <button type='button' onClick={() => handleConfirmAlert('changeStatus', orderData.id, 'p', addressId)} className={Styles.cButton}>ثبت</button>
                            <button type='button' onClick={() => handleConfirmAlert('changeStatusC', orderData.id, 'c')} className={Styles.submitButton}>لغو</button>
                        </div>
                    </>
                )}
                {
                    orderData.address && (
                        <div className={Styles.formGroup}>
                            <p>آدرس :</p>
                            <div className='flex items-center gap-1 w-[85%] bg-[rgb(42,42,42)] p-1 py-0 rounded-md'>
                                <p className={Styles.addressText}>{orderData.address.address}</p>
                            </div>
                        </div>
                    )
                }

                {
                    orderData.status === "A" && (
                        <div>
                            <button onClick={() => push(`/payment/${orderData.id}`)}>
                                صفحه پرداخت
                            </button>
                        </div>
                    )
                }
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
