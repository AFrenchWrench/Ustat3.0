import {  z } from "zod"
import { zodResolver } from '@hookform/resolvers/zod';






const is_persian_string=(str: string): boolean => {
    const persianPattern = /^[\u0600-\u06FF\s]+$/;
  
    return persianPattern.test(str);
  }
  const isValidPhoneNumber = (phoneNumber: string) => {
    const regex = /^\+\d{9,15}$/;
    return regex.test(phoneNumber);
  };




const UserSchema = z.object({
    username: z.string()
      .min(1,"نام کاربری نمی‌تواند خالی باشد")
      .regex(/^[a-zA-Z][a-zA-Z0-9_]{3,20}$/, "نام کاربری معتبر نمیباشد"),
  
    password: z.string()
      .min(1,"گذرواژه نمی‌تواند خالی باشد")
      .min(8, "گذرواژه باید حداقل 8 کاراکتر باشد.")
      .regex(/[A-Z]/, "گذرواژه باید حداقل شامل یک حرف بزرگ انگلیسی باشد.")
      .regex(/[0-9]/, "گذرواژه باید حداقل شامل یک عدد باشد.")
      .regex(/[!@#$%^&*(),.?":{}|<>_]/, "گذرواژه باید حداقل شامل یک کاراکتر ویژه باشد."),
  
    confirmPassword: z.string()
      .min(1,"تکرار گذرواژه نمی‌تواند خالی باشد"),
  
    firstName: z.string({ required_error: "نام نمی‌تواند خالی باشد" })
      .refine(is_persian_string, "نام شما باید فارسی باشد"),
    lastName: z.string({ required_error: "نام خانوادگی نمی‌تواند خالی باشد" })
      .refine(is_persian_string, "نام خانوادگی شما باید فارسی باشد"),
  
    email: z.string({required_error:"ایمیل نمی‌تواند خالی باشد"})
      .email("ایمیل وارد شده معتبر نمی‌باشد"),
  
    phoneNumber: z.string()
      .regex(/^\d{9,15}$/, "شماره تلفن وارد شده معتبر نمی‌باشد فرمت درست : ...98+")
      .min(1,"شماره تلفن نمی‌تواند خالی باشد")
      .min(12,"شماره تلفن باید 12 رقم باشد"),
  
    landlineNumber: z.string()
      .regex(/^\d{9,15}$/, "شماره ثابت وارد شده معتبر نمی‌باشد فرمت درست : ...98+")
      .min(1,"شماره ثابت نمی‌تواند خالی باشد")
      .min(12,"شماره تلفن ثابت باید 12 رقم باشد"),
  
    // city: z.string({required_error: "شهر نمی‌تواند خالی باشد"}),
    birthDate: z.string({required_error:"تاریخ تولد الزامی است"}),
  
    isBusinessSigninInput: z.boolean(),
  
    businessName: z.string().optional(),
    ownerFirstName: z.string().optional(),
    ownerLastName: z.string().optional(),
    ownerPhoneNumber: z.string().optional(),
  
  }).superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "رمزعبور یکسان نیست",
        path: ["confirmPassword"]
      });
    }
  
    if (data.isBusinessSigninInput) {
      if (!data.businessName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "نام شرکت الزامی است",
          path: ["businessName"]
        });
      } else if (!is_persian_string(data.businessName)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "نام شرکت باید فارسی باشد",
          path: ["businessName"]
        });
      }
  
      if (!data.ownerFirstName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "نام صاحب شرکت الزامی است",
          path: ["ownerFirstName"]
        });
      } else if (!is_persian_string(data.ownerFirstName)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "نام صاحب شرکت باید فارسی باشد",
          path: ["ownerFirstName"]
        });
      }
  
      if (!data.ownerLastName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "نام خانوادگی صاحب شرکت الزامی است",
          path: ["ownerLastName"]
        });
      } else if (!is_persian_string(data.ownerLastName)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "نام خانوادگی صاحب شرکت باید فارسی باشد",
          path: ["ownerLastName"]
        });
      }
  
      if (!data.ownerPhoneNumber) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "شماره تلفن صاحب شرکت الزامی است",
          path: ["ownerPhoneNumber"]
        });
      } else if (!isValidPhoneNumber(data.ownerPhoneNumber)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "شماره تلفن وارد شده معتبر نمی‌باشد فرمت درست : ...98+",
          path: ["ownerPhoneNumber"]
        });
      } // بررسی موجود بودن شماره تلفن در سیستم باید در اینجا اضافه شود
    }
  });


  export default UserSchema