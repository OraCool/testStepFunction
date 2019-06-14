'use strict';

const AWS = require('aws-sdk');
const stepfunctions = new AWS.StepFunctions();
const delay = ms => new Promise(res => setTimeout(res, ms));

module.exports.executeStepFunction = (event, context, callback) => {
  console.log('executeStepFunction');

  let number;

  if (event.queryStringParameters) {
    number = event.queryStringParameters.number;
  } else {
    var message = JSON.parse(event.Records[0].Sns.Message);

    console.log('Message received from SNS:', message);
    number = message.number;
  }
  console.log(number);

  callStepFunction(number).then(result => {
    let message = 'Step function is executing';
    if (!result) {
      message = 'Step function is not executing';
    }

    const response = {
      statusCode: 200,
      body: JSON.stringify({ message })
    };

    callback(null, response);
  });
};

module.exports.calculateRandomNumber = async (event, context, callback) => {
  console.log('calculateRandomNumber was called');

  let result = event.number;
  const iterator = event.iterator;
  console.log(result);
  console.log('calculateRandomNumber before delay');
  await delay(5000);
  console.log('calculateRandomNumber awaited 10 sec');
  callback(null, { result, iterator });
};

module.exports.moreCalculations = async (event, context, callback) => {
  console.log('moreCalculations was called');
  console.log(event);
  console.log('moreCalculations before delay');
  await delay(5000);
  console.log('moreCalculations awaited 10 sec');
  callback(null, null);
};

module.exports.iterator = (event, context, callback) => {
  let index = event.iterator.index;
  let step = event.iterator.step;
  let count = event.iterator.count ? event.iterator.count : event.count;

  index += step;
  console.log('iterator index', index);
  const next = index < count;
  console.log('iterator next', next);
  callback(null, { count, index, step, continue: next });
};

function callStepFunction(number) {
  console.log('callStepFunction');

  const stateMachineName = 'TestingStatesMachine'; // The name of the step function we defined in the serverless.yml
  console.log('Fetching the list of available workflows');

  return stepfunctions
    .listStateMachines({})
    .promise()
    .then(listStateMachines => {
      console.log('Searching for the step function', listStateMachines);

      for (var i = 0; i < listStateMachines.stateMachines.length; i++) {
        const item = listStateMachines.stateMachines[i];

        if (item.name.indexOf(stateMachineName) >= 0) {
          console.log('Found the step function', item);

          var params = {
            stateMachineArn: item.stateMachineArn,
            input: JSON.stringify({ number: number })
          };

          console.log('Start execution');
          return stepfunctions
            .startExecution(params)
            .promise()
            .then(() => {
              return true;
            });
        }
      }
    })
    .catch(error => {
      return false;
    });
}
