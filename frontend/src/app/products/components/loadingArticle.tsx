import React from 'react';
import "./componentStyles.css";

const LoadingArticle = () => {
    return (
        <div className="article">
            <div className="top_section_loading">
                <div className="picture_loading">
                </div>
                <div className="top_right_section_loading">
                    <p className="product_name_loading"></p>
                    <p className="price_loading"></p>
                </div>
            </div>
            <div className="buttons_section_loading">
                <span></span>
                <span></span>
            </div>
        </div>
    );
};

export default LoadingArticle;
