import React, { Component } from 'react';
import styled from 'styled-components';
import {
  Form,
  FormGroup,
  FormControl,
  ControlLabel,
  Button,
} from 'react-bootstrap';

const Wrapper = styled.div`
  width: 80%;
  margin: 0 auto;
`;

class URLForm extends Component {
  constructor(props) {
    super(props);

    this.state = {
      githubUrl: '',
      username: '',
      password: '',
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(evt) {
    this.setState({
      [evt.target.name]: evt.target.value
    });
  }

  handleSubmit(evt) {
    evt.preventDefault();

    this.props.updateState(Object.assign({}, this.state, {
      isLoading: true,
      data: '',
    }));

    handleVisRequest(this.state, this.props.updateState, this.props.processData);

    this.setState({
      githubUrl: '',
      username: '',
      password: '',
    });
  }

  render() {
    return (
      <Wrapper>
        <Form inline>
          <FormGroup>
            <ControlLabel>GitHub URL</ControlLabel>
            {' '}
            <FormControl
              type="text"
              name="githubUrl"
              value={this.state.githubUrl}
              onChange={this.handleChange}
            />
          </FormGroup>
          {' '}
          <FormGroup>
            <ControlLabel>Username</ControlLabel>
            {' '}
            <FormControl
              type="text"
              name="username"
              value={this.state.username}
              onChange={this.handleChange}
            />
          </FormGroup>
          {' '}
          <FormGroup>
            <ControlLabel>Password</ControlLabel>
            {' '}
            <FormControl
              type="password"
              name="password"
              value={this.state.password}
              onChange={this.handleChange}
            />
          </FormGroup>
          {' '}
          <Button
            style={{
              float: 'right',
            }}
            bsStyle="primary"
            onClick={this.handleSubmit}
          >
            Visualize!
          </Button>
        </Form>
      </Wrapper>
    );
  }
}

export default URLForm;

function handleVisRequest({ githubUrl, username, password }, updateState, processData) {
  const [repo, owner] = githubUrl.split('/').reverse();

  const repoInfo = {
    owner,
    repo,
  };

  const authInfo = {
    username,
    password,
  };

  const initConfig = generateInitConfig(repoInfo, authInfo);
  const getCommits = getCommitsWrapper(initConfig);

  fetch(compGithubUrl(repoInfo), initConfig)
    .then(getCommits)
    .then(acms => processAllShas(acms, updateState, processData))
    .catch(err => console.log(err));
}

function generateInitConfig(repoInfo, authInfo) {
  const customeHeaders = new Headers();
  customeHeaders.append('user-agent', 'My-Cool-GitHub-App');
  customeHeaders.append('Authorization', "Basic " + btoa(authInfo.username + ":" + authInfo.password, "ascii"));
  return ({
    debug: false,
    protocol: "https",
    host: "api.github.com",
    followRedirects: false,
    method: 'GET',
    headers: customeHeaders,
    mode: 'cors',
    cache: 'default',
  });
}

function compGithubUrl(repoInfo) {
  return `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/commits`;
}

function getCommitsWrapper(initConfig) {

  return function (response) {

    const allCommits = [];

    function getCommitsHelper(res) {
      return res.json()
        .then(data => {
          const shas = data.map(e => e.sha);

          allCommits.push(...shas.map(sha => fetch(`${response.url}/${sha}`, initConfig)));

          const originLink = res.headers.get('link');

          if (originLink !== null && originLink !== undefined) {
            const [link] = originLink.split(',');
            const {
              1: nextUrl,
              2: rel
            } = link.match(/<(.*)>; rel="([a-z]+)"/);

            if (rel === 'next') {
              return fetch(nextUrl, initConfig).then(getCommitsHelper).catch(err => console.log(err));
            }
          }

          return new Promise((resolve, reject) => {
            resolve(allCommits);
          });

        })
        .catch(err => console.log(err));
    }

    return getCommitsHelper(response);
  }
}

function processAllShas(acms, updateState, processData) {
  Promise.all(acms)
    .then(ress => ress.map(res => res.json()))
    .then(promises => Promise.all(promises))
    .then(commits => {
      const filtered = commits.filter(e => 'files' in e);
      const commitsData = {};

      filtered.forEach(cmt => {
        const { sha, commit: { committer}, stats, files } = cmt;
        commitsData[sha] = {
          committer,
          stats,
          files,
        };
      });
      // console.log(Object.keys(commitsData).length);

      updateState({
        isLoading: false,
      });

      processData(commitsData);

      // document.querySelector('.message').classList.remove('visible')
      // process(commitsData);

    })
    .catch(err => {
      console.log(err);
    });
}
