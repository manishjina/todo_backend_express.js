const setAccessTokenCookie = (res, token) => {
    res.cookie("access_token", token, {
      httpOnly: true,
      // Set to true if using HTTPS
    });
  };

  module.exports ={setAccessTokenCookie}