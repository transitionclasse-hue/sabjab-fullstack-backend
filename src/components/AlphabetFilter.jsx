import React from 'react';
import { Box, Button, Text } from '@adminjs/design-system';
import { useLocation, useNavigate } from 'react-router-dom';

const AlphabetFilter = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const currentLetter = searchParams.get('letter') || '';

  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const handleLetterClick = (letter) => {
    const newParams = new URLSearchParams(location.search);
    if (newParams.get('letter') === letter) {
      newParams.delete('letter');
    } else {
      newParams.set('letter', letter);
      // Clear standard name filter to avoid conflicts if needed, 
      // but keeping it might be useful for sub-filtering.
    }
    // Reset page to 1 when changing filters
    newParams.set('page', '1');
    navigate({ search: newParams.toString() });
  };

  return (
    <Box variant="white" mt="xl" mb="xl" p="lg" borderRadius="lg" boxShadow="card">
      <Text variant="sm" fontWeight="bold" mb="md" color="grey60">
        ALPHABETICAL SEARCH
      </Text>
      <Box flex flexWrap="wrap" style={{ gap: '8px' }}>
        <Button
          size="sm"
          variant={currentLetter === '' ? 'primary' : 'light'}
          onClick={() => {
            const newParams = new URLSearchParams(location.search);
            newParams.delete('letter');
            newParams.set('page', '1');
            navigate({ search: newParams.toString() });
          }}
        >
          ALL
        </Button>
        {letters.map((letter) => (
          <Button
            key={letter}
            size="sm"
            variant={currentLetter === letter ? 'primary' : 'light'}
            onClick={() => handleLetterClick(letter)}
            style={{ minWidth: '36px' }}
          >
            {letter}
          </Button>
        ))}
      </Box>
    </Box>
  );
};

export default AlphabetFilter;
