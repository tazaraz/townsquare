<template>
    <div id="seats">
        <div id="wheel">
            <div v-for="(player, p) in players.all"
                 class="seat" :style="`z-index: ${p < players.all.length / 2 ? -p : p}`">
                <div class="player flex flex-col mb-8">
                    <Token :data="player.role ?? undefined"
                           :state="player.state"
                           kind="role"
                           @click="circle.scrollTo(p) && emit('editPlayer', p)"
                        />
                    <PlayerTag class="mx-4 mt-1" :index="p"></PlayerTag>
                </div>
                <Token v-for="(reminder, rIndex) in player.reminders"
                       class="reminder mx-auto"
                       :data="{name: reminder.name, image: reminder.image}"
                       kind="reminder"
                       @click="emit('editReminder', p, rIndex)"
                    />
                <Token v-if="player.reminders.length < 3"
                       class="reminder mx-auto"
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

/**
 * The logic in this file is purely for visualizing the player tokens in a circle.
 * It affects the game state only in that it updates the selected token based on the rotation of the wheel.
 */
class PlayerCircle {
    /** Data about the circle in the DOM */
    wheel = {
        /** x coordinate of center of wheel */
        x: 0,
        /** y coordinate of center of wheel */
        y: 0,
        /** Radius of the wheel. Double it to get height and width of the wheel */
        radius: {
            x: 200,
            y: 200
        },
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
    private centreSeatIndex = 0;

    private draggable: Draggable = null!;

    constructor() {
        onMounted(() => {
            this.seats.wrapper = document.getElementById('seats')!;

            window.addEventListener("resize", () => {
                this.setWheelVisualization(ui.orientation.user)
                this.updateOrder(true)
            })

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

            this.createCircle()
            this.updateOrder(true)
        })
    }

    /**
     * Creates the circle and arranges the tokens around it
     */
    createCircle() {
        this.setWheelVisualization(ui.orientation.user)

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
                        // y: [0, -20, -70][i],
                        // Undo the centre rotation, and add 180 degrees to make the token face upward
                        rotation: -seatRotation - this.wheel.orentation
                    })
                })

            })
        })

        // Get the token elements in the DOM
        this.seats.elements = gsap.utils.toArray<HTMLElement>("#wheel > .seat")
    }

    /**
     * Renders a seat at its current slot position
     * @param seatIdx Index of the seat in the DOM
     */
    positionSeat(seatIdx: number) {
        // Get the token element
        const seat = this.seats.elements[seatIdx]!
        const slot  = this.seats.slots[seatIdx]!
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
        };

        const vars: gsap.TweenVars = {
            x: (this.wheel.radius.x - elSize) * Math.cos(radians),
            y: (this.wheel.radius.y - elSize) * Math.sin(radians),
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
    tokenOrder(): {selected: number, slots: number[]} {
        const size = this.seats.elements.length;
        const radius = Math.floor(size / 2);

        // Create an array of offsets: [0, ..., size, -size, ... ,-1]
        const offset = Array.from({ length: size }, (_, i) => {
            return i <= Math.floor(size / 2) ? i : i - size;
        });

        // Calculate the direction to shift the array based on the seat index
        const direction = Math.sign(this.centreSeatIndex);

        // Put the seat indexes into the array
        for (let i = 0; i < Math.abs(this.centreSeatIndex); i++) {
            const index = (i + radius + 1) % size;
            offset[index]! += direction * size;
        }

        const wrap = (value: number) => ((value % this.seats.max) + this.seats.max) % this.seats.max;

        // Make sure each value is in the range [0, this.seats.max)
        const slots = offset.map(wrap);
        return {selected: slots.indexOf(wrap(this.centreSeatIndex)), slots};

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
        this.centreSeatIndex = ((- offset) % this.seats.max + this.seats.max) % this.seats.max

        // Update the slots based on the new origin
        const {selected, slots} = this.tokenOrder()

        // Update the class of the selected token in the DOM
        if (ui.orientation.rendered !== "center") {
            this.seats.elements[ui.selectedToken]?.classList.remove("selected")
            this.seats.elements[selected]?.classList.add("selected")
        } else {
            this.seats.elements[ui.selectedToken]?.classList.remove("selected")
        }

        ui.selectedToken = selected

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
     * @returns Whether we scrolled to the token or whether it was already in the centre
     */
    scrollTo(index: number) {
        // Don't scroll if:
        if (ui.orientation.rendered === "center" || index === ui.selectedToken) return true;

        // Index offset calculation, bearing in mind rotationary nature of the wheel
        const m = this.seats.elements.length
        const indexOffset = ((index - this.centreSeatIndex + m / 2) % m + m) % m - m / 2;

        const rotation = gsap.getProperty("#wheel", "rotation") as number;

        gsap.to("#wheel", {
            rotation: rotation - indexOffset * (360 / this.seats.max),
            duration: 0.5,
            ease: "power2.inOut",
            onUpdate: () => this.updateOrder(),
        })

        return false;
    }


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
                this.wheel.radius.x = this.wheel.radius.y = screenSize * 2.5
                this.seats.max = Math.ceil(Math.pow(screenSize, 1/2.5)) * 4;
                ui.tokenSize = Math.min(Math.max(110, screenSize * 0.22), 160)
                break;
            // Horizontal
            case 'left':
            case "right":
                this.wheel.radius.x = this.wheel.radius.y = screenSize * 3.5
                this.seats.max = Math.ceil(Math.pow(screenSize, 1/2)) * 3;
                ui.tokenSize = Math.min(Math.max(100, screenSize * 0.22), 140)
                break;
            // Center. We calculate the radius based on the size of the token, ensuring no overlap
            case "center":
                this.seats.max = players.count;
                ui.tokenSize = Math.min(Math.max(100, (screenSize * 1.5) / this.seats.max), 160)
                const dynamic = this.seats.max * ui.tokenSize * 0.23;
                const fixed = screenSize / 3;
                // Make an elliptic curve
                if (dynamic < fixed) {
                    this.wheel.radius.x = this.wheel.radius.y = dynamic
                } else {
                    this.wheel.radius.x = this.wheel.radius.y = dynamic
                    this.wheel.radius.x = fixed + this.seats.max * ui.tokenSize * 0.02;
                    this.wheel.radius.y = this.seats.max * ui.tokenSize * 0.23
                }
                break;
        }

        // Disable dragging if the wheel is smaller than the screen.
        if (ui.tokenSize * players.count < screenSize ||
             ui.orientation.rendered === "center") {
            this.draggable.disable()
        } else {
            this.draggable.enable()
        }

        /* Set the position of the wheel in the DOM based on the orientation. */
        // I cooked up the magic numbers (except orientation) here by quick trial and error.
        switch (position) {
            case "top":
                this.wheel.x = w_width / 2
                this.wheel.y = w_height * 0.05 + this.wheel.radius.x + ui.tokenSize / 2
                this.wheel.orentation = -90
                break;
            case "bottom":
                this.wheel.x = w_width / 2
                this.wheel.y = w_height * 0.85 - this.wheel.radius.x - ui.tokenSize / 2
                this.wheel.orentation = 90
                break;
            case "left":
                this.wheel.x = w_width * 0.10 + this.wheel.radius.x + ui.tokenSize / 2
                this.wheel.y = w_height / 2
                this.wheel.orentation = 180
                break;
            case "right":
                this.wheel.x = w_width * 0.90 - this.wheel.radius.x - ui.tokenSize / 2
                this.wheel.y = w_height / 2
                this.wheel.orentation = 0
                break;
            case "center":
                this.wheel.x = w_width / 2
                this.wheel.y = w_height / 2
                this.wheel.orentation = -90
                break;
        }

        this.updateCSS()
    }

    updateCSS() {
        gsap.set("#wheel", {
            left: this.wheel.x,
            top: this.wheel.y,
            xPercent: -50,
            yPercent: -50,
            rotation: this.wheel.orentation
        })

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
}

/** Initialize the circle */
const circle = new PlayerCircle()

/** When the amount of players change, update the circle */
watch(
    () => [
        players.all.length,
        players.all.map(player => player.reminders?.length ?? 0)
    ],
    async () => {
        await nextTick();
        // Get the new player elements
        circle.seats.elements = gsap.utils.toArray<HTMLElement>("#wheel > .seat")
        // Update the wheel
        circle.setWheelVisualization(ui.orientation.user)
        circle.updateOrder(true);
    }
)

/** Expose the circle to allow parent components to update the circle as well */
defineExpose({
    circle
});

</script>

<style lang="css" scoped>
#seats {
    user-select: none;

    width: 100%;
    min-height: 100%;
    position: relative;
}

#wheel {
    position: absolute;

    .seat {
        position: absolute;

        &:deep(.reminder) {
            transition: opacity 0.3s;
            opacity: 1;
        }

        &:deep(.reminder:nth-child(4)),
        &:hover:deep(.reminder:last-child) {
            opacity: 1 !important;
        }

        &:not(.selected):deep(.reminder:last-child) {
            opacity: 0;
        }
    }
}

</style>
