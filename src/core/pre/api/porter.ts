//nulink-ts porter service url

import { getSettingsData } from "../../chainnet";


export const getPorterUrl = async () => {
  //return server url endsWith without "/"
  const config = await getSettingsData();

  //call server interface to save strategy and file info
  const PorterUrl = config.porter.endsWith("/") ? config.porter.slice(0, -1) : config.porter;

  return PorterUrl;
};
