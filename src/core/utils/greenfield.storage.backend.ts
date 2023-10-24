//get storage data from greenfield by backend service

import { serverPost } from "../servernet";
// eslint-disable-next-line import/no-extraneous-dependencies
import { isBlank, isNotBlankAndEmptyObject } from "./null";
import SingletonService from "singleton-service";
import { Client, IObjectResultType } from "@bnb-chain/greenfield-chain-sdk";
import * as exception from '../../core/utils/exception'

const GREENFIELD_CLIENT_INSTANCE_NAME_PREFIX = "greenFieldClient";
const GRPC_URL = "https://gnfd-testnet-fullnode-tendermint-us.bnbchain.org:443";
const GREEN_CHAIN_ID = "greenfield_5600-1";
const SP_PROVIDER_RPC = 'https://gnfd-testnet-sp3.nodereal.io';

const bucketName: string = process.env.REACT_APP_BUCKET as string;

export const getGreenFieldStorageProviderClient = async () => {
    //const secret = pwdEncrypt('Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64'));
    //console.log("encrypt: ", secret);

    // for get instance with saved key
    let client = SingletonService.get<Client>(
        GREENFIELD_CLIENT_INSTANCE_NAME_PREFIX
    );
    if (isBlank(client)) {
        client = Client.create(GRPC_URL, GREEN_CHAIN_ID);
        SingletonService.set<Client>(
        GREENFIELD_CLIENT_INSTANCE_NAME_PREFIX,
        client,
        true
        );
    }
    
    return client;
};

export const getData = async (objectName: string): Promise<Buffer> => {
  //return cid string array
    const client: Client = await getGreenFieldStorageProviderClient();

    if(objectName.toLowerCase().trim().startsWith(bucketName.toLowerCase().trim()))
    {
        objectName = objectName.replace(bucketName+"/","");
    }

    const result: IObjectResultType<Blob> = await client.object.getObject({
    bucketName: bucketName,
    objectName: objectName,
    endpoint: SP_PROVIDER_RPC,
    });
    
    // debugger
    if(result.code !=0)
    {
        console.log("get greenfield sp data error: ", result);
        throw new exception.GetBucketDataError("get greenfield data failed! objectName: "+ objectName);
    }
    
    const blob = result.body as Blob;
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer;
};
