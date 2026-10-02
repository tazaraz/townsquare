import type { NavigationMenuItem } from '@nuxt/ui'


export class NotFoundError extends Error {}
export class DataFormatError extends Error {}

export type RoleEdition = "tb" | "bmr" | "snv" | "carousel" | "fabled" | "loric"
export function validRoleEditionId(id: string): id is RoleEdition {
    return ["tb", "bmr", "snv", "carousel", "fabled", "loric", ""].includes(id)
}

export interface EditionJSON {
    id: "_meta"
    name: string
    author: string
}

export interface Edition {
    id:  "tb" | "bmr" | "snv" | string
    name: string | "Custom script"
    author?: "The Pandemonium Institute" | string
    description?: string
    level?: "Beginner" | "Intermediate" | "Veteran" | "Unknown"
    roles: string[]
}

export type Team = "townsfolk" | "outsider" | "traveller" | "minion" | "demon" | "fabled" | "loric"
export function validTeam(team: string): team is Team {
    return ["townsfolk", "outsider", "traveller", "minion", "demon", "fabled", "loric"].includes(team)
}

export interface Role {
    id: string
    name: string
    image: string
    edition: RoleEdition
    team: Team
    firstNightReminder: string
    otherNightReminder: string
    reminders: string[]
    remindersGlobal: string[]
    setup: boolean
    ability: string
    flavor: string
}

export interface Reminder {
    image: string
    name: string
    /** Only present when the reminder is a custom note */
    isCustom?: boolean
}

export type TokenKind = "role" | "fabled" | "loric" | "reminder"
export type PlayerState = "alive" | "dead" | "voteless"

export interface Player {
    name: string
    role: Role | undefined
    reminders: Reminder[]

    state: PlayerState
}

export type WheelOrientation = "center" | "top" | "right" | "bottom" | "left"

export interface UI {
    /** Whether the UI is in its hidden state */
    hidden: boolean
    /** Whether the UI should show the night order, or just leaves */
    showNightOrder: boolean
    /** Whether flavor text is hidden throughout the UI */
    showFlavor: boolean

    /** Whether we are swapping players */
    swapping: number | -1
    /** Internal only. Size of the token as computed by the wheel */
    tokenSize: number

    /** Orientation of the token wheel */
    orientation: {
        user: WheelOrientation
        rendered: WheelOrientation
    }

    grimoire: {
        /** Whether to show a temporary grimoire */
        temporary: boolean
        /** Index of the currently selected token in the wheel */
        selectedToken: number
        /** Allows quick access to actions */
        lastAction: NavigationMenuItem
    }
}
