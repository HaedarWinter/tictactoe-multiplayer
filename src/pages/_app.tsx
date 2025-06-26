import React from 'react';
import { AppProps } from 'next/app';
import Error from 'next/error';
import '../app/globals.css';

// Global error handler
if (typeof window !== 'undefined') {
  window.onerror = function(message, source, lineno, colno, error) {
    console.error('Global error caught:', { message, source, lineno, colno, error });
    return false;
  };
}

function MyApp({ Component, pageProps }: AppProps) {
  // Check for pageProps.statusCode which indicates an error page
  if (pageProps.statusCode) {
    return <Error statusCode={pageProps.statusCode} />;
  }

  return <Component {...pageProps} />;
}

export default MyApp; 