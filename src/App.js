import React, { Component } from 'react';
import './App.css';

import Header from './Header';
import MessageBar from './MessageBar';
import URLForm from './URLForm';
import Vis from './Vis';

class App extends Component {
  constructor() {
    super();

    this.state = {
      isLoading: false,
    }

    this.updateState = this.updateState.bind(this);
    this.processData = this.processData.bind(this);
  }

  updateState(updated) {
    this.setState(updated);
  }

  processData(data) {
    this.setState({
      data,
    });
  }

  render() {
    return (
      <div style={styles.container}>
        <Header />
        <URLForm
          updateState={this.updateState}
          processData={this.processData}
        />
        <MessageBar isLoading={this.state.isLoading} />
        <Vis commitData={this.state.data}/>
      </div>
    );
  }
}

const styles = {
  container: {
    width: '80%',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
}

export default App;
