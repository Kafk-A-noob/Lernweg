import React from 'react';
import '../styles/globals.css';
import GlobalLayout from '../components/GlobalLayout';

export default function MyApp({ Component, pageProps }) {
  return (
    <GlobalLayout>
      <Component {...pageProps} />
    </GlobalLayout>
  );
}
