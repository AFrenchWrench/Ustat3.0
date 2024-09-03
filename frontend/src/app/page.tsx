"use client"

import style from "@/allStyles/home.module.css"
import { useRouter } from "next/navigation";

export default function Home() {

  const { push } = useRouter()

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
              مجموعه اوستات تجارت با ارائه ي مبلمان با سبك آرت دكو و نئوكلاسيك با بهترین کیفیت و طراحی منحصر به فرد، زیبایی و اصالت را براي شما دوستداران اين سبك به ارمغان آورده است .
            </p>
            <p>
              شركت اوستات تجارت با  بازرگاني چوب و متريال مبلمان از كشور تركيه و بخش R@D  نيز در خدمت شما توليد كنندگان محترم مي باشد .
            </p>
          </div>
          <div className={style.gridDiv}>
            <div className={style.productsGrid}>
              <picture onClick={() => push("/products/S")} className={style.picture1}><span></span><img src="image/Rectangle 31.png" alt="" /><p>مبل ها</p></picture>
              <picture onClick={() => push("/products/B")} className={style.picture2}><span></span><img src="image/Rectangle 31.png" alt="" /><p>سرویس خواب</p></picture>
              <picture onClick={() => push("/products/M")} className={style.picture3}><span></span><img src="image/Rectangle 31.png" alt="" /><p>میز و صندلی</p></picture>
              <picture onClick={() => push("/products/J")} className={style.picture4}><span></span><img src="image/Rectangle 31.png" alt="" /><p>جلومبلی و عسلی</p></picture>
              <picture onClick={() => push("/products/C")} className={style.picture5}><span></span><img src="image/Rectangle 31.png" alt="" /><p>آینه کنسول</p></picture>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
