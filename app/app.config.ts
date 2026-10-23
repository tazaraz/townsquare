export default defineAppConfig({
    ui: {
        colors: {
            primary: 'arcane',
            secondary: 'emerald',
            success: 'emerald',
            info: 'mystic',
            warning: 'amber',
            error: 'rose',
            neutral: 'slate'
        },

        alert: {
            slots: {
                root: 'bg-default/40 backdrop-blur-lg',
            }
        },
        card: {
            slots: {
                root: 'ring-1 ring-inset ring-[var(--archive-gold-border)]'
            }
        },
        dropdownMenu: {
            slots: {
                content: 'border border-[var(--color-gold-600)] bg-default/70 backdrop-blur-lg'
            }
        },
        modal: {
            slots: {
                content: 'border border-[var(--color-gold-600)] bg-default/70 backdrop-blur-lg',
                wrapper: 'w-[90%]',
                header: 'min-h-fit! border-0 pb-0!',
                body: 'border-0'
            }
        },
        pageCard: {
            slots: {
                root: 'bg-default/70!',
            }
        },
        popover: {
            slots: {
                content: 'border border-[var(--color-gold-600)] bg-default/70 backdrop-blur-lg'
            }
        },
        slideover: {
            slots: {
                content: 'border border-[var(--color-gold-700)] bg-default/70 backdrop-blur-lg'
            }
        },
        tabs: {
            slots: {
                content: 'bg-default/0',
            }
        },
        tooltip: {
            slots: {
                content: 'border border-[var(--color-gold-600)] bg-default/70 backdrop-blur-lg'
            }
        },
    }
})