"use client"; // Add this line to indicate that the component is client-side

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import Cookies from 'js-cookie';
import { faIR } from '@mui/x-data-grid/locales';
import { createTheme, ThemeProvider, useTheme } from '@mui/material/styles';
import jalaali from 'jalaali-js';

interface Transaction {
    id: string;
    dueDate: string;
    creationDate: string;
    transactionNumber: string;
    amount: number;
    status: string;
    order: {
        orderNumber: string;
    };
}

// Updated status mapping for transactions
const statusMapping: Record<string, string> = {
    "p": "در انتظار پرداخت",  // Pending Payment
    "c": "لغو شده",           // Canceled
    "d": "پرداخت شده",        // Paid
};

const convertToJalaali = (gregorianDate: string | undefined) => {
    if (gregorianDate) {
        const [year, month, day] = gregorianDate.split('-');
        const jalaaliDate = jalaali.toJalaali(parseInt(year), parseInt(month), parseInt(day));
        return `${jalaaliDate.jy}/${jalaaliDate.jm}/${jalaaliDate.jd}`;
    }
};

// Column definitions with a link in the `transactionNumber` column
const columns: GridColDef[] = [
    {
        field: 'transactionNumber',
        headerName: 'شماره تراکنش',
        flex: 1,
        minWidth: 150,
        renderCell: (params) => (
            <Link
                href={`/transaction/${params.row.id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
            >
                {params.value}
            </Link>
        ),
    },
    {
        field: 'order.orderNumber',
        headerName: 'شماره سفارش',
        flex: 1,
        minWidth: 150,
        renderCell: (params) => params.row.order?.orderNumber || 'N/A',
    },
    {
        field: 'status',
        headerName: 'وضعیت',
        flex: 1,
        type: "singleSelect",
        minWidth: 100,
        valueOptions: Object.entries(statusMapping).map(([key, value]) => ({
            value: key,
            label: value,
        })),
        renderCell: (params) => statusMapping[params.value] || params.value,
    },
    {
        field: 'creationDate',
        headerName: 'تاریخ ایجاد',
        flex: 1,
        minWidth: 100,
    },
    {
        field: 'dueDate',
        headerName: 'تاریخ تحویل',
        flex: 1,
        minWidth: 100,
    },
    {
        field: 'amount',
        headerName: 'مبلغ',
        flex: 1, type: 'number',
        headerClassName: 'custom-header-style',
        cellClassName: 'custom-cell-style',
        minWidth: 100,
    },
];

export default function TransactionsDataGrid() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [pageSize, setPageSize] = useState<number>(5);
    const [page, setPage] = useState<number>(0);
    const [rowCount, setRowCount] = useState<number>(0);

    useEffect(() => {
        const token = Cookies.get('Authorization');

        fetch('http://localhost/api/sales/graphql/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? token : "",
            },
            body: JSON.stringify({
                query: `
                    query Transactions {
                        transactions(
                            page: ${page + 1} 
                            perPage: ${pageSize}
                        ) {
                            totalPages
                            totalItems
                            items {
                                id
                                dueDate
                                creationDate
                                transactionNumber
                                amount
                                status
                                order {
                                    orderNumber
                                }
                            }
                        }
                    }
                `,
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                const transactionsData = data.data.transactions.items.map((transaction: Transaction) => ({
                    ...transaction,
                    status: statusMapping[transaction.status],
                    creationDate: convertToJalaali(transaction.creationDate),
                    dueDate: convertToJalaali(transaction.dueDate),
                }));
                const totalItems = data.data.transactions.totalItems;
                setTransactions(transactionsData);
                setRowCount(totalItems);
                setLoading(false);
            })
            .catch((error) => {
                console.error('Error fetching transactions data:', error);
                setLoading(false);
            });
    }, [page, pageSize]);

    const existingTheme = useTheme();

    const theme = React.useMemo(
        () =>
            createTheme({}, faIR, existingTheme, {
                direction: 'rtl',
                typography: {
                    fontFamily: 'Vazir-bold',
                },
            }),
        [existingTheme],
    );

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '85vh',
                width: '100%',
                maxWidth: '800px',
                margin: '50px auto',
                bgcolor: 'rgb(32,32,32)',
                color: 'white',
                p: 2,
                borderRadius: 2,
                boxShadow: 3,
            }}
        >
            <ThemeProvider theme={theme}>
                <div dir='rtl' style={{ width: '100%', height: '100%' }}>
                    <DataGrid
                        rows={transactions}
                        columns={columns}
                        loading={loading}
                        getRowId={(row) => row.id}
                        pagination
                        paginationMode="server"
                        paginationModel={{ page, pageSize }}
                        onPaginationModelChange={(newModel) => {
                            if (newModel) {
                                setPage(newModel.page ?? 0);
                                setPageSize(newModel.pageSize ?? 5);
                            }
                        }}
                        pageSizeOptions={[5, 10, 20]}
                        rowCount={rowCount}
                        disableRowSelectionOnClick
                        sx={{
                            backgroundColor: 'white',
                            color: 'black',
                            height: '100%',
                            '& .MuiDataGrid-cell': {
                                borderColor: 'black',
                                textAlign: 'start',
                                fontFamily: 'Vazir-bold',
                            },
                            '& .MuiDataGrid-columnHeaders': {
                                backgroundColor: '#D32F2F',
                                color: 'black',
                                fontFamily: 'Vazir-bold',
                            },
                            '& .MuiDataGrid-footerContainer': {
                                backgroundColor: '#D32F2F',
                                color: 'white',
                                fontFamily: 'Vazir-bold',
                            },
                            '& .custom-header-style': {
                                direction: 'ltr',
                                flexDirection: 'row-reverse',
                            },
                            '& .custom-header-style .MuiDataGrid-columnHeaderDraggableContainer': {
                                flexDirection: 'row-reverse',
                            },
                            '& .custom-header-style .MuiDataGrid-columnSeparator': {
                                marginRight: '10px',
                            },
                            '& .MuiTablePagination-root': {
                                color: 'white',
                                fontFamily: 'Vazir-bold',
                                marginLeft: 'auto',
                                marginRight: '15px',
                            },
                            '& .MuiTablePagination-selectLabel': {
                                color: 'white',
                                fontFamily: 'Vazir-bold',
                            },
                            '& .MuiDataGrid-columnSeparator': {
                                position: 'relative',
                            },
                        }}
                    />
                </div>
            </ThemeProvider>
        </Box>
    );
}
