"use client"

import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

import Styles from '@/allStyles/cartStyles.module.css'
import Link from 'next/link';

import * as jalaali from 'jalaali-js';
import ConfirmAlert from './components/ConfirmAlert';
import { BsCart4 } from 'react-icons/bs';
import Loading from '@/components/Loading';
import { useTitle } from '@/components/TitleContext';
import useDynamicTitle from '@/components/useDynamicTitle';

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

type TupdateType = "update" | "delete" | "updateDate" | "changeStatus" | "changeStatusC";

interface ConfirmAlertType {
  show: boolean;
  type: TupdateType;
  itemId: string;
  status?: string;
}

type Titles = {
  [key: string]: string;
};

const titles: Titles = {
  en: 'Ustattecaret-Cart',
  fa: 'اوستات تجارت-سبد خرید',
};

const convertToJalaali = (gregorianDate: string | undefined) => {
  if (gregorianDate) {
    const [year, month, day] = gregorianDate.split('-');
    const jalaaliDate = jalaali.toJalaali(parseInt(year), parseInt(month), parseInt(day));
    return `${jalaaliDate.jy}/${jalaaliDate.jm}/${jalaaliDate.jd}`;
  }
};

const Cart = () => {
  const [orders, setOrders] = useState<DisplayItem[]>([]);
  const { push } = useRouter();
  const [confirmAlert, setConfirmAlert] = useState<ConfirmAlertType | null>(null);
  const [loading, setLoading] = useState(true)
  const [update, setUpdate] = useState(false);

  const [showAllItems, setShowAllItems] = useState(false);
  const maxItemsToShow = 4;
  const { setTitle } = useTitle();


  useDynamicTitle(); // This will set the document title based on context

  useEffect(() => {
    const language = navigator.language || 'en';
    const langCode = language.split('-')[0];
    const pageTitle = titles[langCode] || titles['en'];
    setTitle(pageTitle);
    return () => setTitle('Ustat'); // Reset title on unmount if desired
  }, [setTitle]);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true)
      const token = Cookies.get('Authorization');
      if (!token) {
        push("/auth");
        return;
      }

      try {
        const response = await fetch('/api/sales/graphql/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token,
          },
          body: JSON.stringify({
            query: `
            query Orders {
                orders(filter: { status: ["p","ps","a"] }) {        
                        totalPages
                        totalItems
                        items {
                            id
                            status
                            orderNumber
                            dueDate
                            items {
                                id
                                type
                                name
                                quantity
                            }
                        }
                    }
           }
            `,
          }),
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();


        if (data.errors) {
          throw new Error(data.errors[0].message);
        }

        setOrders(data.data.orders.items);
      } catch (error) {
        console.log(error);
      }
      finally {
        setLoading(false)
      }
    };

    fetchOrders();
  }, [push, update]);



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


  const handleConfirmAlert = (type: TupdateType, itemId: string, status?: string) => {
    setConfirmAlert({ show: true, type, itemId, status });
  };
  const handleCancel = () => {
    setConfirmAlert(null);
  };

  const handleConfirm = async (type: TupdateType, itemId: string, status?: string) => {
    const user = Cookies.get("Authorization");

    let query: string = '';  // Initialize with an empty string
    let variables: any = {}; // Initialize with an empty object

    query = `
            mutation DeleteOrder ($orderId:ID!) {
                deleteOrder(input: { id: $orderId }) {
                    success
                    messages
                }
            }
        `;
    variables = { orderId: itemId };


    try {
      setLoading(true)
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

      console.log(query);
      console.log(itemId);



      const data = await response.json();

      console.log(data);

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      if (data.errors || !data.data) {
        throw new Error(data.errors ? data.errors[0].message : 'Something went wrong');
      }

      setUpdate(!update);
    } catch (error) {
      console.error('Error executing mutation:', error);
    } finally {
      setConfirmAlert(null);
      setLoading(false)
    }
  };

  if (loading) return <div>{<Loading />}</div>
  return (
    <section className={Styles.container}>
      <div className={Styles.ordersSection}>
        {orders && orders.length > 0 ?
          <span className={Styles.shadow}></span> : ""}

        <div className={Styles.orderItemsSection}>
          {orders && orders.length > 0 ? orders.map((order) => (
            <Link key={order.id} href={`/cart/${order.id}`}>
              <div className={Styles.itemsSection}>
                <div className={Styles.orderNumberContainer}>
                  <p>شماره سفارش :</p>
                  <p className={Styles.orderNumber}>{order.orderNumber}</p>
                </div>
                <div className={Styles.itemsContainer}>
                  {order.items.slice(0, showAllItems ? order.items.length : maxItemsToShow).map((item) => (
                    <div key={item.id}>
                      <p>{item.name}</p>
                      <span>{item.quantity}×</span>
                    </div>
                  ))}
                  {order.items.length > maxItemsToShow && (
                    <button className={Styles.showMoreButton} onClick={(e) => {
                      e.preventDefault();
                      setShowAllItems(!showAllItems);
                    }}>
                      {showAllItems ? 'نمایش کمتر' : 'نمایش همه'}
                    </button>
                  )}
                </div>
                <div className={Styles.bottomSection}>
                  <div className={Styles.dateContainer}>
                    <p>تاریخ دریافت :</p>
                    <p className={Styles.notOrderNumber}>{convertToJalaali(order.dueDate)}</p>
                  </div>
                  <div className={Styles.dateContainer}>
                    <p>وضعیت :</p>
                    <p style={{ color: handleStatusColor(order.status), textShadow: `0px 0px 4px ${handleStatusColor(order.status)}` }} className={Styles.notOrderNumber}>{handleStatus(order.status)}</p>
                  </div>
                  <button
                    className={Styles.deleteButton}
                    onClick={(e) => {
                      e.preventDefault();
                      handleConfirmAlert('delete', order.id);
                    }}
                  >
                    حذف سفارش
                  </button>
                </div>
              </div>
            </Link>
          ))
            :
            <div className={Styles.emptyContainer}>
              <BsCart4 className={Styles.cartIcon} />
              <p>سبدخرید شما خالی است</p>
            </div>
          }
        </div>

      </div>
      {confirmAlert && (
        <ConfirmAlert
          type={confirmAlert.type}
          status={confirmAlert.status}
          itemId={confirmAlert.itemId}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </section>
  );
};

export default Cart;
