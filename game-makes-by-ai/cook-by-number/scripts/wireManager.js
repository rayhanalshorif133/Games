/**
 * Cook by Number - Wire Manager
 * Handles socket ports, multi-port branching (YES/NO outputs for conditional pods),
 * wire drawing, cubic Bezier curve math, and connection topology.
 */
class WireManager {
  constructor(game) {
    this.game = game;
    this.connections = []; // Array of { fromBoxId, fromPortId, toBoxId, toPortId }
    this.activeDraft = null; // { fromBoxId, fromPortId, fromX, fromY, color, curX, curY, snappedTo }
    this.hoverPort = null;
    this.portSnapRadius = 75; // Magnetic snap radius in canvas pixels
  }

  clear() {
    this.connections = [];
    this.activeDraft = null;
    this.hoverPort = null;
  }

  /**
   * Return array of all current available ports on the board
   */
  getAllPorts() {
    const ports = [];
    const level = this.game.currentLevelData;
    if (!level) return ports;

    // 1. Start Box (Output Port on right side)
    const sb = this.game.startBox;
    if (sb) {
      ports.push({
        boxId: 'start',
        portId: 'out',
        type: 'output',
        x: sb.x + sb.w / 2,
        y: sb.y,
        radius: 20,
        label: 'OUT',
        color: '#ff9800'
      });
    }

    // 2. Modifier Boxes
    for (const box of this.game.modifierBoxes) {
      // Standard Input Port on Left
      ports.push({
        boxId: box.id,
        portId: 'in',
        type: 'input',
        x: box.x - box.w / 2,
        y: box.y,
        radius: 19,
        label: 'IN',
        color: '#00e5ff'
      });

      if (box.op === 'conditional') {
        // DUAL OUTPUT PORTS FOR CONDITIONAL POD (YES / NO)
        // 1. Upper Right Output: YES (Condition Met)
        ports.push({
          boxId: box.id,
          portId: 'yes',
          type: 'output',
          x: box.x + box.w / 2,
          y: box.y - 36,
          radius: 19,
          label: 'YES',
          color: '#00e676'
        });

        // 2. Lower Right Output: NO (Condition Failed)
        ports.push({
          boxId: box.id,
          portId: 'no',
          type: 'output',
          x: box.x + box.w / 2,
          y: box.y + 36,
          radius: 19,
          label: 'NO',
          color: '#ff3d00'
        });
      } else {
        // Standard Single Output Port on Right
        ports.push({
          boxId: box.id,
          portId: 'out',
          type: 'output',
          x: box.x + box.w / 2,
          y: box.y,
          radius: 19,
          label: 'OUT',
          color: '#ff9800'
        });
      }
    }

    // 3. End Box (Computer) (Input Port on left side)
    const eb = this.game.endBox;
    if (eb) {
      ports.push({
        boxId: 'end',
        portId: 'in',
        type: 'input',
        x: eb.x - eb.w / 2,
        y: eb.y,
        radius: 22,
        label: 'IN',
        color: '#00e5ff'
      });
    }

    return ports;
  }

  /**
   * Find port near coordinates
   */
  findPortAt(x, y, filterType = null) {
    const ports = this.getAllPorts();
    let best = null;
    let minDist = this.portSnapRadius;

    for (const port of ports) {
      if (filterType && port.type !== filterType) continue;
      const d = Math.hypot(port.x - x, port.y - y);
      if (d < minDist) {
        minDist = d;
        best = port;
      }
    }
    return best;
  }

  /**
   * Get specific port for a box
   */
  getPort(boxId, type, portId = null) {
    return this.getAllPorts().find(p => {
      if (p.boxId !== boxId || p.type !== type) return false;
      if (portId && p.portId && p.portId !== portId) return false;
      return true;
    }) || null;
  }

  /**
   * Start dragging a wire from an output port
   */
  startDraft(port, pointerX, pointerY) {
    if (port.type !== 'output') return false;

    // Disconnect any existing wire from THIS specific output port
    this.disconnectFrom(port.boxId, port.portId || 'out');

    this.activeDraft = {
      fromBoxId: port.boxId,
      fromPortId: port.portId || 'out',
      fromX: port.x,
      fromY: port.y,
      color: port.color || '#ff9800',
      curX: pointerX,
      curY: pointerY,
      snappedTo: null
    };

    if (typeof window !== 'undefined' && window.Sound) {
      window.Sound.playClick();
    }
    return true;
  }

  /**
   * Update wire draft position while dragging
   */
  updateDraft(pointerX, pointerY) {
    if (!this.activeDraft) return;

    this.activeDraft.curX = pointerX;
    this.activeDraft.curY = pointerY;

    // Check for magnetic snap to a valid input port
    const candidate = this.findPortAt(pointerX, pointerY, 'input');
    if (candidate && candidate.boxId !== this.activeDraft.fromBoxId) {
      this.activeDraft.snappedTo = candidate;
      this.activeDraft.curX = candidate.x;
      this.activeDraft.curY = candidate.y;
    } else {
      this.activeDraft.snappedTo = null;
    }
  }

