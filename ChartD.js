import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const ChartD = ({items}) => {
  const times = useState([]);
  const prices = useState([]);
  for(let i of items){
    times.push(i.time_stamp);
    prices.push(i.price);
  }
  times.splice(0,2);
  prices.splice(0,2);

  const data = {
    labels: times,
    datasets: [
      {
        label: 'Sales',
        data: prices,
        fill: false,
        backgroundColor: 'rgba(75,192,192,0.4)',
        borderColor: 'rgba(75,192,192,1)',
      },
    ],
  };

  const options = {
    scales: {
      y: {
        beginAtZero: true,
      },
      x: {
        beginAtZero: true,
      }
    },
  };

  return <Line data={data} options={options} />;
};

export default ChartD;