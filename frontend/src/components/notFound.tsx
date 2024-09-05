import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '@/allStyles/notFound.module.css'; // اختیاری: استفاده از ماژول‌های CSS

const NotFound = () => {

    const { back } = useRouter()
    return (
        <section className={styles.notFoundsection}>
            <div className={styles.notFoundContainer}>
                <h1 className={styles.heading}>۴۰۴ - صفحه پیدا نشد</h1>
                <p className={styles.message}>متأسفانه صفحه‌ای که به دنبال آن هستید وجود ندارد.</p>
                <div className={styles.actions}>
                    <button className={styles.goBackBtn} onClick={() => back()}>بازگشت به صفحه قبل</button>
                    <Link href="/" className={styles.homeLink}>
                        بازگشت به صفحه اصلی
                    </Link>
                </div>
            </div>
        </section>
    )
}

export default NotFound;
