"use client";

import React, { useState, useEffect } from 'react';
import Loading from '@/components/Loading';
import AddItemTable from '@/components/adminComponent/items/addItemTable';

const Page = () => {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate loading delay for this example
        setLoading(false);
    }, []);

    if (loading) return <div><Loading /></div>;

    return (
        <>
            <AddItemTable />
        </>
    );
};

export default Page;
