<template>
    <div id="seats">
        <!-- Voting + clock hand -->
        <div id="nominations" class="flex flex-col items-center ">
            <div v-if="game.nomination.open"
                id="votes" class="flex flex-col items-center text-nowrap bg-default/50 backdrop-blur-lg rounded-lg">
                <UAlert v-if="game.nomination.nominee > -1 || game.nomination.marked !== null"
                    color="neutral"
                    variant="subtle"
                    :ui="{ root: 'text-center py-3 mb-2'}">
                    <template #description>
                        <div class="text-center text-md">
                            <!-- If we are nominating -->
                            <template v-if="game.nomination.nominee > -1">
                                <div class="font-bold text-lg">
                                    <span class="text-info">
                                        {{ players.get(game.nomination.nominator)?.name }}
                                    </span>
                                    nominated
                                    <span class="text-error">
                                        {{ players.get(game.nomination.nominee)?.name }}
                                    </span>
                                </div>
                                {{ players.list.filter(p => p.isVoting).length }} votes in favour
                                <!-- This differs based on exile or execution -->
                                <span class="text-error">
                                    ({{ game.votesRequired }} required)
                                </span>
                            </template>

                            <!-- No one is nominated, but some player is marked for death -->
                            <div v-else-if="game.nomination.marked" class="font-bold text-lg">
                                <span class="text-error">
                                    {{ players.get(game.nomination.marked.player)?.name }}
                                </span>
                                is marked for execution!
                            </div>
                        </div>
                        <UFieldGroup v-if="socket.isHost && game.nomination.marked !== null" class="mt-2">
                            <UButton
                                @click="game.setMarked(-1, false)"
                                label="Clear mark"
                                color="neutral"
                                variant="subtle"
                                class="px-4" />
                            <UButton
                                @click="players.setState(game.nomination.marked.player, PlayerState.Dead);
                                        game.setMarked(-1, false)"
                                label="Execute"
                                color="error"
                                variant="subtle"
                                class="px-4" />
                        </UFieldGroup>
                    </template>
                </UAlert>

                <template v-if="socket.isHost">
                    <UButton v-if="game.nomination.nominee === -1"
                        @click="game.setNominations(false)"
                        color="error" variant="subtle" label="Stop nominations" />

                    <template v-if="game.nomination.nominee > -1">
                        <UFieldGroup class="my-2">
                            <UButton v-if="game.nomination.nominee === game.nomination.marked?.player"
                                @click="game.setMarked(-1, false)"
                                :label="`Clear mark on ${players.get(game.nomination.nominee)!.name}`"
                                color="neutral"
                                variant="subtle"
                                class="px-4" />
                            <UButton v-else
                                @click="game.setMarked(game.nomination.nominee, false)"
                                color="neutral"
                                variant="subtle"
                                class="px-4">
                                <!-- If someone is marked and tied with current -->
                                <template v-if="players.list.filter(p => p.isVoting).length === game.nomination.marked?.votes">
                                    Tie nominations with {{ players.get(game.nomination.marked!.player)!.name }}
                                </template>
                                <template v-else>
                                    Mark for {{ players.get(game.nomination.nominee)!.name }} execution
                                    {{ game.nomination.marked ? 'instead' : '' }}
                                </template>
                            </UButton>
                        </UFieldGroup>
                        <UFieldGroup>
                            <UButton v-if="game.nomination.hand === -1"
                                @click="nomination.start()" color="info" variant="subtle" label="Start" class="px-4" />
                            <UButton v-else
                                @click="nomination.stop()" color="warning" variant="subtle" label="Stop" class="px-4" />
                            <UInputNumber v-model="game.nomination.speed" :ui="{base: 'w-0'}" :min="0.5" :step="0.5"/>
                            <UButton
                                @click="players.setNominated(game.nomination.nominee, game.nomination.nominator, false)"
                                color="error" variant="subtle" label="Cancel" />
                        </UFieldGroup>
                        <small>Time per player: {{ game.nomination.speed }}s</small>
                    </template>
                </template>
                <template v-else>
                    <UAlert v-if="game.nomination.nominee === -1"
                        description="Nominations are now open!"
                        color="info"
                        variant="subtle"
                        :ui="{ root: 'text-center py-3 mb-2'}"/>
                    <template v-else>
                        <UButton v-if="!players.get(socket.seatIndex)?.isVoting"
                            @click="socket.requestVote()"
                            color="primary" variant="subtle" label="Vote" class="px-4" />
                        <UButton v-else
                            @click="socket.requestVote()"
                            color="primary" variant="subtle" label="Cancel vote" class="px-4" />
                        <small>You are <b v-if="!players.get(socket.seatIndex)?.isVoting">not</b> voting</small>
                    </template>
                </template>
            </div>
            <div id="hand" :class="game.nomination.nominee === -1 ? 'hidden' : ''"><span></span></div>
        </div>

        <!-- Player seats -->
        <div id="wheel">
            <div v-for="(player, p) in players.list"
                 class="seat" :style="`z-index: ${p < players.length / 2 ? -p : p}`">
                <div class="player flex flex-col mb-8">
                    <Token
                        :data="player.role ?? undefined"
                        :state="player.state"
                        kind="role"
                        :hidden="ui.hidden"
                        :overlay="overlay(p)"
                        :order="{
                            firstNight: game.knownNightOrder.firstNight.findIndex(r => r.id === player.role?.id) + 1,
                            otherNights: game.knownNightOrder.otherNights.findIndex(r => r.id === player.role?.id) + 1
                        }"
                        @click="processTokenClick(p)"/>
                    <PlayerMenu class="mx-4 mt-1" :player="player" :index="p"></PlayerMenu>
                </div>
                <Token v-for="(reminder, rIndex) in player.reminders"
                    :class="`reminder mx-auto ${ui.hidden ? 'invisible' : ''}`"
                    :data="{name: reminder.name, image: reminder.image}"
                    kind="reminder"
                    @click="emit('editReminder', p, rIndex)"
                    />
                <Token v-if="player.reminders.length < 3"
                    :class="`add reminder mx-auto ${ui.hidden ? 'invisible' : ''}`"
                    :data="{name: '', image: '/sprites/plus.png'}"
                    kind="reminder"
                    @click="emit('editReminder', p)"
                    />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import gsap from 'gsap'
