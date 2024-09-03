"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Cookies from 'js-cookie';
import Style from '@/allStyles/transactions.module.css';
import jalaali from 'jalaali-js'; // Import jalaali-js
import Loading from '@/components/Loading';

import Alert from '@/components/Alert';

const statusChoices: { [key: string]: string } = {
    "P": "در انتظار پرداخت",
    "PD": "پرداخت شده",
    "C": "لغو شده",
    "A": "تایید شده",
    "D": "تایید نشده",
};

interface Transaction {
    id: string;
    title: string;
    status: string;
    amount: number;
    creationDate: string;
    dueDate: string;
    isCheck: boolean;
    proof: string | null;
}

const Page = () => {
    const { transaction } = useParams();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<{ [key: string]: string }>({}); // To store selected status for each transaction
    const [refreshKey, setRefreshKey] = useState<number>(0); // State to trigger refetch
    const [alert, setAlert] = useState<{ message: string; type: 'success' | 'failed' } | null>(null);


    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const user = Cookies.get("Authorization");
                const response = await fetch('http://localhost/api/admin_dash/graphql/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': user ? user : '',
                    },
                    body: JSON.stringify({
                        query: `
                            query Transactions {
                                transactions(filter: { order_Id: ${transaction} }) {
                                    totalPages
                                    totalItems
                                    items {
                                        id
                                        title
                                        status
                                        amount
                                        creationDate
                                        dueDate
                                        isCheck
                                        proof
                                    }
                                }
                            }
                        `,
                    }),
                });

                const result = await response.json();
                if (result.data) {
                    setTransactions(result.data.transactions.items);
                } else {
                    setError('Failed to fetch transactions');
                }
            } catch (err) {
                console.error(err);
                setError('An error occurred while fetching transactions');
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, [transaction, refreshKey]);

    const handleStatusChange = (transactionId: string, newStatus: string) => {
        setSelectedStatus((prev) => ({
            ...prev,
            [transactionId]: newStatus,
        }));
    };

    const handleStatusUpdate = async (transactionId: string) => {
        const Authorization = Cookies.get("Authorization");
        const newStatus = selectedStatus[transactionId];

        try {
            const response = await fetch(`http://localhost/api/admin_dash/graphql/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': Authorization ? Authorization : '',
                },
                body: JSON.stringify({
                    query: `
                        mutation UpdateTransaction {
                            updateTransaction(input: { id: "${transactionId}", status: "${newStatus}" }) {
                                success
                                errors
                            }
                        }
                    `,
                }),
            });

            const result = await response.json();

            if (result.data.updateTransaction.success) {
                setAlert({ message: "عملیات موقیت آمیز بود", type: "success" });
                setRefreshKey(prev => prev + 1); // Refresh the data
            } else if (result.data.updateTransaction.errors) {
                setAlert({ message: result.data.updateTransaction.errors, type: "failed" });
            }
        } catch (err) {
            console.error(err);
            setAlert({ message: "مشکلی پیش آمده", type: "failed" });
        }
    };

    const convertToJalaali = (gregorianDate: string | undefined) => {
        if (gregorianDate) {
            const [year, month, day] = gregorianDate.split('-');
            const jalaaliDate = jalaali.toJalaali(parseInt(year), parseInt(month), parseInt(day));
            return `${jalaaliDate.jy}/${jalaaliDate.jm}/${jalaaliDate.jd}`;
        }
    };

    const closeAlert = () => {
        setAlert(null);
    };

    if (loading) return <Loading />;
    if (error) return <div className={Style.error}>{error}</div>;

    return (
        <section className={Style.transactionsSection}>
            <ul className={Style.transactionsList}>
                <h1 className={Style.header}>رسید ها</h1>
                {transactions.map((transaction) => (
                    <li key={transaction.id} className={Style.transactionItemAdmin}>
                        <div className='ml-[auto]'>
                            <h2 className={Style.title}>{transaction.title}</h2>
                            <p>وضعیت : {statusChoices[transaction.status] || 'Unknown Status'}</p>
                            <p>{Number(transaction.amount).toLocaleString('en-US')} تومان</p>
                            <p>تاریخ ساخت : {convertToJalaali(transaction.creationDate)}</p>
                            <p>تاریخ تحویل : {convertToJalaali(transaction.dueDate)}</p>
                            <p>{transaction.isCheck ? 'چک' : 'نقدی'}</p>
                            <p>{transaction.proof ? "عکس ارسال شده" : "عکس ارسال نشده"}</p>

                            {/* Only show the select and submit button if proof is available */}
                            {transaction.proof && (
                                <div className={Style.actionContainer}>
                                    <select
                                        value={selectedStatus[transaction.id] || transaction.status}
                                        onChange={(e) => handleStatusChange(transaction.id, e.target.value)}
                                        className={Style.statusSelect}
                                        name='status'
                                    >
                                        {Object.keys(statusChoices).map((status) => (
                                            <option key={status} value={status}>
                                                {statusChoices[status]}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={() => handleStatusUpdate(transaction.id)}
                                        className={Style.submitButton}
                                    >
                                        ثبت
                                    </button>
                                </div>
                            )}
                        </div>



                        {transaction.proof && (
                            <div className={Style.proofContainer}>
                                <img
                                    src={`/media/${transaction.proof}`} // URL where the proof image is served
                                    alt="Proof"
                                    className={Style.proofImage}
                                />
                            </div>
                        )}
                    </li>
                ))}
            </ul>
            {alert && (
                <Alert
                    message={alert.message}
                    type={alert.type}
                    onClose={closeAlert}
                />
            )}
        </section>
    );
};

export default Page;
