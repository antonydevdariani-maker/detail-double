import confetti from "canvas-confetti"

/**
 * Fire confetti from the center of the viewport.
 * Use after a successful appointment booking.
 */
export function fireConfetti() {
  confetti({
    origin: { x: 0.5, y: 0.5 },
    particleCount: 80,
    spread: 70,
    startVelocity: 28,
  })
}