import Draggable from 'gsap/Draggable'
import InertiaPlugin from 'gsap/InertiaPlugin'
gsap.registerPlugin(Draggable, InertiaPlugin)

const emit = defineEmits<{
    editPlayer: [player: number],
    editReminder: [player: number, reminder?: number],
}>()

const players = usePlayers()
const ui = useUI()
const game = useGame()
const socket = useSocket()

/**
 * The logic in this file is purely for visualizing the player tokens in a circle.
 * It affects the game state only in that it updates the selected token based on the rotation of the wheel.
 */
class PlayerSeats {
    /** Data about the circle in the DOM */
    wheel = {
        /** x coordinate of center of wheel */
        x: 0,
        /** y coordinate of center of wheel */
        y: 0,
        /** Radius of the wheel. Double it to get height and width of the wheel */
        radius: 0,
        /** Initial orientation of the wheel. 0 points right */
        orentation: 0,
        /** Positioning of the reminder */
        reminders: {
            margin: 10,
            scale: 0.6,
        },
        /** Breakpoints for when the wheel should switch to center mode */
        breakpoints: {
            horizontal: 1100,
            vertical: 600
        }
    }

    /** Everything related to nominations. */
    nomination = {
        /** Initial orientation of the hand. 0 points right */
        handRotation: 0,
        /** Location of the ui for nominations on the screen */
        ui: {
            x: 0,
            y: 0
        }
    }

    /** The token data */
    seats = {
        wrapper: {} as HTMLElement,
        elements: [] as HTMLElement[],
        /** Mapping, where the index maps the element to its seat in the wheel */
        slots: [] as number[],
        /** Maximum size of the circle */
        max: 7,
    }

    /** Currently selected seat index (in `[0...this.seats.max]`) */
    centreSeatIndex = 0;

    draggable: Draggable = null!;

    constructor() {
        onMounted(() => {
            this.seats.wrapper = document.getElementById('seats')!;

            window.addEventListener("resize", () => {
                this.setWheelVisualization(ui.orientation.user)
                this.updateOrder(true)
            })

            this.setWheelVisualization(ui.orientation.user)

            if (players.length === 0)
                return;

            // Create GSAP circle
            this.createCircle()

            // Get the token elements in the DOM
            this.seats.elements = gsap.utils.toArray<HTMLElement>("#wheel > .seat")
            this.setWheelVisualization(ui.orientation.user)
            // Orient the wheel to the correct orientation on load
            gsap.set("#wheel", { rotation: this.wheel.orentation })

            this.updateOrder(true)

            if (useSocket().seatIndex > 0)
                this.scrollTo(useSocket().seatIndex)
        })
    }

