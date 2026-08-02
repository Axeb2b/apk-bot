import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import Web3Wrapper from './web3/Web3Wrapper';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Web3Wrapper>
      <App />
    </Web3Wrapper>
  </StrictMode>,
);
