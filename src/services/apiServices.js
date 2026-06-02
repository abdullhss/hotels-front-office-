import axios from "axios";
import { AES256Encryption } from "../../utils/encryption";

//"https://client-frw.almedadsoft.com/emsserver.dll/ERPDatabaseWorkFunctions";
//"https://framework.md-license.com:8093/emsserver.dll/ERPDatabaseWorkFunctions";
// http://185.207.251.48:8085/ERPDatabaseWorkFunctions/
const API_BASE_URL =
"https://framework.md-license.com:8093/emsserver.dll/ERPDatabaseWorkFunctions";
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// API Configuration
const API_CONFIG = {
  API_TOKEN: "TTRgG@i$$ol@m$Wegh77", // Private key
  PUBLIC_KEY: "SL@C$@rd2023$$AlMedad$Soft$2022$", // Public key for encryption/decryption
};

function safeDecrypt(value) {
  if (value == null || value === "") return value;
  try {
    const out = AES256Encryption.decrypt(value, API_CONFIG.PUBLIC_KEY);
    if (out && typeof out === "object" && "Decryption failed:" in out) return value;
    return out;
  } catch {
    return value;
  }
}

function logProcedureCall({
  encryptedProcedureName,
  procedureValues,
  decryptedRow,
  decryptedFields,
}) {
  const procedureName = safeDecrypt(encryptedProcedureName);
  console.group("[ExecuteProcedure]");
  console.log("Procedure name (decrypted):", procedureName);
  console.log("Procedure values:", procedureValues);
  console.log("Decrypted response:", decryptedRow);
  if (decryptedFields?.result != null) {
    console.log("Decrypted result:", decryptedFields.result);
  }
  if (decryptedFields?.error != null) {
    console.log("Decrypted error:", decryptedFields.error);
  }
  if (decryptedFields?.serverTime != null) {
    console.log("Decrypted serverTime:", decryptedFields.serverTime);
  }
  console.groupEnd();
}

/**
 * Execute procedure with encrypted data
 */
export const executeProcedure = async (ProcedureName, procedureValues) => {
  try {
    // Data to encrypt
    const dataToEncrypt = {
      ProcedureName: ProcedureName,
      ParametersValues: procedureValues,
      DataToken: "Hotels",
    };

    // console.log("Data to encrypt:", dataToEncrypt);

    // Encrypt using public key
    const encryptedData = AES256Encryption.encrypt(
      dataToEncrypt,
      API_CONFIG.PUBLIC_KEY
    );

    // Request payload
    const payload = {
      ApiToken: API_CONFIG.API_TOKEN,
      Data: encryptedData,
    };

    // Make API call
    const response = await api.post("/ExecuteProcedure", payload);

    // Decrypt response fields
    const decryptedResponse = {};

    if (response.data.Result) {
      decryptedResponse.result = AES256Encryption.decrypt(
        response.data.Result,
        API_CONFIG.PUBLIC_KEY
      );
    }

    if (response.data.Error) {
      decryptedResponse.error = AES256Encryption.decrypt(
        response.data.Error,
        API_CONFIG.PUBLIC_KEY
      );
    }

    if (response.data.Data) {
      decryptedResponse.data = AES256Encryption.decrypt(
        response.data.Data,
        API_CONFIG.PUBLIC_KEY
      );
    }

    if (response.data.ServerTime) {
      decryptedResponse.serverTime = AES256Encryption.decrypt(
        response.data.ServerTime,
        API_CONFIG.PUBLIC_KEY
      );
    }

    const decryptedRow = decryptedResponse.data?.Result?.[0] ?? null;

    logProcedureCall({
      encryptedProcedureName: ProcedureName,
      procedureValues,
      decryptedRow,
      decryptedFields: {
        result: decryptedResponse.result,
        error: decryptedResponse.error,
        serverTime: decryptedResponse.serverTime,
      },
    });

    return {
      success: true,
      decrypted: decryptedRow,
      decryptedData: decryptedResponse.data,
      raw: response.data,
    };
  } catch (error) {
    console.error("API call failed:", error);
    console.group("[ExecuteProcedure]");
    console.log("Procedure name (decrypted):", safeDecrypt(ProcedureName));
    console.log("Procedure values:", procedureValues);
    console.error("Request error:", error.message);
    console.groupEnd();
    return {
      success: false,
      error: error.message,
      details: error.response?.data,
    };
  }
};

/**
 * checkLogin
 * ProcedureName: 7lgMl3DLGpYu7xln2ZexiA==
 * ParametersValues: Email#Pass#Encrypt#moduleNum
 * Encrypt placeholder: "$????", moduleNum: 2
 */
