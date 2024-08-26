"use client";

import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import { DataGrid, GridColDef, GridRowModel } from '@mui/x-data-grid';
import Cookies from 'js-cookie';
import { faIR } from '@mui/x-data-grid/locales';
import { createTheme, ThemeProvider, useTheme } from '@mui/material/styles';
import jalaali from 'jalaali-js';

const convertToJalaali = (gregorianDate: string | undefined) => {
    if (gregorianDate) {
        const [year, month, day] = gregorianDate.split('-');
        const jalaaliDate = jalaali.toJalaali(parseInt(year), parseInt(month), parseInt(day));
        return `${jalaaliDate.jy}/${jalaaliDate.jm}/${jalaaliDate.jd}`;
    }
};

const columnsUsers: GridColDef[] = [
    { field: 'firstName', headerName: 'نام', flex: 1, minWidth: 150 },
    { field: 'lastName', headerName: 'نام خانوادگی', flex: 1, minWidth: 150 },
    { field: 'phoneNumber', headerName: 'تلفن همراه', flex: 1, minWidth: 150 },
    { field: 'email', headerName: 'ایمیل', flex: 1, minWidth: 200 },
    { field: 'dateJoined', headerName: 'تاریخ عضویت', flex: 1, minWidth: 200 },
    {
        field: 'isFullyAuthenticated',
        headerName: 'وضعیت تایید',
        flex: 1,
        minWidth: 200,
        renderCell: (params) => (
            <span style={{ color: params.value ? 'green' : 'red', fontWeight: 'bold' }}>
                {params.value ? 'تایید شده' : 'تایید نشده'}
            </span>
        ),
    },
];


const columnsBusinesses: GridColDef[] = [
    { field: 'ownerFirstName', headerName: 'نام مالک', flex: 1, minWidth: 150 },
    { field: 'ownerLastName', headerName: 'نام خانوادگی مالک', flex: 1, minWidth: 150 },
    { field: 'ownerPhoneNumber', headerName: 'تلفن مالک', flex: 1, minWidth: 150 },
    { field: 'name', headerName: 'نام کسب‌وکار', flex: 1, minWidth: 200 },
    {
        field: 'isConfirmed',
        headerName: 'وضعیت تایید',
        flex: 1,
        minWidth: 150,
        type: 'singleSelect',
        renderCell: (params) => (
            <span style={{ color: params.value ? 'green' : 'red', fontWeight: 'bold' }}>
                {params.value ? 'تایید شده' : 'تایید نشده'}
            </span>
        ),
        editable: true,
        valueOptions: [
            { value: true, label: 'تایید شده' },
            { value: false, label: 'تایید نشده' },
        ],
    }

];


