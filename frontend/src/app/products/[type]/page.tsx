"use client"

import { ImageList, ImageListItem } from "@mui/material";
import React, { useEffect, useState } from "react";
import Article from "../components/Article";

import { useParams } from "next/navigation";

import Cookies from "js-cookie";




interface Ivariants {
    id: string,
    name: string;
    price: string;
    thumbnail: string;
}


interface DisplayItem {
    id: string;
    name: string;
    type: string;
    variants: Ivariants[];
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
    const { type } = useParams()

    const [displayData, setDisplayData] = useState<DisplayItem[]>([]);
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
                                displayItems(page: 1, perPage: 12, filter: { type: "${type.toString().toLowerCase()}" }) {
                                    totalPages
                                    totalItems
                                    items {
                                        id
                                        type
                                        name
                                        variants {
                                            id
                                            name
                                            price
                                            thumbnail
                                        }
                                    }
                                }
                            ${token ? `
                                orders(filter: { status: "ps" }) {
                                    id
                                    dueDate
                                    creationDate
                                    orderNumber
                                    status
                                    items {
                                        id
                                        type
                                        name
                                        quantity
                                    }
                                }
                            }
                            `: ""}

            `,
                }),
            });
            const data = await response.json();
            console.log(data);


            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            if (data.errors || !data.data.displayItems || (token && !data.data.orders)) {
                throw new Error(data.errors ? data.errors[0].message : 'No items found');
            }

            setDisplayData(data.data.displayItems.items);
            console.log(displayData);

            if (token) setOrderData(data.data.orders);

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
                {displayData && displayData.map((article, index) => (
                    <ImageListItem key={index}>
                        <Article
                            imageSrc={`/media/${article.variants[0].thumbnail}`}
                            productName={article.variants[0].name}
                            price={article.variants[0].price}
                            productLink={article.variants[0].id}
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