"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Cookies from 'js-cookie';
import Style from '@/allStyles/transactions.module.css';
import jalaali from 'jalaali-js'; // Import jalaali-js

const statusChoices: { [key: string]: string } = {
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
    const { transactionId } = useParams();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<{ [key: string]: File | null }>({});
    const [previewUrl, setPreviewUrl] = useState<{ [key: string]: string | null }>({});
    const [refreshKey, setRefreshKey] = useState<number>(0); // State to trigger refetch

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const user = Cookies.get("Authorization");
                const response = await fetch('http://localhost/api/sales/graphql/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': user ? user : '',
                    },
                    body: JSON.stringify({
                        query: `
                            query Transactions {
                                transactions(filter: { order_Id: ${transactionId} }) {
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
    }, [transactionId, refreshKey]); // Add refreshKey to dependencies

    const handleImageUpload = async (transactionId: string, file: File) => {
        const formData = new FormData();
        formData.append('proof', file);

        const Authorization = Cookies.get("Authorization");

        try {
            const response = await fetch(`http://localhost/api/sales/transaction/${transactionId}/upload-image/`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': Authorization ? Authorization : '',
                },
            });

            if (response.ok) {
                alert('Image uploaded successfully!');
                setSelectedFile((prev) => ({ ...prev, [transactionId]: null }));
                setPreviewUrl((prev) => ({ ...prev, [transactionId]: null }));
                setRefreshKey(prev => prev + 1); // Increment refreshKey to trigger refetch
            } else {
                alert('Failed to upload image');
            }
        } catch (err) {
            console.error(err);
            alert('An error occurred while uploading the image');
        }
    };

    const handleFileChange = (transactionId: string, file: File) => {
        const objectUrl = URL.createObjectURL(file);
        setSelectedFile((prev) => ({ ...prev, [transactionId]: file }));
        setPreviewUrl((prev) => ({ ...prev, [transactionId]: objectUrl }));
    };

    // Convert Gregorian date to Shamsi date
    const convertToJalaali = (gregorianDate: string | undefined) => {
        if (gregorianDate) {
            const [year, month, day] = gregorianDate.split('-');
            const jalaaliDate = jalaali.toJalaali(parseInt(year), parseInt(month), parseInt(day));
            return `${jalaaliDate.jy}/${jalaaliDate.jm}/${jalaaliDate.jd}`;
        }
    };

    if (loading) return <div className={Style.loading}>Loading...</div>;
    if (error) return <div className={Style.error}>{error}</div>;

    return (
        <section className={Style.transactionsSection}>
            <h1 className={Style.header}>Transactions</h1>
            <ul className={Style.transactionsList}>
                {transactions.map((transaction) => (
                    <li key={transaction.id} className={Style.transactionItem}>
                        <div>
                            <h2 className={Style.title}>{transaction.title}</h2>
                            <p>وضعیت : {statusChoices[transaction.status] || 'Unknown Status'}</p>
                            <p>{Number(transaction.amount).toLocaleString('en-US')} تومان</p>
                            <p>تاریخ ساخت : {convertToJalaali(transaction.creationDate)}</p>
                            <p>تاریخ تحویل : {convertToJalaali(transaction.dueDate)}</p>
                            <p>{transaction.isCheck ? 'چک' : 'نقدی'}</p>
                            <p>{transaction.proof ? "عکس ارسال شده" : "عکس ارسال نشده"}</p>
                        </div>
                        {transaction.proof ? (
                            <div className={Style.proofContainer}>
                                <img
                                    src={`/media/${transaction.proof}`} // URL where the proof image is served
                                    alt="Proof"
                                    className={Style.proofImage}
                                />
                            </div>
                        ) : (
                            <div className={Style.uploadContainer}>
                                {previewUrl[transaction.id] && (
                                    <img
                                        src={previewUrl[transaction.id]!}
                                        alt="Preview"
                                        className={Style.previewImage}
                                    />
                                )}
                                <div>
                                    <label className={Style.fileLable} htmlFor={`proofInput${transaction.id}`}>انتخاب عکس</label>
                                    <input
                                        id={`proofInput${transaction.id}`}
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files.length > 0) {
                                                handleFileChange(transaction.id, e.target.files[0]);
                                            }
                                        }}
                                        className={Style.fileInput}
                                    />

                                    <button
                                        onClick={() => {
                                            const file = selectedFile[transaction.id];
                                            if (file) {
                                                handleImageUpload(transaction.id, file);
                                            } else {
                                                alert('No file selected');
                                            }
                                        }}
                                        className={Style.uploadButton}
                                    >
                                        ارسال
                                    </button>
                                </div>
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </section>
    );
};

export default Page;