    /**
     * Creates the circle and arranges the tokens around it
     */
    createCircle() {
        this.draggable = Draggable.create("#wheel", {
            type: "rotation",
            inertia: true,

            snap: (value: number) => {
                const angle = 360 / this.seats.max
                return Math.round((value - this.wheel.orentation) / angle) * angle + this.wheel.orentation
            },
            onThrowUpdate: () => this.updateOrder(),
            onDrag: () => this.updateOrder(),
        })[0]!;

        // Update the rotation of the tokens on each tick
        gsap.ticker.add(() => {
            const angleStep = 360 / this.seats.max
            // Get the current rotation of the wheel, account for initial orientation
            const rotation = gsap.getProperty("#wheel", "rotation") as number - this.wheel.orentation

            this.seats.elements.forEach((seat, index) => {
                // Calculate the seat angle to the centre. Account for the index of the seat
                const centreAngle = (this.seats.slots[index]! - this.centreSeatIndex) * angleStep
                // Angle to centre is 90 degrees
                const seatRotation = centreAngle + 90

                gsap.set(seat, {
                    rotation: seatRotation - rotation
                })

                // Make sure each token is faceing upward
                Array.from(seat.children).forEach((token, i) => {
                    gsap.set(token, {
                        // Undo the centre rotation, and add 180 degrees to make the token face upward
                        rotation: -seatRotation - this.wheel.orentation
                    })
                })
            })
        })
    }

    /**
     * Renders a seat at its current slot position
     * @param seatIdx Index of the seat in the DOM
     */
    positionSeat(seatIdx: number) {
        // Get the token element
        const seat = this.seats.elements[seatIdx]!
        const slot = this.seats.slots[seatIdx]!
        // Calculate the angle each slot
        const angleStep = 360 / this.seats.max
        // Calculate the angle for this slot.
        const angle = slot * angleStep
        // Convert the angle to radians
        const radians = angle * Math.PI / 180;

        // Calculate the amount of reminders
        const reminders = seat.querySelectorAll(".reminder")
        let elSize = 0;
        if (reminders.length > 0) {
            // My math is mathing but shomehow off by 2px
            elSize = (reminders[0]!.clientHeight / 2 + this.wheel.reminders.margin - 2) * reminders.length
        }

        const vars: gsap.TweenVars = {
            x: (this.wheel.radius - elSize) * Math.cos(radians),
            y: (this.wheel.radius - elSize) * Math.sin(radians),
            xPercent: -50,
            yPercent: -50,
        }

        // Move the token
        gsap.set(seat, vars)
    }

    /**
     * Calculates the order of tokens based on the current origin
     * @returns An array of token indices in their current order
     */
    tokenOrder(rotationOffset: number): {selected: number, slots: number[]} {
        const size = this.seats.elements.length;
        const rotation = ((rotationOffset % size) + size) % size;

        // Wraps a value to the range [0, this.seats.max)
        const wrap = (value: number) => ((value % this.seats.max) + this.seats.max) % this.seats.max;

        /**
         * Create an array of offsets: [0, ..., size, -size, ... ,-1]
         * Add the rotation offset of the wheel: [0 + off, ..., size + off, -size - off, ... , -1 - off]
         * Then for the rotation of the elements, wrap the array around.
         *
         * This results in an array where indices are mapped to their current position in the wheel,
         * and the selected index is the one that is closest to 0.
         */
        const offsets = Array.from({ length: size },
            // Construct the array
            (_, i) => (i <= Math.floor(size / 2) ? i : i - size) - rotationOffset)
            // Wrap
            .map((_, i, arr) => arr[(i + rotation) % size]!);

        // Make sure each value is in the range [0, this.seats.max)
        const slots = offsets.map(wrap);
        return {selected: slots.indexOf(wrap(-rotationOffset)), slots};
    }

