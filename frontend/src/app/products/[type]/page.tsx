"use client";

import { ImageList, ImageListItem } from "@mui/material";
import React, { useEffect, useState, useRef, useCallback } from "react";
import Article from "../components/Article";
import { useParams } from "next/navigation";
import Cookies from "js-cookie";
import useMediaQuery from '@mui/material/useMediaQuery';
import LoadingArticle from "../components/loadingArticle";
import { useTitle } from "@/components/TitleContext";
import useDynamicTitle from "@/components/useDynamicTitle";

interface Ivariants {
    id: string;
    name: string;
    price: string;
    thumbnail: string;
    isForBusiness: boolean;
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

type Titles = {
    [key: string]: {
        en: string;
        fa: string;
    };
};

const typeNames: Record<string, { en: string; fa: string }> = {
    S: { en: "Sofas", fa: "مبل ها" },
    B: { en: "Bed Sets", fa: "سرویس های خواب" },
    M: { en: "Tables and Chairs", fa: "میز و صندلی" },
    J: { en: "Coffee Tables and Side Tables", fa: "جلومبلی و عسلی" },
    C: { en: "Console Mirrors and TV Stands", fa: "آینه کنسول و میز تلوزیون" },
};


const titles: Titles = {
    'default': {
        en: 'Ustattecaret-Products',
        fa: 'اوستات تجارت-محصولات',
    },
};

type LangCode = 'en' | 'fa';


const Page = () => {
    const params = useParams();
    const type = Array.isArray(params.type) ? params.type[0] : params.type || '';
    const [displayData, setDisplayData] = useState<DisplayItem[]>([]);
    const [orderData, setOrderData] = useState<DisplayOrder[]>([]);
    const [page, setPage] = useState(1); // Track the current page
    const [totalPages, setTotalPages] = useState<number | null>(null); // Track total pages
    const [loading, setLoading] = useState(false); // Track loading state
    const [fetchTrigger, setFetchTrigger] = useState(false); // Trigger for re-fetching data


    const isSmallScreen = useMediaQuery('(max-width:740px)');
    const isMediumScreen = useMediaQuery('(max-width:1000px)');

    const observer = useRef<IntersectionObserver | null>(null); // Ref for intersection observer
    const { setTitle } = useTitle();


    useDynamicTitle(); // This will set the document title based on context

    useEffect(() => {
        // Determine the language code
        const language = navigator.language || 'en';
        const langCode: LangCode = (language.split('-')[0] as LangCode) || 'en';

        // Get product type name
        const productType = typeNames[type as string] || { en: 'Default', fa: 'پیش‌فرض' };

        // Set title based on product type or default
        const pageTitle = `${titles['default'][langCode]}-${productType[langCode]}`;
        setTitle(pageTitle);

        return () => setTitle('Ustattecaret-Products'); // Reset title on unmount if desired
    }, [type, setTitle]);



    const fetchUser = async () => {
        try {
            const token = Cookies.get('Authorization');
            if (!token) {
                return false
            }
            const response = await fetch('/api/users/graphql/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? token : '',
                },
                body: JSON.stringify({
                    query: `
                        query CurrentUser {
                            currentUser {
                                business {
                                    isConfirmed
                                }
                            }
                        }
                    `,
                }),
            });

            const data = await response.json();

            if (!response.ok) throw new Error('Network response was not ok');
            if (data.errors || !data.data.currentUser) throw new Error(data.errors ? data.errors[0].message : 'No item found');

            console.log(data.data.currentUser.business.isConfirmed);

            return data.data.currentUser.business.isConfirmed

        } catch (error) {
            console.log(error);
            return false

        }
    }

    const fetchUserData = async (page: number) => {
        try {
            setLoading(true);
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
                            isForBusiness
                          }
                        }
                      }
                      ${token
                            ? `
                        orders(filter: { status: "ps" }) {
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

            if (data.errors || !data.data.displayItems) {
                throw new Error(data.errors ? data.errors[0].message : "No items found");
            }

            let filteredItems = data.data.displayItems.items;

            // Apply the isForBusiness filter
            if (await fetchUser()) {
                // Map through the items and filter the variants inside each item
                filteredItems = filteredItems
                    .map((item: DisplayItem) => {
                        // Filter only the variants where isForBusiness is true
                        const businessVariants = item.variants.filter(variant => variant.isForBusiness === true);

                        // Return the item with only the business-related variants
                        return { ...item, variants: businessVariants };
                    })
                    .filter((item: DisplayItem) => item.variants.length > 0);
                // Keep only items that have business variants
                console.log(filteredItems);

            } else {
                filteredItems = filteredItems
                    .map((item: DisplayItem) => {
                        // Filter only the variants where isForBusiness is true
                        const businessVariants = item.variants.filter(variant => variant.isForBusiness === false);

                        // Return the item with only the business-related variants
                        return { ...item, variants: businessVariants };
                    })
                    .filter((item: DisplayItem) => item.variants.length > 0);
                console.log(filteredItems);

            }


            if (page !== 1 || filteredItems.length !== displayData.length) {
                setDisplayData((prevData) => {
                    const newData = filteredItems;
                    const isDifferent = JSON.stringify(prevData) !== JSON.stringify([...prevData, ...newData]);
                    return isDifferent ? [...prevData, ...newData] : prevData;
                });
            }

            setTotalPages(data.data.displayItems.totalPages);
            setOrderData(data.data.orders?.items);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };



    useEffect(() => {
        fetchUserData(page); // Fetch data when the component mounts
    }, [page, type]); // Re-fetch data if the page or type changes

    useEffect(() => {
        if (fetchTrigger) {
            fetchUserData(page);
            setFetchTrigger(false);
        }
    }, [fetchTrigger]); // Fetch updated data when fetchTrigger is true

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
        setFetchTrigger(true);
    };

    const calculateCols = () => {
        if (isSmallScreen) return 2;
        if (isMediumScreen) return 3;
        return 4;
    };

    return (
        <section className="flex flex-col gap-5 items-center my-10">
            <ImageList gap={8} sx={{ width: "93%" }} cols={calculateCols()}>
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
                {loading && <LoadingArticle />}
                {loading && <LoadingArticle />}
                {loading && <LoadingArticle />}
                {loading && <LoadingArticle />}
                {loading && <LoadingArticle />}
                {loading && <LoadingArticle />}
            </ImageList>
        </section>
    );
};

export default Page;
