"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import 'swiper/css/bundle'; // Import Swiper styles
import '@/allStyles/product.css'; // Import your custom styles

import Loading from '@/components/Loading';


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

const Page = () => {
    const [product, setProduct] = useState<DisplayItem | null>(null);
    const [loading, setLoading] = useState(true);
    const { id, type } = useParams();

    useEffect(() => {

        if (!id) return; // Don't fetch if id is not available yet

        const fetchProductData = async () => {
            try {
                const response = await fetch('/api/sales/graphql/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
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
                    }
            `,
                    }),
                });
                const data = await response.json();

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                if (data.errors || !data.data.displayItem) {
                    throw new Error(data.errors ? data.errors[0].message : 'No item found');
                }

                setProduct(data.data.displayItem);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchProductData();
    }, [id]);

    if (loading) return <><Loading /></>;

    if (!product) return <p>Product not found</p>;

    return (
        <section className='section'>
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
                <button className='add_to_cart'>افزودن به سبدخرید</button>
            </div>
        </section>
    );
}

const ClientOnlyPage = () => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return <Page />;
}

export default ClientOnlyPage;
