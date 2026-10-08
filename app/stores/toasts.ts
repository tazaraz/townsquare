import { DialogInput, Token } from "#components";
import type { ButtonProps } from "@nuxt/ui";
import { defineStore } from 'pinia';

export const useToasts = defineStore('toasts', () => {
    const socket = useSocket()

    const toast = useToast();

    const serverError = (message: string) => toast.add({
        title: message,
        icon: 'i-material-symbols-error-outline-rounded',
        color: 'warning',
    })

    const leftGame = (name: string) => toast.add({
        title: `${name} has left the game`,
        icon: 'i-carbon-connection-signal-off',
    })

    const connectionError = () => {
        const reloadAction: ButtonProps = {
            label: 'Reload the page',
            color: 'neutral',
            variant: 'outline',
            onClick: (e) => {
                e?.stopPropagation()
                location.reload()
            }
        }

        toast.add({
            title: 'Connection lost',
            description: 'The connection to the server has been lost.',
            icon: 'i-carbon-connection-signal-off',
            actions: [{
                label: 'Reconnect',
                color: 'primary',
                variant: 'outline',
                onClick: async (e) => {
                    e?.stopPropagation()
                    if (await socket.reconnect()) {
                        toast.add({
                            title: 'Failed to reconnect',
                            description: 'Reload the page to restore the connection.',
                            icon: 'i-carbon-connection-signal-off',
                            actions: [reloadAction],
                            duration: 0,
                        })
                    } else {
                        restoredConnection()
                    }
                }
            }, reloadAction],
            duration: 0,
        })
    }
    const restoredConnection = () => toast.add({
        title: 'Connection restored',
        icon: 'i-carbon-connection-signal',
        duration: 3000,
    })

    const modifier = (type: 'fabled' | 'loric') => toast.add({
        title: h('span', { class: `text-(--${type})` }, [`The host modified the ${type} roles`]),
    })

    /**
     * This function allows for communication between the host and players through direct messages. It can display messages with different button configurations, such as 'reply', 'confirm', 'acknowledge', or 'custom'. Depending on the type of message, it will show appropriate buttons for user interaction.
     * @param data The data to send
     * @param replyTo The ID of the player to send the message to. Defaults to 'host'.
     */
    const showDirectMessage = (data: DirectMessage, replyTo: string = 'host') => {
        let actions: ButtonProps[] = [];
        // Add buttons based on the type of message
        switch (data.buttons) {
            case 'confirm':
                actions.push({ label: 'No', color: 'neutral', variant: 'outline', onClick: (e) => {
                    e?.stopPropagation()
                    socket.sendTo(replyTo, 'message', { text: 'No', buttons: 'none' } satisfies DirectMessage)
                }});
                actions.push({ label: 'Yes', color: 'primary', variant: 'solid', onClick: (e) => {
                    e?.stopPropagation()
                    socket.sendTo(replyTo, 'message', { text: 'Yes', buttons: 'none' } satisfies DirectMessage)
                }});
                break;
            case 'acknowledge':
                actions.push({ label: 'Understood', color: 'neutral', variant: 'outline',
                    onClick: (e) => e?.stopPropagation()
                });
                break;
            case 'dialog':
                actions.push({ label: 'Understood', color: 'neutral', variant: 'outline',
                    onClick: (e) => e?.stopPropagation()
                });
            case 'reply':
                actions.push({ label: 'Reply', color: 'primary', variant: 'solid', onClick: async (e) => {
                    e?.stopPropagation()
                    const dialog = useOverlay().create(DialogInput).open({
                        title: 'Reply to the host',
                        placeholder: 'Type your message here...'
                    })
                    const result = await dialog.result
                    if (result) {
                        socket.sendTo(replyTo, 'message', {
                            text: result,
                            buttons: 'dialog'
                        } satisfies DirectMessage)
                    }
                }});
                break;
            default:
                break;
        }

        // If we have to show a role, we need to load it and show it in the toast.
        if (data.role) {
            const role = useGame().loadRole(data.role)
            toast.add({
                title: h('div', { class: 'flex gap-4' }, [
                    h('div', { class: 'flex flex-col flex-1 my-auto' }, [
                        h('span', { class: 'italic text-neutral-500' }, [data.title]),
                        h('span', { class: 'text-lg font-bold' }, [data.text]),
                    ]),
                    h(Token, { kind: 'role', data: role, style: 'width: 70px' }),
                ]),
                actions,
                duration: 0,
            })
        }

        // Show a direct message to the player or host.
        else {
            toast.add({
                title: h('span', { class: 'italic text-neutral-500' }, [data.title]),
                description: data.text ? h('span', { class: 'text-lg font-bold' }, [data.text])
                                       : undefined,
                icon: data.icon,
                actions,
                duration: data.buttons === 'none' ? 3000 : 0,
            })
        }
    }

    return {
        serverError,
        connectionError,
        leftGame,
        restoredConnection,
        modifier,

        showDirectMessage,
    }
})