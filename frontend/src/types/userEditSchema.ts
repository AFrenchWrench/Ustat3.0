import { z } from "zod";

const is_persian_string = (str: string): boolean => {
  const persianPattern = /^[\u0600-\u06FF\s]+$/;
  return persianPattern.test(str);
};

const isValidPhoneNumber = (phoneNumber: string) => {
  const regex = /^\+\d{12}$/;
  return regex.test(phoneNumber);
};

const UserSchema = z.object({
  username: z.string()
    .refine(value => value === undefined || value === '' || /^[a-zA-Z][a-zA-Z0-9_]{3,20}$/.test(value), {
      message: "نام کاربری معتبر نمیباشد"
    })
    .optional(),

  password: z.string()
    .refine(value => value === undefined || value === '' || value.length >= 8, {
      message: "گذرواژه باید حداقل 8 کاراکتر باشد."
    })
    .refine(value => value === undefined || value === '' || /[A-Z]/.test(value), {
      message: "گذرواژه باید حداقل شامل یک حرف بزرگ انگلیسی باشد."
    })
    .refine(value => value === undefined || value === '' || /[0-9]/.test(value), {
      message: "گذرواژه باید حداقل شامل یک عدد باشد."
    })
    .refine(value => value === undefined || value === '' || /[!@#$%^&*(),.?":{}|<>_]/.test(value), {
      message: "گذرواژه باید حداقل شامل یک کاراکتر ویژه باشد."
    })
    .optional(),

  newPassword: z.string()
    .refine(value => value === undefined || value === '' || value.length >= 8, {
      message: "گذرواژه باید حداقل 8 کاراکتر باشد."
    })
    .refine(value => value === undefined || value === '' || /[A-Z]/.test(value), {
      message: "گذرواژه باید حداقل شامل یک حرف بزرگ انگلیسی باشد."
    })
    .refine(value => value === undefined || value === '' || /[0-9]/.test(value), {
      message: "گذرواژه باید حداقل شامل یک عدد باشد."
    })
    .refine(value => value === undefined || value === '' || /[!@#$%^&*(),.?":{}|<>_]/.test(value), {
      message: "گذرواژه باید حداقل شامل یک کاراکتر ویژه باشد."
    })
    .optional(),

  confirmNewPassword: z.string()
    .optional(),

  firstName: z.string()
    .refine(value => value === undefined || value === '' || is_persian_string(value), {
      message: "نام شما باید فارسی باشد"
    })
    .optional(),

  lastName: z.string()
    .refine(value => value === undefined || value === '' || is_persian_string(value), {
      message: "نام خانوادگی شما باید فارسی باشد"
    })
    .optional(),

  email: z.string()
    .refine(value => value === undefined || value === '' || /\S+@\S+\.\S+/.test(value), {
      message: "ایمیل وارد شده معتبر نمی‌باشد"
    })
    .optional(),

  phoneNumber: z.string()
    .refine(value => value === undefined || value === '' || /^\+\d{12}$/.test(value), {
      message: "شماره تلفن وارد شده معتبر نمی‌باشد فرمت درست : +123456789012"
    })
    .optional(),

  landlineNumber: z.string()
    .refine(value => value === undefined || value === '' || /^\+\d{12}$/.test(value), {
      message: "شماره ثابت وارد شده معتبر نمی‌باشد فرمت درست : +123456789012"
    })
    .optional(),

  city: z.string().optional(),

  birthdate: z.string().optional(),

  isBusinessSigninInput: z.boolean().optional(),

  business: z.object({
    name: z.string().refine(is_persian_string, {
      message: "نام شرکت باید فارسی باشد"
    }).optional(),
    ownerFirstName: z.string().refine(is_persian_string, {
      message: "نام صاحب شرکت باید فارسی باشد"
    }).optional(),
    ownerLastName: z.string().refine(is_persian_string, {
      message: "نام خانوادگی صاحب شرکت باید فارسی باشد"
    }).optional(),
    ownerPhoneNumber: z.string().refine(isValidPhoneNumber, {
      message: "شماره تلفن وارد شده معتبر نمی‌باشد فرمت درست : ...98+"
    }).optional(),
    address: z.string().refine((value) => {
      const pattern = /^[\u0600-\u06FF0-9\s,]+$/;
      return pattern.test(value);
    }, {
      message: "در آدرس تنها از حروف فارسی، اعداد انگلیسی، و ویرگول و یا فاصله استفاده کنید"
    }).optional(),
  }).optional(),
}).superRefine((data, ctx) => {
  if (data.confirmNewPassword && data.newPassword !== data.confirmNewPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "رمزعبور یکسان نیست",
      path: ["confirmNewPassword"],
    });
  }
  if (data.newPassword && !data.confirmNewPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "تکرار رمزعبور الزامی است",
      path: ["confirmNewPassword"],
    });
  }
  if(data.newPassword && !data.password){
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "رمزعبور خود را وارد کنید",
      path: ["password"],
    });
  }
});

export default UserSchema;
