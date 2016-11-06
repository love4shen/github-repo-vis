import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import constructVis from './constructVis';

class Vis extends Component {
  constructor(props) {
    super(props); // data: commitData

    this.state = {};
  }

  componentDidMount() {
    this.setState({
      domNode: ReactDOM.findDOMNode(this),
    });
  }

  render() {
    if (this.props.commitData !== undefined) {
      constructVis(this.state.domNode, this.props.commitData)
    }

    return <div></div>;
  }
}

export default Vis;