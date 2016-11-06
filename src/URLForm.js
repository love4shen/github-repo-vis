import React, { Component } from 'react';

const styles = {
  form: {
    display: 'flex',
    flexDirection: 'row',
  },

  form__label: {
    flex: '1 1 auto',
  }
};

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

    if (this.state.githubUrl.includes('github.com')) {
      this.props.updateState(Object.assign({}, this.state, {
        isLoading: true,
      }));

      handleVisRequest(this.state, this.props.updateState, this.props.processData);
    } else {
      alert('Bad Github URL');
    }

    
  }

  render() {
    return (
      <form style={styles.form}>
        <label style={styles.form__label}>
          <span>GitHub Url: </span>
          <input
            type="text"
            name="githubUrl"
            value={this.state.githubUrl}
            onChange={this.handleChange}
            />
        </label>
        <label style={styles.form__label}>
          <span>Username: </span>
          <input
            type="text"
            name="username"
            value={this.state.username}
            onChange={this.handleChange}
            />
        </label>
        <label style={styles.form__label}>
          <span>Password: </span>
          <input
            type="password"
            name="password"
            value={this.state.password}
            onChange={this.handleChange}
            />
        </label>
        <button
          onClick={this.handleSubmit}
          >Visualize!</button>
      </form>
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
      const [link] = res.headers.get('link').split(',');
      const [original, nextUrl, rel] = link.match(/\<(.*)\>\;\ rel\=\"([a-z]+)\"/);

      return res.json()
        .then(data => {
          const shas = data.map(e => e.sha);

          allCommits.push(...shas.map(sha => fetch(`${response.url}/${sha}`, initConfig)));

          if (rel === 'next') {
            return fetch(nextUrl, initConfig).then(getCommitsHelper).catch(err => console.log(err))
          } else {
            return new Promise((resolve, reject) => {
              resolve(allCommits);
            });
          }

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
