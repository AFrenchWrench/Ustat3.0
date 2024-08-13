"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link'; // Import Link from react-router-dom
import Box from '@mui/material/Box';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import Cookies from 'js-cookie';
import { faIR } from '@mui/x-data-grid/locales';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import jalaali from 'jalaali-js'; // Import the Jalali calendar library

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
        width: 150,
        renderCell: (params) => (
            <Link
                href={`/cart/${params.row.id}`} // Use the row id to build the link
                style={{ textDecoration: 'none', color: 'inherit' }} // Customize link styles
            >
                {params.value}
            </Link>
        ),
    },
    {
        field: 'status',
        headerName: 'وضعیت',
        width: 130,
        renderCell: (params) => statusMapping[params.value] || params.value,
    },
    {
        field: 'creationDate',
        headerName: 'تاریخ ایجاد',
        width: 130,
        valueFormatter: (params) => convertToJalaali(params),
    },
    {
        field: 'dueDate',
        headerName: 'تاریخ تحویل',
        width: 130,
        valueFormatter: (params) => convertToJalaali(params),
    },
    { field: 'totalPrice', headerName: 'مجموع قیمت', width: 150, type: 'number' },
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
                const ordersData = data.data.orders.items;
                const totalItems = data.data.orders.totalItems; // Get the total item count
                setOrders(ordersData);
                setRowCount(totalItems); // Set the row count for pagination
                setLoading(false);
            })
            .catch((error) => {
                console.error('Error fetching orders data:', error);
                setLoading(false);
            });
    }, [page, pageSize]); // Fetch data when page or pageSize changes

    const theme = React.useMemo(
        () =>
            createTheme({}, faIR, {
                direction: 'rtl',
                typography: {
                    fontFamily: 'Vazir-bold', // Define your font family here
                },
            }),
        [],
    );

    return (
        <Box
            sx={{
                height: 500,
                width: '80%',
                margin: 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                bgcolor: 'rgb(32,32,32)',
                color: 'white',
                p: 2,
                borderRadius: 2,
                boxShadow: 3,
            }}
        >
            <ThemeProvider theme={theme}>
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
                        // Add specific styles for pagination
                        '& .MuiTablePagination-root': {
                            color: 'white', // Pagination text color
                            fontFamily: 'Vazir-bold', // Pagination font family
                            marginLeft: 'auto',
                            marginRight: '15px'
                        },
                        '& .MuiTablePagination-selectLabel': {
                            color: 'white', // Pagination text color
                            fontFamily: 'Vazir-bold', // Pagination font family
                        },
                    }}
                />
            </ThemeProvider>
        </Box>
    );
}
