const server = require('../server');

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const sinon = require('sinon');
const governify = require('governify-commons');
const nockController = require('./nockController')

const apiUrl = "http://localhost:5700/api/v1/scopes";

// For skipping tests in case of failure
const skip = [];
const keep = [];


describe('Tests', function () {

  before((done) => {
    governify.init().then((commonsMiddleware) => {
      server.deploy('test', commonsMiddleware).then( () => {
        governify.httpClient.setRequestLogging(false);
        nockController.instantiateMockups('test').then(() => {
          sinon.stub(console, 'log');
          done();
        }) 
      }).catch(err2 => {
        console.log(err2.message);
        done(err2);
      })
    }).catch(err1 => {
      console.log(err1.message);
      done(err1);
    });
  });

  describe('#apiRestControllersTestRequest()', function() {
    apiRestControllersTest('/testRequests.json');
  });
    
  describe('#apiRestControllersNegativeTestRequest()', function(){
    apiRestControllersTest('/negativeTestRequests.json');
  });

  after((done) => {
    server.undeploy(done);
  });
});


function apiRestControllersTest(JSONfile) {
  const testRequests = JSON.parse(fs.readFileSync(path.join(__dirname, JSONfile)));
  for(const testRequest of testRequests) {
    if ((keep.length === 0 && !skip.includes(testRequest.name)) || (keep.length !== 0 && keep.includes(testRequest.name))) {
      
      it(testRequest.name + 'should respond with code ' + testRequest.response.code + ' ' + testRequest.response.message + ' on ' + testRequest.method + ' /api/v1/scopes' + testRequest.endpoint, function(done){
        try{
          const options = {
            method: testRequest.method,
            url: apiUrl + testRequest.endpoint,
            data: testRequest.body,
            headers: {
              'User-Agent': 'request',
              'Content-Type': 'application/json',
              'Authorization' : testRequest.auth ?? ''
            }
          };
          governify.httpClient.request(options).then(response => {
            assert.strictEqual(response.status, 200);
            assert.strictEqual(response.data.code, testRequest.response.code)
            assert.deepStrictEqual(response.data.scope, testRequest.response.scope);
            assert.deepStrictEqual(response.data.projects, testRequest.response.projects);
            done();
          }).catch(err => {
            assert.fail('Error on request:' + err);
          })
        } catch(err){
          assert.fail('Error when sending request');
        }
      });
    }
  }
}
