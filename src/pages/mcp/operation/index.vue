<template>
  <van-cell-group title="mcp操作管理" :border="false" :inset="true">
    <van-cell center title="👏 mcp操作列表" to="operation/list" is-link />
    <van-cell center title="🔧 mcp操作编排" to="operation/organize" is-link />
  </van-cell-group>
</template>

<route lang="json5">
{
  name: 'mcp/operation',
  meta: {
    title: '👏 mcp操作管理',
    i18n: 'menus.mcpOperation'
  },
}
</route>
