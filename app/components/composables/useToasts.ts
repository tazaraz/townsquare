export const useToasts = () => {
    const toast = useToast();

    const sendWSFail = () => toast.add({
        title: 'Could not connect to the server',
        description: 'Reload or log in again.',
        icon: 'i-carbon-connection-signal',
        duration: 3000,
    })

    const reconnectError = (message: string) => toast.add({
        title: message,
        icon: 'i-carbon-connection-signal',
        duration: 3000,
    })

    const leftGame = (name: string) => toast.add({
        title: `${name} has left the game`,
        icon: 'i-carbon-connection-signal',
        duration: 3000,
    })

    const pingpongTimeout = () => toast.add({
        title: 'Connection lost',
        description: 'The connection to the server has been lost. Please reload the page.',
        icon: 'i-carbon-connection-signal',
        duration: 3000,
    })

    const modifier = (type: 'fabled' | 'loric') => toast.add({
        title: h('span', { class: `text-(--${type})` }, [`The host modified the ${type} roles`]),
        duration: 3000,
    })

    return {
        sendWSFail,
        reconnectError,
        leftGame,
        pingpongTimeout,
        modifier,
    }
}