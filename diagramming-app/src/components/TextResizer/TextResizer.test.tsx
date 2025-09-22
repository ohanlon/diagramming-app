
import React from 'react';
import { render } from '@testing-library/react';
import TextResizer from './TextResizer';

test('renders TextResizer', () => {
  render(
    <svg>
      <TextResizer
        shapeId="test-shape"
        text="Test Text"
        initialTextOffsetX={0}
        initialTextOffsetY={0}
        initialTextWidth={100}
        initialTextHeight={50}
        zoom={1}
        isInteractive={true}
        isSelected={true}
      />
    </svg>
  );
});
