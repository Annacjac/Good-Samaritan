const fetch = require("node-fetch");

exports.handler = async (event) => {
    const {endpoint} = event.queryStringParameters;
    const apiBaseURL = "http://rccgoodsamaritan.atwebpages.com/";

    try {
        const response = await fetch(`${apiBaseURL}${endpoint}`);
        const data = await response.text();

        return {
            statusCode: 200,
            body: data
        };
    }
    catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({error: "Failed to fetch data", details: error.message})
        };
    }
}