"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import { DataGrid, GridColDef, GridRowModel } from '@mui/x-data-grid';
import Cookies from 'js-cookie';
import { faIR } from '@mui/x-data-grid/locales';
import { createTheme, ThemeProvider, useTheme } from '@mui/material/styles';
import jalaali from 'jalaali-js';

interface Order {
    id: string;
    dueDate: string;
    creationDate: string;
    orderNumber: string;
    totalPrice: number;
    status: string;
    user: {
        username: string;
        firstName: string;
        email: string;
    };
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

const columns: GridColDef[] = [
    {
        field: 'orderNumber',
        headerName: 'شماره سفارش',
        flex: 1,
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
        flex: 1,
        type: "singleSelect",
        minWidth: 100,
        valueOptions: Object.entries(statusMapping).map(([key, value]) => ({
            value: key,
            label: value,
        })),
        renderCell: (params) => statusMapping[params.value] || params.value,
        editable: true
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
        field: 'totalPrice',
        headerName: 'مجموع قیمت',
        flex: 1,
        type: 'number',
        headerClassName: 'custom-header-style',
        cellClassName: 'custom-cell-style',
        minWidth: 100,
    },
    {
        field: 'username',
        headerName: 'نام کاربری',
        flex: 1,
        minWidth: 150,
    },
    {
        field: 'firstName',
        headerName: 'نام',
        flex: 1,
        minWidth: 150,
    },
    {
        field: 'email',
        headerName: 'ایمیل',
        flex: 1,
        minWidth: 200,
    },
];

export default function OrdersDataGrid() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [pageSize, setPageSize] = useState<number>(5); // Default page size
    const [page, setPage] = useState<number>(0); // Default page
    const [rowCount, setRowCount] = useState<number>(0); // Total number of rows
    const [isAll, setIsAll] = useState<boolean>(false); // Track "All" option

    useEffect(() => {
        const token = Cookies.get('Authorization');

        const fetchOrders = () => {
            fetch('http://localhost/api/sales/graphql/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? token : "",
                },
                body: JSON.stringify({
                    query: `
                        query Orders($page: Int, $perPage: Int) {
                            orders(page: $page, perPage: $perPage) {
                                totalPages
                                totalItems
                                items {
                                    id
                                    dueDate
                                    creationDate
                                    orderNumber
                                    totalPrice
                                    status
                                    user {
                                        username
                                        firstName
                                        email
                                    }
                                }
                            }
                        }
                    `,
                    variables: {
                        page: page + 1,
                        perPage: isAll ? rowCount : pageSize, // Use a high number for "all"
                    },
                }),
            })
                .then((response) => response.json())
                .then((data) => {
                    const ordersData = data.data.orders.items.map((order: Order) => ({
                        ...order,
                        username: order.user.username,
                        firstName: order.user.firstName,
                        email: order.user.email,
                        creationDate: convertToJalaali(order.creationDate),
                        dueDate: convertToJalaali(order.dueDate),
                    }));
                    const totalItems = data.data.orders.totalItems;
                    setOrders(ordersData);
                    setRowCount(totalItems);
                    setLoading(false);
                })
                .catch((error) => {
                    console.error('Error fetching orders data:', error);
                    setLoading(false);
                });
        };

        fetchOrders();
    }, [page, pageSize, isAll]);

    const handleProcessRowUpdate = async (newRow: GridRowModel, oldRow: GridRowModel) => {
        const updates: Record<string, any> = {};

        // Compare fields and add changed ones to the updates object
        if (newRow.status !== oldRow.status) {
            console.log(newRow.status.toLowerCase());

            updates.status = newRow.status.toLowerCase();
        }

        if (newRow.dueDate !== oldRow.dueDate) {
            // Ensure the due date is in yyyy-mm-dd format
            const [year, month, day] = newRow.dueDate.split('/');
            updates.dueDate = `${year}-${month}-${day}`;
        }

        // If there are no updates, return the newRow immediately
        if (Object.keys(updates).length === 0) {
            return newRow;
        }

        try {
            const token = Cookies.get('Authorization');

            const response = await fetch('http://localhost/api/admin_dash/graphql/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? token : "",
                },
                body: JSON.stringify({
                    query: `
                        mutation UpdateOrder($id: ID!, $status: String, $dueDate: Date) {
                            updateOrder(input: { id: $id, status: $status, dueDate: $dueDate }) {
                                success
                                errors
                            }
                        }
                    `,
                    variables: {
                        id: newRow.id,
                        ...updates, // Spread the updates object to send only the changed fields
                    },
                }),
            });

            const data = await response.json();

            if (data.data.updateOrder.success) {
                // If the update is successful, return the new row to update the UI
                return newRow;
            } else {
                // If there are errors, log them and return the old row to revert the UI changes
                console.error('Error updating order:', data.data.updateOrder.errors.join(', '));
                return oldRow;
            }
        } catch (error) {
            console.error('Error updating order:', error);
            // In case of an error, return the old row to revert the UI changes
            return oldRow;
        }
    };


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
                maxWidth: '1000px',
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
                                if (newModel.pageSize === rowCount) {
                                    setPageSize(rowCount); // Reset pageSize for "All" option
                                    setIsAll(true);
                                } else {
                                    setPageSize(newModel.pageSize ?? 5);
                                    setIsAll(false);
                                }
                            }
                        }}
                        pageSizeOptions={[5, 10, 20, { value: rowCount, label: 'همه' }]} // Include "All" option
                        rowCount={rowCount}
                        disableRowSelectionOnClick
                        processRowUpdate={handleProcessRowUpdate} // Add this handler
                        sx={{
                            backgroundColor: 'white',
                            color: 'black',
                            height: '100%',
                            '& .MuiDataGrid-cell': {
                                borderColor: 'black',
                                textAlign: 'start',
                                fontFamily: 'Vazir-bold',
                            },
                            '& .MuiDataGrid-virtualScrollerRenderZone': {
                                marginRight: '10px'
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
