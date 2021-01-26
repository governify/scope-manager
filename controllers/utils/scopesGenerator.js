const axios = require('axios');
const jsyaml = require('js-yaml');

const githubRawUrl = 'https://raw.githubusercontent.com/';

const infoFilename = 'info.test.yml';

/*  generationRequest Example
{
    "courseId": "cstest",
    "repoList": [
        "https://github.com/governify/audited-project-template"
    ]
}
*/
const generateFromGithubList = (generationRequest, substitute = false, branch = 'main') => {
  return new Promise((resolve, reject) => {
    const base = {
      development: [
        {
          classId: 'classId',
          identities: [],
          credentials: [],
          projects: []
        }
      ]
    };

    if (generationRequest.courseId) {
      base.development[0].classId = generationRequest.courseId;
    }

    const projects = [];
    const promises = [];

    for (const repoURL of generationRequest.repoList) {
      const githubOwner = repoURL.split('github.com/')[1].split('/')[0];
      const githubRepo = repoURL.split('github.com/')[1].split('/')[1];

      const promise = new Promise((resolve, reject) => {
        getInfoYaml(githubRawUrl + githubOwner + '/' + githubRepo + '/', branch).then((response) => {
          try {
            const infoJson = jsyaml.load(response.data).project;

            infoJson.projectId = base.development[0].classId + '-GH-' + githubOwner + '_' + githubRepo;

            // Get Identities
            const identities = [
              {
                source: 'github',
                repository: githubRepo,
                repoOwner: githubOwner

              }
            ];

            for (const identity of Object.keys(infoJson.identities)) {
              const identityObject = { source: identity };

              if (identity === 'pivotal') {
                identityObject.projectId = infoJson.identities[identity].projectId.toString();
              } else if (identity === 'heroku') {
                identityObject.projectId = infoJson.identities[identity].appId;
              }
              identities.push(identityObject);
            }
            delete infoJson.identities; // Just for ordering the return object
            infoJson.identities = identities;

            // Get Members
            const members = [];

            for (const member of Object.keys(infoJson.members)) {
              const memberObject = {
                memberId: infoJson.members[member].name.replace(' ', '') + '_' + infoJson.members[member].surname.replace(' ', '')
              };

              // Member identities
              const memberIdentities = [];
              if (infoJson.members[member].githubUsername) {
                memberIdentities.push({
                  source: 'github',
                  username: infoJson.members[member].githubUsername
                });
              }
              if (infoJson.members[member].pivotalUsername) {
                memberIdentities.push({
                  source: 'pivotal',
                  username: infoJson.members[member].pivotalUsername
                });
              }
              if (infoJson.members[member].herokuEmail) {
                memberIdentities.push({
                  source: 'heroku',
                  email: infoJson.members[member].herokuEmail
                });
              }
              memberObject.identities = memberIdentities;

              // Credentials
              memberObject.credentials = [];

              members.push(memberObject);
            }
            delete infoJson.members; // Just for ordering the return object
            infoJson.members = members;

            // Push and resolve
            projects.push(infoJson);
            resolve();
          } catch (err) {
            console.log(err);
            resolve();
          }
        }).catch(err => {
          console.log('Info.yml retrieval to principal branch failed. Retrying with master instead.', err.message);
          resolve();
        });
      });

      promises.push(promise);
    }

    Promise.all(promises).then(() => {
      base.development[0].projects = projects;
      resolve(base);
    }).catch(err => {
      console.log(err);
      reject(err);
    });
  });
};

const getInfoYaml = (url, branch) => {
  return new Promise((resolve, reject) => {
    axios.get(url + branch + '/' + infoFilename).then((response) => {
      resolve(response);
    }).catch(err => {
      if (branch !== 'master') {
        resolve(getInfoYaml(url, 'master'));
      } else {
        console.log(err);
        resolve(undefined);
      }
    });
  });
};

/* const getMissingInfo = (infoObject) => {
  const missingAtributes = "";

  axios.get("https://raw.githubusercontent.com/governify/audited-project-template/main/info.yml").then((response) => {
    const originalInfoYaml = jsyaml.load(response.data).project;
    if (!infoObject.name) {

    }
  });
} */

exports.generateFromGithubList = generateFromGithubList;
