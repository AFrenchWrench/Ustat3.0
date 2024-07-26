import { ImageList, ImageListItem } from "@mui/material";
import React from "react";
import Article from "../components/Article";

// Sample data for the articles
const articles = [
  {
    imageSrc: "/media/display_items/thumbnails/file_0.jpg", // Updated path to match Nginx media URL
    productName: "Product 1",
    description: "Description 1",
    price: "$10",
    productLink: "/product1", // Ensure you have valid links
    type: "Type 1",
  },
  {
    imageSrc: "/media/display_items/thumbnails/1229091.jpg", // Updated path to match Nginx media URL
    productName: "Product 2",
    description: "Description 2",
    price: "$20",
    productLink: "/product2", // Ensure you have valid links
    type: "Type 2",
  },
  // Add more articles as needed
];

const Page = () => {
  return (
    <section className="flex flex-col gap-5 items-center mt-10">
      <ImageList gap={8} sx={{ width: "80%" }} cols={3}>
        {articles.map((article, index) => (
          <ImageListItem key={index}>
            <Article
              imageSrc={article.imageSrc}
              productName={article.productName}
              description={article.description}
              price={article.price}
              productLink={article.productLink}
              type={article.type}
            />
          </ImageListItem>
        ))}
      </ImageList>
    </section>
  );
};

export default Page;
