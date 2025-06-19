import { useState, useEffect } from "react"
import { telemetryClient } from "@/utils/TelemetryClient"
import { useExtensionState } from "@/context/ExtensionStateContext"

export function useModeSelectorTracking() {
	const { telemetrySetting } = useExtensionState()
	const [hasOpenedModeSelector, setHasOpenedModeSelector] = useState(true)

	// Check if the user has opened the ModeSelector before
	useEffect(() => {
		// If telemetry is disabled, assume the property is set to true
		if (telemetrySetting !== "enabled") {
			setHasOpenedModeSelector(true)
			return
		}

		// Try to get the property from PostHog
		const userProperty = telemetryClient.getPeopleProperty("openedModeSelector")
		setHasOpenedModeSelector(userProperty === true)
	}, [telemetrySetting])

	// Function to track when the ModeSelector is opened
	const trackModeSelectorOpened = () => {
		if (!hasOpenedModeSelector && telemetrySetting === "enabled") {
			// Set the property in PostHog
			telemetryClient.setPeopleProperty("openedModeSelector", true)

			// Update local state
			setHasOpenedModeSelector(true)
		}
	}

	return { hasOpenedModeSelector, trackModeSelectorOpened }
}
