// src/components/DateFormatSelect.jsx
import React from 'react';

const DateFormatSelect = ({ selectedFormat, onChange, label = 'Select Date Format' }) => {
  return (
    <div className="mt-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <select
        value={selectedFormat}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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