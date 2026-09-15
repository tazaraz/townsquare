import { defineStore } from 'pinia';

export const usePlayers = defineStore('players', () => {
    const gamestate = useGamestate()
    const players   = useGamestate().players
    const reminders = useReminders()
    const game      = useGame()

    const all = computed(() => players as Player[])
    const count = computed(() => players.length)

    /**
     * Player to add to the game
     * @param name Player name
     */
    function add(name: string) {
        players.push({
            name,
            role: undefined,
            reminders: [],
            state: "alive",
        })
    }

    /**
     * Get a player by its index
     * @param index Index of the player
     */
    function get(index: number): Player | undefined  {
        return players[index]
    }

    /**
     * Removes a player from the game, and removes its reminders from the game state
     * @param index Index of the player to remove
     */
    function remove(index: number) {
        const removed = players.splice(index, 1)[0]!

        reminders.remove(removed.reminders)
        reminders.removeGlobal(removed.reminders)
    }


    /**
     * Updates the role of a player, and adds the reminders of that role to the game state
     * @param index Index of the player to set the role for
     * @param role ID of the role to set for the player
     */
    function setRole(index: number, role: string): boolean {
        const player = get(index)
        if (!player) return false  // Player not found

        // First find the role in the list of roles
        let char: Role | undefined = player.role;
        const oldRoleCount = char ? players.filter(p => p.role?.id === char!.id).length : 0

        // If the player is already the role
        if (char?.name === role)
            return true;
        
        // Remove the reminders of the previous role (if any) from the game state
        if (char && oldRoleCount == 1) {
            reminders.remove(reminders.fromString(char.reminders, char.id))
            reminders.removeGlobal(reminders.fromString(char.remindersGlobal ?? [], char.id))
        }

        // If a traveller is being set which was not present before, add it to the list of travellers
        if (game.loadTravellers().find(t => t.id === role) && !gamestate.roles.find(r => r.id === role)) {
            gamestate.roles.push(game.loadRole(role)!)
        }

        // Find the role in the list of roles
        char = gamestate.roles.find(c => c.id === role)

        // If the role does not exist, unset the role for the player
        if (!char) {
            player.role = undefined
        } else {
            // Set the role for the player
            player.role = char

            // If this is the first character to exist
            if (players.filter(p => p.role?.id === role).length == 1) {
                // Add the reminders of the role to the game state
                reminders.add(reminders.fromString(char.reminders, char.id))
                reminders.addGlobal(reminders.fromString(char.remindersGlobal ?? [], char.id))
            }
        }
        
        return true;
    }

    /**
     * Changes the name of the player
     * @param index Index of the player
     * @param name The new name of the player
     */
    function setName(index: number, name: string): boolean {
        // Dont set an empty name
        if (name === '') return false;

        // Get player
        const player = get(index);
        if (!player) return false;

        player.name = name;
        return true;
    }

    
    /**
     * Sets a reminder for a player, without removing it from the `once` reminders list
     * @param player Index of the player to set the reminder for
     * @param reminder Reminder to set for the player
     * @param index Optional index of the reminder in the player's reminders list to update, if it already exists
     */
    function setReminder(player: number, reminder: Reminder, index?: number) {
        // Get the current reminder
        const curr: Reminder | undefined = get(player)!.reminders[index ?? -1]
        // If the current reminder exists, add it back to the reminders
        if (curr)
            reminders.add([curr])
        }

        // Remove the reminder from the `once` reminders list
        reminders.remove([reminder])

        // Add the reminder to the player's reminders
        if (index !== undefined) {
            get(player)!.reminders[index] = reminder
        } else {
            get(player)!.reminders.push(reminder)
        }
    }

    /**
     * Removes a reminder from a player, and adds it back to the `once` reminders list if it is not a global reminder
     * @param player Index of the player to remove the reminder from
     * @param index Reminder index to remove from the player
     */
    function removeReminder(player: number, index: number) {
        // Remove the reminder from the player's reminders
        const reminder: Reminder = get(player)!.reminders.splice(index, 1)[0]!
        reminders.add([reminder])

    }

    return {
        all,
        count,

        add,
        get,
        remove,
        setRole,
        setName,
        setReminder,
        removeReminder,
    }
})
