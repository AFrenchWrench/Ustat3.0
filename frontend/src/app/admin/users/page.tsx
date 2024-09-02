"use client";

import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import { DataGrid, GridColDef, GridFilterModel, GridRowModel } from '@mui/x-data-grid';
import Cookies from 'js-cookie';
import { faIR } from '@mui/x-data-grid/locales';
import { createTheme, ThemeProvider, useTheme } from '@mui/material/styles';
import jalaali from 'jalaali-js';
import CustomPagination from '@/types/customPagination';

const convertToJalaali = (gregorianDate: string | undefined) => {
    if (gregorianDate) {
        const [year, month, day] = gregorianDate.split('-');
        const jalaaliDate = jalaali.toJalaali(parseInt(year), parseInt(month), parseInt(day));
        return `${jalaaliDate.jy}/${jalaaliDate.jm}/${jalaaliDate.jd}`;
    }
};

const formatDate = (date: string): string => {
    const [year, month, day] = date.split('-');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

const columnsUsers: GridColDef[] = [
    { field: 'firstName', headerName: 'نام', flex: 1, minWidth: 150 },
    { field: 'lastName', headerName: 'نام خانوادگی', flex: 1, minWidth: 150 },
    { field: 'phoneNumber', headerName: 'تلفن همراه', flex: 1, minWidth: 150, cellClassName: 'phone' },
    { field: 'email', headerName: 'ایمیل', flex: 1, minWidth: 200 },
    { field: 'dateJoined', headerName: 'تاریخ عضویت', flex: 1, minWidth: 200 },
];


const columnsBusinesses: GridColDef[] = [
    { field: 'ownerFirstName', headerName: 'نام مالک', flex: 1, minWidth: 150 },
    { field: 'ownerLastName', headerName: 'نام خانوادگی مالک', flex: 1, minWidth: 150 },
    { field: 'ownerPhoneNumber', headerName: 'تلفن مالک', flex: 1, minWidth: 150, cellClassName: 'phone' },
    { field: 'name', headerName: 'نام کسب‌وکار', flex: 1, minWidth: 200 },
    {
        field: 'isConfirmed',
        headerName: 'وضعیت تایید',
        flex: 1,
        minWidth: 150,
        type: 'singleSelect',
        renderCell: (params) => (
            <span style={{ color: params.value ? '#00ff00' : 'red', fontWeight: 'bold' }} className='customSelectSpan'>
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


    const [userFilters, setUserFilters] = useState<GridFilterModel>({ items: [] });
    const [businessFilters, setBusinessFilters] = useState<GridFilterModel>({ items: [] });


    useEffect(() => {
        const token = Cookies.get('Authorization');

        const formattedUserFilterModel = {
            ...createUserFilterObject(userFilters),
        };
        const formattedBusinessFilterModel = {
            ...createBusinessFilterObject(businessFilters),
        };


        const fetchUsersAndBusinesses = () => {
            fetch('http://localhost/api/admin_dash/graphql/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? token : "",
                },
                body: JSON.stringify({
                    query: `
                            query Users ($page: Int, $perPage: Int,
                                         $pageBusinesses: Int, $perPageBusinesses: Int
                                         $userFilters: UserFilterInput, $businessFilters: BusinessFilterInput
                                         ) {
                                users(page: $page, perPage: $perPage, filter: $userFilters) {
                                    totalPages
                                    totalItems
                                    items {
                                        firstName
                                        lastName
                                        phoneNumber
                                        email
                                        dateJoined
                                    }
                                }
                                businesses(page: $pageBusinesses, perPage: $perPageBusinesses, filter: $businessFilters) {
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
                        userFilters: formattedUserFilterModel, // User filters
                        businessFilters: formattedBusinessFilterModel, // User filters
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
    }, [pageUsers, pageSizeUsers, pageBusinesses, pageSizeBusinesses, userFilters, businessFilters]);


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


    const createUserFilterObject = (filterModel: GridFilterModel) => {
        const filters: any = {};
        filterModel.items.forEach((item) => {
            if (item.value !== undefined && item.value !== null) { // Check if item.value is defined
                switch (item.field) {
                    case 'firstName':
                        filters.firstName_Icontains = item.value;
                        break;
                    case 'lastName':
                        filters.lastName = item.value; // Convert status to lowercase
                        break;
                    case 'phoneNumber':
                        filters.phoneNumber_Icontains = item.value;
                        break;
                    case 'email':
                        filters.email = item.value;
                        break;
                    default:
                        break;
                }
            }
        });
        return filters
    }
    const createBusinessFilterObject = (filterModel: GridFilterModel) => {
        const filters: any = {};
        filterModel.items.forEach((item) => {
            if (item.value !== undefined && item.value !== null) { // Check if item.value is defined
                switch (item.field) {
                    case 'ownerFirstName':
                        filters.ownerFirstName_Icontains = item.value;
                        break;
                    case 'ownerLastName':
                        filters.ownerLastName_Icontains = item.value; // Convert status to lowercase
                        break;
                    case 'ownerPhoneNumber':
                        filters.ownerPhoneNumber_Icontains = item.value;
                        break;
                    case 'name':
                        filters.name_Icontains = item.value;
                        break;
                    case 'isConfirmed':
                        filters.isConfirmed = item.value;
                        break;
                    default:
                        break;
                }
            }
        });
        return filters
    }

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
                        filterModel={userFilters}
                        onFilterModelChange={(newFilterModel) => setUserFilters(newFilterModel)}
                        onPaginationModelChange={(newModel) => {
                            if (newModel) {
                                setPageUsers(newModel.page ?? 0);
                                setPageSizeUsers(newModel.pageSize ?? 5);
                            }
                        }}
                        rowCount={rowCountUsers}
                        pageSizeOptions={[5, 10, 20]}
                        sx={sx}
                    />
                </div>
                <CustomPagination
                    page={pageUsers}
                    pageSize={pageSizeUsers}
                    rowCount={rowCountUsers}
                    onPageChange={(newPage) => setPageUsers(newPage)}
                    onPageSizeChange={(newPageSize) => setPageSizeUsers(newPageSize)}
                    dir={"rtl"}
                />
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
                        filterModel={businessFilters}
                        onFilterModelChange={(newFilterModel) => setBusinessFilters(newFilterModel)}
                        rowCount={rowCountBusinesses}
                        processRowUpdate={handleBusinessRowUpdate}
                        pageSizeOptions={[5, 10, 20]}
                        sx={sx}
                    />
                </div>
                <CustomPagination
                    page={pageBusinesses}
                    pageSize={pageSizeBusinesses}
                    rowCount={rowCountBusinesses}
                    onPageChange={(newPage) => setPageBusinesses(newPage)}
                    onPageSizeChange={(newPageSize) => setPageSizeBusinesses(newPageSize)}
                    dir={"rtl"}
                />
            </Box>
        </ThemeProvider>
    );
}
