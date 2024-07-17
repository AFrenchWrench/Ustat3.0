import { z } from "zod";

const is_persian_string = (str: string): boolean => {
  const persianPattern = /^[\u0600-\u06FF\s]+$/;
  return persianPattern.test(str);
};

const isValidPhoneNumber = (phoneNumber: string): boolean => {
  const regex = /^\+\d{12}$/;
  return regex.test(phoneNumber);
};

const businessSchema = z.object({
  businessName: z.string()
    .nonempty({ message: "نام شرکت الزامی است" })
    .refine(is_persian_string, {
      message: "نام شرکت باید فارسی باشد"
    }),
  
  ownerFirstName: z.string()
    .nonempty({ message: "نام صاحب شرکت الزامی است" })
    .refine(is_persian_string, {
      message: "نام صاحب شرکت باید فارسی باشد"
    }),
  
  ownerLastName: z.string()
    .nonempty({ message: "نام خانوادگی صاحب شرکت الزامی است" })
    .refine(is_persian_string, {
      message: "نام خانوادگی صاحب شرکت باید فارسی باشد"
    }),
  
  ownerPhoneNumber: z.string()
    .nonempty({ message: "شماره تلفن صاحب شرکت الزامی است" })
    .refine(isValidPhoneNumber, {
      message: "شماره تلفن وارد شده معتبر نمی‌باشد فرمت درست : ...98+"
    }),
  
  address: z.string()
    .nonempty({ message: "آدرس الزامی است" })
    .refine((value) => {
      const pattern = /^[\u0600-\u06FF0-9\s,]+$/;
      return pattern.test(value);
    }, {
      message: "در آدرس تنها از حروف فارسی، اعداد انگلیسی، و ویرگول و یا فاصله استفاده کنید"
    }),
});

export default businessSchema;
