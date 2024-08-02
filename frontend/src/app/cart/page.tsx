"use client"

import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

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

const Cart = () => {
  const [orders, setOrders] = useState<DisplayItem[]>([]);
  const { push } = useRouter();

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
              query UserOrders {
                userOrders {
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

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();

        if (data.errors) {
          throw new Error(data.errors[0].message);
        }

        setOrders(data.data.userOrders);
      } catch (error) {
        console.log(error);
      }
    };

    fetchOrders();
  }, [push]);

  return (
    <section>
      {orders.map((order) => (
        <div key={order.id}>
          <div>{order.orderNumber}</div>
          <div>{order.status}</div>
          <div>{order.dueDate}</div>
          {order.items.map((item) => (
            <div key={item.id}>
              <div>{item.name}</div>
              <div>{item.quantity}</div>
            </div>
          ))}
        </div>
      ))}
    </section>
  );
};

export default Cart;
