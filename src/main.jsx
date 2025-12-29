import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from "@sentry/browser";
import App from './App';
import Auth0Provider from './auth/Auth0Provider';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/index.css';

Sentry.init({
  dsn: "https://bb878798be1591204bee06bdcb6f2535@o4510619524202496.ingest.us.sentry.io/4510619618181120",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Auth0Provider>
        <App />
      </Auth0Provider>
    </ErrorBoundary>
  </React.StrictMode>
);