export default function UsersAndBusinessesDataGrid() {
    const [users, setUsers] = useState([]);
    const [businesses, setBusinesses] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [loadingBusinesses, setLoadingBusinesses] = useState(true);

    const [pageSizeUsers, setPageSizeUsers] = useState<number>(5); // Default page size for users
    const [pageUsers, setPageUsers] = useState<number>(0); // Default page for users
    const [rowCountUsers, setRowCountUsers] = useState<number>(0); // Total number of rows for users

    const [pageSizeBusinesses, setPageSizeBusinesses] = useState<number>(5); // Default page size for businesses
    const [pageBusinesses, setPageBusinesses] = useState<number>(0); // Default page for businesses
    const [rowCountBusinesses, setRowCountBusinesses] = useState<number>(0); // Total number of rows for businesses

    useEffect(() => {
        const token = Cookies.get('Authorization');

        const fetchUsersAndBusinesses = () => {
            fetch('http://localhost/api/admin_dash/graphql/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? token : "",
                },
                body: JSON.stringify({
                    query: `
                            query Users ($page: Int, $perPage: Int) {
                                users(page: $page, perPage: $perPage) {
                                    totalPages
                                    totalItems
                                    items {
                                        dateJoined
                                        firstName
                                        lastName
                                        phoneNumber
                                        email
                                        isFullyAuthenticated
                                    }
                                }
                                businesses(page: $pageBusinesses, perPage: $perPageBusinesses) {
                                    totalPages
                                    totalItems
                                    items {
                                        id
                                        ownerFirstName
                                        ownerLastName
                                        ownerPhoneNumber
                                        isConfirmed
                                        name
                                    }
                                }
                            }
                    `,
                    variables: {
                        page: pageUsers + 1,
                        perPage: pageSizeUsers,
                        pageBusinesses: pageBusinesses + 1,
                        perPageBusinesses: pageSizeBusinesses,
                    },
                }),
            })
                .then((response) => response.json())
                .then((data) => {
                    const usersData = data.data.users.items.map((user: any) => ({
                        ...user,
                        dateJoined: convertToJalaali(user.dateJoined),
                    }));

                    const businessesData = data.data.businesses.items.map((business: any) => ({
                        ...business,
                    }));

                    setUsers(usersData);
                    setBusinesses(businessesData);

                    setRowCountUsers(data.data.users.totalItems);
                    setRowCountBusinesses(data.data.businesses.totalItems);

                    setLoadingUsers(false);
                    setLoadingBusinesses(false);
                })
                .catch((error) => {
                    console.error('Error fetching users and businesses data:', error);
                    setLoadingUsers(false);
                    setLoadingBusinesses(false);
                });
        };

        fetchUsersAndBusinesses();
    }, [pageUsers, pageSizeUsers, pageBusinesses, pageSizeBusinesses]);


    const handleBusinessRowUpdate = async (newRow: GridRowModel, oldRow: GridRowModel) => {
        const updates: Record<string, any> = {};

        // Compare fields and add changed ones to the updates object
        if (newRow.isConfirmed !== oldRow.isConfirmed) {
            updates.isConfirmed = newRow.isConfirmed;
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
                        mutation UpdateBusiness($id: ID!, $isConfirmed: Boolean!) {
                            updateBusiness(input: { id: $id, isConfirmed: $isConfirmed }) {
                                success
                                errors
                            }
                        }
                    `,
                    variables: {
                        id: newRow.id,
                        isConfirmed: updates.isConfirmed,
                    },
                }),
            });

            const data = await response.json();

            if (data.data.updateBusiness.success) {
                // If the update is successful, return the new row to update the UI
                return newRow;
            } else {
                // If there are errors, log them and return the old row to revert the UI changes
                console.error('Error updating business:', data.data.updateBusiness.errors.join(', '));
                return oldRow;
            }
        } catch (error) {
            console.error('Error updating business:', error);
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
        <ThemeProvider theme={theme}>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    rowGap: '20px',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '180vh',
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
                <div dir='rtl' style={{ width: '100%', height: '50%' }}>
                    <h2 style={{ color: 'white' }}>کاربران</h2>
                    <DataGrid
                        rows={users}
                        columns={columnsUsers}
                        loading={loadingUsers}
                        getRowId={(row) => row.email}
                        pagination
                        paginationMode="server"
                        paginationModel={{ page: pageUsers, pageSize: pageSizeUsers }}
                        onPaginationModelChange={(newModel) => {
                            if (newModel) {
                                setPageUsers(newModel.page ?? 0);
                                setPageSizeUsers(newModel.pageSize ?? 5);
                            }
                        }}
                        rowCount={rowCountUsers}
                        pageSizeOptions={[5, 10, 20]}
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
                        }}
                    />
                </div>

                <div dir='rtl' style={{ width: '100%', height: '50%', marginTop: '20px' }}>
                    <h2 style={{ color: 'white' }}>کسب و کار ها</h2>
                    <DataGrid
                        rows={businesses}
                        columns={columnsBusinesses}
                        loading={loadingBusinesses}
                        getRowId={(row) => row.id}
                        pagination
                        paginationMode="server"
                        paginationModel={{ page: pageBusinesses, pageSize: pageSizeBusinesses }}
                        onPaginationModelChange={(newModel) => {
                            if (newModel) {
                                setPageBusinesses(newModel.page ?? 0);
                                setPageSizeBusinesses(newModel.pageSize ?? 5);
                            }
                        }}
                        rowCount={rowCountBusinesses}
                        processRowUpdate={handleBusinessRowUpdate}
                        pageSizeOptions={[5, 10, 20]}
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
                        }}
                    />
                </div>
            </Box>
        </ThemeProvider>
    );
}
