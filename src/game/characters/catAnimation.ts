/**
 * Procedural animation for the shape-built cat rig: breathing, blinking,
 * trot gait, run lean, jump tuck, landing squash, sit, sleep, look-at,
 * happy hop, celebration spin and hug.
 */
import type { CatRig } from './catBuilder'
import type { CatMood } from '../state/runtime'

export interface CatAnimInput {
  dt: number
  t: number
  /** 0 idle · 1 walk · ~1.7 run */
  gait: number
  grounded: boolean
  vy: number
  idleTime: number
  mood: CatMood
  moodTime: number
  /** Desired head yaw relative to the body (radians) or null. */
  lookYaw: number | null
  lookPitch?: number
  talking?: boolean
  /** Force a resting pose (intro sleep). */
  forceSleep?: boolean
  allowRest?: boolean
}

const damp = (cur: number, target: number, rate: number, dt: number) => cur + (target - cur) * (1 - Math.exp(-rate * dt))
const ease = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2)

export class CatAnimator {
  phase = 0
  sit = 0
  sleep = 0
  air = 0
  squash = 0
  squashV = 0
  headYaw = 0
  headPitch = 0
  nextBlink = 2
  blink = 0
  earTwitch = 0
  nextTwitch = 3
  wasGrounded = true
  stepEvents = 0
  private lastStepSign = 0

