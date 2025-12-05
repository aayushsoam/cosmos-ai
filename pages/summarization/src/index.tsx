import React from 'react';
import ReactDOM from 'react-dom/client';
import { withErrorBoundary, withSuspense } from '@extension/shared';
import SummarizationPage from './SummarizationPage';
import './index.css';

const App = withErrorBoundary(withSuspense(SummarizationPage, <div>Loading...</div>), <div>Error Occurred</div>);

const container = document.getElementById('app-container');
if (container) {
  ReactDOM.createRoot(container).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
