// "use strict";
// exports.__esModule = true;

//andi Adds dynamic selection configuration compilation

//Determine whether it is a data production environment. The production environment needs js compression, obfuscation, and remove the log and debugger
//TODO: When you add a new .env file, you need to modify this array

exports.PROD_CONFIG = ["mobile", "prod"];

var isProdEnv = function () {
  var mode = process.env.REACT_APP_ENV ; // || process.env.RUN_ENV;
  //TODO: debugger the env variable RUN_ENV is it correct
  console.log(`-------------------------- mode : ${mode} ---------------------------------`);

  //Determine whether it is a data production environment. The production environment needs js compression, obfuscation, and remove the log and debugger
  var idProdConfig = exports.PROD_CONFIG.includes(mode.toLowerCase());
  console.log(
    "---------------------------config select ".concat(
      idProdConfig ? "prod" : "development",
      "-----------------------------"
    )
  );
  return idProdConfig;
};
exports.isProdEnv = isProdEnv;
