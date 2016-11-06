import React from 'react';

const MessageBar = ({ isLoading }) => (
  <div style={{
    opacity: isLoading ? 1 : 0.01,
  }}>
    Loading...
  </div>
);

export default MessageBar;