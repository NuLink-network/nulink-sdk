import { serverGet } from "../../servernet";
import { signMessage } from "../sign.message";
import FormData from "form-data";

/**
 * @internal
 */
export const getServerTimeStamp = async (): Promise<string> => {
  //get golbal time from server
  const sendData = {};

  const data = (await serverGet("/timestamp", sendData)) as object;

  return data["timestamp"] as string;
};

/**
 * @internal
 */
export const signUpdateServerDataMessage = async (
  privateKey: string,
  data: "dataDict" | FormData
) => {
  if (data instanceof FormData) {
    data.append(`timestamp`, await getServerTimeStamp());
  } else {
    // Do not use local time. Gets UTC real time in milliseconds with 0.001 precision from http://worldtimeapi.org/api/timezone/Etc/UTC.
    //data["timestamp"] = (new Date().getTime() / 1000) | 0; // Discard the decimal number
    //UTC real time
    data["timestamp"] = await getServerTimeStamp();
  }

  return await signMessage(data as any, privateKey);
};
