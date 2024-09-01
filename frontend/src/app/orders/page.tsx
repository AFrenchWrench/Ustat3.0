"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link'; // Import Link from react-router-dom
import Box from '@mui/material/Box';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import Cookies from 'js-cookie';
import { faIR } from '@mui/x-data-grid/locales';
import { createTheme, ThemeProvider, useTheme } from '@mui/material/styles';
import jalaali from 'jalaali-js'; // Import the Jalali calendar library

interface Order {
    id: string;
    dueDate: string;
    creationDate: string;
    orderNumber: string;
    totalPrice: number;
    status: string;
}

// Status mapping
const statusMapping: Record<string, string> = {
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

const convertToJalaali = (gregorianDate: string | undefined) => {
    if (gregorianDate) {
        const [year, month, day] = gregorianDate.split('-');
        const jalaaliDate = jalaali.toJalaali(parseInt(year), parseInt(month), parseInt(day));
        return `${jalaaliDate.jy}/${jalaaliDate.jm}/${jalaaliDate.jd}`;
    }
};

// Column definitions with a link in the `orderNumber` column
const columns: GridColDef[] = [
    {
        field: 'orderNumber',
        headerName: 'شماره سفارش',
        flex: 1,  // Takes 1 part of the available space
        minWidth: 150,
        renderCell: (params) => (
            <Link
                href={`/cart/${params.row.id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
            >
                {params.value}
            </Link>
        ),
    },
    {
        field: 'status',
        headerName: 'وضعیت',
        flex: 1,  // Takes 1 part of the available space
        type: "singleSelect",
        minWidth: 100,
        valueOptions: Object.entries(statusMapping).map(([key, value]) => ({
            value: key, // Backend status code (e.g., "P")
            label: value, // Display name in Persian (e.g., "در انتظار تایید")
        })),
        renderCell: (params) => statusMapping[params.value] || params.value,
    },
    {
        field: 'creationDate',
        headerName: 'تاریخ ایجاد',
        flex: 1,  // Takes 1 part of the available space
        minWidth: 100,
    },
    {
        field: 'dueDate',
        headerName: 'تاریخ تحویل',
        flex: 1,  // Takes 1 part of the available space
        minWidth: 100,
    },
    {
        field: 'totalPrice',
        headerName: 'مجموع قیمت',
        flex: 1, type: 'number',
        headerClassName: 'custom-header-style',  // Custom class for header
        cellClassName: 'custom-cell-style',
        minWidth: 100,
    }, // Takes 1 part of the available space
    {
        field: 'transaction',
        headerName: 'رسید',
        flex: 1,  // Takes 1 part of the available space
        minWidth: 100,
        renderCell: (params) => (
            <Link
                href={`/cart/${params.row.id}/${params.row.id}`}
                className='bg-red-600 p-2 text-white hover:text-white hover:bg-red-500 rounded-md'
            >
                سر رسید
            </Link>
        ),
    },
];

export default function OrdersDataGrid() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [pageSize, setPageSize] = useState<number>(5); // Default page size
    const [page, setPage] = useState<number>(0); // Default page
    const [rowCount, setRowCount] = useState<number>(0); // Total number of rows

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
                    query Orders {
                        orders(
                            page: ${page + 1} 
                            perPage: ${pageSize}
                        ) {
                            totalPages
                            totalItems
                            items {
                                id
                                dueDate
                                creationDate
                                orderNumber
                                totalPrice
                                status
                            }
                        }
                    }
                `,
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                const ordersData = data.data.orders.items.map((order: Order) => ({
                    ...order,
                    status: statusMapping[order.status], // Convert status code to Persian name
                    creationDate: convertToJalaali(order.creationDate), // Convert to Jalali date
                    dueDate: convertToJalaali(order.dueDate), // Convert to Jalali date
                }));
                const totalItems = data.data.orders.totalItems; // Get the total item count
                setOrders(ordersData);
                setRowCount(totalItems); // Set the row count for pagination
                setLoading(false);
            })
            .catch((error) => {
                console.error('Error fetching orders data:', error);
                setLoading(false);
            });
    }, [page, pageSize]);

    const existingTheme = useTheme();

    const theme = React.useMemo(
        () =>
            createTheme({}, faIR, existingTheme, {
                direction: 'rtl',
                typography: {
                    fontFamily: 'Vazir-bold', // Define your font family here
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
                height: '85vh',  // Set height using viewport height units for responsiveness
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
                        rows={orders}
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
                        pageSizeOptions={[5, 10, 20]} // Allow users to change page size
                        rowCount={rowCount} // Provide the total number of rows
                        disableRowSelectionOnClick
                        sx={{
                            backgroundColor: 'white',
                            color: 'black',
                            height: '100%',  // Ensure DataGrid takes full height
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
                            // Add specific styles for pagination
                            '& .MuiTablePagination-root': {
                                color: 'white', // Pagination text color
                                fontFamily: 'Vazir-bold', // Pagination font family
                                marginLeft: 'auto',
                                marginRight: '15px',
                            },
                            '& .MuiTablePagination-selectLabel': {
                                color: 'white', // Pagination text color
                                fontFamily: 'Vazir-bold', // Pagination font family
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