    /**
     * Updates the order of tokens based on the current rotation of the wheel
     * @param force Whether to force an update even if the order hasn't changed
     */
    updateOrder(force: boolean = false) {
        // Get the current rotation of the wheel, account for initial orientation
        const rotation = (gsap.getProperty("#wheel", "rotation") as number) - this.wheel.orentation
        // Calculate the offset based on the rotation and the number of slots
        const offset = Math.round(rotation / (360 / this.seats.max))
        this.centreSeatIndex = ((-offset) % this.seats.max + this.seats.max) % this.seats.max

        // Update the slots based on the new origin
        const {selected, slots} = this.tokenOrder(offset)

        // Update the class of the selected token in the DOM
        if (ui.orientation.rendered !== "center") {
            this.seats.elements[ui.grimoire.selectedToken]?.classList.remove("selected")
            this.seats.elements[selected]?.classList.add("selected")
        } else {
            this.seats.elements[ui.grimoire.selectedToken]?.classList.remove("selected")
        }

        ui.grimoire.selectedToken = selected

        // If the slots have changed, update them and re-render the tokens
        if (force || !this.seats.slots.every((e, i) => e === slots[i])) {
            this.seats.slots = slots;

            // Update the position of each token based on its new slot
            this.seats.slots.forEach((_, index) => {
                this.positionSeat(index)
            })
        }
    }

    /**
     * Sets the scroll position of the wheel to the given index.
     * @param index Index to scroll to
     * @param duration Duration of the scroll animation in seconds
     * @returns Whether we scrolled to the token or whether it was already in the centre
     */
    async scrollTo(index: number, duration: number = 0.5, nominations: boolean = false) {
        // Don't scroll if:
        if (ui.orientation.rendered === "center" || (index === ui.grimoire.selectedToken && !nominations))
            return false;

        // Index offset calculation, bearing in mind rotationary nature of the wheel
        const m = this.seats.max;
        const angle = 360 / m;
        // Get the rotation relative to the wheel orientation
        const relativeRotation = (gsap.getProperty("#wheel", "rotation") as number) - this.wheel.orentation
        // Align to the same slot grid as updateOrder
        const snappedRotation = this.wheel.orentation + Math.round(relativeRotation / angle) * angle
        // Difference between the current index and the centre index
        const diff = this.seats.slots[index]! - this.centreSeatIndex;
        // Wrap the difference to the range [-m/2, m/2]
        const indexOffset = ((diff + m / 2) % m + m) % m - m / 2;

        await gsap.to("#wheel", {
            rotation: snappedRotation - indexOffset * angle,
            duration: duration,
            ease: nominations ? 'circ.inOut' : 'power2.inOut',
            onUpdate: () => this.updateOrder(),
        })

        return true;
    }

    /**
     * Moves the hand to the given index. If the wheel is not in center mode, it will scroll to the index first.
     * @param index Index to move the hand to
     * @param duration Duration of the scroll animation in seconds
     * @returns Whether we moved the hand to the token or whether it was already in the centre
     */
    async moveHand(index: number, duration: number = 0.5) {
        // Kill any previous animations
        gsap.killTweensOf(['*'])

        if (index === -1)
            return false;

        // If we are not in center mode, scroll to the tokens instead.
        if (ui.orientation.rendered !== 'center') {
            this.setWheelVisualization(ui.orientation.rendered)
            // scrollTo does requires the index to be in the range [0, this.seats.max), so we wrap it around
            await this.scrollTo(index % this.seats.elements.length, duration, true)
        } else {
            // Index offset calculation, bearing in mind rotationary nature of the wheel
            const m = this.seats.max;
            const base = this.wheel.orentation - 180 / m + this.nomination.handRotation

            await gsap.to("#hand", {
                rotation: base + index * (360 / m),
                duration,
                ease: "circ.inOut",
            })
        }

        return true;
    }

