import React from 'react';
import { Colors } from '../../theme/theme';

interface StatProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
}

const Stat: React.FC<StatProps> = ({
  label,
  value,
  icon,
  color = Colors.primary,
}) => {
  return (
    <div
      className="flex flex-col items-center p-8 rounded-lg bg-gray-50 border-2 border-gray-200"
      style={{}}
    >
      <div
        className="flex items-center justify-center w-12 h-12 rounded-xl mb-4"
        style={{
          backgroundColor: `${color}20`,
        }}
      >
        {icon}
      </div>
      <div
        className="text-lg font-bold text-gray-800 mb-2 text-center"
      >
        {value}
      </div>
      <div
        className="text-sm text-gray-600 text-center"
      >
        {label}
      </div>
    </div>
  );
};

export default Stat;

