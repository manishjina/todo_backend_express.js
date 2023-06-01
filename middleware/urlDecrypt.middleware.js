function encryptURL(url) {
    let encryptedURL = '';
    for (let i = 0; i < url.length; i++) {
      const charCode = url.charCodeAt(i);
      const encodedChar = encodeURIComponent(String.fromCharCode(charCode));
      encryptedURL += encodedChar;
    }
    return encryptedURL;
  }

  console.log(encryptURL("/task/alltask/1?page=1&limit=5"))
  function decryptURL(encryptedURL) {
    let decodedURL = '';
    let i = 0;
    while (i < encryptedURL.length) {
      if (encryptedURL.charAt(i) === '%') {
        const hexCode = encryptedURL.substr(i + 1, 2);
        const charCode = parseInt(hexCode, 16);
        decodedURL += String.fromCharCode(charCode);
        i += 3;
      } else {
        decodedURL += encryptedURL.charAt(i);
        i++;
      }
    }
    return decodedURL;
  }

  function decryptUrl(req, res, next) {
    // console.log(req.originalUrl)
    let url=decryptURL(req.originalUrl)

    req.originalUrl=url
next()
  }
  module.exports={decryptUrl}