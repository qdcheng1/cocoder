var express = require("express");
var router = express.Router();
var problemService = require("../services/problemService");
var bodyParser = require("body-parser");
var jsonParser = bodyParser.json();

var node_rest_client = require('node-rest-client').Client;
var rest_client = new node_rest_client();

// Should be in a config file, hardcoded here
EXECUTOR_SERVER_URL = 'http://localhost:5000/build_and_run';
// register a remote method
rest_client.registerMethod('build_and_run', EXECUTOR_SERVER_URL, 'POST');
// GET /api/v1/problems
router.get("/problems", function (req, res) {
  problemService.getProblems()
    .then(problems => res.json(problems));
});

// GET /api/v1/problems/:id
router.get("/problems/:id", function (req, res) {
  var id = req.params.id;
  problemService.getProblem(+id)
    .then(problem => res.json(problem));
});

// Create a new problem
// POST /api/v1/problems
router.post('/problems', jsonParser, (req, res) => {
    problemService.addProblem(req.body)
        .then(problem => {
            res.json(problem);
        }, (error) => {
            res.status(400).send('Problem name already exists!');
        });
});

// build and run
router.post("/build_and_run", jsonParser, function(req, res) {
  const userCode = req.body.user_code;
  const lang = req.body.lang;

  console.log(lang + "; " + userCode);
  rest_client.methods.build_and_run(
    {
      data: {code: userCode, lang: lang},
      headers: { "Content-Type": "application/json"}
    }, (data, response) => {
      console.log("Recieved response from execution server: " + response);

      const text = `Build output: ${data['build']}
      Execute output: ${data['run']}`;

      data['text'] = text;
      res.json(data);
    }

  );
});

module.exports = router;
