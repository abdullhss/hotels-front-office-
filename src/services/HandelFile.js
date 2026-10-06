import axios from "axios";
import { AES256Encryption } from "../../utils/encryption.js";
import { getBase64 } from "./getBase64.js";
import { getBackendEndpoint, getDataToken } from "../lib/runtimeConfig.js";
import {
  applySessionStamps,
  buildLegacyAuthHeaders,
  handleLegacySessionResponse,
} from "../utils/auth/legacyRequestAuth.js";

// Every call builds a fresh encrypted ApiToken + RSAEncryptionKey/JWT headers and
// stamps the stored SessionId / DeviceSerial / User_Id onto the payload.
async function buildRequest(payload, extra = {}) {
  const { headers, apiToken } = await buildLegacyAuthHeaders();
  const jsonData = {
    ApiToken: apiToken,
    Data: AES256Encryption.encrypt(
      applySessionStamps({ ...payload, DataToken: getDataToken() })
    ),
    ...extra,
  };
  return { headers, jsonData };
}

/**
 * Represents a file handler for uploading, deleting, and downloading files.
 */
export class HandelFile {
  /**
   * Uploads a website file to the server.
   * @param {string} options.action - The action to perform on the file (e.g. "Add" for new upload, "Delete" to remove).
   * @param {string} [options.fileId=""] - The ID of the file (optional).
   * ```js
   * const data = await new HandelFile().UploadFileWebSite({action,file,fileId});
   * ```
   */
  async UploadFileWebSite({ action, file, fileId = "" }) {
    if (!file && action !== "Delete") return console.error("No file provided");
    const { headers, jsonData } = await buildRequest(
      {
        ActionType: action,
        FileId: fileId,
        MainId: 0,
        SubId: 0,
        DetailId: 0,
        FileType: `.${file?.name.split(".").pop()}`,
        Description: "",
        Name: file?.name || " ",
      },
      { encode_plc1: file ? (await getBase64(file))?.split(",")[1] : "" }
    );
    const { data } = await axios.post(getBackendEndpoint("UploadFileWebSite"), jsonData, { headers });
    handleLegacySessionResponse(data);
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
   * ```js
   * const data = await new HandelFile().UploadFile({action,file,fileId});
   * ```
   */
  async UploadFile({ action, file, fileId = "", onProgress, controller }) {
    if (!file) return console.error("No file provided");
    const base64File = await getBase64(file);
    const { headers, jsonData } = await buildRequest(
      {
        ActionType: action,
        FileId: fileId,
        MainId: 0,
        SubId: 0,
        DetailId: 0,
        FileType: `.${file?.name.split(".").pop()}`,
        Description: "",
        Name: file?.name || " ",
      },
      { encode_plc1: base64File.split(",")[1] }
    );
    const { data } = await axios.post(getBackendEndpoint("UploadFileEnc"), jsonData, {
      headers,
      signal: controller?.signal, // Hook into the abort signal
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          onProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
        }
      },
    });
    handleLegacySessionResponse(data);
    return {
      status: AES256Encryption.decrypt(data.Result),
      id: AES256Encryption.decrypt(data.FileId),
      error: AES256Encryption.decrypt(data.Error),
    };
  }

  /**
   * Deletes a file using the provided fileId.
   * @param {string} options.fileId - The ID of the file to be deleted.
   * ```js
   * const data = await new HandelFile().DeleteFile({fileId});
   * ```
   */
  async DeleteFile({ fileId = "" }) {
    const { headers, jsonData } = await buildRequest(
      {
        ActionType: "Delete",
        FileId: fileId,
        MainId: 0,
        SubId: 0,
        DetailId: 0,
        FileType: "",
        Description: "",
        Name: "",
      },
      { encode_plc1: "" }
    );
    const { data } = await axios.post(getBackendEndpoint("UploadFileEnc"), jsonData, { headers });
    handleLegacySessionResponse(data);
    return {
      status: AES256Encryption.decrypt(data.Result),
      id: AES256Encryption.decrypt(data.FileId),
      error: AES256Encryption.decrypt(data.Error),
    };
  }

  /**
   * Downloads a file by id.
   * @param {string} options.fileId - The id of the file to be downloaded.
   * ```js
   * const fileData = await new HandelFile().DownloadFile({fileId});
   * ```
   */
  async DownloadFile({ fileId = "" }) {
    const { headers, jsonData } = await buildRequest({ FileId: fileId });
    const { data } = await axios.post(getBackendEndpoint("DownloadFileEnc"), jsonData, { headers });
    handleLegacySessionResponse(data);
    let fileData = data.FileData?.replace(/\r\n/g, "")?.trim()?.replace(/^data/, "data:")?.replace(/base64/, ";base64,");
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
