"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTitle } from "@/components/TitleContext";
import useDynamicTitle from "@/components/useDynamicTitle";
import style from "@/allStyles/home.module.css";

type Titles = {
  [key: string]: string;
};

const titles: Titles = {
  en: "Ustattecaret-Home",
  fa: "اوستات تجارت-خانه",
};

export default function Home() {
  const { push } = useRouter();
  const { setTitle } = useTitle();

  useDynamicTitle(); // This will set the document title based on context

  useEffect(() => {
    const language = navigator.language || "en";
    const langCode = language.split("-")[0];
    const pageTitle = titles[langCode] || titles["en"];
    setTitle(pageTitle);
    return () => setTitle("Ustat"); // Reset title on unmount if desired
  }, [setTitle]);

  return (
    <section className={style.section}>
      <div className={style.homeCart}>
        <div className={style.topDiv}>
          <div className={style.icon}>
            <picture>
              <img src="icons/icon.png" alt="ustat icon" />
            </picture>
          </div>
          <div className={style.productsDiv}>
            <div onClick={() => push("/products")}>
              <img src="image/Frame 7.png" alt="all products" />
              <p>مشاهده همه</p>
              <span></span>
            </div>
          </div>
        </div>
        <div className={style.bottomDiv}>
          <div className={style.textDiv}>
            <p>
              مجموعه اوستات تجارت با ارائه ي مبلمان با سبك آرت دكو و نئوكلاسيك
              با بهترین کیفیت و طراحی منحصر به فرد، زیبایی و اصالت را براي شما
              دوستداران اين سبك به ارمغان آورده است .
            </p>
            <p>
              شركت اوستات تجارت با بازرگاني چوب و متريال مبلمان از كشور تركيه و
              بخش R@D نيز در خدمت شما توليد كنندگان محترم مي باشد .
            </p>
          </div>
          <div className={style.gridDiv}>
            <div className={style.productsGrid}>
              <picture
                onClick={() => push("/products/M")}
                className={style.picture1}
              >
                <span></span>
                <img src="image/table.jpg" alt="" />
                <p>میز و صندلی</p>
              </picture>
              <picture
                onClick={() => push("/products/B")}
                className={style.picture2}
              >
                <span></span>
                <img src="image/bed.jpg" alt="" />
                <p>سرویس خواب</p>
              </picture>
              <picture
                onClick={() => push("/products/S")}
                className={style.picture3}
              >
                <span></span>
                <img src="image/sofa.jpg" alt="" />
                <p>مبل ها</p>
              </picture>
              <picture
                onClick={() => push("/products/J")}
                className={style.picture4}
              >
                <span></span>
                <img src="image/side.jpg" alt="" />
                <p>جلومبلی و عسلی</p>
              </picture>
              <picture
                onClick={() => push("/products/C")}
                className={style.picture5}
              >
                <span></span>
                <img src="image/tv.jpg" alt="" />
                <p>آینه کنسول و میز تلوزیون</p>
              </picture>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
