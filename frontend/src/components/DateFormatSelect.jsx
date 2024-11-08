import React from 'react';

export const DateFormatSelect = ({ selectedFormat, onChange, label }) => {
  return (
    <div className="mt-2">
      <label className="block text-sm text-gray-700 mb-1">{label}</label>
      <select
        value={selectedFormat}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
      >
        <option value="YYYY-MM-DD">YYYY-MM-DD (e.g., 2024-01-31)</option>
        <option value="DD/MM/YYYY">DD/MM/YYYY (e.g., 31/01/2024)</option>
        <option value="MM/DD/YYYY">MM/DD/YYYY (e.g., 01/31/2024)</option>
        <option value="DD-MM-YYYY">DD-MM-YYYY (e.g., 31-01-2024)</option>
        <option value="MM-DD-YYYY">MM-DD-YYYY (e.g., 01-31-2024)</option>
      </select>
    </div>
  );
};

export default DateFormatSelect;