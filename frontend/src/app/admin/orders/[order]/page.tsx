"use client"

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import Styles from "@/allStyles/orderStyles.module.css";
import * as jalaali from 'jalaali-js';

import "react-multi-date-picker/styles/colors/red.css";
import "react-multi-date-picker/styles/backgrounds/bg-dark.css";
import { FaCalendarAlt } from "react-icons/fa";

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

interface Iprovince {
    name: string;
}

interface Icity {
    name: string;
    province: Iprovince;
}

interface Iaddress {
    address: string;
    city: Icity;
}

interface DisplayItem {
    id: string;
    dueDate: string;
    orderNumber: string;
    status: string;
    address: Iaddress;
    items: OrderItems[];
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

const handleStatus = (status: string) => {
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




const convertToJalaali = (gregorianDate: string | undefined) => {
    if (gregorianDate) {
        const [year, month, day] = gregorianDate.split('-');
        const jalaaliDate = jalaali.toJalaali(parseInt(year), parseInt(month), parseInt(day));
        return `${jalaaliDate.jy}/${jalaaliDate.jm}/${jalaaliDate.jd}`;
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
};

const Page = () => {
    const [orderData, setOrderData] = useState<DisplayItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState<string>('');
    const [updated, handleUpdated] = useState<boolean>(false)

    const { order } = useParams();
    const { push } = useRouter();

    useEffect(() => {
        if (!order) return;

        const fetchProductData = async () => {
            try {
                const user = Cookies.get("Authorization");
                const response = await fetch('/api/admin_dash/graphql/', {
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
                                    creationDate
                                    orderNumber
                                    totalPrice
                                    status
                                    address {
                                        address
                                        city {
                                            name
                                            province {
                                                name
                                            }
                                        }
                                    }
                                    items {
                                        id
                                        type
                                        name
                                        dimensions
                                        price
                                        description
                                        fabric
                                        color
                                        woodColor
                                        quantity
                                        thumbnail
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

                if (data.errors || !data.data.order) {
                    throw new Error(data.errors ? data.errors[0].message : 'No item found');
                }

                const fetchedOrderData = data.data.order;
                if (!fetchedOrderData) {
                    push("/cart");
                    return;
                }

                setOrderData(fetchedOrderData);
                setSelectedStatus(fetchedOrderData.status); // Set initial status

            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProductData();
    }, [order, push, updated]);

    const handleStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedStatus(event.target.value);
    };

    const handleStatusUpdate = async () => {
        try {
            const user = Cookies.get("Authorization");
            const response = await fetch('/api/admin_dash/graphql/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': user ? user : '',
                },
                body: JSON.stringify({
                    query: `
                        mutation UpdateOrder {
                            updateOrder(input: { id: ${orderData?.id}, status: "${selectedStatus}" }) {
                                success
                                errors
                            }
                        }
                    `,
                }),
            });

            const data = await response.json();

            if (!response.ok || data.errors) {
                throw new Error('Failed to update order status');
            }

            // Handle success or errors here
            console.log('Order status updated:', data);
            handleUpdated(!updated)
        } catch (error) {
            console.error('Error updating order status:', error);
        }
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
                                        <p>تعداد : {item.quantity}</p>
                                    </span>
                                </div>
                            </div>
                            <div className={Styles.itemLeft}>
                                <picture><img src={`/media/${item.thumbnail}`} alt="thumbnail" /></picture>
                            </div>
                        </div>
                    ))}
                </div>
                <div className='flex justify-center mt-[30px] gap-2 w-[100%] relative items-center'>
                    <label htmlFor="orderDate" className='flex items-center gap-2'>
                        تاریخ تحویل :<FaCalendarAlt />
                    </label>
                    <p>{convertToJalaali(orderData.dueDate)}</p>
                </div>
                <p style={{ color: handleStatusColor(orderData.status) }} className={orderData.status}>{handleStatus(orderData.status)}</p>
                <p>{orderData.address.city.province.name}</p>
                <p>{orderData.address.city.name}</p>
                <p>{orderData.address.address}</p>

                {/* Status dropdown */}
                <div className={Styles.statusContainer}>
                    <label htmlFor="orderStatus">وضعیت سفارش:</label>
                    <select className={Styles.selectAdmin} id="orderStatus" value={selectedStatus} onChange={handleStatusChange}>
                        {Object.entries(statusMapping).map(([key, value]) => (
                            <option key={key} value={key}>{value}</option>
                        ))}
                    </select>
                </div>

                {/* Submit button */}
                <button onClick={handleStatusUpdate}>
                    ثبت وضعیت
                </button>
            </div>

            <div>
                <button onClick={() => push(`${orderData.id}/${orderData.id}`)}>
                    صورت حساب ها
                </button>
            </div>

        </section>
    );
};

export default Page;
