import React, { useState, useEffect } from 'react';

type CountdownTimerProps = {
  setResendvar: React.Dispatch<React.SetStateAction<boolean>>;
  setIsTimerRunning: React.Dispatch<React.SetStateAction<boolean>>;
};

const CountdownTimer: React.FC<CountdownTimerProps> = ({ setResendvar, setIsTimerRunning }) => {
  const [timer, setTimer] = useState(60);

  useEffect(() => {
    const countdown = setInterval(() => {
      setTimer(prevTimer => {
        if (prevTimer > 0) {
          return prevTimer - 1;
        } else {
          clearInterval(countdown);
          setIsTimerRunning(false); // تغییر وضعیت تایمر به غیر فعال
          setResendvar(false); // تغییر وضعیت دکمه ارسال دوباره کد به فعال
          return prevTimer;
        }
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, []);

  return (
    <div>
        <p>{timer} ثانیه دیگر</p>
    </div>
  );
};

export default CountdownTimer;
