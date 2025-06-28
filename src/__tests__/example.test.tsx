import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';

test('renders app component', () => {
  const { getByText } = render(<App />);
  const linkElement = getByText(/your text here/i);
  expect(linkElement).toBeInTheDocument();
});