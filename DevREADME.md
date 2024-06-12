
# TODO: 待验证 nulink-ts工程需要重新打包  因为不能用 process.env, 所以nulink-ts库也要修改




# 1.已经做的工作

1.首先需要把 nucypher-core的代码改为本地版本呢(nulink-ts和 nulink-sdk)
2.然后通过webpack打包为一个js文件，给app端测试

# 2. TODO:

   这些变量放到window对象上：  
   在那个src/index.ts里  直接 window.xxx = '...'
   引用的时候引用window.xxx对象里的值

   给app测试的存储需要弄一个window.storage_tt来走测试用例

  