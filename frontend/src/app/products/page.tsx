"use client";

import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css/bundle";
import "./components/componentStyles.css";
import Article from "./components/Article";
import Link from "next/link";
import { MdKeyboardDoubleArrowLeft } from "react-icons/md";
import Cookies from "js-cookie";
import LoadingArticle from "./components/loadingArticle";

interface IdisplayItem {
  id: string;
  type: string;
}

interface DisplayItem {
  id: string;
  name: string;
  price: string;
  thumbnail: string;
  displayItem: IdisplayItem;
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

const typeNames: Record<string, string> = {
  S: "مبل",
  B: "سرویس خواب",
  M: "میز و صندلی",
  J: "جلومبلی و عسلی",
  C: "آینه کنسول",
};

const Products = () => {
  const [userData, setUserData] = useState<DisplayItem[]>([]);
  const [orderData, setOrderData] = useState<DisplayOrder[]>([]);
  const [fetchTrigger, setFetchTrigger] = useState(false); // Trigger for re-fetching data
  const [loading, setLoading] = useState(false); // Track loading state

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = Cookies.get("Authorization");
      const response = await fetch("/api/sales/graphql/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? token : "",
        },
        body: JSON.stringify({
          query: `
          query Showcase {
              showcase {
                  id
                  name
                  price
                  thumbnail
                  displayItem {
                      id
                      type
                      name
                  }
              }
  ${token
              ? `
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
                                }`
              : ""
            }
}
          `,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      if (
        data.errors ||
        !data.data.showcase ||
        (token && !data.data.showcase)
      ) {
        throw new Error(
          data.errors ? data.errors[0].message : "No items found"
        );
      }

      setUserData(data.data.showcase);
      if (token) setOrderData(data.data.orders.items);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []); // Fetch initial data on mount

  useEffect(() => {
    if (fetchTrigger) {
      fetchUserData();
      setFetchTrigger(false);
    }
  }, [fetchTrigger]); // Fetch updated data when fetchTrigger is true

  const updateOrderData = (newOrderData: DisplayOrder[]) => {
    setOrderData(newOrderData);
    setFetchTrigger(true); // Trigger data re-fetch
  };

  const categorizedProducts = Object.keys(typeNames).reduce((acc, type) => {
    acc[type] = userData.filter((item) => item.displayItem.type === type);
    return acc;
  }, {} as Record<string, DisplayItem[]>);

  return (
    <section className="flex flex-col gap-5 items-center mt-10">
      {Object.entries(categorizedProducts).map(([type, items]) => (
        <div key={type} className="type_section">
          <div className="type_name">
            <p>{typeNames[type]}</p>
            <Link href={`/products/${type}`}>
              مشاهده همه <MdKeyboardDoubleArrowLeft />
            </Link>
          </div>
          <Swiper
            slidesPerView={2}
            spaceBetween={10}
            breakpoints={{
              640: {
                slidesPerView: 2,
                spaceBetween: 6,
              },
              768: {
                slidesPerView: 3,
                spaceBetween: 10,
              },
              1124: {
                slidesPerView: 4,
                spaceBetween: 10,
              },
            }}
            className="mySwiper"
          >
            {items.map((item) => (
              <SwiperSlide key={item.id}>
                <Article
                  imageSrc={`/media/${item.thumbnail}`}
                  productName={item.name}
                  price={item.price}
                  productLink={item.id}
                  type={item.displayItem.type}
                  orderData={orderData}
                  onOrderUpdate={updateOrderData}
                />
              </SwiperSlide>
            ))}
            {loading && <SwiperSlide><LoadingArticle /></SwiperSlide>}
            {loading && <SwiperSlide><LoadingArticle /></SwiperSlide>}
            {loading && <SwiperSlide><LoadingArticle /></SwiperSlide>}
            {loading && <SwiperSlide><LoadingArticle /></SwiperSlide>}
            {loading && <SwiperSlide><LoadingArticle /></SwiperSlide>}
          </Swiper>
        </div>
      ))}
    </section>
  );
};

export default Products;
