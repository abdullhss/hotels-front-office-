import CryptoJS from "crypto-js";

function AsciiConverter(key) {
  let keyASCIIArry = [];
  for (let i = 0; i < key.length; i++) {
    let char = key[i];
    let ascii = char.charCodeAt(0);
    keyASCIIArry.push(ascii);
  }
  return keyASCIIArry;
}
export function ArrayResizer(arr, newSize, defaultValue) {
  let newArr = [...arr];
  if (newArr.length > newSize) {
    newArr = newArr.slice(0, newSize);
  } else {
    while (newSize > newArr.length) newArr.push(defaultValue);
  }
  newArr.length = newSize;
  return newArr;
}
export class AES256Encryption {
  static encrypt(data, key = "SL@C$@rd2023$$AlMedad$Soft$2022$") {
    try {
      if (!key) {
        throw new Error("Key is required");
      }
      let JsonObject = data;
      if (typeof data === "object" && !Object.keys(data).length) {
        JsonObject = { ...data };
        for (const key in JsonObject) {
          if (JsonObject[key] === undefined) {
            delete JsonObject[key];
          }
        }
      }

      const plaintext =
        typeof JsonObject === "object"
          ? JSON.stringify(JsonObject)
          : String(JsonObject);
      const asciiArr = AsciiConverter(key);
      const encKey = ArrayResizer(asciiArr, 32, 0);
      const ivArr = ArrayResizer(asciiArr, 16, 0);
      const encodedKey = CryptoJS.enc.Hex.parse(
        encKey.map((num) => ("0" + num.toString(16)).slice(-2)).join("")
      );
      const iv = CryptoJS.enc.Hex.parse(
        ivArr.map((num) => ("0" + num.toString(16)).slice(-2)).join("")
      );
      return CryptoJS.AES.encrypt(plaintext, encodedKey, { iv }).toString();
    } catch (error) {
      return { "Encryption failed:": error.message };
    }
  }
  static decrypt(
    encryptedData,
    key = "SL@C$@rd2023$$AlMedad$Soft$2022$"
  ) {
    try {
      if (!key) {
        throw new Error("Key is required");
      }
      const asciiArr = AsciiConverter(key);
      const encKey = ArrayResizer(asciiArr, 32, 0);
      const ivArr = ArrayResizer(asciiArr, 16, 0);
      const encodedKey = CryptoJS.enc.Hex.parse(
        encKey.map((num) => ("0" + num.toString(16)).slice(-2)).join("")
      );
      const iv = CryptoJS.enc.Hex.parse(
        ivArr.map((num) => ("0" + num.toString(16)).slice(-2)).join("")
      );
      const decrypted = CryptoJS.AES.decrypt(
        encryptedData?.replaceAll("\r\n", ""),
        encodedKey,
        { iv }
      );
      const decryption = decrypted.toString(CryptoJS.enc.Utf8);
      let flag = false;
      try {
        JSON.parse(decryption);
        flag = true;
      } catch (error) {
        decryption.trim.length && console.error(error.message);
      }
      return flag ? JSON.parse(decryption) : decryption;
    } catch (error) {
      return { "Decryption failed:": error.message };
    }
  }
}
