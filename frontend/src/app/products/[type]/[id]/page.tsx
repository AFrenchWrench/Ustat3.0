"use client"

import React from 'react'
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import 'swiper/css/bundle'; // Import Swiper styles
import '@/allStyles/product.css'; // Import your custom styles

import image1 from "../../../../../public/image/7819e8797424eb54391a3cc2f4ec7853.jpg"
import Image from 'next/image'

const Page = () => {
    return (
        <section className='section'>
            <div className='container'>
                <Swiper className='Swiper'
                    modules={[Pagination]}
                    pagination={{ clickable: true }}>
                    <SwiperSlide><Image src={image1} width={600} height={300} alt='product image' /></SwiperSlide>
                    <SwiperSlide><Image src={image1} width={600} height={300} alt='product image' /></SwiperSlide>
                    <SwiperSlide><Image src={image1} width={600} height={300} alt='product image' /></SwiperSlide>
                </Swiper>
                <div className='name_price'>
                    <h2 className='product_name'>مبل ویچنزا</h2>
                    <p className='price'>129,000,000 تومان</p>
                </div>
                <p className='caption'>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Commodi numquam veniam exercitationem iure fugit fugiat aperiam quam vitae ut iusto accusamus quae odio, dolore quaerat nihil voluptatibus praesentium et repudiandae.lorem Lorem, ipsum dolor sit amet consectetur adipisicing elit. Praesentium, perspiciatis quidem? Architecto quis veritatis adipisci fugiat, praesentium totam esse soluta! Blanditiis reiciendis rem, facere vitae illo ad sapiente voluptatem vero!</p>
                <button className='add_to_cart'>افزودن به سبدخرید</button>
            </div>
        </section>
    )
}

export default Page
