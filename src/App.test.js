import { render, screen } from '@testing-library/react';
import { act } from 'react';
import ImageComponent from './components/Image/Image';

describe('ImageComponent', () => {
  test('uses name prop when src not provided', () => {
    act(() => {
      render(<ImageComponent name="logo" alt="logo" />);
    });
    const img = screen.getByAltText('logo');
    expect(img).toHaveAttribute('src', '/logo.svg');
  });

  test('uses provided src', () => {
    act(() => {
      render(<ImageComponent src="/custom.png" alt="test" />);
    });
    const img = screen.getByAltText('test');
    expect(img).toHaveAttribute('src', '/custom.png');
  });
});
