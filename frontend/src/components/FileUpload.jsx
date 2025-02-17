import React, { useRef } from 'react';

export function FileUpload({ onFileSelected, accept = '.csv', label = 'Upload CSV' }) {
  const fileInputRef = useRef();

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Add console.log to see the file details
      console.log('Selected file:', {
        name: file.name,
        type: file.type,
        size: file.size
      });
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
        name="upload"
      />
      <button
        onClick={handleClick}
        className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg
                 hover:border-blue-500 hover:bg-blue-50 transition-colors
                 flex items-center justify-center gap-2 w-full"
      >
        + {label}
      </button>
    </div>
  );
}
