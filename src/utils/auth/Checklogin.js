import { postToBackend } from './postToBackend.js'

/**
 * Validates credentials. ProcedureName / FunctionName identify the login
 * stored procedure; the parameters travel inside ParametersValue.
 * Retries on 201 (transient backend state).
 */
export async function Checklogin({
  ProcedureName,
  FunctionName,
  ParametersValue,
  AuthType,
  SendTo = '',
  retries = 3,
  signal,
}) {
  while (retries > 0) {
    try {
      const payload = { ProcedureName, ParametersValue, AuthType, SendTo }
      if (FunctionName) payload.FunctionName = FunctionName
      const result = await postToBackend({ endpoint: 'Checklogin', payload, signal })
      if (result.status === 201 && --retries > 0) continue
      return result
    } catch (error) {
      return { status: null, Data: null, error: error?.message, ServerTime: null, TransToken: undefined }
    }
  }
}