export const checkLogin = async (email, password, encrypt = "$????") => {
  const safeEmail = String(email ?? "").trim();
  const safePassword = String(password ?? "");
  const payload = `${safeEmail}#${safePassword}#${encrypt}#2`;

  try {
    const response = await executeProcedure(
      "7lgMl3DLGpYu7xln2ZexiA==",
      payload
    );

    if (!response?.success) {
      return {
        success: false,
        authenticated: false,
        message: response?.error || "Login request failed",
      };
    }

    const decrypted = response?.decrypted;
    const rawResult =
      decrypted?.Result ??
      decrypted?.result ??
      decrypted?.IsValid ??
      decrypted?.isValid ??
      decrypted?.Success ??
      decrypted?.success ??
      false;

    const normalized = String(rawResult).trim().toLowerCase();
    const authenticated = rawResult === true || normalized === "true" || normalized === "1";

    const token =
      decrypted?.SessionID ??
      decrypted?.sessionId ??
      decrypted?.SessionId ??
      decrypted?.Token ??
      decrypted?.token ??
      "";

    return {
      success: true,
      authenticated,
      token: token ? String(token) : "",
      data: decrypted,
      message: authenticated ? "" : (decrypted?.Message || decrypted?.message || "Invalid credentials"),
    };
  } catch (error) {
    return {
      success: false,
      authenticated: false,
      message: error?.message || "Login request failed",
    };
  }
};
export const DoTransaction = async (tableName, ColumnsValues , WantedAction=0 ,ColumnsNames=null) => {
  try {
    // Data to encrypt
    var dataToEncrypt = {
      TableName: tableName,
      ColumnsValues: ColumnsValues,
      WantedAction:WantedAction,
      DataToken: "Hotels",
      PointId:0
    };
    if(ColumnsNames != null){
      dataToEncrypt={...dataToEncrypt , ColumnsNames : ColumnsNames}
    }
    console.log("Data to encrypt:", dataToEncrypt);

    // Encrypt using public key
    const encryptedData = AES256Encryption.encrypt(
      dataToEncrypt,
      API_CONFIG.PUBLIC_KEY
    );

    // Request payload
    const payload = {
      ApiToken: API_CONFIG.API_TOKEN,
      Data: encryptedData,
    };

    // Make API call
    const response = await api.post("/DoTransaction", payload);

    // Decrypt response fields
    const decryptedResponse = {};

    if (response.data.Result) {
      decryptedResponse.result = AES256Encryption.decrypt(
        response.data.Result,
        API_CONFIG.PUBLIC_KEY
      );
    }
    if (response.data.NewId) {
        decryptedResponse.NewId = AES256Encryption.decrypt(
        response.data.NewId,
        API_CONFIG.PUBLIC_KEY
        )
    }
    if (response.data.Error) {
      decryptedResponse.error = AES256Encryption.decrypt(
        response.data.Error,
        API_CONFIG.PUBLIC_KEY
      );
    }

    if (response.data.Data) {
      decryptedResponse.data = AES256Encryption.decrypt(
        response.data.Data,
        API_CONFIG.PUBLIC_KEY
      );
    }

    if (response.data.ServerTime) {
      decryptedResponse.serverTime = AES256Encryption.decrypt(
        response.data.ServerTime,
        API_CONFIG.PUBLIC_KEY
      );
    }
    const errRaw = decryptedResponse.error
    const errTrimmed = errRaw != null && String(errRaw).trim() !== '' ? String(errRaw).trim() : null

    return {
      success: decryptedResponse.result,
      errorMessage: errTrimmed,
      NewId: decryptedResponse.NewId,
    };
  } catch (error) {
    console.error("API call failed:", error);
    return {
      success: false,
      error: error.message,
      details: error.response?.data,
    };
  }
};
export const RequireAuthentication = async (FunctionName, ProcedureName , ParametersValue , AuthType,SendTo) => {
  try {
    // Data to encrypt
    const dataToEncrypt = {
      FunctionName: FunctionName,
      ProcedureName: ProcedureName,
      ParametersValue:`${ParametersValue}#$????`,
      AuthType:AuthType,
      SendTo:SendTo,
      DataToken: "Hotels",
    };

    console.log("Data to encrypt:", dataToEncrypt);

    // Encrypt using public key
    const encryptedData = AES256Encryption.encrypt(
      dataToEncrypt,
      API_CONFIG.PUBLIC_KEY
    );

    // Request payload
    const payload = {
      ApiToken: API_CONFIG.API_TOKEN,
      Data: encryptedData,
    };

    // Make API call
    const response = await api.post("/RequireAuthentication", payload);

    // Decrypt response fields
    const decryptedResponse = {};

    if (response.data.Result) {
      decryptedResponse.result = AES256Encryption.decrypt(
        response.data.Result,
        API_CONFIG.PUBLIC_KEY
      );
    }
    
    if (response.data.TransToken) {
      decryptedResponse.TransToken = response.data.TransToken
    }
    
    if (response.data.Error) {
      decryptedResponse.error = AES256Encryption.decrypt(
        response.data.Error,
        API_CONFIG.PUBLIC_KEY
      );
    }

    if (response.data.Data) {
      decryptedResponse.data = AES256Encryption.decrypt(
        response.data.Data,
        API_CONFIG.PUBLIC_KEY
      );
    }

    if (response.data.ServerTime) {
      decryptedResponse.serverTime = AES256Encryption.decrypt(
        response.data.ServerTime,
        API_CONFIG.PUBLIC_KEY
      );
    }

    console.log("Decrypted response:", decryptedResponse);

    return {
      success:  decryptedResponse.result,
      TransToken: decryptedResponse.TransToken,
      error : decryptedResponse.error
    };
  } catch (error) {
    console.error("API call failed:", error);
    return {
      success: false,
      error: error.message,
      details: error.response?.data,
    };
  }
};
export const ExecuteAuthentication = async (TransToken   , VerCode    ) => {
  try {
    // Data to encrypt
    const dataToEncrypt = {
      TransToken   : TransToken   ,
      VerCode    : VerCode    ,
      DataToken: "Hotels"
    };

    console.log("Data to encrypt:", dataToEncrypt);

    // Encrypt using public key
    const encryptedData = AES256Encryption.encrypt(
      dataToEncrypt,
      API_CONFIG.PUBLIC_KEY
    );

    // Request payload
    const payload = {
      ApiToken: API_CONFIG.API_TOKEN,
      Data: encryptedData,
    };

    // Make API call
    const response = await api.post("/ExecuteAuthentication", payload);

    // Decrypt response fields
    const decryptedResponse = {};

    if (response.data.Result) {
      decryptedResponse.result = AES256Encryption.decrypt(
        response.data.Result,
        API_CONFIG.PUBLIC_KEY
      );
    }
    
    if (response.data.TransToken) {
      decryptedResponse.TransToken = response.data.TransToken
    }
    
    if (response.data.Error) {
      decryptedResponse.error = AES256Encryption.decrypt(
        response.data.Error,
        API_CONFIG.PUBLIC_KEY
      );
    }

    if (response.data.Data) {
      decryptedResponse.data = AES256Encryption.decrypt(
        response.data.Data,
        API_CONFIG.PUBLIC_KEY
      );
    }

    if (response.data.ServerTime) {
      decryptedResponse.serverTime = AES256Encryption.decrypt(
        response.data.ServerTime,
        API_CONFIG.PUBLIC_KEY
      );
    }

    console.log("Decrypted response:", decryptedResponse);

    return {
      success:  decryptedResponse.result,
      TransToken: decryptedResponse.TransToken,
    };
  } catch (error) {
    console.error("API call failed:", error);
    return {
      success: false,
      error: error.message,
      details: error.response?.data,
    };
  }
};
export const DoMultiTransaction = async (MultiTableName, MultiColumnsValues, WantedAction = 0) => {
  try {
    const dataToEncrypt = {
      MultiTableName,
      MultiColumnsValues,
      WantedAction,
      DataToken: "Hotels",
      PointId: 0,
    };

    console.log("Data to encrypt:", dataToEncrypt);

    const encryptedData = AES256Encryption.encrypt(
      dataToEncrypt,
      API_CONFIG.PUBLIC_KEY
    );

    const payload = {
      ApiToken: API_CONFIG.API_TOKEN,
      Data: encryptedData,
    };

    const response = await api.post("/DoMultiTransaction", payload);

    const decryptedResponse = {};

    if (response.data.Result) {
      decryptedResponse.result = AES256Encryption.decrypt(
        response.data.Result,
        API_CONFIG.PUBLIC_KEY
      );
    }

    if (response.data.MultiIdinties) {
      decryptedResponse.MultiIdinties = AES256Encryption.decrypt(
        response.data.MultiIdinties,
        API_CONFIG.PUBLIC_KEY
      );
    }

    if (response.data.Error) {
      decryptedResponse.error = AES256Encryption.decrypt(
        response.data.Error,
        API_CONFIG.PUBLIC_KEY
      );
    }

    if (response.data.Data) {
      decryptedResponse.data = AES256Encryption.decrypt(
        response.data.Data,
        API_CONFIG.PUBLIC_KEY
      );
    }

    if (response.data.ServerTime) {
      decryptedResponse.serverTime = AES256Encryption.decrypt(
        response.data.ServerTime,
        API_CONFIG.PUBLIC_KEY
      );
    }

    const errRaw = decryptedResponse.error
    const errTrimmed =
      errRaw != null && String(errRaw).trim() !== '' ? String(errRaw).trim() : null

    return {
      success: decryptedResponse.result,
      errorMessage: errTrimmed,
      MultiIdinties: decryptedResponse.MultiIdinties,
    };
  } catch (error) {
    console.error("API call failed:", error);
    return {
      success: false,
      error: error.message,
      errorMessage: error.message,
      details: error.response?.data,
    };
  }
};