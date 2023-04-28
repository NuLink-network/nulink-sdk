import SingletonService from "singleton-service";
import sleep from "await-sleep";
import { create, IPFSHTTPClient } from "ipfs-http-client";
import { AwaitIterable } from "ipfs-core-types";
// Remove interdependence
// import { getSettingsData as getConfigData } from "../chainnet";
import { isBlank } from "./null";
import { decrypt as pwdDecrypt } from "./passwordEncryption";

const IPFS_CLIENT_INSTANCE_NAME_PREFIX = "ipfsClient";

export const getIPFSClient = async () => {
  //const secret = pwdEncrypt('Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64'));
  //console.log("encrypt: ", secret);

  // for get instance with saved key
  let client = SingletonService.get<IPFSHTTPClient>(IPFS_CLIENT_INSTANCE_NAME_PREFIX);
  if (isBlank(client)) {
    const { getSettingsData } = await import("../chainnet");
    const config = await /* getConfigData */getSettingsData();

    const bInfura: boolean = config.ipfs.indexOf("infura") >= 0;
    let options: any = { url: config.ipfs };
    if (bInfura) {
      options = {
        ...options,
        headers: {
          authorization: pwdDecrypt(config.infura_ipfs_encrypted_auth, false),
        },
      };
    }

    client = create(options); //create("/ip4/54.241.67.36/tcp/5001");
    SingletonService.set<IPFSHTTPClient>(IPFS_CLIENT_INSTANCE_NAME_PREFIX, client, true);
  }

  return client;
};

export const setData = async (
  userData:
    | string
    | InstanceType<typeof String>
    | ArrayBufferView
    | ArrayBuffer
    | Blob
    | AwaitIterable<Uint8Array>
    | ReadableStream<Uint8Array>,
): Promise<string> => {
  let i = 0;
  do {
    try {
      const client = await getIPFSClient();

      /*
      call client.add return object:
      {
      path: 'ipfs-logo.svg',
      cid: CID('QmTqZhR6f7jzdhLgPArDPnsbZpvvgxzCZycXK7ywkLxSyU'),
      size: 3243
      }
    */
      // console.log("ipfs client", client);
      // call Core API methods
      const { cid } = await client.add(userData); //await client.add("Hello world!");
      // console.log("ipfs setData cid", cid.toString());
      return cid.toString();
    } catch (error) {
      i++;
      console.log("ipfs http setData retrying ....");
      if (i >= 3) {
        console.error("ipfs http setData error: ", error);
        // Message.error("ipfs http setData error: " + error);
        throw error;
      }
      await sleep(1000);
    }
  } while (i < 3);

  throw new Error("The IPFS setData function has failed. Please check the network for possible issues.");
};

export const getData = async (cid: string): Promise<Buffer> => {
  let i = 0;
  do {
    try {
      const client = await getIPFSClient();
      // console.log("ipfs getData cid", cid);
      const stream = client.cat(cid);
      const chunks: Uint8Array[] = [];
      for await (const chunk of stream) {
        // chunks of data are returned as a Buffer, convert it back to a string
        chunks.push(chunk);
      }

      // console.log("ipfs getData cid string", Buffer.concat(chunks).toString());
      return Buffer.concat(chunks);
    } catch (error) {
      i++;
      console.log("ipfs http getData retrying ....");
      if (i >= 3) {
        console.error("ipfs http getData error: ", error);
        // Message.error("ipfs http getData error: " + error);
        throw error;
      }
      await sleep(1000);
    }
  } while (i < 3);

  throw new Error("The IPFS setData function has failed. Please check the network for possible issues.");
};
