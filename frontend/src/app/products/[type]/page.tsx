"use client"

import { ImageList, ImageListItem } from "@mui/material";
import React, { useEffect, useState } from "react";
import Article from "../components/Article";

import Cookies from "js-cookie";



interface DisplayItem {
    id: string;
    type: string;
    name: string;
    dimensions: string;
    price: string;
    description: string;
    thumbnail: string;
    slider1: string;
    slider2: string;
    slider3: string;
}

interface OrderItems {
    id: string;
    type: string;
    name: string;
    dimensions: object;
    price: number;
    quantity: number;
}

interface DisplayOrder {
    id: string;
    dueDate: string;
    creationDate: string;
    orderNumber: string;
    status: string;
    items: OrderItems[];
}


const Page = () => {
    const [userData, setUserData] = useState<DisplayItem[]>([]);
    const [orderData, setOrderData] = useState<DisplayOrder[]>([]);
    const [fetchTrigger, setFetchTrigger] = useState(false); // Trigger for re-fetching data

    const fetchUserData = async () => {
        try {
            const token = Cookies.get('Authorization');
            const response = await fetch('/api/sales/graphql/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? token : '',
                },
                body: JSON.stringify({
                    query: `
              query DisplayItems {
                displayItems {
                  id
                  type
                  name
                  dimensions
                  price
                  description
                  thumbnail
                  slider1
                  slider2
                  slider3
                }
                ${token ? `
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
                    quantity
                  }
                }` : ''}
              }
            `,
                }),
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            if (data.errors || !data.data.displayItems || (token && !data.data.userOrders)) {
                throw new Error(data.errors ? data.errors[0].message : 'No items found');
            }

            setUserData(data.data.displayItems);
            if (token) setOrderData(data.data.userOrders);

        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchUserData();
    }, []); // Fetch initial data on mount

    useEffect(() => {
        if (fetchTrigger) {
            fetchUserData();
            setFetchTrigger(false);
        }
    }, [fetchTrigger]); // Fetch updated data when fetchTrigger is true

    const updateOrderData = (newOrderData: DisplayOrder[]) => {
        setOrderData(newOrderData);
        setFetchTrigger(true); // Trigger data re-fetch
    };


    return (
        <section className="flex flex-col gap-5 items-center mt-10">
            <ImageList gap={8} sx={{ width: "80%" }} cols={3}>
                {userData.map((article, index) => (
                    <ImageListItem key={index}>
                        <Article
                            imageSrc={`/media/${article.thumbnail}`}
                            productName={article.name}
                            description={article.description}
                            price={article.price}
                            productLink={article.id}
                            type={article.type}
                            orderData={orderData}
                            onOrderUpdate={updateOrderData}
                        />
                    </ImageListItem>
                ))}
            </ImageList>
        </section>
    );
};

export default Page;