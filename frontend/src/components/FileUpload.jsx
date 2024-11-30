import React, { useRef } from 'react';

export function FileUpload({ onFileSelected, accept = '.csv', label = 'Upload CSV' }) {
  const fileInputRef = useRef();

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      onFileSelected(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
      />
      <button
        onClick={handleClick}
        className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg
                 hover:border-blue-500 hover:bg-blue-50 transition-colors
                 flex items-center justify-center gap-2 w-full"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
        {label}
      </button>
    </div>
  );
}