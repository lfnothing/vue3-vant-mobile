<template>
  <van-cell-group title="mcp操作" :border="false" :inset="true">
    <van-cell title="👏 配置mcp服务器" to="mcp/config" is-link center />
    <van-cell center title="🔧 mcp变量定义" to="mcp/variable" is-link />
    <van-cell center title="🔧 执行mcp工具" to="mcp/call" is-link />
    <van-cell center title="🤔️ mcp操作管理" to="mcp/operation" is-link />
    <van-cell center title="🔧 创建mcp工具" to="mcp/create" is-link />
  </van-cell-group>
</template>

<route lang="json5">
{
  name: 'mcp',
  meta: {
    title: 'mcp',
    i18n: 'menus.mcp'
  }
}
</route>
