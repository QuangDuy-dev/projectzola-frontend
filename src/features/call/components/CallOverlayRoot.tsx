import React from 'react';
import { IncomingCallDialog } from './IncomingCallDialog';
import { ActiveCallWindow } from './ActiveCallWindow';

export const CallOverlayRoot: React.FC = () => {
  return (
    <>
      <IncomingCallDialog />
      <ActiveCallWindow />
    </>
  );
};
