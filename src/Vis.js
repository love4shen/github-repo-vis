import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import constructVis from './constructVis';
import d3 from 'd3';

class Vis extends Component {
  constructor(props) {
    super(props); // data: commitData

    this.state = {};
  }

  componentDidMount() {
    this.setState({
      domNode: ReactDOM.findDOMNode(this),
      width: Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
    });
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.isLoading) {
      d3.select(ReactDOM.findDOMNode(this)).select('svg').remove();
    }
  }

  render() {

    if (this.props.commitData !== undefined && this.props.commitData !== '') {
      constructVis(this.state.domNode, this.props.commitData, this.state.width)
    }

    return <div></div>;
  }
}

export default Vis;
