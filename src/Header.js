import React from 'react';
import styled from 'styled-components';
import {
  PageHeader
} from 'react-bootstrap';

const Wrapper = styled.h1`
  width: 80%;
  margin: 0 auto;
`;

const Header = () => (
  <Wrapper>
    <PageHeader>
      <a href="#">GitHub Project Evolution Vis</a>
    </PageHeader>
  </Wrapper>
);

export default Header;
