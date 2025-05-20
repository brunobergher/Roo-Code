import React, { useState } from "react"
import { useAppTranslation } from "@/i18n/TranslationContext"
import { vscode } from "@/utils/vscode"
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui"
import { VSCodePanels, VSCodePanelTab, VSCodePanelView } from "@vscode/webview-ui-toolkit/react"
import { McpServer } from "@roo/shared/mcp"
import McpToolRow from "./McpToolRow"
import McpResourceRow from "./McpResourceRow"
import { McpErrorRow } from "./McpErrorRow"

type ServerRowProps = {
  server: McpServer
  alwaysAllowMcp?: boolean
}

const ServerRow = ({ server, alwaysAllowMcp }: ServerRowProps) => {
  const { t } = useAppTranslation()
  const [isExpanded, setIsExpanded] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [timeoutValue, setTimeoutValue] = useState(() => {
    const configTimeout = JSON.parse(server.config)?.timeout
    return configTimeout ?? 60 // Default 1 minute (60 seconds)
  })

  const timeoutOptions = [
    { value: 15, label: t("mcp:networkTimeout.options.15seconds") },
    { value: 30, label: t("mcp:networkTimeout.options.30seconds") },
    { value: 60, label: t("mcp:networkTimeout.options.1minute") },
    { value: 300, label: t("mcp:networkTimeout.options.5minutes") },
    { value: 600, label: t("mcp:networkTimeout.options.10minutes") },
    { value: 900, label: t("mcp:networkTimeout.options.15minutes") },
    { value: 1800, label: t("mcp:networkTimeout.options.30minutes") },
    { value: 3600, label: t("mcp:networkTimeout.options.60minutes") },
  ]

  const getStatusColor = () => {
    switch (server.status) {
      case "connected":
        return "var(--vscode-testing-iconPassed)"
      case "connecting":
        return "var(--vscode-charts-yellow)"
      case "disconnected":
        return "var(--vscode-testing-iconFailed)"
    }
  }

  const handleRowClick = () => {
    if (server.status === "connected") {
      setIsExpanded(!isExpanded)
    }
  }

  const handleRestart = () => {
    vscode.postMessage({
      type: "restartMcpServer",
      text: server.name,
      source: server.source || "global",
    })
  }

  const handleTimeoutChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const seconds = parseInt(event.target.value)
    setTimeoutValue(seconds)
    vscode.postMessage({
      type: "updateMcpTimeout",
      serverName: server.name,
      source: server.source || "global",
      timeout: seconds,
    })
  }

  const handleDelete = () => {
    vscode.postMessage({
      type: "deleteMcpServer",
      serverName: server.name,
      source: server.source || "global",
    })
    setShowDeleteConfirm(false)
  }

  return (
    <div className="mb-2.5">
      <div
        className="flex items-center p-2 bg-vscode-textCodeBlock-background rounded"
        style={{
          cursor: server.status === "connected" ? "pointer" : "default",
          borderRadius: isExpanded || server.status === "connected" ? "4px" : "4px 4px 0 0",
          opacity: server.disabled ? 0.6 : 1,
        }}
        onClick={handleRowClick}>
        {server.status === "connected" && (
          <span
            className={`codicon codicon-chevron-${isExpanded ? "down" : "right"} mr-2`}
          />
        )}
        <span className="flex-1">
          {server.name}
          {server.source && (
            <span
              className="ml-2 py-0.5 px-1.5 text-xs rounded"
              style={{
                background: "var(--vscode-badge-background)",
                color: "var(--vscode-badge-foreground)",
              }}>
              {server.source}
            </span>
          )}
        </span>
        <div
          className="flex items-center mr-2"
          onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDeleteConfirm(true)}
            className="mr-2">
            <span className="codicon codicon-trash text-sm"></span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRestart}
            disabled={server.status === "connecting"}
            className="mr-2">
            <span className="codicon codicon-refresh text-sm"></span>
          </Button>
          <div
            role="switch"
            aria-checked={!server.disabled}
            tabIndex={0}
            className="relative w-5 h-2.5 rounded-sm cursor-pointer transition-colors"
            style={{
              backgroundColor: server.disabled
                ? "var(--vscode-titleBar-inactiveForeground)"
                : "var(--vscode-button-background)",
              opacity: server.disabled ? 0.4 : 0.8,
            }}
            onClick={() => {
              vscode.postMessage({
                type: "toggleMcpServer",
                serverName: server.name,
                source: server.source || "global",
                disabled: !server.disabled,
              })
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                vscode.postMessage({
                  type: "toggleMcpServer",
                  serverName: server.name,
                  source: server.source || "global",
                  disabled: !server.disabled,
                })
              }
            }}>
            <div
              className="absolute w-1.5 h-1.5 bg-vscode-titleBar-activeForeground rounded-full top-0.5 transition-all"
              style={{
                left: server.disabled ? "2px" : "12px",
              }}
            />
          </div>
        </div>
        <div
          className="w-2 h-2 rounded-full ml-2"
          style={{
            background: getStatusColor(),
          }}
        />
      </div>

      {server.status === "connected" ? (
        isExpanded && (
          <div
            className="bg-vscode-textCodeBlock-background p-0 px-2.5 pb-2.5 text-sm rounded-b">
            <VSCodePanels className="mb-2.5">
              <VSCodePanelTab id="tools">
                {t("mcp:tabs.tools")} ({server.tools?.length || 0})
              </VSCodePanelTab>
              <VSCodePanelTab id="resources">
                {t("mcp:tabs.resources")} (
                {[...(server.resourceTemplates || []), ...(server.resources || [])].length || 0})
              </VSCodePanelTab>
              <VSCodePanelTab id="errors">
                {t("mcp:tabs.errors")} ({server.errorHistory?.length || 0})
              </VSCodePanelTab>

              <VSCodePanelView id="tools-view">
                {server.tools && server.tools.length > 0 ? (
                  <div
                    className="flex flex-col gap-2 w-full">
                    {server.tools.map((tool) => (
                      <McpToolRow
                        key={`${tool.name}-${server.name}-${server.source || "global"}`}
                        tool={tool}
                        serverName={server.name}
                        serverSource={server.source || "global"}
                        alwaysAllowMcp={alwaysAllowMcp}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-2.5 text-vscode-descriptionForeground">
                    {t("mcp:emptyState.noTools")}
                  </div>
                )}
              </VSCodePanelView>

              <VSCodePanelView id="resources-view">
                {(server.resources && server.resources.length > 0) ||
                (server.resourceTemplates && server.resourceTemplates.length > 0) ? (
                  <div
                    className="flex flex-col gap-2 w-full">
                    {[...(server.resourceTemplates || []), ...(server.resources || [])].map(
                      (item) => (
                        <McpResourceRow
                          key={"uriTemplate" in item ? item.uriTemplate : item.uri}
                          item={item}
                        />
                      ),
                    )}
                  </div>
                ) : (
                  <div className="py-2.5 text-vscode-descriptionForeground">
                    {t("mcp:emptyState.noResources")}
                  </div>
                )}
              </VSCodePanelView>

              <VSCodePanelView id="errors-view">
                {server.errorHistory && server.errorHistory.length > 0 ? (
                  <div
                    className="flex flex-col gap-2 w-full">
                    {[...server.errorHistory]
                      .sort((a, b) => b.timestamp - a.timestamp)
                      .map((error, index) => (
                        <McpErrorRow key={`${error.timestamp}-${index}`} error={error} />
                      ))}
                  </div>
                ) : (
                  <div className="py-2.5 text-vscode-descriptionForeground">
                    {t("mcp:emptyState.noErrors")}
                  </div>
                )}
              </VSCodePanelView>
            </VSCodePanels>

            {/* Network Timeout */}
            <div className="p-2.5 px-1.5">
              <div
                className="flex items-center gap-2.5 mb-2">
                <span>{t("mcp:networkTimeout.label")}</span>
                <select
                  value={timeoutValue}
                  onChange={handleTimeoutChange}
                  className="flex-1 p-1 rounded"
                  style={{
                    background: "var(--vscode-dropdown-background)",
                    color: "var(--vscode-dropdown-foreground)",
                    border: "1px solid var(--vscode-dropdown-border)",
                    outline: "none",
                    cursor: "pointer",
                  }}>
                  {timeoutOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <span
                className="text-xs text-vscode-descriptionForeground block">
                {t("mcp:networkTimeout.description")}
              </span>
            </div>
          </div>
        )
      ) : (
        <div
          className="text-sm bg-vscode-textCodeBlock-background rounded-b w-full">
          <div
            className="text-vscode-testing-iconFailed mb-2 p-0 px-2.5 break-words">
            {server.error &&
              server.error.split("\n").map((item, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <br />}
                  {item}
                </React.Fragment>
              ))}
          </div>
          <Button
            variant="secondary"
            onClick={handleRestart}
            disabled={server.status === "connecting"}
            className="w-[calc(100%-20px)] mx-2.5 mb-2.5">
            {server.status === "connecting" ? "Retrying..." : "Retry Connection"}
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("mcp:deleteDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("mcp:deleteDialog.description", { serverName: server.name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
              {t("mcp:deleteDialog.cancel")}
            </Button>
            <Button variant="default" onClick={handleDelete}>
              {t("mcp:deleteDialog.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ServerRow