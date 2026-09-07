import { defineStore } from 'pinia';


export const useReminders = defineStore('reminders', () => {
    const reminderstate = useGamestate().reminders

    /**
     * Adds reminders to the `once` reminders list
     * @param reminders Reminders to add
     */
    function add(reminders: Reminder[]) {
        // Filter out global reminders
        reminders = reminders.filter(r => !reminderstate.global.find(g => g.name === r.name))

        // Add the reminders to the `once` reminders list
        reminderstate.once.push(...reminders)
        sort();
    }
    /**
     * Removes reminders from the `once` reminders list
     * @param reminders Reminders to remove
     */
    function remove(reminders: Reminder[]) {
        reminderstate.once = reminderstate.once.filter(r => !reminders.some(rem => rem.name === r.name))
        sort();
    }
    /**
     * Sorts the `once` reminders list, based on the image name of the reminders
     */
    function sort() {
        reminderstate.once.sort((a, b) => a.image.localeCompare(b.image))
    }
    /**
     * Add a global reminder
     * @param reminders Global reminder to add
     */
    function addGlobal(reminders: Reminder[]) {
        reminderstate.global.push(...reminders)
        reminderstate.global.sort((a, b) => a.image.localeCompare(b.image))

        // Move the custom note reminder to the end of the list
        const customNoteIndex = reminderstate.global.findIndex(r => r.name === 'Custom note')
        const customNote = reminderstate.global.splice(customNoteIndex, 1)[0]!
        reminderstate.global.push(customNote)
    }
    /**
     * Removes a global reminder
     * @param reminders Global reminder to remove
     */
    function removeGlobal(reminders: Reminder[]) {
        reminderstate.global = reminderstate.global.filter(r => !reminders.some(rem => rem.name === r.name))
    }
    /**
     * Builds a list of reminder objects from a list of reminder names
     * @param reminder List of reminder names to build
     * @param role Name of the role to build the reminders for
     */
    function fromString(reminder: string[], role: string): Reminder[] {
        return reminder.map(r => create(r, role))
    }
    /**
     * Builds a reminder object from a reminder name
     * @param reminder Name of the reminder to build
     * @param role Name of the role to build the reminder for
     */
    function create(reminder: string, role: string): Reminder {
        return {
            name: reminder,
            image: `/sprites/characters/${role}.webp`
        }
    }

    return {
        add,
        remove,
        addGlobal,
        removeGlobal,
        fromString,
        create,
    }
})