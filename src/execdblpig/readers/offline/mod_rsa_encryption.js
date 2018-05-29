shell.app.execdblp.offlinereader = ( function (my) {

  /**
   * Encrypts a text using AES and RSA encryption
   * @param plainText     {String}  Text that will be encrypted
   * @param rsaPublicKey  {String}  RSA Public Key that will be used (PEM) as string
   * @returns {{
   *    key:  string      RSA encrypted aesKey and aesIV (both 16 characters long)
   *    text: string      AES encrypted text
   * }}
   */
  my.encryptText = function (plainText, rsaPublicKey) {
    var deferred = $.Deferred(),
      aesObject = aesEncryption(plainText);

    rsaEncryption(
      aesObject.secretKey + aesObject.initializationVector,
      rsaPublicKey
    ).then(
      function (rsaEncryptedText) {
        deferred.resolve({
          key: rsaEncryptedText,
          text: aesObject.encryptedTextAsBase64
        });
      },
      function () {
        deferred.reject("Unable to encrypt the message");
      }
    );

    return deferred.promise();
  };


  /**
   * RSA encryption
   * @param   plainText    {string} The text that needs to be encrypted using the RSA encryption
   * @param   rsaPublicKey {string} The RSA public key (PEM) which will be used to encrypt the text
   * @returns              {Promise} Resolved with the encrypted text as base64
   */
  function rsaEncryption(plainText, rsaPublicKey) {
    var deferred = $.Deferred();
    crypto.subtle.importKey(
      "spki",
      convertPemToBinary(rsaPublicKey),
      {
        name: "RSA-OAEP",
        hash: {
          name: "SHA-512"
        }
      },
      false,
      ["encrypt"]
    ).then(
      function (publicKey) {
        crypto.subtle.encrypt({
            name: 'RSA-OAEP'
          },
          publicKey,
          stringToArrayBuffer(plainText)
        ).then(
          function (encryptedArrayBuffer) {
            deferred.resolve(arrayBufferToBase64(encryptedArrayBuffer));
          },
          function () {
            deferred.reject("Error during the encryption.");
          }
        );
      },
      function () {
        deferred.reject("Error during the retrieval of the public key.");
      }
    );
    return deferred.promise();
  }


  /**
   * Converts a RSA public key (PEM) to a binary object
   * @param   pem {string}     The RSA public key (PEM) which will be used to encrypt the text
   * @returns     {Uint8Array} The RSA public key as binary object (Array Buffer)
   */
  function convertPemToBinary(pem) {
    var lines = pem.split('\n');
    var encoded = '';
    for (var i = 0; i < lines.length; i++) {
      if (lines[i].trim().length > 0 &&
        lines[i].indexOf('-BEGIN RSA PRIVATE KEY-') < 0 &&
        lines[i].indexOf('-BEGIN RSA PUBLIC KEY-') < 0 &&
        lines[i].indexOf('-BEGIN PUBLIC KEY-') < 0 &&
        lines[i].indexOf('-END PUBLIC KEY-') < 0 &&
        lines[i].indexOf('-END RSA PRIVATE KEY-') < 0 &&
        lines[i].indexOf('-END RSA PUBLIC KEY-') < 0) {
        encoded += lines[i].trim();
      }
    }
    return base64StringToArrayBuffer(encoded);
  }


  /**
   * AES Encryption
   * Advanced Encryption Standard uses a symmetric-key algorithm, meaning the same key is used for both encrypting
   * and decrypting the data. AES encryption can be used for large amounts of data.
   * @param plainText {String}    Text to encrypt
   * @returns {{
     *      secretKey: string,
     *      initializationVector: string,
     *      encryptedTextAsBase64: string}
     * }
   */
  function aesEncryption(plainText) {

    // The AES encryption requires a secret key (key) and an initialization vector (IV). Important is that the
    // same IV may never be used for two messages. Below a random key and a random IV will be generated every time
    // the plain text is encrypted
    var secretKey = generateRandomKey(16),
      initializationVector = generateRandomKey(16);

    // Use the Crypto library for the encryption
    var mode = new Crypto.mode.CFB(Crypto.pad.pkcs7),
      input_bytes = Crypto.charenc.UTF8.stringToBytes(plainText),
      key = Crypto.charenc.UTF8.stringToBytes(secretKey),
      options = {
        iv: Crypto.charenc.UTF8.stringToBytes(initializationVector),
        asBytes: true,
        mode: mode
      },
      encrypted = Crypto.AES.encrypt(input_bytes, key, options);

    return {
      secretKey: secretKey,
      initializationVector: initializationVector,
      encryptedTextAsBase64: arrayBufferToBase64(encrypted)
    }
  }


  /**
   * Generate a random string
   * @param keyLength {Number}  The length of the random string
   * @returns {string}          The random string
   */
  function generateRandomKey(keyLength) {
    var _keyLength = keyLength || 10,
      text = "",
      possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < _keyLength; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
  }


  /**
   * Converts a base64 encoded string to binary object
   * @param   b64str {String}     Base64 encoded string
   * @returns        {Uint8Array} Binary object
   */
  function base64StringToArrayBuffer(b64str) {
    var byteStr = atob(b64str);
    var bytes = new Uint8Array(byteStr.length);
    for (var i = 0; i < byteStr.length; i++) {
      bytes[i] = byteStr.charCodeAt(i);
    }
    return bytes;
  }


  /**
   * Converts a string to an ArrayBuffer
   * @param    s {String}     String
   * @returns    {Uint8Array} Binary object
   */
  function stringToArrayBuffer(s) {
    var enc = new TextEncoder("utf-16");
    return enc.encode(s);
  }


  /**
   * Converts an array buffer to a base64 encoded string
   * @param   buffer {Uint8Array} Binary object
   * @returns        {string}     Base64 Encoded string
   */
  function arrayBufferToBase64(buffer) {
    var binary = '';
    var bytes = new Uint8Array(buffer);
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }


  return my;

}(shell.app.execdblp.offlinereader));
