const axios = require("axios");

let accessToken = null;

// Function to get a valid access token
const getAccessToken = async () => {
  try {
    const response = await axios.post(
      "https://shipment.xpressbees.com/api/users/login",
      {
        email: "orders@therrgroup.in",
        password: "Xpress@2023",
      }
    );

    if (response.data) {
      accessToken = response.data.data;
      return accessToken;
    } else {
      throw new Error("Unable to obtain XpressBees access token");
    }
  } catch (error) {
    console.error("Error getting XpressBees access token:", error);
    throw error;
  }
};

// Function to make an authenticated request
// Function to make an authenticated request
const makeXpressBeesAuthenticatedRequest = async (
  apiEndpoint,
  method = "get",
  data = null
) => {
  try {
    const token = accessToken || (await getAccessToken());

    const response = await axios({
      method: method.toLowerCase(),
      url: apiEndpoint,
      headers: {
        Authorization: `Bearer ${token}`,
        // Other headers
      },
      data: data,
    });

    // Return the response data
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      // Token expired, refresh and retry the request
      accessToken = await getAccessToken();
      return makeXpressBeesAuthenticatedRequest(apiEndpoint, method, data);
    } else {
      console.error("Error making authenticated request:", error);
      throw error;
    }
  }
};

module.exports = { makeXpressBeesAuthenticatedRequest };
