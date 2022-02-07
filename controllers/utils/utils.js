'use strict';

const fs = require('fs');
const mustache = require('mustache');
mustache.escape = function (text) { return text; };
const governify = require('governify-commons');
const logger = governify.getLogger().tag('utils');
const CryptoJS = require('crypto-js');

const scopesGenerator = require('./scopesGenerator');

let scopeObject;
let authorizedTokens;

// Scope management
const init = () => {
  fs.readFile('./configurations/authKeys.json', 'utf-8', (err, data) => {
    if (err) { logger.error(err); } else {
      authorizedTokens = JSON.parse(mustache.render(data, process.env, {}, ['$_[', ']']));
      logger.info('Successfully loaded authorized keys.');
    }
  });

  if (process.env.KEY_ASSETS_MANAGER_PRIVATE) {
    fetchScopes().catch(logger.error);
  } else {
    logger.warn('Working without Assets Manager (Missing key).');
    fs.readFile('./configurations/scopes.json', (err, data) => {
      if (err) { logger.error(err); } else {
        logger.info('Successfully loaded scopes from configurations file.');
        scopeObject = JSON.parse(data);
      }
    });
  }
};

const fetchScopes = () => {
  return new Promise((resolve, reject) => {
    logger.info('Trying to fetch scopes.json file from assets.');
    governify.infrastructure.getService('internal.assets').get('/api/v1/private/scope-manager/scopes.json', {
      params: {
        private_key: process.env.KEY_ASSETS_MANAGER_PRIVATE
      }
    }).then((response) => {
      if (response.data === 'File not found.') {
        logger.error('Error: scopes.json file not found in Assets Manager. Retrying in 10s.');
        setTimeout(() => {
          fetchScopes();
        }, 10000);
      } else {
        logger.info('Successfully retrieved scopes from Assets Manager.');
        scopeObject = response.data;
      }
    }).catch((err) => {
      logger.error('Error when retrieving scopes from Assets Manager. Retrying in 5s.', err.message);
      setTimeout(() => {
        fetchScopes();
      }, 5000);
    });
  });
};

const putScopes = () => {
  return new Promise((resolve, reject) => {
    logger.info('Trying to PUT scopes.json file to assets.');
    governify.infrastructure.getService('internal.assets').put('/api/v1/private/scope-manager/scopes.json', scopeObject, {
      params: {
        private_key: process.env.KEY_ASSETS_MANAGER_PRIVATE
      }
    }).then((response) => {
      logger.info('Successfully saved scopes to Assets Manager.');
      logger.info(response);
      resolve();
    }).catch((err) => {
      logger.error('Error when saving scopes to Assets Manager. Retrying in 10s.', err.message);
      setTimeout(() => {
        putScopes();
      }, 10000);
    });
  });
};

const setCourseScope = (courseScope, courseId) => {
  let found = false;
  for (const courseIndex in scopeObject.development) {
    if (scopeObject.development[courseIndex].classId === courseId) {
      scopeObject.development[courseIndex] = courseScope;
      found = true;
      break;
    }
  }

  // Add if it does not exist
  //! found && scopeObject.development.push(courseScope);

  if (!found) {
    logger.warn('Course does not exist!');
  }

  if (process.env.KEY_ASSETS_MANAGER_PRIVATE) {
    putScopes();
  } else {
    logger.warn('Working without Assets Manager (Missing URL/key). Saving Scopes locally.');
    fs.writeFileSync('./configurations/scopes.json', JSON.stringify(scopeObject));
    logger.info('Successfully saved scopes to configurations file.');
  }
};

// API methods
const getCourses = () => {
  try {
    return scopeObject.development;
  } catch (err) {
    logger.error('Internal error', err);
    return 'error';
  }
};

const getCourse = (courseId) => {
  try {
    for (const course of scopeObject.development) {
      if (course.classId === courseId) { return course; }
    }
    return undefined;
  } catch (err) {
    logger.error('Internal error', err);
    return 'error';
  }
};

const getProjects = (courseId) => {
  try {
    const course = getCourse(courseId);
    if (course) { return course.projects; } else { return undefined; }
  } catch (err) {
    logger.error('Internal error', err);
    return 'error';
  }
};

const getProject = (courseId, projectId) => {
  try {
    const projects = getProjects(courseId);
    if (projects) {
      for (const project of projects) {
        if (project.projectId === projectId) { return project; }
      }
    }
    return undefined;
  } catch (err) {
    logger.error('Internal error', err);
    return 'error';
  }
};

const getMembers = (courseId, projectId) => {
  try {
    const project = getProject(courseId, projectId);
    if (project) { return project.members; } else { return undefined; }
  } catch (err) {
    logger.error('Internal error', err);
    return 'error';
  }
};

const getMember = (courseId, projectId, memberId) => {
  try {
    const members = getMembers(courseId, projectId);
    if (members) {
      for (const member of members) {
        if (member.memberId === memberId) { return member; }
      }
    }
    return undefined;
  } catch (err) {
    logger.error('Internal error', err);
    return 'error';
  }
};

const searchScope = (scope) => {
  try {
    if (scope.class) {
      if (scope.class.default) {
        if (scope.project) {
          if (scope.project.default) {
            if (scope.member) {
              if (scope.member.default) {
                return getMember(scope.class.default, scope.project.default, scope.member.default);
              } else {
                return getMembers(scope.class.default, scope.project.default);
              }
            } else {
              return getProject(scope.class.default, scope.project.default);
            }
          } else {
            return getProjects(scope.class.default);
          }
        } else {
          return getCourse(scope.class.default);
        }
      } else {
        return getCourses();
      }
    } else {
      return getCourses();
    }
  } catch (err) {
    logger.error('Internal error', err);
    return 'error';
  }
};

