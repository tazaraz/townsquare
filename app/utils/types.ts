import type { NavigationMenuItem } from '@nuxt/ui'


export class NotFoundError extends Error {}
export class DataFormatError extends Error {}


export type EditionId = "tb" | "bmr" | "snv" | "carousel" | "fabled" | "loric" | "custom"
export function validEditionId(id: string): id is EditionId {
    return ["tb", "bmr", "snv", "carousel", "fabled", "loric", "custom", ""].includes(id)
}

export interface Edition {
    id: EditionId
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
    edition: EditionId
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
    /** Index of the currently selected token in the wheel */
    selectedToken: number
    /** Orientation of the token wheel */
    orientation: {
        user: WheelOrientation
        rendered: WheelOrientation
    }
    /** Whether the UI should show the night order, or just leaves */
    showNightOrder: boolean
    /** Whether the UI is in its hidden state */
    hidden: boolean
    /** Whether flavor text is hidden throughout the UI */
    showFlavor: boolean

    lastAction: NavigationMenuItem

    /** Internal only. Size of the token as computed by the wheel */
    tokenSize: number
}
