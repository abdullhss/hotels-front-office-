import { postToBackend } from "./postToBackend.js";
import { getOrCreateDeviceSerial } from "./deviceSerial.js";

/**
 * Verifies an OTP code against a TransToken issued by Checklogin (login) or
 * RequireAuthentication (register / forgot-password). On success for a
 * login attempt the backend also returns the JWT/refresh token/SessionId/
 * User_Id needed to establish the new authenticated session.
 *
 * Example usage:
 * ```js
 *  const data = await ExecuteAuthentication({TransToken, VerCode})
 *  console.log(data)
 * ```
 */
export async function ExecuteAuthentication({ TransToken, VerCode, DeviceSerial }) {
  const {
    status, Data, error, JWTToken, RefreshToken, TokenExpiry, TokenExpiryDate,
    SessionId, SessionID, UserId, User_Id,
  } = await postToBackend({
    endpoint: "ExecuteAuthentication",
    payload: {
      TransToken,
      VerCode,
      DeviceSerial: DeviceSerial || getOrCreateDeviceSerial(),
    },
  });

  const sessionId = SessionId ?? SessionID;
  const encryptedUserId = User_Id ?? UserId;

  return {
    status,
    Data,
    error,
    JWTToken,
    RefreshToken,
    TokenExpiry,
    TokenExpiryDate,
    SessionId: sessionId,
    SessionID: sessionId,
    UserId: encryptedUserId,
    User_Id: encryptedUserId,
  };
}
