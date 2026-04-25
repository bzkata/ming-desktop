"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPCChannels = void 0;
// IPC 通道名称常量
var IPCChannels;
(function (IPCChannels) {
    // 插件相关
    IPCChannels["PLUGIN_LIST"] = "plugin:list";
    IPCChannels["PLUGIN_EXECUTE"] = "plugin:execute";
    IPCChannels["PLUGIN_INSTALL"] = "plugin:install";
    IPCChannels["PLUGIN_UNINSTALL"] = "plugin:uninstall";
    // Agent 相关
    IPCChannels["AGENT_CREATE"] = "agent:create";
    IPCChannels["AGENT_CHAT"] = "agent:chat";
    IPCChannels["AGENT_LIST"] = "agent:list";
    IPCChannels["AGENT_DELETE"] = "agent:delete";
    // LLM Provider 相关
    IPCChannels["LLM_LIST_PROVIDERS"] = "llm:list-providers";
    IPCChannels["LLM_CHAT"] = "llm:chat";
    IPCChannels["LLM_ADD_PROVIDER"] = "llm:add-provider";
    IPCChannels["LLM_REMOVE_PROVIDER"] = "llm:remove-provider";
    IPCChannels["LLM_UPDATE_PROVIDER"] = "llm:update-provider";
    // 执行服务相关
    IPCChannels["EXECUTE_COMMAND"] = "executor:execute-command";
    IPCChannels["EXECUTE_SCRIPT"] = "executor:execute-script";
    IPCChannels["EXECUTE_TERMINAL"] = "executor:execute-terminal";
    // 配置相关
    IPCChannels["CONFIG_GET"] = "config:get";
    IPCChannels["CONFIG_SET"] = "config:set";
    IPCChannels["CONFIG_GET_ALL"] = "config:get-all";
    IPCChannels["CONFIG_RESET"] = "config:reset";
    // 文件系统相关
    IPCChannels["FS_READ_FILE"] = "fs:read-file";
    IPCChannels["FS_WRITE_FILE"] = "fs:write-file";
    IPCChannels["FS_READ_DIR"] = "fs:read-dir";
    IPCChannels["FS_EXISTS"] = "fs:exists";
    // 系统相关
    IPCChannels["SYS_GET_OS_INFO"] = "sys:get-os-info";
    IPCChannels["SYS_GET_VERSION"] = "sys:get-version";
})(IPCChannels || (exports.IPCChannels = IPCChannels = {}));
