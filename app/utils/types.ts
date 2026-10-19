import type { NavigationMenuItem } from '@nuxt/ui'


export class NotFoundError extends Error {}
export class DataFormatError extends Error {}

export type RoleEdition = "tb" | "bmr" | "snv" | "carousel" | "fabled" | "loric"
export function validRoleEditionId(id: string): id is RoleEdition {
    return ["tb", "bmr", "snv", "carousel", "fabled", "loric", ""].includes(id)
}

export interface ScriptJSON {
    id: "_meta"
    name: string
    author: string
}

export interface Script {
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
export enum PlayerState {
    Alive = 0,
    Dead = 1,
    Voteless = 2,
}

export interface Player {
    /** Shown name in the UI */
    name: string
    /** Role assigned to the player */
    role: Role | undefined
    /** Reminders assigned to the player */
    reminders: Reminder[]
    /** State of the player in the UI */
    state: PlayerState

    /** Whether the player can vote at all */
    voteLocked: boolean
    /** Whether this player is currently voting */
    isVoting: boolean
    /** Whether this player is nominated */
    nominated: {
        /** Whether the player has already been nominated */
        been: boolean,
        /** Whether the player has nominated someone else */
        has: boolean,
    }

    /** ID of the player in the socket */
    socketId?: string
}

export type WheelOrientation = "center" | "top" | "right" | "bottom" | "left"

export interface Nomination {
    /** Whether players can nominate */
    open: boolean
    /** The player marked for death */
    marked: { player: number, votes: number } | null;

    /** The player who has nominated */
    nominator: number
    /** The player that is being nominated */
    nominee: number

    /** Index where the hand points to. */
    hand: number
    /** Speed of the hand in seconds */
    speed: number
}

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

export interface DirectMessage {
    /** The text of the message */
    text: string
    /** What buttons to show to the user */
    buttons: 'none' | 'acknowledge' | 'confirm' | 'reply' | 'dialog'
    /** How long the message is visible */
    duration?: number

    /** Icon to show */
    icon?: string
    /** If a token is to be shown */
    role?: Role['id']

    /** Set automatically upon receiving the message */
    title?: string
}