    /**
     * Sets the visualization of the game wheel. It calculates all sorts of positional values based on the size of the screen and the number of players.
     * @param position Position requested by the user
     */
    setWheelVisualization(position: WheelOrientation) {
        const w_width = this.seats.wrapper.clientWidth;
        const w_height = this.seats.wrapper.clientHeight;

        // If the screen is wide enough, allow all tokens to be displayed
        if (w_width > w_height &&
            (w_width > this.wheel.breakpoints.horizontal &&
             w_height > this.wheel.breakpoints.vertical)
        ) {
            ui.orientation.rendered = position = "center"
        } else {
            ui.orientation.rendered = position = ui.orientation.user
        }

        const screenSize = Math.min(w_width, w_height);

        /* Calculate the radius for the wheel, which influences arc.
         * Calculate the number of slots, which influences token spacing.
         */
        // I cooked up the magic numbers here by quick trial and error.
        switch (position) {
            // Vertical
            case "top":
            case "bottom":
                this.wheel.radius = screenSize * 2.5
                this.seats.max = Math.ceil(Math.pow(screenSize, 1/2.5)) * 4;
                ui.tokenSize = Math.min(Math.max(110, screenSize * 0.22), 160)
                break;
            // Horizontal
            case 'left':
            case "right":
                this.wheel.radius = screenSize * 3.5
                this.seats.max = Math.ceil(Math.pow(screenSize, 1/2)) * 3;
                ui.tokenSize = Math.min(Math.max(100, screenSize * 0.22), 140)
                break;
            // Center. We calculate the radius based on the size of the token, ensuring no overlap
            case "center":
                this.seats.max = players.length;
                ui.tokenSize = Math.min(Math.max(100, (screenSize * 1.5) / this.seats.max), 150)
                this.wheel.radius = Math.max(300, this.seats.max * ui.tokenSize * 0.23)
                break;
        }

        // Disable dragging if the wheel is smaller than the screen.
        if (ui.orientation.rendered === "center") {
            this.draggable?.disable()
        } else {
            this.draggable?.enable()
        }

        const votes = {
            width: document.getElementById("votes")?.clientWidth ?? 0,
            height: document.getElementById("votes")?.clientHeight ?? 0,
        }

        /* Set the position of the wheel in the DOM based on the orientation. */
        // I cooked up the magic numbers (except orientation) here by quick trial and error.
        switch (position) {
            case "top":
                // Wheel center position and rotation
                this.wheel.x = w_width / 2
                this.wheel.y = w_height * 0.05 + this.wheel.radius + ui.tokenSize / 2
                this.wheel.orentation = -90

                // Nomination UI
                this.nomination.ui.x = 0
                this.nomination.ui.y = -this.wheel.y - votes.height + w_height * 0.8
                // this.nomination.handRotation = -90 - (180 / this.seats.max)
                break;
            case "bottom":
                // Wheel center position and rotation
                this.wheel.x = w_width / 2
                this.wheel.y = w_height * 0.85 - this.wheel.radius - ui.tokenSize / 2
                this.wheel.orentation = 90

                // Nomination UI
                this.nomination.ui.x = 0
                this.nomination.ui.y = -this.wheel.y + votes.height + w_height * 0.2
                // this.nomination.handRotation = 90 - (180 / this.seats.max)
                break;
            case "left":
                // Wheel center position and rotation
                this.wheel.x = w_width * 0.10 + this.wheel.radius + ui.tokenSize / 2
                this.wheel.y = w_height / 2
                this.wheel.orentation = 180

                // Nomination UI
                this.nomination.ui.x = -this.wheel.x - votes.width / 2 + w_width * 0.97
                this.nomination.ui.y = votes.height
                this.nomination.handRotation = 180 - (180 / this.seats.max)
                break;
            case "right":
                // Wheel center position and rotation
                this.wheel.x = w_width * 0.90 - this.wheel.radius - ui.tokenSize / 2
                this.wheel.y = w_height / 2
                this.wheel.orentation = 0

                // Nomination UI
                this.nomination.ui.x = -this.wheel.x + votes.width / 2 + w_width * 0.03
                this.nomination.ui.y = votes.height
                // this.nomination.handRotation = 0 - (180 / this.seats.max)
                break;
            case "center":
                // Wheel center position and rotation
                this.wheel.x = w_width / 2
                this.wheel.y = w_height / 2
                this.wheel.orentation = -90
                gsap.set("#wheel", { rotation: this.wheel.orentation })

                // Nomination UI
                this.nomination.ui.x = this.nomination.ui.y = 0
                this.nomination.handRotation = 0
                break;
        }

        this.updateCSS()
    }

    /**
     * Updates the CSS of the wheel and nominations based on the current state of the wheel and nominations
     */
    updateCSS() {
        gsap.set("#wheel", {
            left: this.wheel.x,
            top: this.wheel.y,
        })

        if (players.length > 0) {
            gsap.set("#wheel .player", {
                width: ui.tokenSize,
                height: ui.tokenSize
            })

            gsap.set("#wheel .reminder", {
                width: ui.tokenSize * this.wheel.reminders.scale,
                height: ui.tokenSize * this.wheel.reminders.scale,
                margin: `${this.wheel.reminders.margin}px auto 0 auto`
            })
        }

        if (game.nomination.open) {
            gsap.set("#nominations", {
                left: this.wheel.x,
                top: this.wheel.y,
            })

            gsap.set("#nominations #votes", {
                left: this.nomination.ui.x,
                top: this.nomination.ui.y,
                xPercent: -50,
                yPercent: -50,
            })

            gsap.set("#nominations #hand", {
                rotation: this.nomination.handRotation
            })

            gsap.set("#nominations #hand span", {
                left: this.wheel.radius - ui.tokenSize * 0.75,
                yPercent: -100,
                width: ui.tokenSize * 1.5,
                height: ui.tokenSize / 5,
            })
        }
    }
}


