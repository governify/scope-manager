const jsyaml = require('js-yaml');
const governify = require('governify-commons');
const logger = governify.getLogger().tag('scopes-generator');

const utils = require('./utils');

const githubRawUrl = 'https://raw.githubusercontent.com/';

const infoFilename = 'info.yml';

/*  generationRequest Example
{
    "courseId": "cstest",
    "repoList": [
        "https://github.com/governify/audited-project-template"
    ]
}
*/

// ------------------------------- Check -------------------------------//
const checkFromGithubList = (checkRequest) => {
  /*eslint-disable */
  return new Promise(async (resolve, reject) => {
    /* eslint-enable */
    try {
      const missingAndValidation = {};
      const wrongAPIs = {};
      const infoYmlJson = {};
      const promises = [];

      for (const repoURL of checkRequest.repoList) {
        let githubOwner, githubRepo;

        try {
          githubOwner = repoURL.split('github.com/')[1].split('/')[0];
          githubRepo = repoURL.split('github.com/')[1].split('/')[1];
        } catch (err) {
          missingAndValidation[repoURL] = { missingValues: [], wrongFormatValues: ['Wrong URL, it should be a GitHub URL.'] };
          wrongAPIs[repoURL] = { invalidApiValues: [] };
          continue;
        }

        await getInfoYaml(githubRawUrl + githubOwner + '/' + githubRepo + '/', 'main').then((getInfoYamlResponse) => {
          checkInfoYaml(getInfoYamlResponse.data, missingAndValidation, wrongAPIs, infoYmlJson, promises, repoURL);
        });
      }

      Promise.all(promises).then(() => {
        const finalResponse = [];
        for (const project of Object.keys(missingAndValidation)) {
          const errorProject = {};
          errorProject.projectURL = project;

          // Errors splitted by category
          // errorProject.errors = { ...missingAndValidation[project] };
          // errorProject.errors.invalidApiValues = wrongAPIs[project].invalidApiValues;

          // Merged errors
          errorProject.errors = [...missingAndValidation[project].missingValues, ...missingAndValidation[project].wrongFormatValues];
          errorProject.errors = [...errorProject.errors, ...wrongAPIs[project].invalidApiValues];
          errorProject.infoYml = infoYmlJson[project];
          finalResponse.push(errorProject);
        }
        resolve(finalResponse);
      }).catch(err => {
        logger.error(err);
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
};

const checkFromGitLabList = (checkRequest) => {
  /*eslint-disable */
  return new Promise(async (resolve, reject) => {
    /* eslint-enable */
    try {
      const missingAndValidation = {};
      const wrongAPIs = {};
      const infoYmlJson = {};
      const promises = [];

      for (const repoURL of checkRequest.repoList) {
        if (!repoURL.includes('gitlab.com/')) {
          missingAndValidation[repoURL] = { missingValues: [], wrongFormatValues: ['Wrong URL, it should be a GitLab URL.'] };
          wrongAPIs[repoURL] = { invalidApiValues: [] };
          continue;
        }

        await getInfoYamlGitlab(repoURL + '/-/raw/', 'main').then((getInfoYamlResponse) => {
          if (getInfoYamlResponse === undefined) {
            missingAndValidation[repoURL] = { missingValues: ['Github Repo URL not valid or Info.yml file not found!'], wrongFormatValues: [] };
            wrongAPIs[repoURL] = { invalidApiValues: [] };
          } else {
            try {
              const infoJson = jsyaml.load(getInfoYamlResponse.data).project;
              infoYmlJson[repoURL] = infoJson;

              // Missing and format
              const missingAndValidationPromise = new Promise((resolve, reject) => {
                getMissingAndValidationInfo(infoJson, true).then((projectValidation) => {
                  missingAndValidation[repoURL] = { ...projectValidation };
                  resolve();
                }).catch(err => {
                  console.log(err);
                  resolve();
                });
              });
              promises.push(missingAndValidationPromise);

              // Invalid API values
              const invalidAPIValuesPromise = new Promise((resolve, reject) => {
                getWrongAPIValues(infoJson).then((projectValidation) => {
                  wrongAPIs[repoURL] = { ...projectValidation };
                  resolve();
                }).catch(err => {
                  console.log(err);
                  resolve();
                });
              });
              promises.push(invalidAPIValuesPromise);
            } catch (err) {
              missingAndValidation[repoURL] = { missingValues: [], wrongFormatValues: ['Not valid info.yml format. Check yaml syntax!'] };
              wrongAPIs[repoURL] = { invalidApiValues: [] };
            }
          }
        });
      }

      Promise.all(promises).then(() => {
        const finalResponse = [];
        for (const project of Object.keys(missingAndValidation)) {
          const errorProject = {};
          errorProject.projectURL = project;

          // Errors splitted by category
          // errorProject.errors = { ...missingAndValidation[project] };
          // errorProject.errors.invalidApiValues = wrongAPIs[project].invalidApiValues;

          // Merged errors
          errorProject.errors = [...missingAndValidation[project].missingValues, ...missingAndValidation[project].wrongFormatValues];
          errorProject.errors = [...errorProject.errors, ...wrongAPIs[project].invalidApiValues];
          errorProject.infoYml = infoYmlJson[project];
          finalResponse.push(errorProject);
        }
        resolve(finalResponse);
      }).catch(err => {
        console.log(err);
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
};

const checkFromJson = (checkRequest) => {
  /*eslint-disable */
  return new Promise(async (resolve, reject) => {
    /* eslint-enable */
    try {
      const missingAndValidation = {};
      const wrongAPIs = {};
      const infoYmlJson = {};
      const promises = [];

      checkInfoYaml(checkRequest.data, missingAndValidation, wrongAPIs, infoYmlJson, promises, 'Wizard');

      Promise.all(promises).then(() => {
        const finalResponse = [];
        for (const project of Object.keys(missingAndValidation)) {
          const errorProject = {};
          errorProject.projectURL = project;

          // Errors splitted by category
          // errorProject.errors = { ...missingAndValidation[project] };
          // errorProject.errors.invalidApiValues = wrongAPIs[project].invalidApiValues;

          // Merged errors
          errorProject.errors = [...missingAndValidation[project].missingValues, ...missingAndValidation[project].wrongFormatValues];
          errorProject.errors = [...errorProject.errors, ...wrongAPIs[project].invalidApiValues];
          errorProject.infoYml = infoYmlJson[project];
          finalResponse.push(errorProject);
        }
        resolve(finalResponse);
      }).catch(err => {
        logger.error(err);
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
};

const checkInfoYaml = (InfoYaml, missingAndValidation, wrongAPIs, infoYmlJson, promises, repoURL) => {
  if (InfoYaml === undefined) {
    missingAndValidation[repoURL] = { missingValues: ['Github Repo URL not valid or Info.yml file not found!'], wrongFormatValues: [] };
    wrongAPIs[repoURL] = { invalidApiValues: [] };
  } else {
    try {
      const infoJson = jsyaml.load(InfoYaml).project;
      infoYmlJson[repoURL] = infoJson;

      // Missing and format
      const missingAndValidationPromise = new Promise((resolve, reject) => {
        getMissingAndValidationInfo(infoJson, true).then((projectValidation) => {
          missingAndValidation[repoURL] = { ...projectValidation };
          resolve();
        }).catch(err => {
          console.log(err);
          resolve();
        });
      });
      promises.push(missingAndValidationPromise);

      // Invalid API values
      const invalidAPIValuesPromise = new Promise((resolve, reject) => {
        getWrongAPIValues(infoJson).then((projectValidation) => {
          wrongAPIs[repoURL] = { ...projectValidation };
          resolve();
        }).catch(err => {
          console.log(err);
          resolve();
        });
      });
      promises.push(invalidAPIValuesPromise);
    } catch (err) {
      missingAndValidation[repoURL] = { missingValues: [], wrongFormatValues: ['Not valid info.yml format. Check yaml syntax!'] };
      wrongAPIs[repoURL] = { invalidApiValues: [] };
    }
  }
};

// Missing and validation
const getMissingAndValidationInfo = (infoObject, gitlab) => {
  return new Promise((resolve, reject) => {
    const missingAttributes = [];
    const wrongAttributes = [];
    const url = 'https://raw.githubusercontent.com/governify/audited-project-template/main/info.yml';
    governify.httpClient.get(url).then((response) => {
      const originalInfoObject = jsyaml.load(response.data).project;
      for (const key1 of Object.keys(originalInfoObject)) {
        switch (key1) {
          case 'members':
            if (infoObject[key1] === undefined) {
              missingAttributes.push('Missing mandatory parameter: ' + key1);
            } else {
              if (Object.keys(infoObject[key1]).length === 0) {
                missingAttributes.push('There must be at least one member');
              } else {
                for (const key2 of Object.keys(infoObject[key1])) {
                  for (const key3 of Object.keys(originalInfoObject[key1].member)) {
                    let encripted = false;
                    if (infoObject[key1][key2][key3 + '_enc'] !== undefined) {
                      infoObject[key1][key2][key3] = infoObject[key1][key2][key3 + '_enc'];
                      encripted = true;
                    }
                    let fieldValue = infoObject[key1][key2][key3];
                    if (encripted) {
                      fieldValue = utils.decrypt(fieldValue);
                    }
                    if (originalInfoObject[key1].member[key3] !== undefined) {
                      const missingAndValidation = checkField(infoObject[key1][key2][key3], originalInfoObject[key1].member[key3], 'members.' + key2 + '.' + key3);
                      if (missingAndValidation === undefined) {
                        missingAttributes.push('Missing mandatory parameter: members.' + key2 + '.' + key3);
                      } else if (missingAndValidation !== null) {
                        wrongAttributes.push(missingAndValidation);
                      }
                    }
                  }
                }
              }
            }
            break;
          case 'identities':
            if (infoObject[key1] === undefined) {
              missingAttributes.push('Missing mandatory parameter: ' + key1);
            } else {
              for (const key2 of Object.keys(originalInfoObject[key1])) {
                let encripted = false;

                if (infoObject[key1][key2 + '_enc'] !== undefined) {
                  infoObject[key1][key2] = infoObject[key1][key2 + '_enc'];
                  encripted = true;
                }
                let fieldValue = infoObject[key1][key2];
                if (encripted) {
                  fieldValue = utils.decrypt(fieldValue);
                }
                const missingAndValidation = checkField(fieldValue, originalInfoObject[key1][key2], 'identities.' + key2);
                if (missingAndValidation === undefined) {
                  missingAttributes.push('Missing mandatory parameter: identities.' + key2);
                } else if (missingAndValidation !== null) {
                  wrongAttributes.push(missingAndValidation);
                }
              }
            }
            break;
          default:
            if (infoObject[key1] === undefined) {
              missingAttributes.push('Missing mandatory parameter: ' + key1);
            }
        }
      }
      resolve({ missingValues: missingAttributes, wrongFormatValues: wrongAttributes });
    }).catch(err => {
      reject(err);
    });
  });
};

const checkField = (field, validationRule, fieldLocation) => {
  if (field === undefined) {
    return undefined;
  } else {
    switch (validationRule) {
      case 'string':
        if (field === '') {
          return 'Field cannot be empty: ' + fieldLocation;
        }
        break;
      case 'number':
        /*eslint-disable */
        const numberRegex = /^[0-9]+$/;
        /* eslint-enable */
        if (!numberRegex.test(field)) {
          return 'Field must be number: ' + fieldLocation;
        }
        break;
      case 'url':
        /*eslint-disable */
        const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
        /* eslint-enable */
        if (!urlRegex.test(field)) {
          return 'Field must be an URL: ' + fieldLocation;
        }
        break;
      case 'email':
        /*eslint-disable */
        let emailRegex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
        /* eslint-enable */
        if (!emailRegex.test(field)) {
          return 'Field must be an email: ' + fieldLocation;
        }
        break;
      default:
        return 'unknownValidationRule(' + validationRule + ')-' + fieldLocation;
    }
  }
  return null;
};

// Wrong values
const getWrongAPIValues = (infoYml) => {
  return new Promise((resolve, reject) => {
    const wrongAPIs = [];
    const promises = [];
    // Pivotal
    if (infoYml.identities.pivotal) {
      const pivotalPromise = new Promise((resolve, reject) => {
        const pivotalUrlSplit = infoYml.identities.pivotal.split('/');
        const pivotalId = pivotalUrlSplit[pivotalUrlSplit.length - 1];
        getStatusCode('https://www.pivotaltracker.com/services/v5/projects/' + pivotalId, { 'X-TrackerToken': process.env.KEY_PIVOTAL ? process.env.KEY_PIVOTAL : '' }).then(statusCode => {
          if (statusCode === undefined) {
            wrongAPIs.push('Wrong Url or private project. If problem persists, please contact Governify administrator: identities.pivotal.url');
          } else if (statusCode !== 200) {
            wrongAPIs.push('Wrong Url or private project: identities.pivotal.url');
          }
          resolve();
        }).catch(err => {
          logger.error(err);
          resolve();
        });
      });
      promises.push(pivotalPromise);
    }

    // Heroku
    if (infoYml.identities.heroku && infoYml.identities.heroku) {
      const herokuPromise = new Promise((resolve, reject) => {
        const originalURL = infoYml.identities.heroku;
        const herokuRegex = /^https:\/\/[a-zA-Z0-9&_-]+\.herokuapp\.com/;
        if (herokuRegex.test(originalURL)) {
          const url = 'https://api.heroku.com/apps/' + originalURL.split('://')[1].split('.')[0];

          getStatusCode(url, { Accept: 'application/vnd.heroku+json; version=3', Authorization: 'Bearer ' + process.env.KEY_HEROKU }).then(statusCode => {
            if (statusCode === 403) {
              wrongAPIs.push('Forbidden access to Bluejay Auditor: identities.heroku.url');
            } else if (statusCode === 404) {
              wrongAPIs.push('Wrong Url: identities.heroku.url. Should follow the following patter: \'https://\' + appId + \'herokuapp.com\'');
            } else if (statusCode === 401) {
              wrongAPIs.push('Wrong Heroku Credentials - Please, contact Governify administrator');
            } else if (statusCode === undefined) {
              wrongAPIs.push('Wrong URL. If problem persists, please contact Governify administrator: identities.heroku.url');
            }
            resolve();
          }).catch(err => {
            logger.error(err);
            resolve();
          });
        } else {
          wrongAPIs.push('Wrong Url: identities.heroku.url. Should follow the following patter: \'https://\' + appId + \'herokuapp.com\'');
          resolve();
        }
      });
      promises.push(herokuPromise);
    }

    // GithubUsername
    for (const member of Object.keys(infoYml.members)) {
      if (infoYml.members[member].githubUsername) {
        const githubUsernamePromise = new Promise((resolve, reject) => {
          getStatusCode('https://github.com/' + infoYml.members[member].githubUsername).then(statusCode => {
            if (statusCode === undefined) {
              wrongAPIs.push('Wrong Username. If problem persists, please contact Governify administrator: members.' + member + '.githubUsername');
            } else if (statusCode !== 200) {
              wrongAPIs.push('Wrong Username: members.' + member + '.githubUsername');
            }
            resolve();
          }).catch(err => {
            logger.error(err);
            resolve();
          });
        });

        promises.push(githubUsernamePromise);
      }
    }

    Promise.all(promises).then(() => {
      resolve({ invalidApiValues: wrongAPIs });
    }).catch(err => {
      logger.error(err);
      reject(err);
    });
  });
};

const getStatusCode = (url, headers = {}) => {
  return new Promise((resolve, reject) => {
    governify.httpClient.get(url, { headers: { ...headers } }).then((response) => {
      resolve(response.status);
    }).catch((err) => {
      resolve(err.response ? err.response.status : undefined);
    });
  });
};

// ------------------------------- Generation -------------------------------//
const generateFromGithubList = (generationRequest) => {
  return new Promise((resolve, reject) => {
    const courseId = generationRequest.courseId;
    const courseScope = utils.getCourse(courseId);

    if (!courseScope) {
      return reject(new Error('Course does not exist.'));
      // Creates if does not exist
      /* courseScope = {
        classId: courseId,
        identities: [],
        credentials: [],
        projects: []
      }; */
    }

    const projects = [];

    checkFromGithubList(generationRequest).then((checkedProjects) => {
      for (const project of checkedProjects) {
        try {
          if (project.errors.length !== 0) {
            projects.push(project);
          } else {
            // Prepare project object
            const newProjectObject = { ...project };
            delete newProjectObject.errors;

            // Create new scope
            const infoJson = project.infoYml;

            const githubOwner = project.projectURL.split('github.com/')[1].split('/')[0];
            const githubRepo = project.projectURL.split('github.com/')[1].split('/')[1];

            infoJson.projectId = courseId + '-GH-' + githubOwner + '_' + githubRepo;

            // Add notifications
            const notifications = {};
            for (const notification of Object.keys(infoJson.notifications)) {
              let key = notification;
              let value = infoJson.notifications[key];
              if (key.endsWith('_enc')) {
                key = key.slice(0, -4);
                value = utils.decrypt(value);
              }
              notifications[key] = value;
            }
            delete infoJson.notifications;
            infoJson.notifications = notifications;

            // Add empty credentials
            infoJson.credentials = [];

            // Get Identities
            const identities = [
              {
                source: 'github',
                repository: githubRepo,
                repoOwner: githubOwner

              }
            ];

            for (const identity of Object.keys(infoJson.identities)) {
              let key = identity;
              let value = infoJson.identities[key];
              if (key.endsWith('_enc')) {
                key = key.slice(0, -4);
                value = utils.decrypt(value);
              }

              if (key !== 'github') {
                const identityObject = { source: key };

                if (key === 'pivotal') {
                  const pivotalUrlSplit = value.split('/');
                  identityObject.projectId = pivotalUrlSplit[pivotalUrlSplit.length - 1];
                } else if (key === 'heroku') {
                  identityObject.projectId = value.split('://')[1].split('.')[0];
                }
                identities.push(identityObject);
              }
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

            // Obtain old scope
            const oldScope = utils.getProject(courseId, infoJson.projectId);

            if (JSON.stringify(oldScope) === JSON.stringify(infoJson)) {
              projects.push({ ...project, errors: ['The is no new changes for this project scope.'], oldScope: { ...oldScope } });
            } else {
              oldScope && (newProjectObject.oldScope = { ...oldScope });
              newProjectObject.newScope = { ...infoJson };
              projects.push(newProjectObject);
            }
          }
        } catch (err) {
          logger.error(err);
        }
      }

      // Substitution
      for (const project of projects) {
        if (project.newScope) {
          if (project.oldScope) {
            for (const courseIndex in courseScope.projects) {
              if (courseScope.projects[courseIndex].projectId === project.newScope.projectId) {
                courseScope.projects[courseIndex] = project.newScope;
                break;
              }
            }
          } else {
            courseScope.projects.push(project.newScope);
          }
        }
      }
      utils.setCourseScope(courseScope, courseId);

      // Return response
      resolve(projects);
    }).catch(err => {
      logger.error(err);
      reject(err);
    });
  });
};

const generateFromGitLabList = (generationRequest) => {
  return new Promise((resolve, reject) => {
    const courseId = generationRequest.courseId;
    const courseScope = utils.getCourse(courseId);

    if (!courseScope) {
      return reject(new Error('Course does not exist.'));
      // Creates if does not exist
      /* courseScope = {
        classId: courseId,
        identities: [],
        credentials: [],
        projects: []
      }; */
    }

    const projects = [];

    checkFromGitLabList(generationRequest).then((checkedProjects) => {
      for (const project of checkedProjects) {
        try {
          if (project.errors.length !== 0) {
            projects.push(project);
          } else {
            // Prepare project object
            const newProjectObject = { ...project };
            delete newProjectObject.errors;

            // Create new scope
            const infoJson = project.infoYml;

            const gitlabOwner = project.projectURL.split('gitlab.com/')[1].split('/')[0];
            const gitlabRepo = project.projectURL.split('gitlab.com/')[1].split('/')[1];

            infoJson.projectId = courseId + '-GH-' + gitlabOwner + '_' + gitlabRepo;

            // Add notifications
            const notifications = {};
            if (infoJson.notifications) {
              notifications.grafana = {
                slack: {
                  name: 'Slack-Notification',
                  type: 'slack',
                  settings: {
                    url: infoJson.notifications.slack.url
                  }
                }
              };
              delete infoJson.notifications;
            }

            infoJson.notifications = notifications;

            // Add empty credentials
            infoJson.credentials = [];

            // Get Identities
            const identities = [
              {
                source: 'gitlab',
                repository: gitlabRepo,
                repoOwner: gitlabOwner,
                repoId: infoJson.identities.gitlab.repoId
              }
            ];

            for (const identity of Object.keys(infoJson.identities)) {
              if (identity !== 'gitlab') {
                const identityObject = { source: identity };

                if (identity === 'pivotal') {
                  const pivotalUrlSplit = infoJson.identities[identity].url.split('/');
                  identityObject.projectId = pivotalUrlSplit[pivotalUrlSplit.length - 1];
                } else if (identity === 'heroku') {
                  identityObject.projectId = infoJson.identities[identity].url.split('://')[1].split('.')[0];
                }
                identities.push(identityObject);
              }
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
              if (infoJson.members[member].gitlabUsername) {
                memberIdentities.push({
                  source: 'gitlab',
                  username: infoJson.members[member].gitlabUsername
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

            // Obtain old scope
            const oldScope = utils.getProject(courseId, infoJson.projectId);

            if (JSON.stringify(oldScope) === JSON.stringify(infoJson)) {
              projects.push({ ...project, errors: ['The is no new changes for this project scope.'], oldScope: { ...oldScope } });
            } else {
              oldScope && (newProjectObject.oldScope = { ...oldScope });
              newProjectObject.newScope = { ...infoJson };
              projects.push(newProjectObject);
            }
          }
        } catch (err) {
          logger.error(err);
        }
      }

      // Substitution
      for (const project of projects) {
        if (project.newScope) {
          if (project.oldScope) {
            for (const courseIndex in courseScope.projects) {
              if (courseScope.projects[courseIndex].projectId === project.newScope.projectId) {
                courseScope.projects[courseIndex] = project.newScope;
                break;
              }
            }
          } else {
            courseScope.projects.push(project.newScope);
          }
        }
      }
      utils.setCourseScope(courseScope, courseId);

      // Return response
      resolve(projects);
    }).catch(err => {
      logger.error(err);
      reject(err);
    });
  });
};

const getInfoYaml = (url, branch) => {
  return new Promise((resolve, reject) => {
    governify.httpClient.get(url + branch + '/' + infoFilename, { headers: { Authorization: process.env.KEY_GITHUB ? 'token ' + process.env.KEY_GITHUB : '' } }).then((response) => {
      resolve(response);
    }).catch(() => {
      if (branch !== 'master') {
        resolve(getInfoYaml(url, 'master'));
      } else {
        logger.info('Not found info.yml: ' + url + branch + '/' + infoFilename);
        resolve(undefined);
      }
    });
  });
};

const getInfoYamlGitlab = (url, branch) => {
  return new Promise((resolve, reject) => {
    governify.httpClient.get(url + branch + '/' + infoFilename, { headers: { 'PRIVATE-TOKEN': process.env.KEY_GITLAB ? process.env.KEY_GITLAB : '' } }).then((response) => {
      resolve(response);
    }).catch(() => {
      if (branch !== 'master') {
        resolve(getInfoYaml(url, 'master'));
      } else {
        console.log('Not found info.yml: ' + url + branch + '/' + infoFilename);
        resolve(undefined);
      }
    });
  });
};

exports.checkFromGithubList = checkFromGithubList;
exports.checkFromGitLabList = checkFromGitLabList;
exports.checkFromJson = checkFromJson;
exports.generateFromGithubList = generateFromGithubList;
exports.generateFromGitLabList = generateFromGitLabList;
