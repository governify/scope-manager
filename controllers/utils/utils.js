'use strict';

const fs = require('fs');
const axios = require('axios');
const mustache = require('mustache');
mustache.escape = function (text) { return text; };
const scopesGenerator = require('./scopesGenerator');

let scopeObject;
let authorizedTokens;

const init = () => {
  fs.readFile('./configurations/authKeys.json', 'utf-8', (err, data) => {
    if (err) { console.log(err); } else {
      authorizedTokens = JSON.parse(mustache.render(data, process.env, {}, ['$_[', ']']));
      console.log('Successfully loaded authorized keys.');
    }
  });

  if (process.env.URL_INT_ASSETS_MANAGER && process.env.KEY_ASSETS_MANAGER_PRIVATE) {
    fetchScopes();
  } else {
    console.log('Working without Assets Manager (Missing URL/key).');
    fs.readFile('./configurations/scopes.json', (err, data) => {
      if (err) { console.log(err); } else {
        console.log('Successfully loaded scopes from configurations file.');
        scopeObject = JSON.parse(data);
      }
    });
  }
};

const fetchScopes = () => {
  return new Promise((resolve, reject) => {
    console.log('Trying to fetch scopes.json file from assets.');
    axios.get(process.env.URL_INT_ASSETS_MANAGER + '/api/v1/private/scope-manager/scopes.json', {
      params: {
        private_key: process.env.KEY_ASSETS_MANAGER_PRIVATE
      }
    }).then((response) => {
      if (response.data === 'File not found.') {
        console.log('Error: scopes.json file not found in Assets Manager. Retrying in 10s.');
        setTimeout(() => {
          fetchScopes();
        }, 10000);
      } else {
        console.log('Successfully retrieved scopes from Assets Manager.');
        scopeObject = response.data;
      }
    }).catch((err) => {
      console.log('Error when retrieving scopes from Assets Manager. Retrying in 5s.', err.message);
      setTimeout(() => {
        fetchScopes();
      }, 5000);
    });
  });
};

const getCourses = () => {
  try {
    return scopeObject.development;
  } catch (err) {
    console.log('Internal error', err);
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
    console.log('Internal error', err);
    return 'error';
  }
};

const getProjects = (courseId) => {
  try {
    const course = getCourse(courseId);
    if (course) { return course.projects; } else { return undefined; }
  } catch (err) {
    console.log('Internal error', err);
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
    console.log('Internal error', err);
    return 'error';
  }
};

const getMembers = (courseId, projectId) => {
  try {
    const project = getProject(courseId, projectId);
    if (project) { return project.members; } else { return undefined; }
  } catch (err) {
    console.log('Internal error', err);
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
    console.log('Internal error', err);
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
    console.log('Internal error', err);
    return 'error';
  }
};

// Unauth Methods
const getCoursesUnauth = () => {
  try {
    return trimUnauthData([...getCourses()]);
  } catch (err) {
    console.log('Internal error', err);
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
    console.log('Internal error', err);
    return 'error';
  }
};

const getProjectsUnauth = (courseId) => {
  try {
    const course = getCourseUnauth(courseId);
    if (course) { return course.projects; } else { return undefined; }
  } catch (err) {
    console.log('Internal error', err);
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
    console.log('Internal error', err);
    return 'error';
  }
};

const getMembersUnauth = (courseId, projectId) => {
  try {
    const project = getProjectUnauth(courseId, projectId);
    if (project) { return project.members; } else { return undefined; }
  } catch (err) {
    console.log('Internal error', err);
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
    console.log('Internal error', err);
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
            console.log('No source for this identity:', identityItem);
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
    console.log('Problem when trimming data');
    return 'error';
  }
};

const isAuthorized = (token) => {
  try {
    return authorizedTokens.includes(token);
  } catch (err) {
    console.log('Authentication error', err);
    return false;
  }
};

// Scope generator

const generateScope = (generationRequest) => {
  return scopesGenerator.generateFromGithubList(generationRequest);
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

init();

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

exports.generateScope = generateScope;

exports.sendHelper = sendHelper;
