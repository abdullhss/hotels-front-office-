import axios from "axios";
import { AES256Encryption } from "../../utils/encryption.js";
import { getBase64 } from "./UploadImage";

// https://framework.md-license.com:8093/emsserver.dll/ERPDatabaseWorkFunctions/
/**
 * Represents a file handler for uploading, deleting, and downloading files.
 */
export class HandelFile {
    /**
   * Uploads a file to the server.
   * @param {string} options.action - The action to perform on the file (e.g. "Add" for new upload, "Delete" to remove).
   * @param {string} [options.fileId=""] - The ID of the file (optional).
   * @param {string} options.SessionID - The session id of the user.
   * ```js
   * const data = await new HandelFile({ file: images }).UploadFile({action,fileId,SessionID});
   * console.log(data)
   * ```
   */
    async UploadFileWebSite({ action,file,fileId="",SessionID }) {
      if(!file&&action!=='Delete') return console.error("No file provided");
    const convertedFile = {
      MainId:0,
      SubId:0,
      DetailId:0,
      FileType:`.${file?.name.split('.').pop()}`,
      Description:"",
      Name:file?.name||" "
    }
    let jsonData = {
      ApiToken: "TTRgG@i$$ol@m$Wegh77",
      Data: AES256Encryption.encrypt({
        ActionType: action,
        FileId: fileId,
        ...convertedFile,
        DataToken: "Hotels",
        SessionID,
      }),
      encode_plc1: file?((await getBase64(file))?.split(',')[1]):"",
    };
    let { data } = await axios.post("https://framework.md-license.com:8093/emsserver.dll/ERPDatabaseWorkFunctions/" + "UploadFileWebSite",jsonData);
    return {
      status: AES256Encryption.decrypt(data.Result),
      id: AES256Encryption.decrypt(data.FileId),
      error: AES256Encryption.decrypt(data.Error),
    };
  }

  /**
   * Uploads a file to the server.
   * @param {string} options.action - The action to perform on the file (e.g. "Add" for new upload, "Delete" to remove).
   * @param {string} [options.fileId=""] - The ID of the file (optional).
   * @param {string} options.SessionID - The session id of the user.
   * ```js
   * const data = await new HandelFile({ file: images }).UploadFile({action,fileId,SessionID});
   * console.log(data)
   * ```
   */
  async UploadFile({ action, file, fileId = "", SessionID, onProgress, controller }) {
  if (!file) return console.error("No file provided");

  const convertedFile = {
    MainId: 0,
    SubId: 0,
    DetailId: 0,
    FileType: `.${file?.name.split('.').pop()}`,
    Description: "",
    Name: file?.name || " "
  };
  const base64File = await getBase64(file);
  const jsonData = {
    ApiToken: "TTRgG@i$$ol@m$Wegh77",
    Data: AES256Encryption.encrypt({
      ActionType: action,
      FileId: fileId,
      ...convertedFile,
      DataToken: "Hotels",
      SessionID,
    }),
    encode_plc1: base64File.split(',')[1],
  };
  const { data } = await axios.post(
    "https://framework.md-license.com:8093/emsserver.dll/ERPDatabaseWorkFunctions/" + "UploadFileEnc",
    jsonData,
    {
      signal: controller?.signal, // Hook into the abort signal
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      }
    }
  );
  console.log({
    status: AES256Encryption.decrypt(data.Result),
    id: AES256Encryption.decrypt(data.FileId),
    error: AES256Encryption.decrypt(data.Error),
  });
  return {
    status: AES256Encryption.decrypt(data.Result),
    id: AES256Encryption.decrypt(data.FileId),
    error: AES256Encryption.decrypt(data.Error),
  };
}



  /**
   * Deletes a file using the provided fileId.
   * @param {string} options.fileId - The ID of the file to be deleted.
   * @param {string} options.SessionID - The session id of the user.
   * ```js
   * const data = await new HandelFile().DeleteFile({fileId,SessionID});
   * console.log(data)
   * ```
   */
  async DeleteFile({ fileId="",SessionID }) {
    let jsonData = {
      ApiToken: "TTRgG@i$$ol@m$Wegh77",
      Data: AES256Encryption.encrypt({
        ActionType: "Delete",
        FileId: fileId,
        MainId: 0,
        SubId:0,
        DetailId:0,
        FileType:"",
        Description:"",
        Name:"",
        DataToken: "Hotels",
        SessionID,
      }),
      encode_plc1:""
    };
    let { data } = await axios.post("https://framework.md-license.com:8093/emsserver.dll/ERPDatabaseWorkFunctions/"+ "UploadFileEnc",jsonData);
    return {
      status: AES256Encryption.decrypt(data.Result),
      id: AES256Encryption.decrypt(data.FileId),
      error: AES256Encryption.decrypt(data.Error),
    };
  }

/**
 * Performs a DoTransaction with the Medad Backend Server.
 * @param {string} options.fileId - The id of the file to be downloaded. 
 * @param {string} options.SessionID - The session id of the user.
 * ```js
 * const fileData = await new HandelFile().DownloadFile({fileId});
 * console.log(fileData)
 * ```
 */
  async DownloadFile({ fileId="",SessionID }) {
    let jsonData = {
      ApiToken: "TTRgG@i$$ol@m$Wegh77",
      Data: AES256Encryption.encrypt({
        FileId: fileId,
        DataToken: "Hotels",
        SessionID,
      }),
    };
    let { data } = await axios.post(
      "https://framework.md-license.com:8093/emsserver.dll/ERPDatabaseWorkFunctions/" + "DownloadFileEnc",
      jsonData
    );
    let fileData = data.FileData?.replace(/\r\n/g, "")?.trim()?.replace(/^data/, "data:")?.replace(/base64/, ";base64,")
    if (fileData.startsWith("data:image/png") || fileData.startsWith("data:image/gif")) {
      fileData = fileData.slice(0, -1);
    }
    return {
      status: AES256Encryption.decrypt(data.Result),
      url: fileData,
      name: AES256Encryption.decrypt(data.SavedFileName),
      OriginalName: AES256Encryption.decrypt(data.OrgFileName),
      FileExt: AES256Encryption.decrypt(data.FileExt),
      error: AES256Encryption.decrypt(data.Error),
    };
  }

}