  /**
   * Release and establish connection if valid
   */
  endDraft() {
    if (!this.activeDraft) return false;

    const snap = this.activeDraft.snappedTo;
    let connected = false;

    if (snap && snap.type === 'input' && snap.boxId !== this.activeDraft.fromBoxId) {
      // Remove any existing connection leading INTO this target input port
      this.disconnectTo(snap.boxId, snap.portId || 'in');

      this.connections.push({
        fromBoxId: this.activeDraft.fromBoxId,
        fromPortId: this.activeDraft.fromPortId,
        toBoxId: snap.boxId,
        toPortId: snap.portId || 'in'
      });

      connected = true;
      if (typeof window !== 'undefined' && window.Sound) {
        window.Sound.playPlug();
      }
    } else {
      if (typeof window !== 'undefined' && window.Sound) {
        window.Sound.playUnplug();
      }
    }

    this.activeDraft = null;
    return connected;
  }

  /**
   * Cancel draft wire
   */
  cancelDraft() {
    if (this.activeDraft) {
      this.activeDraft = null;
      if (typeof window !== 'undefined' && window.Sound) {
        window.Sound.playUnplug();
      }
    }
  }

  /**
   * Disconnect wire originating from a box (and optionally specific port)
   */
  disconnectFrom(boxId, portId = null) {
    const idx = this.connections.findIndex(c => {
      if (c.fromBoxId !== boxId) return false;
      if (portId && c.fromPortId && c.fromPortId !== portId) return false;
      return true;
    });
    if (idx !== -1) {
      this.connections.splice(idx, 1);
      return true;
    }
    return false;
  }

  /**
   * Disconnect wire terminating into a box (and optionally specific port)
   */
  disconnectTo(boxId, portId = null) {
    const idx = this.connections.findIndex(c => {
      if (c.toBoxId !== boxId) return false;
      if (portId && c.toPortId && c.toPortId !== portId) return false;
      return true;
    });
    if (idx !== -1) {
      this.connections.splice(idx, 1);
      return true;
    }
    return false;
  }

  /**
   * Get connection starting from box and optional portId
   */
  getConnection(fromBoxId, fromPortId = null) {
    return this.connections.find(c => {
      if (c.fromBoxId !== fromBoxId) return false;
      if (fromPortId && c.fromPortId && c.fromPortId !== fromPortId) return false;
      return true;
    }) || null;
  }

  /**
   * Remove any wire touched near (x, y)
   */
  tryCutWireAt(x, y) {
    for (let i = 0; i < this.connections.length; i++) {
      const conn = this.connections[i];
      const p1 = this.getPort(conn.fromBoxId, 'output', conn.fromPortId);
      const p2 = this.getPort(conn.toBoxId, 'input', conn.toPortId);
      if (!p1 || !p2) continue;

      // Sample 20 points along bezier curve
      const cp = this.calculateCurvePoints(p1, p2);
      for (let step = 0; step <= 20; step++) {
        const t = step / 20;
        const pt = this.sampleBezier(cp.p0, cp.p1, cp.p2, cp.p3, t);
        if (Math.hypot(pt.x - x, pt.y - y) < 32) {
          this.connections.splice(i, 1);
          if (typeof window !== 'undefined' && window.Sound) {
            window.Sound.playUnplug();
          }
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Calculate cubic Bezier control points for organic, realistic cable physics
   */
  calculateCurvePoints(p0, p3) {
    const dx = p3.x - p0.x;
    const dy = p3.y - p0.y;
    const dist = Math.hypot(dx, dy);

    // Natural horizontal offset for cable routing
    const offsetH = Math.max(Math.abs(dx) * 0.45, 90);

    const p1 = {
      x: p0.x + offsetH,
      y: p0.y + (dx < 0 ? 80 : 0) // extra gravity droop if bending backwards
    };
    const p2 = {
      x: p3.x - offsetH,
      y: p3.y + (dx < 0 ? 80 : 0)
    };

    return { p0, p1, p2, p3, dist };
  }

  /**
   * Evaluate cubic Bezier at parameter t in [0, 1]
   */
  sampleBezier(p0, p1, p2, p3, t) {
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    const uuu = uu * u;
    const ttt = tt * t;

    const x = uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x;
    const y = uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y;

    // Derivative for tangent vector & rotation angle
    const dx = 3 * uu * (p1.x - p0.x) + 6 * u * t * (p2.x - p1.x) + 3 * tt * (p3.x - p2.x);
    const dy = 3 * uu * (p1.y - p0.y) + 6 * u * t * (p2.y - p1.y) + 3 * tt * (p3.y - p2.y);
    const angle = Math.atan2(dy, dx);

    return { x, y, angle };
  }
}

if (typeof window !== 'undefined') {
  window.WireManager = WireManager;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WireManager;
}
