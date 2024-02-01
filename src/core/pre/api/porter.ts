//nulink-ts porter service url

import { getSettingsData } from "../../chainnet";


export const getPorterUrl = async () => {
  //return server url endsWith without "/"
  const config = await getSettingsData();

  const PorterUrl = config.porter.endsWith("/") ? config.porter.slice(0, -1) : config.porter;

  return PorterUrl;
};
