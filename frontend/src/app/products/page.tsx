"use client"

import React, { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css/bundle';
import './components/componentStyles.css';
import Article from './components/Article';
import Link from 'next/link';
import { MdKeyboardDoubleArrowLeft } from "react-icons/md";

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

const Products = () => {
  const [userData, setUserData] = useState<DisplayItem[]>([]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/sales/graphql/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `
              query DisplayItems {
                displayItems {
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

        if (data.errors || !data.data.displayItems) {
          throw new Error(data.errors ? data.errors[0].message : 'No items found');
        }

        setUserData(data.data.displayItems);

      } catch (error) {
        console.error(error);
      }
    };

    fetchUserData();
  }, []);

  return (
    <section className='flex flex-col gap-5 items-center mt-10'>
      <div className='type_section'>
        <div className='type_name'>
          <p>مبل ها</p>
          <Link href={"/products/مبل"}>مشاهده همه <MdKeyboardDoubleArrowLeft /></Link>
        </div>
        <Swiper
          slidesPerView={3}
          spaceBetween={10}
          className="mySwiper"
        >
          {userData.map((item) => (
            <SwiperSlide key={item.id}>
              <Article
                imageSrc={`http://127.0.0.1:8000/media/${item.thumbnail}`}
                productName={item.name}
                description={item.description}
                price={item.price}
                productLink={item.id}
                type={item.type}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
};

export default Products;
