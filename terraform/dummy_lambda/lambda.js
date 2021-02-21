"use strict";

exports.handler = function(event, context, callback) {
  var responseData = { serverTime: Date(), otherData: "Hello World" };
  var response = {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(responseData),
  };
  callback(null, response);
};
