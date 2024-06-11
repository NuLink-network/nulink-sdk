# Configuration Modifications

files：
src/core/servernet/api/axios.ts   11/12行

  配置后台用户名密码： 
  const username = '';
  const password = '';

src/core/chainnet/config/index.ts    14/16行

配置相关后台服务：
    CENTRALIZED_SERVER_URL
    PORTER_URL


src\core\sol 
[NETWORK_LIST.Horus]: {
[CONTRACT_NAME.nuLinkToken]: { address:  process.env.REACT_APP_BSC_TESTNET_CONTRACT_NULINKTOKEN_ADDRESS as string, abi: NuLinkTokenABI },
[CONTRACT_NAME.subScriptManager]: { address: process.env.REACT_APP_BSC_TESTNET_CONTRACT_SUBSCRIPTMANAGER_ADDRESS as string, abi: SubscriptionManagerABI },
}


# nulink-ts工程需要重新打包  因为不能用 process.env, 所以nulink-ts库也要修改


REACT_APP_BSC_TESTNET_CONTRACT_SUBSCRIPTMANAGER_ADDRESS 替换为常量合约地址


# 1.已经做的工作

1.首先需要把 nucypher-core的代码改为本地版本呢(nulink-ts和 nulink-sdk)
2.然后通过webpack打包为一个js文件，给app端测试

# 2. TODO:

   这些变量放到window对象上：  
   在那个src/index.ts里  直接 window.xxx = '...'
   引用的时候引用window.xxx对象里的值

   给app测试的存储需要弄一个window.storage_tt来走测试用例

  