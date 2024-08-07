import { getSettingsData, getClientId } from '../../chainnet';
import axios, { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
// import {store as storage} from "../../utils/storage";
import queryString, { StringifiableRecord, UrlObject } from 'query-string';
import axiosRetry from 'axios-retry';
import { nanoid } from 'nanoid';
import { networkDetails } from '../../chainnet';
// eslint-disable-next-line import/no-extraneous-dependencies
import FormData from 'form-data';

const username = process.env.REACT_APP_SERVER_USERNAME;
const password = process.env.REACT_APP_SERVER_PASSWORD;

export const getServerUrl = async () => {
  //return server url endsWith without "/"
  const config = await getSettingsData();

  const serverUrl = config.service.endsWith('/') ? config.service.slice(0, -1) : config.service;

  // const token = Buffer.from(`${username}:${password}`, "utf8").toString(
  //   "base64",
  // );

  // await storage.setToken(token);
  return serverUrl;
};

/* export const getGreenFieldStorageServerUrl = async () => {
  //return server url endsWith without "/"

  let greenFieldStorageServerUrl: string =
    (process.env.REACT_APP_GREENFIELD_STORAGE_SERVER_URL as string) || "";
  const serverUrl = greenFieldStorageServerUrl.endsWith("/")
    ? greenFieldStorageServerUrl.slice(0, -1)
    : greenFieldStorageServerUrl;

  // const token = Buffer.from(`${username}:${password}`, "utf8").toString(
  //   "base64",
  // );

  // await storage.setToken(token);
  return serverUrl;
}; */

export const signatureRequest = async (urlPath: string, method: string, data: object, config?: AxiosRequestConfig) => {
  //Signing the request
  //solution: https://www.cnblogs.com/Sinte-Beuve/p/12093307.html

  //when we use the http basic auth verification, We no longer need signature verification
  if (method.toLowerCase() === 'post') {
    data['signature'] = nanoid();
  }
};

//exclude show error message list
const excludeList = ['file/create-policy-and-upload', 'file/upload', 'file/batch-upload', 'apply/detail'];

// Configure common request headers
// axios.defaults.baseURL = 'https://127.0.0.1:3000/api'
// Configure timeout
axios.defaults.timeout = 100000; //default `0` (Never timeout)
// Configure common request headers
// axios.defaults.headers.common['Authorization'] = AUTH_TOKEN;
// Configure the Content-Type of the public post
// axios.defaults.headers.post['Content-Type'] = 'application/json' //'application/x-www-form-urlencoded';

async function requestInterceptor(config: InternalAxiosRequestConfig) {
  // config.headers["Content-Type"] = "application/json";
  // config.headers.Accept = "application/json";
  // const token = await storage.getToken();
  // if (token) {
  //   config.headers.authorization = `Basic ${token}`;
  //   // config.headers['Authorization'] = `Basic ${token}`;
  // }

  const token = Buffer.from(`${username}:${password}`, 'utf8').toString('base64');
  config!.headers!.authorization = `Basic ${token}`;

  return config;
}

//request interceptors
axios.interceptors.request.use(requestInterceptor, function (error) {
  //When the request is wrong
  console.log(error);
  return Promise.reject(error);
});

//response interceptors
axios.interceptors.response.use(
  (response) => {
    // console.log("axios.interceptors.response", response);

    try {
      let hasUrl = 0;
      for (const value of Object.values(networkDetails)) {
        // console.log(value.CENTRALIZED_SERVER_URL as string);
        if ((response.config.url as string).indexOf(value.CENTRALIZED_SERVER_URL as string) < 0) {
          //If the request is not from CENTRALIZED_SERVER_URL, it is not processed
          hasUrl++;
        }
      }

      if (hasUrl >= 2) {
        //If the request is not from CENTRALIZED_SERVER_URL, it is not processed
        return response;
      }
    } catch (e) {
      console.log('axios.interceptors.response error:', e);
    }

    //The following is the logic for handling the CENTRALIZED_SERVER_URL
    const response_msg = response.data;
    if (response_msg && Object.prototype.hasOwnProperty.call(response_msg, 'code') && response_msg.code !== 2000) {
      //4000 Invalid Parameter
      //5000 Internal Server Error
      const resmsg = Object.prototype.hasOwnProperty.call(response_msg, 'msg') ? response_msg.msg : response_msg;
      console.error(resmsg);

      let showErrorMessage = true;
      const resUrl = response.config.url as string;
      excludeList.forEach((urlPath) => {
        if (resUrl.indexOf(urlPath) >= 0) {
          showErrorMessage = false;
        }
      });

      if (showErrorMessage) {
        // Message.error(resmsg);
        console.error(resmsg);
        // throw new Error(`newwork request: ${resmsg}`);
      }

      return Promise.reject(response);
    }

    return response_msg && Object.prototype.hasOwnProperty.call(response_msg, 'data')
      ? response_msg.data
      : response_msg;
  },
  (error) => {
    const message = error.response?.msg || error.msg;
    console.error('axios: ', message);
    // Message.error(message);
    return Promise.reject(error);
  }
);

axiosRetry(axios, {
  retries: 5,
  retryDelay: (retryCount) => {
    return /* retryCount * */ 1000;
  },
  retryCondition: (error) => {
    // if retry condition is not specified, by default idempotent requests are retried
    //return error.response.status === 503;
    // if(typeof error?.response?.status === "number")
    // {
    //   return error.response.status.toString().startsWith("5");
    // }
    // return false;
    try {
      return [502, 503, 504].includes(error?.response?.status as number);
    } catch (e) {
      return false;
    }
  }
});

//uploadDataInfo
export const serverPostFormData = async (urlPath: string, data: FormData, config?: object): Promise<unknown> => {
  const serverUrl = await getServerUrl();

  const baseConfig = {
    headers: {
      'Content-Type': 'multipart/form-data',
      Accept: 'application/json'
    }
  };

  urlPath = urlPath.startsWith('/') ? urlPath : '/' + urlPath;

  //note: The same key will be overwritten
  config = Object.assign({}, baseConfig, config);

  // await signatureRequest(urlPath, "POST", data, config);

  return await axios.post(`${serverUrl}${urlPath}`, data, config);
};

export const serverPost = async (urlPath: string, data: object, config?: object): Promise<unknown> => {
  const serverUrl = await getServerUrl();

  const baseConfig = {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    }
  };

  const clientId = await getClientId();
  //projectId
  if (clientId) {
    baseConfig.headers['NuClientId'] = clientId;
  }

  urlPath = urlPath.startsWith('/') ? urlPath : '/' + urlPath;

  //note: The same key will be overwritten
  config = Object.assign({}, baseConfig, config);

  // await signatureRequest(urlPath, "POST", data, config);

  return await axios.post(`${serverUrl}${urlPath}`, data, config);
};

export const serverGet = async (
  urlPath: string, // It should not begin with a /
  data: object,
  config?: object
): Promise<unknown> => {
  const serverUrl = await getServerUrl();

  const baseConfig = {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    }
  };

  urlPath = urlPath.startsWith('/') ? urlPath : '/' + urlPath;

  //note: The same key will be overwritten
  config = Object.assign({}, baseConfig, config);

  await signatureRequest(urlPath, 'GET', data, config);

  const order = Object.keys(data);
  const urlObject: UrlObject = {
    url: `${serverUrl}${urlPath}`,
    query: data as StringifiableRecord
  };
  const url = queryString.stringifyUrl(urlObject, {
    sort: (a, b) => order.indexOf(a) - order.indexOf(b)
  });
  // const queryStr = queryString.stringify(data, {
  //   sort: (a, b) => order.indexOf(a) - order.indexOf(b)
  // })

  return await axios.get(url, config);
};
