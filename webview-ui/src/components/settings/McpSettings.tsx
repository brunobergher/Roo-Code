import React from "react"
import { useAppTranslation } from "@/i18n/TranslationContext"
import { Blocks } from "lucide-react"
import { VSCodeCheckbox, VSCodeLink } from "@vscode/webview-ui-toolkit/react"
import { Trans } from "react-i18next"

import { SetCachedStateField } from "./types"
import { SectionHeader } from "./SectionHeader"
import { Section } from "./Section"
import McpEnabledToggle from "../mcp/McpEnabledToggle"
import { useExtensionState } from "@/context/ExtensionStateContext"
import { vscode } from "@/utils/vscode"
import { buildDocLink } from "@/utils/docLinks"
import { Button } from "@/components/ui"
import ServerRow from "../mcp/ServerRow"

type McpSettingsProps = {
  mcpEnabled?: boolean
  enableMcpServerCreation?: boolean
  alwaysAllowMcp?: boolean
  setCachedStateField: SetCachedStateField<"mcpEnabled" | "enableMcpServerCreation">
}

export const McpSettings = ({
  mcpEnabled,
  enableMcpServerCreation,
  alwaysAllowMcp,
  setCachedStateField,
}: McpSettingsProps) => {
  const { t } = useAppTranslation()
  const { mcpServers: servers } = useExtensionState()

  return (
    <div>
      <SectionHeader description={t("mcp:description")}>
        <div className="flex items-center gap-2">
          <Blocks className="w-4" />
          <div>{t("settings:sections.mcp")}</div>
        </div>
      </SectionHeader>

      <Section>
        <McpEnabledToggle />
        
        {mcpEnabled && (
          <>
            {/* Server creation toggle */}
            <div className="mb-4">
              <VSCodeCheckbox
                checked={enableMcpServerCreation}
                onChange={(e: any) => {
                  setCachedStateField("enableMcpServerCreation", e.target.checked)
                  vscode.postMessage({ type: "enableMcpServerCreation", bool: e.target.checked })
                }}>
                <span className="font-medium">{t("mcp:enableServerCreation.title")}</span>
              </VSCodeCheckbox>
              <div className="text-sm text-vscode-descriptionForeground mt-1">
                <Trans i18nKey="mcp:enableServerCreation.description">
                  <VSCodeLink
                    href={buildDocLink(
                      "features/mcp/using-mcp-in-roo#how-to-use-roo-to-create-an-mcp-server",
                      "mcp_server_creation",
                    )}
                    style={{ display: "inline" }}>
                    Learn about server creation
                  </VSCodeLink>
                  <strong>new</strong>
                </Trans>
                <p className="mt-2">{t("mcp:enableServerCreation.hint")}</p>
              </div>
            </div>

            {/* Server List */}
            {servers.length > 0 && (
              <div className="flex flex-col gap-2.5 mb-4">
                {servers.map((server) => (
                  <ServerRow
                    key={`${server.name}-${server.source || "global"}`}
                    server={server}
                    alwaysAllowMcp={alwaysAllowMcp}
                  />
                ))}
              </div>
            )}

            {/* Edit Settings Buttons */}
            <div className="flex gap-2.5 mt-4">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  vscode.postMessage({ type: "openMcpSettings" })
                }}>
                <span className="codicon codicon-edit mr-1.5"></span>
                {t("mcp:editGlobalMCP")}
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  vscode.postMessage({ type: "openProjectMcpSettings" })
                }}>
                <span className="codicon codicon-edit mr-1.5"></span>
                {t("mcp:editProjectMCP")}
              </Button>
            </div>
            <div className="text-sm text-vscode-descriptionForeground mt-4">
              <VSCodeLink
                href={buildDocLink(
                  "features/mcp/using-mcp-in-roo#editing-mcp-settings-files",
                  "mcp_edit_settings",
                )}
                style={{ display: "inline" }}>
                {t("mcp:learnMoreEditingSettings")}
              </VSCodeLink>
            </div>
          </>
        )}
      </Section>
    </div>
  )
}