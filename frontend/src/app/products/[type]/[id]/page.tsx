"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import 'swiper/css/bundle';
import '@/allStyles/product.css';

import Cookies from 'js-cookie';

import AddToCartButton from '../../components/addToCartButton';
import Loading from '@/components/Loading';
import SelectOrder from '../../components/SelectOrder';

interface DisplayItem {
    id: string;
    type: string;
    name: string;
    dimensions: string;
    price: string;
    description: string;
    thumbnail: string;
    slider1: string;
    slider2: string;
    slider3: string;
}

interface OrderItems {
    id: string;
    type: string;
    name: string;
    dimensions: object;
    price: number;
    quantity: number;
}

interface DisplayOrder {
    id: string;
    dueDate: string;
    creationDate: string;
    orderNumber: string;
    status: string;
    items: OrderItems[];
}

const Page = () => {
    const [product, setProduct] = useState<DisplayItem | null>(null);
    const [loading, setLoading] = useState(true);
    const { id } = useParams();
    const [userOrders, setUserOrders] = useState<DisplayOrder[]>([]);
    const [showSelectOrder, setShowSelectOrder] = useState(false);
    const [fetchTrigger, setFetchTrigger] = useState(false);

    const fetchProductData = async () => {
        try {
            const token = Cookies.get('Authorization');
            const response = await fetch('/api/sales/graphql/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? token : '',
                },
                body: JSON.stringify({
                    query: `
                        query DisplayItem {
                            displayItem(id: ${id}) {
                                id
                                type
                                name
                                dimensions
                                price
                                description
                                thumbnail
                                slider1
                                slider2
                                slider3
                            }
                            ${token ? `
                            userOrders {
                                id
                                dueDate
                                creationDate
                                orderNumber
                                status
                                items {
                                    id
                                    type
                                    name
                                    dimensions
                                    price
                                    quantity
                                }
                            }` : ''}
                        }
                    `,
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error('Network response was not ok');
            if (data.errors || !data.data.displayItem) throw new Error(data.errors ? data.errors[0].message : 'No item found');

            setProduct(data.data.displayItem);
            if (data.data.userOrders && token) setUserOrders(data.data.userOrders);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!id) return;
        fetchProductData();
    }, [id]);

    useEffect(() => {
        if (fetchTrigger) {
            fetchProductData();
            setFetchTrigger(false);
        }
    }, [fetchTrigger]);

    const updateOrderData = (newOrderData: DisplayOrder[]) => {
        setUserOrders(newOrderData);
        setFetchTrigger(true);
    };

    const handleAddToCart = (id: string) => {
        const token = Cookies.get('Authorization');
        if (token) {
            setShowSelectOrder(true);
        } else {
            window.location.href = '/auth';
        }
    };

    const handleRemoveOrder = () => {
        setShowSelectOrder(false);
    };

    if (loading) return <><Loading /></>;
    if (!product) return <p>Product not found</p>;

    return (
        <section className='sectionId'>
            <div className='container'>
                <Swiper className='Swiper_item' modules={[Pagination]} pagination={{ clickable: true }} spaceBetween={10}>
                    <SwiperSlide><img className='slider_image' src={`/media/${product.slider1}`} alt={product.name} /></SwiperSlide>
                    <SwiperSlide><img className='slider_image' src={`/media/${product.slider2}`} alt={product.name} /></SwiperSlide>
                    <SwiperSlide><img className='slider_image' src={`/media/${product.slider3}`} alt={product.name} /></SwiperSlide>
                </Swiper>
                <div className='name_price'>
                    <h2 className='product_name'>{product.name}</h2>
                    <p className='price'>{product.price} تومان</p>
                </div>
                <p className='caption'>{product.description}</p>
                <AddToCartButton
                    id={product.id}
                    onAddToCart={handleAddToCart}
                />
            </div>
            {showSelectOrder && <SelectOrder id={product.id} orderData={userOrders} onRemove={handleRemoveOrder} onOrderUpdate={updateOrderData} />}
        </section>
    );
};

const ClientOnlyPage = () => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return <Page />;
};

export default ClientOnlyPage;
