const http = require('../index');

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const governify = require('governify-commons');

const apiUrl = "http://localhost:5700/api/v1/scopes";

// For skipping tests in case of failure
const skip = [];
const keep = [];


describe('Tests', function () {
  describe('#apiRestControllersTestRequest()', function() {
    this.retries(3)
    apiRestControllersTest('/testRequests.json');
  });
    
  describe('#apiRestControllersNegativeTestRequest()', function(){
    this.retries(3)
    apiRestControllersTest('/negativeTestRequests.json');
  });

  after((done) => {
    http.shutdown(done);
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
            assert.fail('Error on request:');
          })
        } catch(err){
          assert.fail('Error when sending request');
        }
      });
    }
  }
}

function apiRestNegativeControllersTest() {
  const testRequests = JSON.parse(fs.readFileSync(path.join(__dirname,'/negativeTestRequests.json')));
}