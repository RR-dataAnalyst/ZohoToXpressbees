const axios = require("axios");

let accessToken = null;

async function getAccessToken() {
  // Call your authentication server to refresh the access token
  const tokenUrl =
    "https://accounts.zoho.com/oauth/v2/token?refresh_token=1000.60eb41f8af9bcbaddce9912cfd9b003a.7e9b2e9f3b9bf3a81a017fb820edce82&client_id=1000.EOZCA4Z82NL6LMHEBX02818CZY6UXT&client_secret=d11b49cbe6e2ce12900095bbe4b40a49990ec67cee&grant_type=refresh_token";
  try {
    const response = await axios.post(tokenUrl);

    accessToken = response.data.access_token;
    console.log("Access token refreshed:", accessToken);
  } catch (error) {
    console.error("Error refreshing access token:", error.message);
  }
}

async function makeZohoAuthenticatedRequest(method, apiEndpoint, data = null) {
  // Check if the access token is available and not expired
  if (!accessToken) {
    await getAccessToken();
  }

  // Make an API request with the access token
  try {
    const response = await axios({
      method,
      url: apiEndpoint,
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
      },
      data,
    });

    // console.log(`API Response for ${apiEndpoint}:`, response.data);
    return response.data;
  } catch (error) {
    // If the request fails due to an unauthorized error, refresh the access token and retry
    if (error.response && error.response.status === 401) {
      await getAccessToken();
      // Retry the request with the new access token
      return makeZohoAuthenticatedRequest(method, apiEndpoint, data);
    } else {
      console.error(
        `Error making API request for ${apiEndpoint}:`,
        error.message
      );
      throw error;
    }
  }
}

module.exports = { makeZohoAuthenticatedRequest };
