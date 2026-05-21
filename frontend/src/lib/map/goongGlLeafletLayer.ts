import L from "leaflet";
import "@goongmaps/goong-js/dist/goong-js.css";
import goongjs from "@goongmaps/goong-js";
import { getGoongStyleUrl } from "@/lib/map/mapConfig";

/**
 * Layers in goong_map_web.json that reference vector source-layers no longer
 * shipped on the composite source (e.g. "trees" / poi-tree).
 */
const GOONG_REMOVED_LAYER_IDS = new Set(["poi-tree"]);
const GOONG_MISSING_SOURCE_LAYERS = new Set(["trees"]);

type GoongStyleSpec = {
  layers?: Array<{
    id?: string;
    "source-layer"?: string;
  }>;
};

export function sanitizeGoongStyle<T extends GoongStyleSpec>(style: T): T {
  if (!Array.isArray(style.layers)) {
    return style;
  }
  const layers = style.layers.filter((layer) => {
    if (layer.id && GOONG_REMOVED_LAYER_IDS.has(layer.id)) {
      return false;
    }
    const sourceLayer = layer["source-layer"];
    if (sourceLayer && GOONG_MISSING_SOURCE_LAYERS.has(sourceLayer)) {
      return false;
    }
    return true;
  });
  return { ...style, layers };
}

function appendGoongApiKey(styleUrl: string, apiKey: string): string {
  const separator = styleUrl.includes("?") ? "&" : "?";
  return `${styleUrl}${separator}api_key=${encodeURIComponent(apiKey)}`;
}

async function fetchSanitizedGoongStyle(
  styleUrl: string,
  apiKey: string,
): Promise<object> {
  const response = await fetch(appendGoongApiKey(styleUrl, apiKey));
  if (!response.ok) {
    throw new Error(`Goong style fetch failed (${response.status})`);
  }
  const json = (await response.json()) as GoongStyleSpec;
  return sanitizeGoongStyle(json);
}

/** Remove style layers that fail when composite tiles omit a source-layer. */
function attachGoongStyleErrorRecovery(gl: GoongMapInstance): void {
  gl.on("error", (event: { error?: Error }) => {
    const message = event.error?.message ?? "";
    const match = message.match(/style layer "([^"]+)"/);
    const layerId = match?.[1];
    if (!layerId || !gl.getLayer(layerId)) {
      return;
    }
    try {
      gl.removeLayer(layerId);
    } catch {
      // Layer may already be gone if style reloads.
    }
  });
}

type GoongMapInstance = InstanceType<typeof goongjs.Map>;

/** Leaflet marks `_map` protected; the runtime layer from `L.Layer.extend` always has it. */
function layerMap(layer: L.Layer): L.Map | null {
  return (layer as unknown as { _map: L.Map | null })._map;
}

/** Goong/Mapbox GL may expose `triggerRepaint`, `_update`, or `update` depending on version. */
function requestGoongRedraw(gl: GoongMapInstance): void {
  const g = gl as GoongMapInstance & {
    triggerRepaint?: () => void;
    update?: () => void;
    _update?: () => void;
  };
  if (typeof g.triggerRepaint === "function") {
    g.triggerRepaint();
  } else if (typeof g.update === "function") {
    g.update();
  } else if (typeof g._update === "function") {
    g._update();
  }
}

export type GoongGlLayerOptions = L.LayerOptions & {
  apiKey: string;
  /** Goong style URL; query `api_key` is appended automatically. */
  styleUrl?: string;
  /** Relative padding around the map view (fraction of map size per side). */
  padding?: number;
  /** When false, pointer events go through to Leaflet (recommended for marker popups). */
  interactive?: boolean;
  pane?: string;
  className?: string;
  updateInterval?: number;
};

interface GoongLayerThis extends L.Layer {
  options: GoongGlLayerOptions;
  _throttledUpdate: () => void;
  _glMap: GoongMapInstance | null;
  _container: HTMLDivElement;
  _offset: L.Point;
  _zooming: boolean;
  getPaneName: () => string;
  getSize: () => L.Point;
  _initContainer: () => void;
  _initGL: () => void;
  _update: () => void;
  _transformGL: (gl: GoongMapInstance) => void;
  _pinchZoom: () => void;
  _animateZoom: (e: L.ZoomAnimEvent) => void;
  _zoomStart: () => void;
  _zoomEnd: () => void;
  _transitionEnd: () => void;
  _resize: (e?: L.LeafletEvent) => void;
}

/**
 * Leaflet + Goong GL base map (vector tiles). Adapted from mapbox-gl-leaflet, using @goongmaps/goong-js.
 */
