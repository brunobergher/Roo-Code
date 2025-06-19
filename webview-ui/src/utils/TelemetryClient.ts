import posthog from "posthog-js"

import { TelemetrySetting } from "@roo/TelemetrySetting"

class TelemetryClient {
	private static instance: TelemetryClient
	private static telemetryEnabled: boolean = false

	public updateTelemetryState(telemetrySetting: TelemetrySetting, apiKey?: string, distinctId?: string) {
		posthog.reset()

		if (telemetrySetting === "enabled" && apiKey && distinctId) {
			TelemetryClient.telemetryEnabled = true

			posthog.init(apiKey, {
				api_host: "https://us.i.posthog.com",
				persistence: "localStorage",
				loaded: () => posthog.identify(distinctId),
				capture_pageview: false,
				capture_pageleave: false,
				autocapture: false,
			})
		} else {
			TelemetryClient.telemetryEnabled = false
		}
	}

	public static getInstance(): TelemetryClient {
		if (!TelemetryClient.instance) {
			TelemetryClient.instance = new TelemetryClient()
		}

		return TelemetryClient.instance
	}

	public capture(eventName: string, properties?: Record<string, any>) {
		if (TelemetryClient.telemetryEnabled) {
			try {
				posthog.capture(eventName, properties)
			} catch (_error) {
				// Silently fail if there's an error capturing an event.
			}
		}
	}

	public setPeopleProperty(propertyName: string, value: any) {
		if (TelemetryClient.telemetryEnabled) {
			try {
				posthog.people.set({ [propertyName]: value })
			} catch (_error) {
				// Silently fail if there's an error setting a property.
			}
		}
	}

	public getPeopleProperty(propertyName: string): any {
		if (TelemetryClient.telemetryEnabled) {
			try {
				return posthog.get_property(propertyName)
			} catch (_error) {
				// Silently fail if there's an error getting a property.
				return null
			}
		}
		return null
	}
}

export const telemetryClient = TelemetryClient.getInstance()
