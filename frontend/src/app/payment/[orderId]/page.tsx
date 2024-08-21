"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

const Page = () => {
    const [showInstallmentModal, setShowInstallmentModal] = useState(false);
    const [upfront, setUpfront] = useState<string | null>(null);
    const [checks, setChecks] = useState<string | null>(null);
    const [loading, setLoading] = useState(true); // Loading state for redirection
    const { orderId } = useParams();
    const { push } = useRouter();

    // Function to check if there are transactions for the order
    const checkTransactions = async (): Promise<boolean> => {
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
                setLoading(false); // Set loading to false if no redirection
            }
        };

        redirectIfNeeded();
    }, [orderId, push]);

    // Function to handle the Full Payment transaction
    const handleFullPayment = async () => {
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
                alert('Transaction failed to create.');
                console.log(result.data.createTransaction.errors);
            }
        } catch (error) {
            console.error('An error occurred:', error);
        }
    };

    // Function to handle the Installment transaction
    const handleInstallmentSubmit = async () => {
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
                setShowInstallmentModal(false); // Close modal on success
                push(`/cart/${orderId}/${orderId}`);
            } else {
                alert('Transaction failed to create.');
                console.log(result.data.createTransaction.errors);
            }
        } catch (error) {
            console.error('An error occurred:', error);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <button onClick={handleFullPayment}>Full Payment</button>

            <button onClick={() => setShowInstallmentModal(true)}>Installment</button>

            {showInstallmentModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>Choose Installment Options</h2>
                        <div>
                            <label htmlFor="upfront">Upfront</label>
                            <select
                                id="upfront"
                                value={upfront ?? ''}
                                onChange={(e) => setUpfront(e.target.value)}
                            >
                                <option value="" disabled>Select upfront amount</option>
                                <option value="30">30</option>
                                <option value="40">40</option>
                                <option value="50">50</option>
                                <option value="60">60</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="checks">Checks</label>
                            <select
                                id="checks"
                                value={checks ?? ''}
                                onChange={(e) => setChecks(e.target.value)}
                            >
                                <option value="" disabled>Select number of checks</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                                <option value="4">4</option>
                                <option value="5">5</option>
                                <option value="6">6</option>
                                <option value="7">7</option>
                                <option value="8">8</option>
                            </select>
                        </div>
                        <button onClick={handleInstallmentSubmit}>Submit Installment</button>
                        <button onClick={() => setShowInstallmentModal(false)}>Cancel</button>
                    </div>
                </div>
            )}
            <style jsx>{`
                .modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .modal-content {
                    background-color: #fff;
                    padding: 20px;
                    border-radius: 5px;
                    text-align: center;
                }
            `}</style>
        </div>
    );
};

export default Page;
