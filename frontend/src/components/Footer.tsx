import React from 'react'
import Style from "@/allStyles/footer.module.css"
import Link from 'next/link'
import { BsInstagram } from 'react-icons/bs'
import { FaTelegramPlane, FaWhatsapp } from 'react-icons/fa'

const Footer = () => {
    return (
        <footer className={Style.footer}>
            <div className={Style.icons}>
                <Link target='_blank' href={"https://www.instagram.com/ustat.ticaret.online?igsh=MXU1M3I2cDhhb3loNA=="}>
                    <BsInstagram />
                </Link>
                <Link href="tg://resolve?domain=+905531961354" target="_blank" rel="noopener noreferrer">
                    <FaTelegramPlane />
                </Link>
                <Link href="https://wa.me/905531961354" target="_blank" rel="noopener noreferrer">
                    <FaWhatsapp />
                </Link>
            </div>
            <div>
                <p className='text-xs md:text-sm text-white'>
                    تهران - احمدآباد مستوفی - میدان پارسا - خیابان صنوبر چهار شمالی - شهرک بهسازی صنایع چوب ایران - سالن دو اداری
                </p>
            </div>
        </footer>
    )
}

export default Footer
