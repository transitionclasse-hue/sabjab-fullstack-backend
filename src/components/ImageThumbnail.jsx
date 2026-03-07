import React from 'react';
import { Box } from '@adminjs/design-system';

const ImageThumbnail = (props) => {
  const { record, property } = props;
  const value = record.params[property.name];

  if (!value) {
    return <Box color="grey40">No Image</Box>;
  }

  // Handle potential string URLs or other formats from Cloudinary
  const imageUrl = String(value);

  return (
    <Box>
      <img
        src={imageUrl}
        alt={record.params.name || 'Thumbnail'}
        style={{
          width: '45px',
          height: '45px',
          objectFit: 'cover',
          borderRadius: '50%', // Circle looks more premium for thumb
          border: '2px solid #ffffff',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          display: 'block'
        }}
      />
    </Box>
  );
};

export default ImageThumbnail;
