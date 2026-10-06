import axios from "axios";
import { AES256Encryption } from "../../utils/encryption";
import { getBackendEndpoint, getDataToken } from "../lib/runtimeConfig";
import { Checklogin } from "../utils/auth/Checklogin";
import {
  applySessionStamps,
  buildLegacyAuthHeaders,
  handleLegacySessionResponse,
} from "../utils/auth/legacyRequestAuth";

function safeDecrypt(value, key) {
  if (value == null || value === "") return value;
  try {
    const out = key ? AES256Encryption.decrypt(value, key) : AES256Encryption.decrypt(value);
    if (out && typeof out === "object" && "Decryption failed:" in out) return value;
    return out;
  } catch {
    return value;
  }
}

function logProcedureCall({ procedureName, procedureValues, decryptedRow, decryptedFields }) {
  console.group("[ExecuteProcedure]");
  console.log("Procedure name (decrypted):", safeDecrypt(procedureName));
  console.log("Procedure values:", procedureValues);
  console.log("Decrypted response:", decryptedRow);
  if (decryptedFields?.result != null) console.log("Decrypted result:", decryptedFields.result);
  if (decryptedFields?.error != null) console.log("Decrypted error:", decryptedFields.error);
  if (decryptedFields?.serverTime != null) console.log("Decrypted serverTime:", decryptedFields.serverTime);
  console.groupEnd();
}

/**
 * POSTs an encrypted payload to one of the *Manager endpoints using the
 * JWT / RSAEncryptionKey / session-stamped scheme and returns the raw
 * response plus the per-request key needed to decrypt Data-like fields.
 */
async function postManager(endpoint, payload) {
  const { headers, apiToken } = await buildLegacyAuthHeaders();
  const jsonData = {
    ApiToken: apiToken,
    Data: AES256Encryption.encrypt(
      applySessionStamps({ ...payload, DataToken: getDataToken() })
    ),
  };
  const { data } = await axios.post(getBackendEndpoint(endpoint), jsonData, { headers });
  handleLegacySessionResponse(data);
  return { data, key: headers.RSAEncryptionKey };
}

function cleanError(raw) {
  return raw != null && String(raw).trim() !== "" ? String(raw).trim() : null;
}

/**
 * Execute procedure with encrypted data
 */
export const executeProcedure = async (ProcedureName, procedureValues) => {
  try {
    const { data, key } = await postManager("ExecuteProcedureManager", {
      ProcedureName,
      ParametersValues: procedureValues,
    });

    const decryptedResponse = {};
    if (data.Result) decryptedResponse.result = AES256Encryption.decrypt(data.Result);
    if (data.Error) decryptedResponse.error = AES256Encryption.decrypt(data.Error);
    if (data.Data) decryptedResponse.data = AES256Encryption.decrypt(data.Data, key);
    if (data.ServerTime) decryptedResponse.serverTime = AES256Encryption.decrypt(data.ServerTime);

    const decryptedRow = decryptedResponse.data?.Result?.[0] ?? null;

    logProcedureCall({
      procedureName: ProcedureName,
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
      raw: data,
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

/**
 * checkLogin
 * ProcedureName: 7lgMl3DLGpYu7xln2ZexiA==
 * ParametersValues: Email#Pass#Encrypt#moduleNum
 * Encrypt placeholder: "$????", moduleNum: 1
 *
 * Goes through the Checklogin endpoint; on success `auth` carries the
 * JWT / refresh token / session ids to hand to saveSession().
 */
export const checkLogin = async (email, password, encrypt = "$????") => {
  const safeEmail = String(email ?? "").trim();
  const safePassword = String(password ?? "");
  const ParametersValue = `${safeEmail}#${safePassword}#${encrypt}#1`;

  try {
    const response = await Checklogin({
      ProcedureName: "",
      ParametersValue,
      AuthType: "Email",
      SendTo: safeEmail,
    });

    if (Number(response?.status) !== 200) {
      return {
        success: false,
        authenticated: false,
        message: response?.error || "Login request failed",
      };
    }

    const decrypted = response?.Data?.Result?.[0] ?? null;
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

    const sessionId =
      response?.SessionID ??
      decrypted?.SessionID ??
      decrypted?.sessionId ??
      decrypted?.SessionId ??
      decrypted?.Token ??
      decrypted?.token ??
      "";

    return {
      success: true,
      authenticated,
      token: sessionId ? String(sessionId) : "",
      data: decrypted,
      auth: {
        jwtToken: response?.JWTToken,
        refreshToken: response?.RefreshToken,
        tokenExpiry: response?.TokenExpiry,
        tokenExpiryDate: response?.TokenExpiryDate,
        sessionId: sessionId ? String(sessionId) : undefined,
        encryptedUserId: response?.User_Id,
      },
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

export const DoTransaction = async (tableName, ColumnsValues, WantedAction = 0, ColumnsNames = null) => {
  try {
    const payload = {
      TableName: tableName,
      ColumnsValues,
      WantedAction,
      PointId: 0,
    };
    if (ColumnsNames != null) payload.ColumnsNames = ColumnsNames;

    const { data, key } = await postManager("DoTransactionManager", payload);

    return {
      success: data.Result ? AES256Encryption.decrypt(data.Result) : undefined,
      errorMessage: data.Error ? cleanError(AES256Encryption.decrypt(data.Error)) : null,
      NewId: data.NewId ? AES256Encryption.decrypt(data.NewId, key) : undefined,
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
    const { data, key } = await postManager("DoMultiTransactionManager", {
      MultiTableName,
      MultiColumnsValues,
      WantedAction,
      PointId: 0,
    });

    return {
      success: data.Result ? AES256Encryption.decrypt(data.Result) : undefined,
      errorMessage: data.Error ? cleanError(AES256Encryption.decrypt(data.Error)) : null,
      MultiIdinties: data.MultiIdinties ? AES256Encryption.decrypt(data.MultiIdinties, key) : undefined,
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
