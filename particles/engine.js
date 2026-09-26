/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 * 
 * ParticleEngine coordinates Pin physical states, motion simulation ticks, and spatial indexing.
 */
import { PinParticle } from './pin-particle.js';

export class ParticleEngine {
  constructor() {
    this.pins = new Map();
    this.tickListeners = new Set();
    this.forceFields = [];
  }

  /**
   * Register a new or existing Pin particle in the engine
   */
  addPin(pinOrConfig) {
    const pin = pinOrConfig instanceof PinParticle ? pinOrConfig : new PinParticle(pinOrConfig);
    this.pins.set(pin.id, pin);
    return pin;
  }

  /**
   * Remove a Pin particle by its ID
   */
  removePin(id) {
    return this.pins.delete(id);
  }

  /**
   * Retrieve a Pin particle by ID
   */
  getPin(id) {
    return this.pins.get(id);
  }

  /**
   * Retrieve all active Pin particles
   */
  getAllPins() {
    return Array.from(this.pins.values());
  }

  /**
   * Add a custom force field function: (pin, dt) => void
   */
  addForceField(fieldFn) {
    if (typeof fieldFn === 'function') {
      this.forceFields.push(fieldFn);
    }
  }

  /**
   * Apply an instantaneous global force to all unpinned Pins
   */
  applyGlobalForce(fx, fy) {
    for (const pin of this.pins.values()) {
      pin.applyForce(fx, fy);
    }
  }

  /**
   * Run one simulation step
   */
  tick(dt = 1) {
    // Apply registered force fields
    if (this.forceFields.length > 0) {
      for (const pin of this.pins.values()) {
        if (!pin.pinned) {
          for (const field of this.forceFields) {
            field(pin, dt);
          }
        }
      }
    }

    // Update Pin positions and velocities
    for (const pin of this.pins.values()) {
      pin.update(dt);
    }

    // Notify listeners
    for (const listener of this.tickListeners) {
      listener(this.pins, dt);
    }
  }

  /**
   * Subscribe to simulation ticks
   */
  onTick(listener) {
    this.tickListeners.add(listener);
    return () => this.tickListeners.delete(listener);
  }

  /**
   * Find all Pins whose global bounds intersect a circular radius around (x, y).
   * Global, not local: a nested Pin is found where it sits on the canvas.
   */
  queryRadius(x, y, radius) {
    const rSq = radius * radius;
    const results = [];
    for (const pin of this.pins.values()) {
      const bounds = pin.getGlobalBounds();
      const clampedX = Math.max(bounds.minX, Math.min(x, bounds.maxX));
      const clampedY = Math.max(bounds.minY, Math.min(y, bounds.maxY));
      const dx = x - clampedX;
      const dy = y - clampedY;
      if (dx * dx + dy * dy <= rSq) {
        results.push(pin);
      }
    }
    return results;
  }

  /**
   * Find all Pins whose global bounds intersect the given canvas-space box.
   */
  queryBox(minX, minY, maxX, maxY) {
    const results = [];
    for (const pin of this.pins.values()) {
      const bounds = pin.getGlobalBounds();
      const intersects =
        bounds.minX <= maxX &&
        bounds.maxX >= minX &&
        bounds.minY <= maxY &&
        bounds.maxY >= minY;

      if (intersects) {
        results.push(pin);
      }
    }
    return results;
  }

  /**
   * Clear all Pins, listeners, and force fields
   */
  clear() {
    this.pins.clear();
    this.tickListeners.clear();
    this.forceFields = [];
  }
}
