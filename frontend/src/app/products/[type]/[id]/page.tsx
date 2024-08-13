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

interface OrderItems {
    id: string;
    type: string;
    name: string;
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

interface DisplayItem {
    id: string;
    type: string;
    name: string;
    dimensions: string; // This is a JSON string
    price: string;
    description: string;
    fabric: string;
    color: string;
    woodColor: string;
    thumbnail: string;
    slider1: string;
    slider2: string;
    slider3: string;
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
                        query ItemVariant {
                            itemVariant(id: ${id}) {
                                id
                                name
                                dimensions
                                fabric
                                color
                                woodColor
                                price
                                description
                                thumbnail
                                slider1
                                slider2
                                slider3
                            }
                            ${token ? `
                orders(filter: { status: "ps" }) {
                        totalPages
                        totalItems
                        items {
                            id
                            status
                            orderNumber
                            dueDate
                            items {
                                id
                                type
                                name
                                quantity
                            }
                        }
                    }` : ''}
                        }
                    `,
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error('Network response was not ok');
            if (data.errors || !data.data.itemVariant) throw new Error(data.errors ? data.errors[0].message : 'No item found');

            setProduct(data.data.itemVariant);
            if (data.data.orders && token) setUserOrders(data.data.orders.items);
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

    // Parse dimensions from JSON string
    let dimensions: { width?: number; height?: number; length?: number } = {};
    try {
        dimensions = JSON.parse(product.dimensions);
    } catch (e) {
        console.error('Error parsing dimensions JSON:', e);
    }

    return (
        <section className='sectionId'>
            <div className='container'>
                <Swiper className='Swiper_item' modules={[Pagination]} pagination={{ clickable: true }} spaceBetween={10}>
                    <SwiperSlide><img className='slider_image' src={`/media/${product.slider1}`} alt={product.name} /></SwiperSlide>
                    <SwiperSlide><img className='slider_image' src={`/media/${product.slider2}`} alt={product.name} /></SwiperSlide>
                    <SwiperSlide><img className='slider_image' src={`/media/${product.slider3}`} alt={product.name} /></SwiperSlide>
                </Swiper>
                <div className='name_price'>
                    <h2 className='item_product_name'>{product.name}</h2>
                    <p className='item_price'>{Number(product.price).toLocaleString('en-US')} تومان</p>
                </div>

                <div className='info_container'>
                    <p className='info_title'>مشخصات :</p>
                    <div className='dimensions_container'>
                        <p>ابعاد :</p>
                        <div>
                            <p>{dimensions.width ? `عرض: ${dimensions.width}` : 'N/A'} x</p>
                            <p>{dimensions.height ? `ارتفاع: ${dimensions.height}` : 'N/A'} x</p>
                            <p>{dimensions.length ? `طول: ${dimensions.length}` : 'N/A'}</p>
                        </div>
                    </div>
                    <div className='color_section'>
                        <p>رنگ : <span>{product.color || 'N/A'}</span></p>
                        <p>رنگ چوب : <span>{product.woodColor || 'N/A'}</span></p>
                    </div>
                    <div className='color_section'>
                        <p className='fabric_title'>پارچه : <span>{product.fabric || 'N/A'}</span></p>
                    </div>
                </div>

                <p className='caption'>{product.description}</p>
                <AddToCartButton
                    id={product.id}
                    onAddToCart={handleAddToCart}
                    className={"item_add_button"}
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
