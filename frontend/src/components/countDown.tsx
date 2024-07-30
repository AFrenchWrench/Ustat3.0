import React, { useState, useEffect } from 'react';

type CountdownTimerProps = {
  setResendvar: React.Dispatch<React.SetStateAction<boolean>>;
  setIsTimerRunning: React.Dispatch<React.SetStateAction<boolean>>;
};

const CountdownTimer: React.FC<CountdownTimerProps> = ({ setResendvar, setIsTimerRunning }) => {
  const [timer, setTimer] = useState(10);

  useEffect(() => {
    setIsTimerRunning(true);
    const countdown = setInterval(() => {
      setTimer((prevTimer) => {
        if (prevTimer > 1) {
          return prevTimer - 1;
        } else {
          clearInterval(countdown);
          setIsTimerRunning(false);
          setResendvar(true);
          return 0;
        }
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [setIsTimerRunning, setResendvar]);

  return (
    <div>
      <p>{timer} ثانیه دیگر</p>
    </div>
  );
};

export default CountdownTimer;