  /** Returns true when a paw just touched down (for footstep sounds). */
  update(rig: CatRig, a: CatAnimInput): boolean {
    const { dt, t } = a
    let footstep = false

    // resting poses
    const restOk = a.allowRest !== false && a.grounded && a.gait < 0.05 && a.mood === 'none'
    const sitTarget = a.forceSleep || (restOk && a.idleTime > 6) ? 1 : 0
    const sleepTarget = a.forceSleep || (restOk && a.idleTime > 24) ? 1 : 0
    this.sit = damp(this.sit, sitTarget, sitTarget ? 2.5 : 9, dt)
    this.sleep = damp(this.sleep, sleepTarget, sleepTarget ? 1.2 : 9, dt)
    this.air = damp(this.air, a.grounded ? 0 : 1, 14, dt)

    // landing squash spring
    if (a.grounded && !this.wasGrounded) this.squashV -= Math.min(4.5, Math.abs(a.vy) * 0.35 + 1.2)
    this.wasGrounded = a.grounded
    const stretchTarget = a.grounded ? 0 : a.vy > 0 ? 0.07 : -0.02
    this.squashV += (-(this.squash - stretchTarget) * 180 - this.squashV * 14) * dt
    this.squash += this.squashV * dt
    this.squash = Math.max(-0.28, Math.min(0.2, this.squash))

    // gait
    const g = Math.min(a.gait, 1.8)
    const moving = g > 0.05 && a.grounded
    const freq = 8.5 + 5 * Math.max(0, g - 1)
    if (moving) this.phase += dt * freq * Math.max(0.55, Math.min(g, 1.0))
    const amp = moving ? 0.5 * Math.min(g, 1) + 0.22 * Math.max(0, g - 1) : 0
    const s = Math.sin(this.phase)
    const sign = Math.sign(s)
    if (moving && sign !== this.lastStepSign) {
      footstep = true
      this.lastStepSign = sign
    }

    // body
    const breathe = Math.sin(t * 2.3) * (1 - this.sleep * 0.4)
    const sq = this.squash
    rig.body.scale.set(1 + breathe * 0.012 - sq * 0.5, 1 + breathe * 0.022 + sq, 1 - sq * 0.3)
    const bob = moving ? Math.abs(Math.cos(this.phase)) * 0.045 * Math.min(g, 1.4) : 0
    rig.body.position.y = rig.bodyY + bob - this.sit * 0.11 - this.sleep * 0.13 + sq * 0.12
    rig.body.position.z = -this.sit * 0.05
    const lean = moving ? 0.05 + 0.1 * Math.max(0, g - 1) : 0
    let pitch = lean - this.sit * 0.42 * (1 - this.sleep) + (a.vy > 0 && !a.grounded ? -0.12 : 0)
    if (a.mood === 'hug') pitch = -0.55
    rig.body.rotation.x = damp(rig.body.rotation.x, pitch, 10, dt)
    rig.body.rotation.z = moving ? Math.sin(this.phase) * 0.03 * Math.min(g, 1) : 0

    // legs: diagonal pairs (FL+BR, FR+BL)
    const tuckF = -0.75 * this.air, tuckB = 0.85 * this.air
    const legSwing = [s, -s, -s, s].map((v) => v * amp)
    const sitFix = -rig.body.rotation.x
    for (let i = 0; i < 4; i++) {
      const front = i < 2
      let r = legSwing[i] * (1 - this.air) + (front ? tuckF : tuckB)
      r += front ? sitFix * this.sit : -1.15 * this.sit
      if (this.sleep > 0) r = r * (1 - this.sleep) + (front ? -1.35 : -1.25) * this.sleep
      if (a.mood === 'hug' && front) r = -1.5
      rig.legs[i].rotation.x = damp(rig.legs[i].rotation.x, r, 18, dt)
    }

    // head: look-at, bob, sit/sleep compensation, talking nod
    const ly = a.lookYaw === null ? 0 : Math.max(-0.95, Math.min(0.95, a.lookYaw))
    this.headYaw = damp(this.headYaw, ly + this.sleep * 0.45, 6, dt)
    let hp = (a.lookPitch ?? 0) + (moving ? Math.sin(this.phase * 2) * 0.03 : 0)
    hp += this.sit * 0.36 * (1 - this.sleep) + this.sleep * 0.4
    if (a.talking) hp += Math.sin(t * 9) * 0.06
    if (a.mood === 'hug') hp = 0.5
    this.headPitch = damp(this.headPitch, hp, 8, dt)
    rig.head.rotation.set(this.headPitch, this.headYaw, this.sleep * 0.25 + (a.mood === 'happy' ? Math.sin(t * 10) * 0.08 : 0))

    // ears
    this.nextTwitch -= dt
    if (this.nextTwitch <= 0) {
      this.earTwitch = 0.28
      this.nextTwitch = 2.5 + Math.random() * 5
    }
    this.earTwitch = Math.max(0, this.earTwitch - dt)
    const tw = this.earTwitch > 0 ? Math.sin(this.earTwitch * 50) * 0.15 : 0
    const earBack = moving ? Math.max(0, g - 1) * 0.35 : 0
    rig.ears.forEach((e, i) => {
      e.rotation.x = -earBack + this.sleep * 0.2
      e.rotation.y = i === 0 ? tw : 0
    })

    // eyes: blink, happy arcs, sleep closed
    this.nextBlink -= dt
    if (this.nextBlink <= 0) {
      this.blink = 0.14
      this.nextBlink = 2.2 + Math.random() * 3.5
    }
    this.blink = Math.max(0, this.blink - dt)
    const happy = a.mood === 'happy' || a.mood === 'celebrate' || a.mood === 'hug'
    const closed = this.sleep > 0.5
    const lid = this.blink > 0 ? 0.12 : 1
    rig.eyes.forEach((e) => {
      e.visible = !happy
      e.scale.y = closed ? 0.1 : lid
    })
    rig.happyEyes.forEach((e) => (e.visible = happy))

    // tail: travelling sway wave, perkier when moving or happy
    const wag = happy ? 2.2 : 1
    rig.tail.forEach((seg, i) => {
      if (rig.tail.length === 1) {
        seg.rotation.y = Math.sin(t * 6 * wag) * 0.15 * wag
        return
      }
      const base = i === 0
      const sway = Math.sin(t * (1.7 + g * 1.6) * wag - i * 0.6) * (0.16 + 0.1 * Math.min(g, 1) + (happy ? 0.12 : 0))
      const curl = this.sit * (base ? 0.9 : 0.32)
      seg.rotation.z = sway * (1 - this.sit * 0.6) + (base ? 0 : curl)
      seg.rotation.x = base ? -0.15 - this.air * 0.4 - this.sit * 0.95 : -0.1 + this.sit * 0.1
    })

    // whole-model moves: happy hop, celebration spin
    let hop = 0
    let spin = 0
    if (a.mood === 'happy') {
      const k = Math.min(1, a.moodTime / 0.42)
      hop = Math.sin(k * Math.PI) * 0.28
    } else if (a.mood === 'celebrate') {
      const k = Math.min(1, a.moodTime / 1.3)
      spin = ease(k) * Math.PI * 2
      hop = Math.abs(Math.sin(Math.min(1, a.moodTime / 1.4) * Math.PI * 2)) * 0.35
    } else if (a.mood === 'hug') {
      hop = Math.abs(Math.sin(t * 3)) * 0.04
    }
    rig.model.position.y = hop
    rig.model.rotation.y = spin

    return footstep
  }
}