// Unauth Methods
const getCoursesUnauth = () => {
  try {
    return trimUnauthData([...getCourses()]);
  } catch (err) {
    logger.error('Internal error', err);
    return 'error';
  }
};

const getCourseUnauth = (courseId) => {
  try {
    for (const course of getCoursesUnauth()) {
      if (course.classId === courseId) { return course; }
    }
    return undefined;
  } catch (err) {
    logger.error('Internal error', err);
    return 'error';
  }
};

const getProjectsUnauth = (courseId) => {
  try {
    const course = getCourseUnauth(courseId);
    if (course) { return course.projects; } else { return undefined; }
  } catch (err) {
    logger.error('Internal error', err);
    return 'error';
  }
};

const getProjectUnauth = (courseId, projectId) => {
  try {
    const projects = getProjectsUnauth(courseId);
    if (projects) {
      for (const project of projects) {
        if (project.projectId === projectId) { return project; }
      }
    }
    return undefined;
  } catch (err) {
    logger.error('Internal error', err);
    return 'error';
  }
};

const getMembersUnauth = (courseId, projectId) => {
  try {
    const project = getProjectUnauth(courseId, projectId);
    if (project) { return project.members; } else { return undefined; }
  } catch (err) {
    logger.error('Internal error', err);
    return 'error';
  }
};

const getMemberUnauth = (courseId, projectId, memberId) => {
  try {
    const members = getMembersUnauth(courseId, projectId);
    if (members) {
      for (const member of members) {
        if (member.memberId === memberId) { return member; }
      }
    }
    return undefined;
  } catch (err) {
    logger.error('Internal error', err);
    return 'error';
  }
};

const trimUnauthData = (scopeToFilter) => {
  try {
    const classes = [];

    for (const classItem of scopeToFilter) {
      const class1 = { ...classItem };

      const projects = [];
      for (const projectItem of classItem.projects) {
        const project = { ...projectItem };

        const identities = [];
        for (const identityItem of projectItem.identities) {
          try {
            identities.push({ source: identityItem.source });
          } catch (err) {
            logger.error('No source for this identity:', identityItem);
          }
        }
        project.identities = [...identities];
        project.credentials = [];
        project.members = [];

        projects.push(project);
      }

      class1.identities = [];
      class1.credentials = [];
      class1.projects = [...projects];

      classes.push(class1);
    }

    return classes;
  } catch (err) {
    logger.error('Problem when trimming data');
    return 'error';
  }
};

const isAuthorized = (token) => {
  try {
    return authorizedTokens.includes(token);
  } catch (err) {
    logger.error('Authentication error', err);
    return false;
  }
};

// Scope generator

const checkInfoYml = (infoYml) => {
  if (infoYml.name === 'Wizard') return scopesGenerator.checkFromJson(infoYml);
  if (!infoYml.repoList.some((val) => val.includes('gitlab.com'))) {
    return scopesGenerator.checkFromGithubList(infoYml);
  } else {
    return scopesGenerator.checkFromGitLabList(infoYml);
  }
};

const generateScope = (generationRequest) => {
  if (!generationRequest.repoList.some((val) => val.includes('gitlab.com'))) {
    return scopesGenerator.generateFromGithubList(generationRequest);
  } else {
    return scopesGenerator.generateFromGitLabList(generationRequest);
  }
};

// Other methods
const sendHelper = (res, scope) => {
  if (scope) {
    if (scope !== 'error') {
      res.send({
        code: 200,
        message: 'Scope returned',
        scope: scope
      });
    } else {
      res.send({
        code: 500,
        message: 'Internal error'
      });
    }
  } else {
    res.send({
      code: 404,
      message: 'Scope not found',
      scope: undefined
    });
  }
};

const sendHelper2 = (res, content, code, contentName = 'scope') => {
  if (code === 200) {
    const sendObject = {
      code: code,
      message: contentName + ' returned'
    };
    sendObject[contentName] = content;
    res.send(sendObject);
  } else {
    res.send({
      code: code,
      message: content
    });
  }
};

const decrypt = (message) => {
  const result = CryptoJS.AES.decrypt(message, process.env.PRIVATE_KEY);
  return result.toString(CryptoJS.enc.Utf8);
};

init();

exports.setCourseScope = setCourseScope;

exports.getCourses = getCourses;
exports.getCourse = getCourse;
exports.getProjects = getProjects;
exports.getProject = getProject;
exports.getMembers = getMembers;
exports.getMember = getMember;

exports.searchScope = searchScope;

exports.getCoursesUnauth = getCoursesUnauth;
exports.getCourseUnauth = getCourseUnauth;
exports.getProjectsUnauth = getProjectsUnauth;
exports.getProjectUnauth = getProjectUnauth;
exports.getMembersUnauth = getMembersUnauth;
exports.getMemberUnauth = getMemberUnauth;

exports.isAuthorized = isAuthorized;

exports.checkInfoYml = checkInfoYml;
exports.generateScope = generateScope;

exports.sendHelper = sendHelper;
exports.sendHelper2 = sendHelper2;
exports.decrypt = decrypt;
