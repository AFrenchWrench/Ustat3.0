"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import { DataGrid, GridColDef, GridFilterModel, GridRowModel } from '@mui/x-data-grid';
import Cookies from 'js-cookie';
import { faIR } from '@mui/x-data-grid/locales';
import { createTheme, ThemeProvider, useTheme } from '@mui/material/styles';
import jalaali from 'jalaali-js';
import Alert from '@/components/Alert';

import CustomPagination from '@/types/customPagination';
import Loading from '@/components/Loading';

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
interface OrderWithChanges extends Order {
    hasChanges?: boolean; // Track changes for each row
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



export default function OrdersDataGrid() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [pageSize, setPageSize] = useState<number>(5); // Default page size
    const [page, setPage] = useState<number>(0); // Default page
    const [rowCount, setRowCount] = useState<number>(0); // Total number of rows
    const [isAll, setIsAll] = useState<boolean>(false); // Track "All" option
    const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [] });
    const [alert, setAlert] = useState<{ message: string; type: 'success' | 'failed' } | null>(null);



    const columns: GridColDef[] = [
        {
            field: 'orderNumber',
            headerName: 'شماره سفارش',
            flex: 1,
            minWidth: 150,
            renderCell: (params) => (
                <Link
                    href={`/admin/orders/${params.row.id}`}
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
            field: 'firstName',
            headerName: 'نام',
            flex: 1,
            minWidth: 90,
        },
        {
            field: 'email',
            headerName: 'ایمیل',
            flex: 1,
            minWidth: 150,
        },
        {
            field: 'actions',
            headerName: 'عملیات',
            flex: 1,
            minWidth: 50,
            renderCell: (params) => {
                const { row } = params;
                const hasChanges = (row as OrderWithChanges).hasChanges;

                return (
                    <button
                        disabled={!hasChanges} // Disable button if there are no changes
                        onClick={() => handleSubmitButtonClick(row as OrderWithChanges)}
                        style={{
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '6px 12px',
                            cursor: 'pointer',
                        }
                        }
                        className={`px-4 py-2 rounded border-none text-white cursor-pointer ${!hasChanges
                            ? 'bg-gray-400 cursor-not-allowed opacity-70' // Styles for disabled state
                            : 'bg-green-500 hover:bg-green-600' // Styles for enabled state
                            }`}
                    >
                        ثبت
                    </button>
                );
            },
        },
        {
            field: 'transaction',
            headerName: 'صورت حساب ها',
            flex: 1,
            minWidth: 80,
            renderCell: (params) => (
                <Link
                    href={`/admin/orders/${params.row.id}/${params.row.id}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                >
                    صورت حساب
                </Link>
            ),
        },

    ];

    const sx = {
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
        '& .phone': {
            direction: 'ltr',
            textAlign: 'end'
        },
    }

    useEffect(() => {
        const token = Cookies.get('Authorization');

        const formattedFilterModel = {
            ...createFilterObject(filterModel),
        };

        const fetchOrders = async () => {
            try {
                const response = await fetch('/api/admin_dash/graphql/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token ? token : "",
                    },
                    body: JSON.stringify({
                        query: `
                            query Orders($page: Int, $perPage: Int , $filters: OrderFilterInput) {
                                orders(page: $page, perPage: $perPage, filter: $filters) {
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
                            filters: formattedFilterModel,
                        },
                    }),
                });

                const data = await response.json();

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
            } catch (error) {
                console.error('Error fetching orders data:', error);
            } finally {
                setLoading(false); // Ensure loading is set to false after fetching is done
            }
        };

        fetchOrders();

    }, [page, pageSize, isAll, filterModel]);


    const handleProcessRowUpdate = (newRow: GridRowModel, oldRow: GridRowModel) => {
        // Set hasChanges to true for the row being edited
        return { ...newRow, hasChanges: true };
    };

    const handleSubmitButtonClick = async (row: OrderWithChanges) => {
        if (!row.hasChanges) return;
        const originalStatus = row.status; // Save the original status
        const newStatus = row.status.toUpperCase();
        const id = row.id;
        const status = row.status.toLowerCase();
        try {
            const token = Cookies.get('Authorization');
            const response = await fetch('/api/admin_dash/graphql/', {
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
                        }`,
                    variables: {
                        id: id,
                        status: status,
                    },
                }),
            });

            const data = await response.json();
            if (data.data.updateOrder.success) {
                // Show success alert
                setAlert({ message: 'عملیات موفقیت آمیز بود', type: 'success' });
                setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
            } else {
                const errors = JSON.parse(data.data.updateOrder.errors);
                const errorKeys = Object.keys(errors);
                const firstKey = errorKeys.length > 0 ? errorKeys[0] : 'unknownError';
                const firstErrorMessage = errors[firstKey] || 'Failed to update order!';
                // Show error alert and revert status
                setAlert({ message: firstErrorMessage, type: 'failed' });
                setOrders(orders.map(o => o.id === id ? { ...o, status: originalStatus } : o));
            }
        } catch (error) {
            console.error('Error during submit:', error);
            setAlert({ message: 'Error during submit!', type: 'failed' });
        }
    };

    const closeAlert = () => {
        setAlert(null);
    };


    const createFilterObject = (filterModel: GridFilterModel) => {
        const filters: any = {};
        filterModel.items.forEach((item) => {
            if (item.value !== undefined && item.value !== null) { // Check if item.value is defined
                switch (item.field) {
                    case 'username':
                        filters.user_Username_Icontains = item.value;
                        break;
                    case 'status':
                        filters.status = item.value.toLowerCase(); // Convert status to lowercase
                        break;
                    case 'dueDate':
                        if (item.value === 'بعد از') {
                            filters.dueDate_Gte = item.value; // Assume item.value is in yyyy-mm-dd format
                        }
                        if (item.value === 'قبل از') {
                            filters.dueDate_Lte = item.value; // Assume item.value is in yyyy-mm-dd format
                        }
                        break;
                    case 'creationDate':
                        if (item.value === 'بعد از') {
                            filters.creationDate_Gte = item.value; // Assume item.value is in yyyy-mm-dd format
                        }
                        if (item.value === 'قبل از') {
                            filters.creationDate_Lte = item.value; // Assume item.value is in yyyy-mm-dd format
                        }
                        break;
                    case 'orderNumber':
                        filters.orderNumber_Icontains = item.value;
                        break;
                    default:
                        break;
                }
            }
        });

        return filters;
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

    if (loading) return <div><Loading /></div>;

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '85vh',
                width: '100%',
                maxWidth: '1100px',
                margin: '50px auto',
                bgcolor: 'rgb(32,32,32)',
                color: 'white',
                p: 2,
                borderRadius: 2,
                boxShadow: 3,
                rowGap: '20px',
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
                        filterModel={filterModel} // Add this line to use the filter model
                        onFilterModelChange={(newFilterModel) => setFilterModel(newFilterModel)}
                        pageSizeOptions={[5, 10, 20]} // Include "All" option
                        rowCount={rowCount}
                        disableRowSelectionOnClick
                        processRowUpdate={handleProcessRowUpdate} // Add this handler
                        sx={sx}
                    />
                </div>
                <CustomPagination
                    page={page}
                    pageSize={pageSize}
                    rowCount={rowCount}
                    onPageChange={(newPage) => setPage(newPage)}
                    onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
                    dir='rtl'
                />
            </ThemeProvider>
            {alert && (
                <Alert
                    message={alert.message}
                    type={alert.type}
                    onClose={closeAlert}
                />
            )}
        </Box>
    );
}
