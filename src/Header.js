import React, { Component } from 'react';

const Header = () => (
  <header style={styles.header}>
    <h1>GitHub Project Evolution Vis</h1>
  </header>
);

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  }
}

export default Header;