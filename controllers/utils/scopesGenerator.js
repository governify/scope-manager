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

const getMissingAndValidationInfo = (infoObject) => {
  return new Promise((resolve, reject) => {
    const missingAttributes = [];
    const wrongAttributes = [];

    axios.get("https://raw.githubusercontent.com/governify/audited-project-template/main/info.yml").then((response) => {
      const originalInfoObject = jsyaml.load(response.data).project;

      for (const key1 of Object.keys(originalInfoObject)) {
        switch (key1) {
          case 'members':
          case 'identities':
            if (infoObject[key1] === undefined) {
              missingAttributes.push(key1);
            } else {
              for (const key2 of Object.keys(infoObject[key1])) {
                for (const key3 of Object.keys(originalInfoObject[key1][key2])) {
                  const missingAndValidation = checkField(infoObject[key1][key2][key3], originalInfoObject[key1][key2][key3], 'identities.' + key2 + '.' + key3);
                  if (missingAndValidation === undefined) {
                    missingAttributes.push('identities.' + key2 + '.' + key3)
                  } else if (missingAndValidation !== null) {
                    wrongAttributes.push(missingAndValidation)
                  }
                }
              }
            }
            break;
          default:
            if (infoObject[key1] === undefined) {
              missingAttributes.push(key1);
            }
        }
      }
      resolve({ missingAttributes: missingAttributes, wrongAttributes: wrongAttributes });
    }).catch(err => {
      reject(err);
    });
  });
}

const checkField = (field, validationRule, fieldLocation) => {
  if (field === undefined) {
    return undefined;
  } else {
    switch (validationRule) {
      case 'string':
        if (field === '') {
          return fieldLocation;
        }
        break;
      case 'number':
        var numberRegex = /^[0-9]+$/
        if (!numberRegex.test(field)) {
          return fieldLocation;
        }
        break;
      case 'url':
        var urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/
        if (!urlRegex.test(field)) {
          return fieldLocation;
        }
        break;
      case 'email':
        var emailRegex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
        if (!emailRegex.test(field)) {
          return fieldLocation;
        }
        break;
      default:
        return 'unknownValidationRule(' + validationRule + ')-' + fieldLocation;
    }
  }
  return null;
}


exports.generateFromGithubList = generateFromGithubList;
