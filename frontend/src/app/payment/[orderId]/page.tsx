"use client";

import Style from "@/allStyles/payment.module.css"

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import FullPayment from "./components/FullPayment";
import Installment from "./components/Installment";
import Loading from "@/components/Loading";
import NotFound from "@/components/notFound";
import Alert from "@/components/Alert";
import { useTitle } from "@/components/TitleContext";
import useDynamicTitle from "@/components/useDynamicTitle";


interface Iitems {
    name: string;
    price: number;
    quantity: number;
}

interface IuserData {
    isConfirmed: boolean;
    rank: "A" | "B" | "C"
}

type Titles = {
    [key: string]: string;
};

const titles: Titles = {
    en: 'Ustattecaret-Cart-Payment',
    fa: 'اوستات تجارت-پرداخت',
};

const Page = () => {
    const [loading, setLoading] = useState(true); // Loading state for redirection
    const { orderId } = useParams();
    const { push } = useRouter();
    const [items, setItems] = useState<Iitems[]>([])
    const [totalPrice, setTotalPrice] = useState<number>()
    const [userData, setUserData] = useState<IuserData>()

    const [alertMui, setAlert] = useState<{ message: string; type: 'success' | 'failed' } | null>(null);
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
        const fetchOrderItems = async () => {
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
                                    order(id: ${orderId}) {
                                        totalPrice
                                        items {
                                            price
                                            name
                                            quantity
                                        }
                                    }
                                }
                        `,
                    }),
                });

                const result = await response.json();
                if (!result) {
                    console.log("netWorkError");
                }
                if (result.errors) {
                    console.log(result.errors);
                }
                if (result.data.order) {
                    setItems(result.data.order.items)
                    setTotalPrice(result.data.order.totalPrice)
                }
            }
            catch (error) {
                console.log(error);

            }
            finally {
                setLoading(false)
            }
        }
        const fetchUserData = async () => {
            try {
                const user = Cookies.get("Authorization");
                const response = await fetch('/api/users/graphql/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': user ? user : '',
                    },
                    body: JSON.stringify({
                        query: `
                                query CurrentUser {
                                    currentUser {
                                        business {
                                            isConfirmed
                                            rank
                                        }
                                    }
                                }
                        `,
                    }),
                });

                const result = await response.json();
                if (!result) {
                    console.log("netWorkError");
                }
                if (result.errors) {
                    console.log(result.errors);
                }
                if (result.data.currentUser) {
                    setUserData(result.data.currentUser.business)
                }
            }
            catch (error) {
                console.log(error);
            }
        }
        fetchUserData()
        fetchOrderItems()
    }, [])




    // Function to check if there are transactions for the order
    const checkTransactions = async (): Promise<boolean> => {
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
                        query Transactions {
                            transactions(filter: { order_Id: "${orderId}" }) {
                                totalItems
                            }
                        }
                    `,
                }),
            });

            const result = await response.json();
            if (result.data && result.data.transactions.totalItems > 0) {
                return true;
            } else {
                return false;
            }
        } catch (error) {
            console.error('An error occurred while checking transactions:', error);
            return false;
        }
    };

    useEffect(() => {
        const redirectIfNeeded = async () => {
            const hasTransactions = await checkTransactions();
            if (hasTransactions) {
                push(`/cart/${orderId}/${orderId}`);
            } else {
                return
            }
        };

        redirectIfNeeded();
    }, [orderId, push]);

    // Function to handle the Full Payment transaction
    const handleFullPayment = async () => {
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
                        mutation CreateTransaction($input: CreateTransactionInput!) {
                            createTransaction(input: $input) {
                                errors
                                success
                            }
                        }
                    `,
                    variables: {
                        input: {
                            order: orderId,
                            upfront: 100,
                            checks: 0,
                        },
                    },
                }),
            });

            const result = await response.json();

            if (result.data.createTransaction.success) {
                push(`/cart/${orderId}/${orderId}`);
            } else {
                if (result.data.createTransaction.errors) {
                    setAlert({ message: JSON.parse(result.data.createTransaction.errors), type: "failed" })
                }
                else {
                    setAlert({ message: "مشکلی پیش آمده", type: 'failed' })
                }
            }
        } catch (error) {
            console.error('An error occurred:', error);
        }
    };

    // Function to handle the Installment transaction
    const handleInstallmentSubmit = async (upfront: string, checks: string) => {
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
                        mutation CreateTransaction($input: CreateTransactionInput!) {
                            createTransaction(input: $input) {
                                errors
                                success
                            }
                        }
                    `,
                    variables: {
                        input: {
                            order: orderId,
                            upfront: parseInt(upfront ?? '100'),
                            checks: parseInt(checks ?? '0'),
                        },
                    },
                }),
            });

            const result = await response.json();

            if (result.data.createTransaction.success) {
                push(`/cart/${orderId}/${orderId}`);
            } else {
                if (result.data.createTransaction.errors) {
                    setAlert({ message: JSON.parse(result.data.createTransaction.errors), type: "failed" })
                }
                else {
                    setAlert({ message: "مشکلی پیش آمده", type: 'failed' })
                }
            }
        } catch (error) {
            console.error('An error occurred:', error);
        }
    };

    const closeAlert = () => {
        setAlert(null);
    };

    if (loading) return <div>{<Loading />}</div>;
    if (items.length < 1) return <NotFound />

    return (
        <section className={Style.paymentSection}>
            <FullPayment totalPrice={totalPrice} items={items} payFunction={handleFullPayment} />
            <Installment totalPrice={totalPrice} items={items} payFunction={handleInstallmentSubmit} rank={userData?.rank ?? null} />
            {alertMui && (
                <Alert
                    message={alertMui.message}
                    type={alertMui.type}
                    onClose={closeAlert}
                />
            )}
        </section>
    );
};

export default Page;
