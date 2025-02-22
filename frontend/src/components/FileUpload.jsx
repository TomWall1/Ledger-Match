import React, { useRef } from 'react';

export const FileUpload = ({ onFileSelected, accept, label }) => {
  const fileInput = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      console.log('Selected file in FileUpload:', file);
      onFileSelected(file);
    }
  };

  return (
    <div className="flex flex-col items-start space-y-2">
      <input
        type="file"
        ref={fileInput}
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
      />
      <button
        onClick={() => fileInput.current.click()}
        className="flex items-center px-4 py-2 bg-primary-navy text-white rounded-lg hover:bg-opacity-90 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
        {label}
      </button>
    </div>
  );
};