class Nominations {
    /** Id of the latest run */
    runId = 0;
    /** Non-wrapping position of the hand */
    handOffset = -1;

    constructor() {
        onMounted(async () => {
            if (game.nomination.nominee === -1) return

            // Move the hand to the nominee
            await this.movehand(-1, 0.0, true)
            await this.movehand(0, 0.0, true)

            // Then mark the nomination as not ongoing
            await this.movehand(-1, 0.0, true)
        })
    }

    /**
     * Starts the nomination clock, which moves the hand to each player in turn, giving them time to vote.
     */
    async start() {
        const currentRunId = ++this.runId;

        if (currentRunId === this.runId) {
            await this.movehand(-1, 0.0, true)
            await this.movehand(0, 0.0, true)
        }

        // Give the the announcement we are about to start the nominations
        const message = {
            text: `The nominations start in ${game.nomination.speed} seconds`,
            buttons: 'none',
            duration: game.nomination.speed * 1000,
        } satisfies DirectMessage
        socket.broadcast('message', message)
        useToaster().showDirectMessage(message)

        // Wait how long we said we would wait.
        await new Promise(resolve => setTimeout(resolve, game.nomination.speed * 1000))

        // Tick
        for (let i = 0; i < players.length; i++) {
            if (currentRunId !== this.runId)
                return;

            await this.movehand(i + 1, game.nomination.speed);
        }

        // Finalize
        await new Promise(resolve => setTimeout(resolve, game.nomination.speed * 1000))
        game.setMarked(game.nomination.nominee, true)
    }

    /** Stops the nominations and marks the nominations as not ongoing */
    async stop() {
        this.runId++;
        const duration = game.nomination.hand === players.length ? 0.0 : 0.5;
        await this.movehand(-1, 0.0, true)
        await this.movehand(0, duration, true)
        await this.movehand(-1, 0.0, true)
    }

    voteLocked(index: number) {
        const length = players.length;
        const nominee = game.nomination.nominee;

        // Calculate distance to nominee in counter-clockwise order
        const distFromNominee = (index - nominee + length - 1) % length
        // Calculate how far we are over the players. range: [0, length], such that
        // locked handle index <= distance from nominee => locked.
        const lockedIndex = this.handOffset - ((nominee + 1) % length)
        // The calculation tells if the player CAN vote, but function returns opposite
        // return {distFromNominee, lockedIndex, 'locked': distFromNominee < lockedIndex}
        return !(game.nomination.hand === -1 || lockedIndex <= distFromNominee)
    }

    handLocation(index: number) {
        const length = players.length;
        const nominee = game.nomination.nominee;

        // Logical position relative to the nominee
        const candidate = (index + nominee + 1) % length;

        // Continue forward instead of jumping backward on wraparound
        if (this.handOffset < candidate)
            return candidate;

        const cycles = Math.max(0, Math.ceil((this.handOffset - candidate) / length));
        return candidate + cycles * length;
    }

    /**
     * Triggers a change in the hand, which triggers a watch, which triggers the animation
     * @param hand The index of the hand to move to
     * @param speed The speed of the animation in seconds
    */
    async movehand(hand: number, speed: number, temporarySpeed: boolean = false) {
        if (temporarySpeed) {
            const oldSpeed = game.nomination.speed
            setTimeout(() => game.nomination.speed = oldSpeed, 10)
        }

        // Setting the hand triggers the animation
        game.nomination.hand = hand
        game.nomination.speed = speed
        await new Promise(resolve => setTimeout(resolve, Math.max(10, speed * 1000)))
    }
}

/** Initialize the circle */
const seats = reactive(new PlayerSeats())
const nomination = reactive(new Nominations())