const GoongGl = L.Layer.extend({
  options: {
    apiKey: "",
    styleUrl: getGoongStyleUrl(),
    updateInterval: 32,
    padding: 0.1,
    interactive: false,
    pane: "tilePane",
  },

  initialize(options: GoongGlLayerOptions) {
    L.setOptions(this, {
      styleUrl: options.styleUrl ?? getGoongStyleUrl(),
      ...options,
    });
    const self = this as GoongLayerThis;
    self._throttledUpdate = L.Util.throttle(
      self._update,
      self.options.updateInterval ?? 32,
      self,
    ) as () => void;
  },

  onAdd(map: L.Map) {
    const self = this as GoongLayerThis;
    if (!self._container) {
      self._initContainer();
    }
    const paneName = self.getPaneName();
    map.getPane(paneName).appendChild(self._container);
    void self._initGL();
    self._offset = map.containerPointToLayerPoint(L.point(0, 0));

    if (map.options.zoomAnimation) {
      L.DomEvent.on(
        map["_proxy"] as HTMLElement,
        L.DomUtil.TRANSITION_END,
        self._transitionEnd,
        this,
      );
    }

    (map as L.Map & { _addZoomLimit: (layer: L.Layer) => void })._addZoomLimit(
      this,
    );
  },

  onRemove(map: L.Map) {
    const self = this as GoongLayerThis;
    const owned = layerMap(self);
    if (owned && owned["_proxy"] && owned.options.zoomAnimation) {
      L.DomEvent.off(
        owned["_proxy"] as HTMLElement,
        L.DomUtil.TRANSITION_END,
        self._transitionEnd,
        this,
      );
    }
    const paneName = self.getPaneName();
    map.getPane(paneName).removeChild(self._container);

    if (self._glMap) {
      self._glMap.remove();
      self._glMap = null;
    }
  },

  getEvents() {
    const self = this as GoongLayerThis;
    return {
      move: self._throttledUpdate,
      zoomanim: self._animateZoom,
      zoom: self._pinchZoom,
      zoomstart: self._zoomStart,
      zoomend: self._zoomEnd,
      resize: self._resize,
    };
  },

  getPaneName() {
    const self = this as GoongLayerThis;
    const pane = self.options.pane ?? "tilePane";
    return layerMap(self)?.getPane(pane) ? pane : "tilePane";
  },

  getSize() {
    const self = this as GoongLayerThis;
    return layerMap(self)!.getSize().multiplyBy(1 + (self.options.padding ?? 0) * 2);
  },

  _initContainer() {
    const self = this as GoongLayerThis;
    const m = layerMap(self)!;
    const container = (self._container = L.DomUtil.create(
      "div",
      "leaflet-gl-layer",
    ) as HTMLDivElement);
    const size = self.getSize();
    const offset = m.getSize().multiplyBy(self.options.padding ?? 0);
    container.style.width = `${size.x}px`;
    container.style.height = `${size.y}px`;
    const topLeft = m.containerPointToLayerPoint(L.point(0, 0)).subtract(
      offset,
    );
    L.DomUtil.setPosition(container, topLeft);
  },

  async _initGL() {
    const self = this as GoongLayerThis;
    const m = layerMap(self);
    if (!m || !self._container.isConnected) return;

    const center = m.getCenter();
    const styleBase = self.options.styleUrl ?? getGoongStyleUrl();

    goongjs.accessToken = self.options.apiKey;

    let style: string | object = appendGoongApiKey(styleBase, self.options.apiKey);
    try {
      style = await fetchSanitizedGoongStyle(styleBase, self.options.apiKey);
    } catch (err) {
      console.warn(
        "Could not sanitize Goong style; using URL (console layer errors may persist):",
        err,
      );
    }

    const mapOptions = {
      container: self._container,
      style,
      center: [center.lng, center.lat] as [number, number],
      zoom: m.getZoom() - 1,
      attributionControl: false,
    };

    if (!self._glMap) {
      self._glMap = new goongjs.Map(mapOptions);
      attachGoongStyleErrorRecovery(self._glMap);
    } else {
      self._glMap.setStyle(style);
      self._glMap.setCenter(mapOptions.center);
      self._glMap.setZoom(mapOptions.zoom);
    }

    self._glMap.transform.latRange = null;
    self._transformGL(self._glMap);

    const rawCanvas = self._glMap["_canvas"] as
      | HTMLCanvasElement
      | { canvas?: HTMLCanvasElement }
      | undefined;
    const canvas =
      rawCanvas && "canvas" in rawCanvas
        ? rawCanvas.canvas ?? (rawCanvas as HTMLCanvasElement)
        : (rawCanvas as HTMLCanvasElement);

    L.DomUtil.addClass(canvas, "leaflet-image-layer");
    L.DomUtil.addClass(canvas, "leaflet-zoom-animated");
    if (self.options.interactive) {
      L.DomUtil.addClass(canvas, "leaflet-interactive");
    }
    if (self.options.className) {
      L.DomUtil.addClass(canvas, self.options.className);
    }
  },

  _update() {
    const self = this as GoongLayerThis;
    const m = layerMap(self);
    if (!m) return;
    self._offset = m.containerPointToLayerPoint(L.point(0, 0));
    if (self._zooming) return;

    const size = self.getSize();
    const container = self._container;
    const gl = self._glMap!;
    const offset = m.getSize().multiplyBy(self.options.padding ?? 0);
    const topLeft = m
      .containerPointToLayerPoint(L.point(0, 0))
      .subtract(offset);
    L.DomUtil.setPosition(container, topLeft);
    self._transformGL(gl);

    const xRound = Math.round(size.x);
    const yRound = Math.round(size.y);

    if (
      Math.round(gl.transform.width) !== xRound ||
      Math.round(gl.transform.height) !== yRound
    ) {
      container.style.width = `${xRound}px`;
      container.style.height = `${yRound}px`;
      gl.resize();
    } else {
      requestGoongRedraw(gl);
    }
  },

  _transformGL(gl: GoongMapInstance) {
    const self = this as GoongLayerThis;
    const m = layerMap(self)!;
    const center = m.getCenter();
    const tr = gl.transform;
    tr.center = goongjs.LngLat.convert([center.lng, center.lat]);
    tr.zoom = m.getZoom() - 1;
  },

  _pinchZoom() {
    const self = this as GoongLayerThis;
    const m = layerMap(self)!;
    self._glMap!.jumpTo({
      zoom: m.getZoom() - 1,
      center: m.getCenter(),
    });
  },

  _animateZoom(e: L.ZoomAnimEvent) {
    const self = this as GoongLayerThis;
    const m = layerMap(self)!;
    const scale = m.getZoomScale(e.zoom);
    const padding = m.getSize().multiplyBy((self.options.padding ?? 0) * scale);
    const viewHalf = self.getSize().divideBy(2);
    const mapWithPane = m as L.Map & { _getMapPanePos: () => L.Point };
    const topLeft = m
      .project(e.center, e.zoom)
      .subtract(viewHalf)
      .add(mapWithPane._getMapPanePos().add(padding))
      .round();
    const offset = m
      .project(m.getBounds().getNorthWest(), e.zoom)
      .subtract(topLeft);

    const rawCanvas = self._glMap!["_canvas"] as
      | HTMLCanvasElement
      | { canvas?: HTMLCanvasElement }
      | undefined;
    const canvas =
      rawCanvas && "canvas" in rawCanvas
        ? rawCanvas.canvas ?? (rawCanvas as HTMLCanvasElement)
        : (rawCanvas as HTMLCanvasElement);

    L.DomUtil.setTransform(canvas, offset.subtract(self._offset), scale);
  },

  _zoomStart() {
    const self = this as GoongLayerThis;
    self._zooming = true;
  },

  _zoomEnd() {
    const self = this as GoongLayerThis;
    const m = layerMap(self)!;
    const scale = m.getZoomScale(m.getZoom());
    const rawCanvas = self._glMap!["_canvas"] as
      | HTMLCanvasElement
      | { canvas?: HTMLCanvasElement }
      | undefined;
    const canvas =
      rawCanvas && "canvas" in rawCanvas
        ? rawCanvas.canvas ?? (rawCanvas as HTMLCanvasElement)
        : (rawCanvas as HTMLCanvasElement);
    L.DomUtil.setTransform(canvas, undefined, scale);
    self._zooming = false;
    self._update();
  },

  _transitionEnd() {
    const self = this as GoongLayerThis;
    const m = layerMap(self)!;
    L.Util.requestAnimFrame(() => {
      const zoom = m.getZoom();
      const center = m.getCenter();
      const offset = m.latLngToContainerPoint(
        m.getBounds().getNorthWest(),
      );
      const rawCanvas = self._glMap!["_canvas"] as
        | HTMLCanvasElement
        | { canvas?: HTMLCanvasElement }
        | undefined;
      const canvas =
        rawCanvas && "canvas" in rawCanvas
          ? rawCanvas.canvas ?? (rawCanvas as HTMLCanvasElement)
          : (rawCanvas as HTMLCanvasElement);
      L.DomUtil.setTransform(canvas, offset, 1);
      self._glMap!.once("moveend", () => {
        self._zoomEnd();
      });
      self._glMap!.jumpTo({
        center,
        zoom: zoom - 1,
      });
    }, this);
  },

  _resize(_e?: L.LeafletEvent) {
    const self = this as GoongLayerThis;
    self._transitionEnd();
  },
});

export function createGoongGlLayer(options: GoongGlLayerOptions): L.Layer {
  const LayerCtor = GoongGl as unknown as new (
    opts: GoongGlLayerOptions,
  ) => L.Layer;
  return new LayerCtor(options);
}
