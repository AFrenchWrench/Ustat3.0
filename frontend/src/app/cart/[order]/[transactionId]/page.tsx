"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Cookies from 'js-cookie';
import Style from '@/allStyles/transactions.module.css';
import jalaali from 'jalaali-js'; // Import jalaali-js
import Loading from '@/components/Loading';
import NotFound from '@/components/notFound';
import Alert from '@/components/Alert';
import { useTitle } from '@/components/TitleContext';
import useDynamicTitle from '@/components/useDynamicTitle';

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

type Titles = {
    [key: string]: string;
};

const titles: Titles = {
    en: 'Ustattecaret-Cart-transaction',
    fa: 'اوستات تجارت-سبد خرید-رسید',
};

const Page = () => {
    const { transactionId } = useParams();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<{ [key: string]: File | null }>({});
    const [previewUrl, setPreviewUrl] = useState<{ [key: string]: string | null }>({});
    const [refreshKey, setRefreshKey] = useState<number>(0); // State to trigger refetch

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
        const fetchTransactions = async () => {
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
            const response = await fetch(`/api/sales/transaction/${transactionId}/upload-image/`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': Authorization ? Authorization : '',
                },
            });

            if (response.ok) {
                setAlert({ message: "عکس با موفقیت بارگذاری شد", type: "success" })
                setSelectedFile((prev) => ({ ...prev, [transactionId]: null }));
                setPreviewUrl((prev) => ({ ...prev, [transactionId]: null }));
                setRefreshKey(prev => prev + 1); // Increment refreshKey to trigger refetch
            } else {
                setAlert({ message: "عکس بارگذاری نشد", type: "failed" })
            }
        } catch (err) {
            console.error(err);
            setAlert({ message: "مشکلی پیش آمده", type: "failed" })
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


    const closeAlert = () => {
        setAlert(null);
    };

    if (loading) return <div>{<Loading />}</div>;
    if (transactions.length < 1) return <NotFound />;

    return (
        <section className={Style.transactionsSection}>
            <ul className={Style.transactionsList}>
                <h1 className={Style.header}>سر رسید ها</h1>
                {transactions.map((transaction) => (
                    <li key={transaction.id} className={Style.transactionItem}>
                        <h2 className={Style.title}>{transaction.title}</h2>
                        <div className={Style.PInfo}>
                            <div className={Style.infoP}>
                                <p>وضعیت : {statusChoices[transaction.status] || 'Unknown Status'}</p>
                                <p>{Number(transaction.amount).toLocaleString('en-US')} تومان</p>
                                <p>تاریخ ساخت : {convertToJalaali(transaction.creationDate)}</p>
                                <p>تاریخ تحویل : {convertToJalaali(transaction.dueDate)}</p>
                                <p>{transaction.isCheck ? 'چک' : 'نقدی'}</p>
                                <p>{transaction.proof ? "عکس ارسال شده" : "عکس ارسال نشده"}</p>
                            </div>
                            {transaction.proof && transaction.status !== "D" ? (
                                <div className={Style.proofContainer}>
                                    <div className={Style.imgContainer}>
                                        <img
                                            src={`/media/${transaction.proof}`} // URL where the proof image is served
                                            alt="Proof"
                                            className={Style.proofImage}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className={Style.uploadContainer}>
                                    <div className={Style.imgContainer}>
                                        {(previewUrl[transaction.id] || transaction.proof) && (
                                            <img
                                                src={previewUrl[transaction.id]! || `/media/${transaction.proof}`}
                                                alt="Preview"
                                                className={Style.previewImage}
                                            />
                                        )}
                                    </div>
                                    <div className={Style.chooseImageButtonContainer}>
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
                                                    setAlert({ message: "عکسی انتخاب نشده", type: "failed" });
                                                }
                                            }}
                                            className={Style.uploadButton}
                                        >
                                            ارسال
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                    </li>
                ))}
            </ul>
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