function overlay(player: number) {
    if (ui.swapping > -1 && ui.swapping !== player)
        return 'swap'
    if (ui.swapping > -1 && ui.swapping === player)
        return 'cancel'
    if (players.get(player)?.isVoting)
        return 'vote'
    if (!players.get(player)?.isVoting && players.voteLocked(player))
        return 'cancel'
    if (game.nomination.marked?.player === player)
        return 'marked'
    return undefined
}

async function processTokenClick(player: number) {
    if (await seats.scrollTo(player))
        return

    if (ui.swapping > -1) {
        if (ui.swapping !== player)
            players.swap(ui.swapping, player)

        ui.swapping = -1;
    } else
        emit('editPlayer', player)
}

/** When the amount of players change, update the circle */
watch(
    () => [
        players.length,
        players.list.map(player => player.reminders?.length ?? 0),
        ui.orientation.user,
    ],
    async () => {
        if (players.length === 0)
            return;

        await nextTick();

        if (!seats.draggable) {
            seats.createCircle()
            // Get the new player elements
            seats.seats.elements = gsap.utils.toArray<HTMLElement>("#wheel > .seat")
            // Update the wheel
            seats.setWheelVisualization(ui.orientation.user)
            gsap.set("#wheel", { rotation: seats.wheel.orentation })
        }

        await nextTick();

        // Get the new player elements
        seats.seats.elements = gsap.utils.toArray<HTMLElement>("#wheel > .seat")
        // Update the wheel
        seats.setWheelVisualization(ui.orientation.user)
        seats.updateOrder(true);
    }, { immediate: true }
)

watch(
    () => [
        game.nomination.open,
        game.nomination.nominee,
    ],
    async () => {
        // Make sure the nomination panel is centered
        await nextTick();
        seats.setWheelVisualization(ui.orientation.user)
        seats.updateOrder(true)

        if (game.nomination.nominee === -1) {
            await nomination.movehand(-1, 0.0, true)
            return;
        }

        // Move the hand to the nominee
        await nomination.movehand(0, 0.5, true)
        await nomination.movehand(-1, 0.0, true)
    }, { immediate: true }
)

/** If the hand is supposed to move */
watch(
    () => game.nomination.hand,
    async () => {
        // We are updating the hand, so we need to tell everyone else to update their hand as well.
        if (socket.isHost)
            await socket.broadcast('nomination', { hand: game.nomination.hand, speed: game.nomination.speed })

        // Pre-reset of the hand (watch does not trigger when the value is already 0, so set it temp to -1)
        if (game.nomination.hand === -1) {
            nomination.handOffset = -1;
            seats.moveHand(-1, 0.0)
        }

        // Move the hand
        else {
            const location = nomination.handLocation(game.nomination.hand);
            seats.moveHand(location, game.nomination.speed)

            // We only update players ability to vote, if a vote is actually happening
            if (location > -1) {
                setTimeout(() => {
                    nomination.handOffset = location;

                    for (let i = 0; i < players.length; i++)
                        players.get(i)!.voteLocked = nomination.voteLocked(i)
                }, game.nomination.speed * (1000 / 2))  // Halfway through hand motion, minus token css animation
            }
        }
    }
)


/** Expose the circle to allow parent components to update the circle as well */
defineExpose({
    circle: seats
});

</script>

<style lang="css" scoped>
#seats {
    user-select: none;

    width: 100%;
    min-height: calc(100vh - var(--ui-header-height));
    position: fixed;

    #nominations {
        position:absolute;

        #votes {
            z-index: 1;
            position: absolute;

            .required {
                position: relative;
                padding: 0.3rem 0.6rem;
                border-bottom: 2px solid white;

                &::before {
                    content: "";
                    position: absolute;
                    z-index: -1;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(0, rgba(255, 255, 255, 0.5) 0%, rgba(0,0,0,0) 80%);
                }
            }
        }

        #hand {
            position: absolute;

            span {
                position: absolute;
                border-bottom: 2px solid white;

                &::before {
                    content: "";
                    position: absolute;
                    z-index: -1;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(0, rgba(255, 255, 255, 0.5) 0%, rgba(0,0,0,0) 100%);
                }
            }
        }
    }

    #wheel {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);

        .seat {
            position: absolute;

            &:deep(.reminder:not(.invisible)) {
                transition: opacity 0.3s;
                opacity: 1;
            }

            &:deep(.reminder:not(.add)),
            &:hover:deep(.reminder:last-child) {
                opacity: 1 !important;
            }

            &:not(.selected):deep(.reminder:last-child) {
                opacity: 0;
            }
        }

    }
}

</style>
