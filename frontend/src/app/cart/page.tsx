"use client"

import React, { useEffect, useState } from 'react'

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

  const [orders, setOrders] = useState<DisplayItem[]>()
  const { push } = useRouter()

  useEffect(() => {

    const fetchOrders = async () => {
      try {
        const token = Cookies.get('Authorization');
        !token ? push("/auth") : ""
        const response = await fetch('/api/sales/graphql/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? token : '',
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
        const data = await response.json();
        console.log(data);


        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        if (data.errors || (token && !data.data.userOrders)) {
          throw new Error(data.errors ? data.errors[0].message : 'No items found');
        }

        if (token) setOrders(data.data.userOrders);



      } catch (error) {
        console.log(error);

      }
    }

    fetchOrders()
  }, [])

  return (
    <section>
      {
        orders?.map((order) => {
          return (
            <div key={order.id}>
              <div>{order.orderNumber}</div>
              <div>{order.status}</div>
              <div>{order.dueDate}</div>
              {
                order.items.map((item) => {
                  return (
                    <div key={item.id}>
                      <div>{item.name}</div>
                      <div>{item.quantity}</div>
                    </div>

                  )
                })
              }
            </div>
          )
        })
      }
    </section>
  )
}

export default Cart
