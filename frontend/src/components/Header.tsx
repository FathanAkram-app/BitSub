import React from 'react';
import { AuthClient } from '@dfinity/auth-client';

interface HeaderProps {
  authClient?: AuthClient;
  isAuthenticated?: boolean;
}

export default function Header({ authClient, isAuthenticated }: HeaderProps): React.ReactElement {
  return (
    <header className="header">
      <div className="header__content">
        <div className="header__branding">
          <h1>₿ BitSub</h1>
          <p>Bitcoin Subscription Platform</p>
        </div>
        
      </div>
    </header>
  );
}