import React from 'react';
import styled from 'styled-components';
import {
  Alert,
  Fade,
} from 'react-bootstrap';

const Wrapper = styled.div`
  width: 80%;
  margin: 10px auto;
`;

const MessageBar = ({ isLoading }) => (
  <Wrapper isLoading={isLoading}>
    <Fade in={isLoading}>
      <Alert bsStyle="info">
        <strong>Loading...</strong>
      </Alert>
    </Fade>
  </Wrapper>
);

export default MessageBar;
