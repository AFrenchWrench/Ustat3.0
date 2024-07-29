"use client"

import { ImageList, ImageListItem } from "@mui/material";
import React, { useEffect, useState } from "react";
import Article from "../components/Article";



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
    const [userData, setUserData] = useState<DisplayItem[]>([]);


    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await fetch('/api/sales/graphql/', {
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
        <section className="flex flex-col gap-5 items-center mt-10">
            <ImageList gap={8} sx={{ width: "80%" }} cols={3}>
                {userData.map((article, index) => (
                    <ImageListItem key={index}>
                        <Article
                            imageSrc={`/media/${article.thumbnail}`}
                            productName={article.name}
                            description={article.description}
                            price={article.price}
                            productLink={article.id}
                            type={article.type}
                        />
                    </ImageListItem>
                ))}
            </ImageList>
        </section>
    );
};

export default Page;