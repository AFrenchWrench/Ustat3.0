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
import Variations from '../../components/variations';



interface Dimensions {
    height?: number;
    width?: number;
    length?: number;
    chair?: ChairDimensions; // Optional property
    mirror?: ChairDimensions;
    "night stand"?: ChairDimensions
    "makeup table"?: ChairDimensions
    "side table"?: ChairDimensions
    "single seat"?: ChairDimensions
}
interface ChairDimensions {
    width?: number;
    height?: number;
    length?: number;
    quantity?: number;
}


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
interface Ivariation {
    id: string;
    name: string;
    fabric: string;
    thumbnail: string;
    price: number;
    color: string;
}
interface IdisplayItemV {
    type: string;
    variants: Ivariation[];
}
interface DisplayItem {
    id: string;
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
    displayItem: IdisplayItemV
}

const Page = () => {
    const [product, setProduct] = useState<DisplayItem | null>(null);
    const [loading, setLoading] = useState(true);
    const { id } = useParams();
    const [userOrders, setUserOrders] = useState<DisplayOrder[]>([]);
    const [showSelectOrder, setShowSelectOrder] = useState(false);
    const [fetchTrigger, setFetchTrigger] = useState(false);
    const [variantId, setVariansId] = useState<string | string[]>(id)

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
                            itemVariant(id: ${variantId}) {
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
                                displayItem {
                                    type
                                    variants {
                                        id
                                        name
                                        price
                                        color
                                        thumbnail
                                        fabric
                                    }
                                }
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
            console.log(data.data.itemVariant.displayItem.variants);

            if (data.data.orders && token) setUserOrders(data.data.orders.items);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const onSelectVariation = (id: string) => {
        setVariansId(id)
    }

    useEffect(() => {
        if (!variantId) return;
        fetchProductData();
    }, [variantId]);

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
    let dimensions: Dimensions = {};

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
                    {dimensions.chair && (
                        <div className='dimensions_container'>
                            <div>
                                <p>{dimensions.chair.quantity ? `تعداد صندلی: ${dimensions.chair.quantity}` : 'تعداد صندلی: N/A'}</p>
                                <p>{dimensions.chair.width ? `عرض صندلی : ${dimensions.chair.width}` : 'عرض صندلی: N/A'}</p>
                                <p>{dimensions.chair.height ? `ارتفاع صندلی: ${dimensions.chair.height}` : 'ارتفاع صندلی: N/A'}</p>
                                <p>{dimensions.chair.length ? `طول صندلی: ${dimensions.chair.length}` : 'طول صندلی: N/A'}</p>
                            </div>
                        </div>
                    )}
                    {dimensions.mirror && (
                        <div className='dimensions_container'>
                            <div>
                                <p>{dimensions.mirror.width ? `عرض آینه: ${dimensions.mirror.width}` : 'عرض آینه: N/A'}</p>
                                <p>{dimensions.mirror.height ? `ارتفاع آینه: ${dimensions.mirror.height}` : 'ارتفاع آینه: N/A'}</p>
                                <p>{dimensions.mirror.length ? `طول آینه: ${dimensions.mirror.length}` : 'طول آینه: N/A'}</p>
                            </div>
                        </div>
                    )}
                    {dimensions["night stand"] && (
                        <div className='dimensions_container'>
                            <div>
                                <p>{dimensions["night stand"].quantity ? `تعداد پاتختی: ${dimensions["night stand"].quantity}` : 'تعداد پاتختی: N/A'}</p>
                                <p>{dimensions["night stand"].width ? `عرض پاتختی: ${dimensions["night stand"].width}` : 'عرض پاتختی: N/A'}</p>
                                <p>{dimensions["night stand"].height ? `ارتفاع پاتختی: ${dimensions["night stand"].height}` : 'ارتفاع پاتختی: N/A'}</p>
                                <p>{dimensions["night stand"].length ? `طول پاتختی: ${dimensions["night stand"].length}` : 'طول پاتختی: N/A'}</p>
                            </div>
                        </div>
                    )}
                    {dimensions["makeup table"] && (
                        <div className='dimensions_container'>
                            <div>
                                <p>{dimensions["makeup table"].width ? `عرض میز آرایش: ${dimensions["makeup table"].width}` : 'عرض میز آرایش: N/A'}</p>
                                <p>{dimensions["makeup table"].height ? `ارتفاع میز آرایش: ${dimensions["makeup table"].height}` : 'ارتفاع میز آرایش: N/A'}</p>
                                <p>{dimensions["makeup table"].length ? `طول میز آرایش: ${dimensions["makeup table"].length}` : 'طول میز آرایش: N/A'}</p>
                            </div>
                        </div>
                    )}
                    {dimensions["side table"] && (
                        <div className='dimensions_container'>
                            <div>
                                <p>{dimensions["side table"].quantity ? `تعداد میز: ${dimensions["side table"].quantity}` : 'تعداد میز: N/A'}</p>
                                <p>{dimensions["side table"].width ? `عرض میز: ${dimensions["side table"].width}` : 'عرض میز: N/A'}</p>
                                <p>{dimensions["side table"].height ? `ارتفاع میز: ${dimensions["side table"].height}` : 'ارتفاع میز: N/A'}</p>
                                <p>{dimensions["side table"].length ? `طول میز: ${dimensions["side table"].length}` : 'طول میز: N/A'}</p>
                            </div>
                        </div>
                    )}
                    {dimensions["single seat"] && (
                        <div className='dimensions_container'>
                            <div>
                                <p>{dimensions["single seat"].width ? `عرض تک نفره: ${dimensions["single seat"].width}` : 'عرض تک نفره: N/A'}</p>
                                <p>{dimensions["single seat"].height ? `ارتفاع تک نفره: ${dimensions["single seat"].height}` : 'ارتفاع تک نفره: N/A'}</p>
                                <p>{dimensions["single seat"].length ? `طول تک نفره: ${dimensions["single seat"].length}` : 'طول تک نفره: N/A'}</p>
                            </div>
                        </div>
                    )}

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
            <Variations active={variantId} onSelectVariation={onSelectVariation} variations={product.displayItem.variants} />
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
