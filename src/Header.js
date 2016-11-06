import React from 'react';

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  }
}

const Header = () => (
  <header style={styles.header}>
    <h1>GitHub Project Evolution Vis</h1>
  </header>
);

export default Header;