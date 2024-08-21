"use client"

import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

import Styles from '@/allStyles/cartStyles.module.css'
import Link from 'next/link';

import * as jalaali from 'jalaali-js';
import { RiDeleteBin6Line } from 'react-icons/ri';
import ConfirmAlert from './components/ConfirmAlert';
import { BsCart4 } from 'react-icons/bs';

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
  const [update, setUpdate] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
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
    };

    fetchOrders();
  }, [push, update]);



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
  }
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
    }
  };


  return (
    <section className={Styles.container}>
      <div className={Styles.ordersSection}>
        {orders && orders.length > 0 ? orders.map((order) => (
          <Link key={order.id} href={`/cart/${order.id}`}>
            <div >
              <div className={Styles.orderNumberContainer}>
                <p>شماره سفارش :</p>
                <p className={Styles.orderNumber}>{order.orderNumber}</p>
              </div>
              <div className={Styles.itemsContainer}>
                {order.items.map((item) => (
                  <div key={item.id}>
                    <p>{item.name}</p>
                    <span>{item.quantity}×</span>
                  </div>
                ))}
              </div>
              <div className={Styles.orderNumberContainer}>
                <p>تاریخ دریافت :</p>
                <p className={Styles.orderNumber}>{convertToJalaali(order.dueDate)}</p>
              </div>
              <div className={Styles.orderNumberContainer}>
                <p>وضعیت :</p>
                <p style={{ color: handleStatusColor(order.status) }} className={Styles.orderNumber}>{handleStatus(order.status)}</p>
              </div>
            </div>
            <button
              className={Styles.deleteButton}
              onClick={(e) => {
                e.preventDefault();
                handleConfirmAlert('delete', order.id);
              }}
            >
              <RiDeleteBin6Line color='white' width={35} height={35} />
            </button>
          </Link>
        ))
          :
          <div className={Styles.emptyContainer}>
            <BsCart4 className={Styles.cartIcon} />
            <p>سبدخرید شما خالی است</p>
          </div>
        }
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
