import React, { useEffect, useState } from 'react';

type CountdownTimerProps = {
  setResendvar: React.Dispatch<React.SetStateAction<boolean>>;
  setIsTimerRunning: React.Dispatch<React.SetStateAction<boolean>>;
  initialTime: number; // Add initialTime prop to allow setting the countdown time
};

const CountdownTimer: React.FC<CountdownTimerProps> = ({ setResendvar, setIsTimerRunning, initialTime }) => {
  const [timer, setTimer] = useState(initialTime);

  useEffect(() => {
    const countdown = setInterval(() => {
      setTimer((prevTimer) => {
        if (prevTimer > 1) {
          return prevTimer - 1;
        } else {
          clearInterval(countdown);
          setTimeout(() => {
            setIsTimerRunning(false);
            setResendvar(true);
          }, 0);
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
