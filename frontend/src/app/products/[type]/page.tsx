"use client";

import { ImageList, ImageListItem } from "@mui/material";
import React, { useEffect, useState, useRef, useCallback } from "react";
import Article from "../components/Article";
import { useParams } from "next/navigation";
import Cookies from "js-cookie";



interface Ivariants {
    id: string;
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
    const { type } = useParams();
    const [displayData, setDisplayData] = useState<DisplayItem[]>([]);
    const [orderData, setOrderData] = useState<DisplayOrder[]>([]);
    const [page, setPage] = useState(1); // Track the current page
    const [totalPages, setTotalPages] = useState<number | null>(null); // Track total pages
    const [loading, setLoading] = useState(false); // Track loading state

    const observer = useRef<IntersectionObserver | null>(null); // Ref for intersection observer

    const fetchUserData = async (page: number) => {
        try {
            setLoading(true);

            // Simulate delay before fetching data
            await new Promise((resolve) => setTimeout(resolve, 500)); // 0.5-second delay

            const token = Cookies.get("Authorization");
            const response = await fetch("/api/sales/graphql/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: token ? token : "",
                },
                body: JSON.stringify({
                    query: `
                        query DisplayItems($page: Int!, $filter: DisplayItemFilterInput!) {
                          displayItems(page: $page, perPage: 6, filter: $filter) {
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
                          ${token
                            ? `
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
                              `
                            : ""
                        }
                        }
                    `,
                    variables: {
                        page,
                        filter: { type: type.toString().toLowerCase() },
                    },
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error("Network response was not ok");
            }

            if (data.errors || !data.data.displayItems || (token && !data.data.orders)) {
                throw new Error(data.errors ? data.errors[0].message : "No items found");
            }

            // Update data efficiently using spread syntax and concatenation
            setDisplayData((prevData) => [...prevData, ...data.data.displayItems.items]);
            console.log(data.data.displayItems.items);

            setTotalPages(data.data.displayItems.totalPages);
            if (token) setOrderData(data.data.orders);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserData(page); // Fetch data when the component mounts
        console.log("hit end of page");

    }, [page, type]); // Re-fetch data if the page or type changes

    const lastItemRef = useCallback(
        (node: HTMLLIElement | null) => {
            if (loading || page >= (totalPages || 1)) return; // Avoid unnecessary re-observing

            if (observer.current) observer.current.disconnect();

            observer.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    setPage((prevPage) => prevPage + 1); // Increment the page number to fetch the next set of data
                }
            }, {
                rootMargin: '10px', // Trigger fetch a bit before reaching the end
            });

            if (node) observer.current.observe(node);
        }, [loading, page, totalPages]
    );

    const updateOrderData = (newOrderData: DisplayOrder[]) => {
        setOrderData(newOrderData);
        setPage(1); // Reset the page to 1 when updating the order data
    };

    return (
        <section className="flex flex-col gap-5 items-center mt-10">
            <ImageList gap={8} sx={{ width: "80%" }} cols={3}>
                {displayData &&
                    displayData.map((article, index) => (
                        article.variants.length > 0 ? (
                            <ImageListItem
                                key={index} // Use unique ID for key
                                ref={index === displayData.length - 1 ? lastItemRef : null} // Attach ref to last item
                            >
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
                        ) : null
                    ))}
            </ImageList>
            {loading && <p>Loading more items...</p>}
        </section>
    );
};

export default Page;
