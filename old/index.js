const process = require('./process.js');

document.querySelector('.form').addEventListener('submit', (evt) => {
  evt.preventDefault();

  const inputs = {};

  Array.from(evt.target.elements).filter(e => e.type !== 'submit')
    .forEach(e => {
      inputs[e.name] = e.value;
    });

  if (inputs['githubUrl'].includes('github.com')) {
    document.querySelector('.message').classList.add('visible')
    handleVisRequest(inputs);
  } else {
    alert('Bad Github URL');
  }
});

function handleVisRequest({ githubUrl, username, password }) {
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
    .then(acms => processAllShas(acms))
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

function processAllShas(acms) {
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

      document.querySelector('.message').classList.remove('visible')
      process(commitsData);

    })
    .catch(err => {
      console.log(err);
    });
}
