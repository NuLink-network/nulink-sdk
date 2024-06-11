import {NETWORK_LIST, contractList} from "../../sol";

// Initial Network config

export const defaultChainNetWork: NETWORK_LIST =
  NETWORK_LIST.Horus;

export const networkDetails = {
  [NETWORK_LIST.Horus]: {
    WEB3_RPC_URL: process.env.REACT_APP_BSC_TESTNET_WEB3_RPC_URL as string || "", //"https://data-seed-prebsc-1-s1.binance.org:8545/", //"https://polygon-mumbai.g.alchemy.com/v2/46LmJOYydi52yqUdANxbLDReG13MDYw5"; //"https://rpc-mumbai.polygon.technology/v1/84cc5f2f2beca130d1d33b38a7085e5d8b57d404";
    CHAIN_ID: 97, //notes: If you add this field, you must also put it in the newworkConfig structure
    CHAIN_NAME: NETWORK_LIST.Horus,
    // ETH_EXPOLRER: "https://testnet.bscscan.com/", //"https://polygonscan.com"; //notes: If you add this field, you must also put it in the newworkConfig structure
    CENTRALIZED_SERVER_URL: 'http://8.219.11.39:8181', //"http://8.219.11.39:8181", //"http://54.241.67.36:8181",
    //"encrypted:0c282750a6f5be15394d171980af6023:8cbdd88a89b74a11cfd8c2a88e0fd4fb045fa83e911058b23894b2f87f2407d45326299618a30682762f5a82ca995f70d0d1cd558d51ac88b7a92656ab6e0d7c2bfef02040df1c23e76b64136d4dc236c6f01e9733e94a293e504cdff027d632c5f60f1befb22b2c75beab3738024e345c9e72f6d589fa7de775d36e0d99e0cdy9Zxst06",
    PORTER_URL: 'http://8.219.11.39:9165', //"http://8.222.146.98:9165", //"http://54.241.67.36:9155", // "http://8.219.188.70:9155", //"https://porter-ibex.nucypher.community"; //nucypher porter service url
    CONTRACT_INFO: contractList[NETWORK_LIST.Horus],
    TOKEN_ADDRESS: process.env.REACT_APP_BSC_TESTNET_BNB_ADDRESS || "",
    TOKEN_SYMBOL: "TBNB",
    NLK_TOKEN_SYMBOL: "TNLK",
    NLK_TOKEN_ADDRESS: process.env.REACT_APP_BSC_TESTNET_CONTRACT_NULINKTOKEN_ADDRESS || "",
  },
  [NETWORK_LIST.ConfluxTestNet]: {
    WEB3_RPC_URL: process.env.REACT_APP_CONFLUX_ESPACE_TESTNET_WEB3_RPC_URL as string || "", //"https://data-seed-prebsc-1-s1.binance.org:8545/", //"https://polygon-mumbai.g.alchemy.com/v2/46LmJOYydi52yqUdANxbLDReG13MDYw5"; //"https://rpc-mumbai.polygon.technology/v1/84cc5f2f2beca130d1d33b38a7085e5d8b57d404";
    CHAIN_ID: 71, //notes: If you add this field, you must also put it in the newworkConfig structure
    CHAIN_NAME: NETWORK_LIST.ConfluxTestNet,
    // ETH_EXPOLRER: "https://testnet.bscscan.com/", //"https://polygonscan.com"; //notes: If you add this field, you must also put it in the newworkConfig structure
    CENTRALIZED_SERVER_URL: process.env.REACT_APP_CENTRALIZED_SERVER_URL as string || "", //"http://8.219.11.39:8181", //"http://54.241.67.36:8181",
    //"encrypted:0c282750a6f5be15394d171980af6023:8cbdd88a89b74a11cfd8c2a88e0fd4fb045fa83e911058b23894b2f87f2407d45326299618a30682762f5a82ca995f70d0d1cd558d51ac88b7a92656ab6e0d7c2bfef02040df1c23e76b64136d4dc236c6f01e9733e94a293e504cdff027d632c5f60f1befb22b2c75beab3738024e345c9e72f6d589fa7de775d36e0d99e0cdy9Zxst06",
    //crosschain use main chain's porter
    PORTER_URL: process.env.REACT_APP_BSC_TESTNET_PORTER_URI as string || "",//process.env.REACT_APP_CONFLUX_ESPACE_TESTNET_PORTER_URI as string || "", //"http://8.222.146.98:9165", //"http://54.241.67.36:9155", // "http://8.219.188.70:9155", //"https://porter-ibex.nucypher.community"; //nucypher porter service url
    CONTRACT_INFO: contractList[NETWORK_LIST.ConfluxTestNet],
    TOKEN_ADDRESS: process.env.REACT_APP_CONFLUX_ESPACE_TESTNET_CFX_ADDRESS || "",
    TOKEN_SYMBOL: "CFX",
    NLK_TOKEN_SYMBOL: "NLKTestCFX",
    NLK_TOKEN_ADDRESS: process.env.REACT_APP_CONFLUX_ESPACE_TESTNET_CONTRACT_NULINKTOKEN_ADDRESS || "",
  },
  [NETWORK_LIST.PolygonTestNet]: {
    WEB3_RPC_URL: process.env.REACT_APP_POLYGON_TESTNET_WEB3_RPC_URL as string || "", //"https://data-seed-prebsc-1-s1.binance.org:8545/", //"https://polygon-mumbai.g.alchemy.com/v2/46LmJOYydi52yqUdANxbLDReG13MDYw5"; //"https://rpc-mumbai.polygon.technology/v1/84cc5f2f2beca130d1d33b38a7085e5d8b57d404";
    CHAIN_ID: 80001, //notes: If you add this field, you must also put it in the newworkConfig structure
    CHAIN_NAME: NETWORK_LIST.PolygonTestNet,
    // ETH_EXPOLRER: "https://testnet.bscscan.com/", //"https://polygonscan.com"; //notes: If you add this field, you must also put it in the newworkConfig structure
    CENTRALIZED_SERVER_URL: process.env.REACT_APP_CENTRALIZED_SERVER_URL as string || "", //"http://8.219.11.39:8181", //"http://54.241.67.36:8181",
    //"encrypted:0c282750a6f5be15394d171980af6023:8cbdd88a89b74a11cfd8c2a88e0fd4fb045fa83e911058b23894b2f87f2407d45326299618a30682762f5a82ca995f70d0d1cd558d51ac88b7a92656ab6e0d7c2bfef02040df1c23e76b64136d4dc236c6f01e9733e94a293e504cdff027d632c5f60f1befb22b2c75beab3738024e345c9e72f6d589fa7de775d36e0d99e0cdy9Zxst06",
    //crosschain use main chain's porter
    PORTER_URL: process.env.REACT_APP_BSC_TESTNET_PORTER_URI as string || "",//process.env.REACT_APP_POLYGON_TESTNET_PORTER_URI as string || "", //"http://8.222.146.98:9165", //"http://54.241.67.36:9155", // "http://8.219.188.70:9155", //"https://porter-ibex.nucypher.community"; //nucypher porter service url
    CONTRACT_INFO: contractList[NETWORK_LIST.PolygonTestNet],
    TOKEN_ADDRESS: process.env.REACT_APP_POLYGON_TESTNET_MATIC_ADDRESS || "",
    TOKEN_SYMBOL: "TMATIC",
    NLK_TOKEN_SYMBOL: "TNLK",
    NLK_TOKEN_ADDRESS: process.env.REACT_APP_POLYGON_TESTNET_CONTRACT_NULINKTOKEN_ADDRESS || "",
  },
  [NETWORK_LIST.XChainTestNet]: {
    WEB3_RPC_URL: process.env.REACT_APP_XCHAIN_TESTNET_WEB3_RPC_URL as string || "", //"https://data-seed-prebsc-1-s1.binance.org:8545/", //"https://polygon-mumbai.g.alchemy.com/v2/46LmJOYydi52yqUdANxbLDReG13MDYw5"; //"https://rpc-mumbai.polygon.technology/v1/84cc5f2f2beca130d1d33b38a7085e5d8b57d404";
    CHAIN_ID: 195, //notes: If you add this field, you must also put it in the newworkConfig structure
    CHAIN_NAME: NETWORK_LIST.XChainTestNet,
    // ETH_EXPOLRER: "https://testnet.bscscan.com/", //"https://polygonscan.com"; //notes: If you add this field, you must also put it in the newworkConfig structure
    CENTRALIZED_SERVER_URL: process.env.REACT_APP_CENTRALIZED_SERVER_URL as string || "", //"http://8.219.11.39:8181", //"http://54.241.67.36:8181",
    //"encrypted:0c282750a6f5be15394d171980af6023:8cbdd88a89b74a11cfd8c2a88e0fd4fb045fa83e911058b23894b2f87f2407d45326299618a30682762f5a82ca995f70d0d1cd558d51ac88b7a92656ab6e0d7c2bfef02040df1c23e76b64136d4dc236c6f01e9733e94a293e504cdff027d632c5f60f1befb22b2c75beab3738024e345c9e72f6d589fa7de775d36e0d99e0cdy9Zxst06",
    //crosschain use main chain's porter
    PORTER_URL: process.env.REACT_APP_BSC_TESTNET_PORTER_URI as string || "",//process.env.REACT_APP_XCHAIN_TESTNET_PORTER_URI as string || "", //"http://8.222.146.98:9165", //"http://54.241.67.36:9155", // "http://8.219.188.70:9155", //"https://porter-ibex.nucypher.community"; //nucypher porter service url
    CONTRACT_INFO: contractList[NETWORK_LIST.XChainTestNet],
    TOKEN_ADDRESS: process.env.REACT_APP_XCHAIN_TESTNET_OKB_ADDRESS || "",
    TOKEN_SYMBOL: "OKB",
    NLK_TOKEN_SYMBOL: "TNLK",
    NLK_TOKEN_ADDRESS: process.env.REACT_APP_XCHAIN_TESTNET_CONTRACT_NULINKTOKEN_ADDRESS || "",
  },
  [NETWORK_LIST.ETHHoleSkyTestNet]: {
    WEB3_RPC_URL: process.env.REACT_APP_HOLESKY_TESTNET_WEB3_RPC_URL as string || "", 
    CHAIN_ID: 17000, //notes: If you add this field, you must also put it in the newworkConfig structure
    CHAIN_NAME: NETWORK_LIST.ETHHoleSkyTestNet,
    // ETH_EXPOLRER: "https://testnet.bscscan.com/", //"https://polygonscan.com"; //notes: If you add this field, you must also put it in the newworkConfig structure
    CENTRALIZED_SERVER_URL: process.env.REACT_APP_CENTRALIZED_SERVER_URL as string || "", 
    //"encrypted:0c282750a6f5be15394d171980af6023:8cbdd88a89b74a11cfd8c2a88e0fd4fb045fa83e911058b23894b2f87f2407d45326299618a30682762f5a82ca995f70d0d1cd558d51ac88b7a92656ab6e0d7c2bfef02040df1c23e76b64136d4dc236c6f01e9733e94a293e504cdff027d632c5f60f1befb22b2c75beab3738024e345c9e72f6d589fa7de775d36e0d99e0cdy9Zxst06",
    //crosschain use main chain's porter
    PORTER_URL: process.env.REACT_APP_BSC_TESTNET_PORTER_URI as string || "",//process.env.REACT_APP_XCHAIN_TESTNET_PORTER_URI as string || "", //"http://8.222.146.98:9165", //"http://54.241.67.36:9155", // "http://8.219.188.70:9155", //"https://porter-ibex.nucypher.community"; //nucypher porter service url
    CONTRACT_INFO: contractList[NETWORK_LIST.ETHHoleSkyTestNet],
    TOKEN_ADDRESS: process.env.REACT_APP_HOLESKY_TESTNET_ETH_ADDRESS || "",
    TOKEN_SYMBOL: "ETH",
    NLK_TOKEN_SYMBOL: "TNLK",
    NLK_TOKEN_ADDRESS: process.env.REACT_APP_HOLESKY_TESTNET_CONTRACT_NULINKTOKEN_ADDRESS || "",
  },

};

/**
 * @internal
 */
export const LOCK_TIMER = 60000 * 5 * 3; // one minute * 5 * 3
/**
 * @internal
 */
export const GAS_LIMIT_FACTOR = 1.5;
/**
 * @internal
 */
export const GAS_PRICE_FACTOR = 2.0; //holesky testnet must be bigger in size
